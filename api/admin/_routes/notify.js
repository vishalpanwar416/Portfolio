// Alert gateway: every app and job sends its alerts here; this decides which
// WhatsApp group each one goes to (routing rules), formats it, logs it, and
// queues it. The WhatsApp bridge only listens on the laptop, so nothing here
// sends directly: messages wait in the server-only vp_outbox collection with
// their group, and the laptop agent (scripts/laptop-agent.mjs, every 2
// minutes) delivers them. While the laptop is off they wait, and arrive later
// with their time.
//
// Sending (any app or job):
//   POST { source, kind, title, lines | message, url }
//     Authorization: Bearer vpk_<id>_<secret>   a sender key, made on the
//     Alerts page; the key decides `source`. MONITOR_SECRET or the owner's
//     sign-in also work, with `source` from the body.
//     kind: critical | resolved | digest | lead | jobs | test | info
//
// Laptop agent (MONITOR_SECRET):
//   GET                       messages waiting, oldest first, with their chatId
//   POST { ack: [ids] }       these were delivered (+ discard: true = dropped)
//   POST { groups: [...] }    the WhatsApp groups the bridge can send to
//
// Owner (Alerts page):
//   GET ?history=1            every alert of the last 120 days, newest first
//   GET ?keys=1               sender keys (never the secrets)
//   POST { action: 'createKey', source, label } → the key, shown once
//   POST { action: 'revokeKey', id }
// Routing rules live in vp_sites/alert_routes, edited on the Alerts page:
//   { defaultChat, rules: [{ source, kind, chatId }] } — first match wins.
const crypto = require('node:crypto');
const { requireOwnerOrMonitor } = require('../_auth');
const { listDocs, mergeDocs, deleteDoc, writeSite, getSite, getSecret, putSecret } = require('../_firestore');

const OUTBOX = 'vp_outbox';
const MAX_WAITING = 200;
// Permanent record of every alert (the outbox forgets a message once sent).
const LOG = 'vp_alert_log';
const KEEP_MS = 120 * 86400e3;
// "Admin Updates": where everything went before routing rules existed.
const FALLBACK_CHAT = '120363411809952493@g.us';
const CHAT_RE = /^[0-9]{6,30}@(g\.us|s\.whatsapp\.net)$/;
const SOURCE_RE = /^[a-z0-9][a-z0-9:_.-]{0,59}$/;

/** critical | resolved | digest | lead | jobs | test | info — given by the caller, else guessed from the title. */
const KINDS = ['critical', 'resolved', 'digest', 'lead', 'jobs', 'test', 'info'];
function classify(title, kind) {
  if (KINDS.includes(kind)) return kind;
  const t = String(title);
  if (/critical|is down/i.test(t)) return 'critical';
  if (/resolved|back up/i.test(t)) return 'resolved';
  if (/morning check/i.test(t)) return 'digest';
  if (/test/i.test(t)) return 'test';
  return 'info';
}

/** The first host name mentioned, so history can be filtered by site. */
const siteOf = (text) => (String(text).match(/\b((?:[a-z0-9-]+\.)+(?:in|com|app|ai|ae|ca|tv|io|dev|co|net|org))\b/i) || [])[1]?.toLowerCase() || '';

// Every WhatsApp alert has the same shape as Media-man's post reports:
//   <icon> *<headline>*      what happened, in plain words
//   <detail lines>           which site / who / why, one fact per line
//   <link>                   where to act
const ICONS = { critical: '🔴', resolved: '✅', digest: '☀️', lead: '📩', jobs: '💼', test: '🧪', info: 'ℹ️' };

// ── routing ────────────────────────────────────────────

let routeCache = { at: 0, value: null };
async function routes() {
  if (routeCache.value && Date.now() - routeCache.at < 60e3) return routeCache.value;
  let doc = null;
  try { doc = await getSite('alert_routes'); } catch { doc = null; }
  routeCache = { at: Date.now(), value: doc || {} };
  return routeCache.value;
}

/** `source` matches a rule's source exactly, or by prefix when the rule ends in "*". */
const sourceMatches = (rule, source) => !rule.source || rule.source === '*'
  || (rule.source.endsWith('*') ? source.startsWith(rule.source.slice(0, -1)) : rule.source === source);

async function routeFor(source, kind) {
  const r = await routes();
  const rule = (r.rules || []).find((x) => x && CHAT_RE.test(x.chatId || '') && sourceMatches(x, source) && (!x.kind || x.kind === kind));
  return rule?.chatId || (CHAT_RE.test(r.defaultChat || '') ? r.defaultChat : FALLBACK_CHAT);
}

/**
 * Queue a WhatsApp message through the gateway. Never throws: an alert must
 * not break its caller. `lines` (array) or `message` (text) carry the details.
 */
async function sendNotification({ title, message, lines, url, kind, icon, source = 'admin' }) {
  const id = `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
  const severity = classify(title, kind);
  const head = String(title || 'Alert').slice(0, 120).trim();
  const body = Array.isArray(lines) ? lines.map((l) => String(l)).filter(Boolean).join('\n') : String(message || '');
  const mark = icon || (/^\p{Extended_Pictographic}/u.test(head) ? '' : ICONS[severity] || '');
  const text = [`${mark ? `${mark} ` : ''}*${head}*`, body.trim().slice(0, 3000), url].filter(Boolean).join('\n');
  const at = Date.now();
  const src = SOURCE_RE.test(source) ? source : 'admin';
  try {
    const chatId = await routeFor(src, severity);
    await mergeDocs(OUTBOX, [{ id, data: { text, at, chatId, source: src } }]);
    // The history entry is best-effort: losing it must not lose the alert.
    await mergeDocs(LOG, [{ id, data: {
      title: head, message: body.slice(0, 3000), url: url || '',
      severity, site: siteOf(`${head} ${body}`), source: src, chatId, at, status: 'queued',
    } }]).catch(() => {});
    return { queued: id, chatId };
  } catch (e) {
    return { error: e.message };
  }
}

// ── sender keys ────────────────────────────────────────

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

/** `vpk_<id>_<secret>` → { id, source } when valid. */
async function senderFromKey(bearer) {
  const m = /^vpk_([a-z0-9]{8})_([A-Za-z0-9_-]{24,})$/.exec(bearer || '');
  if (!m) return null;
  const k = await getSecret(`alertkey-${m[1]}`).catch(() => null);
  if (!k || k.revoked || k.hash !== sha(m[2])) return null;
  putSecret(`alertkey-${m[1]}`, { ...k, lastUsedAt: Date.now() }).catch(() => {});
  return { id: m[1], source: k.source };
}

async function listKeys() {
  const docs = await listDocs('vp_secrets');
  return Object.entries(docs).filter(([id]) => id.startsWith('alertkey-'))
    .map(([id, k]) => ({ id: id.slice(9), source: k.source, label: k.label || '', createdAt: k.createdAt || null, lastUsedAt: k.lastUsedAt || null, revoked: !!k.revoked }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// ── reads ──────────────────────────────────────────────

async function history() {
  const docs = await listDocs(LOG);
  const cutoff = Date.now() - KEEP_MS;
  const all = Object.entries(docs).map(([id, d]) => ({ id, ...d }));
  // Trim entries past the keep window, a few per call.
  for (const old of all.filter((d) => (d.at || 0) < cutoff).slice(0, 50)) await deleteDoc(LOG, old.id).catch(() => {});
  // An ack for a message queued before the log existed leaves a stub without a title: skip it.
  return all.filter((d) => d.title && (d.at || 0) >= cutoff).sort((a, b) => b.at - a.at);
}

async function waiting() {
  const docs = await listDocs(OUTBOX);
  return Object.entries(docs).map(([id, d]) => ({ id, text: d.text, at: d.at, chatId: d.chatId || FALLBACK_CHAT })).sort((a, b) => a.at - b.at);
}

// ── handler ────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  // A sender key can only send.
  if (bearer.startsWith('vpk_')) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'sender keys can only POST alerts' });
    const sender = await senderFromKey(bearer);
    if (!sender) return res.status(401).json({ error: 'unknown or revoked sender key' });
    const b = req.body || {};
    const r = await sendNotification({ title: b.title, message: b.message, lines: b.lines, url: b.url, kind: b.kind, source: sender.source });
    return r.error ? res.status(502).json(r) : res.status(200).json(r);
  }

  const who = await requireOwnerOrMonitor(req, res);
  if (!who) return;
  try {
    if (req.method === 'GET' && req.query?.history === '1') {
      return res.status(200).json({ items: await history(), keepDays: KEEP_MS / 86400e3 });
    }
    if (req.method === 'GET' && req.query?.keys === '1') {
      if (who !== 'owner') return res.status(403).json({ error: 'owner only' });
      return res.status(200).json({ keys: await listKeys() });
    }
    if (req.method === 'GET') {
      const items = await waiting();
      // A laptop off for weeks shouldn't come back to hundreds of messages.
      for (const old of items.slice(0, Math.max(0, items.length - MAX_WAITING))) await deleteDoc(OUTBOX, old.id);
      return res.status(200).json({ items: items.slice(-MAX_WAITING), gateway: true });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });
    const body = req.body || {};

    if (Array.isArray(body.ack)) {
      if (who !== 'monitor') return res.status(403).json({ error: 'agent only' });
      const ids = body.ack.map(String).filter((id) => /^[a-z0-9]{6,40}$/.test(id)).slice(0, 100);
      await Promise.all(ids.map((id) => deleteDoc(OUTBOX, id)));
      if (ids.length && !body.discard) await writeSite('whatsapp', { kind: 'whatsapp', deliveredAt: Date.now(), delivered: ids.length });
      const now = Date.now();
      if (ids.length) {
        await mergeDocs(LOG, ids.map((id) => ({ id, data: body.discard ? { status: 'discarded', discardedAt: now } : { status: 'delivered', deliveredAt: now } }))).catch(() => {});
      }
      return res.status(200).json({ removed: ids.length, discarded: !!body.discard });
    }

    if (Array.isArray(body.groups)) {
      if (who !== 'monitor') return res.status(403).json({ error: 'agent only' });
      const groups = body.groups.filter((g) => g && CHAT_RE.test(g.id || '')).slice(0, 100)
        .map((g) => ({ id: g.id, name: String(g.name || g.id).slice(0, 100) }));
      await writeSite('whatsapp_groups', { kind: 'whatsapp_groups', groups, at: Date.now() });
      return res.status(200).json({ saved: groups.length });
    }

    if (body.action === 'createKey' || body.action === 'revokeKey') {
      if (who !== 'owner') return res.status(403).json({ error: 'owner only' });
      if (body.action === 'revokeKey') {
        const id = String(body.id || '');
        const k = /^[a-z0-9]{8}$/.test(id) ? await getSecret(`alertkey-${id}`) : null;
        if (!k) return res.status(404).json({ error: 'no such key' });
        await putSecret(`alertkey-${id}`, { ...k, revoked: true, revokedAt: Date.now() });
        return res.status(200).json({ revoked: id });
      }
      const source = String(body.source || '').trim().toLowerCase();
      if (!SOURCE_RE.test(source)) return res.status(400).json({ error: 'source: lowercase letters, numbers and - _ . : (e.g. media-man or hermes:social)' });
      const id = crypto.randomBytes(6).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').padEnd(8, '0').slice(0, 8);
      const secret = crypto.randomBytes(24).toString('base64url');
      await putSecret(`alertkey-${id}`, { source, label: String(body.label || '').slice(0, 80), hash: sha(secret), createdAt: Date.now(), revoked: false });
      return res.status(200).json({ id, source, key: `vpk_${id}_${secret}` });
    }

    const { title = 'Admin test', message, lines, url, kind, icon, source } = body;
    const r = await sendNotification({
      title, message: message ?? (lines ? undefined : 'Test message: alerts will look like this.'), lines, url,
      kind: typeof kind === 'string' ? kind : undefined, icon: typeof icon === 'string' ? icon.slice(0, 4) : undefined,
      source: typeof source === 'string' ? source : (who === 'owner' ? 'admin' : 'monitor'),
    });
    return r.error ? res.status(502).json(r) : res.status(200).json(r);
  } catch (e) {
    return res.status(e.status || 502).json({ error: e.message });
  }
};
module.exports.sendNotification = sendNotification;
module.exports.routeFor = routeFor;
module.exports.sourceMatches = sourceMatches;
