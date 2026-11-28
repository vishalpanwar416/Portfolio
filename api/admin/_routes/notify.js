// Alerts go to WhatsApp, to the ops group Media-man reports to, through the
// hermes bridge on the laptop. The bridge only listens on loopback, so nothing
// here sends directly: messages wait in the server-only vp_outbox collection
// and the laptop agent (scripts/laptop-agent.mjs, every 2 minutes) delivers
// them. While the laptop is off they wait, and arrive later with their time.
//
//   POST { title, message }   queue one (the monitor, or a test from Alerts)
//   GET                       agent: messages waiting, oldest first
//   POST { ack: [ids] }       agent: these were delivered
//   GET ?history=1            owner: every alert of the last 120 days, newest
//                             first, with when it was delivered (vp_alert_log)
//   POST { ack: [ids], discard: true }  drop them unsent (stale alerts), without
//                             marking WhatsApp as delivered
const crypto = require('node:crypto');
const { requireOwnerOrMonitor } = require('../_auth');
const { listDocs, mergeDocs, deleteDoc, writeSite } = require('../_firestore');

const OUTBOX = 'vp_outbox';
const MAX_WAITING = 200;
// Permanent record of every alert (the outbox forgets a message once sent).
const LOG = 'vp_alert_log';
const KEEP_MS = 120 * 86400e3;

/** critical | resolved | digest | lead | jobs | test | info — given by the caller, else guessed from the title. */
const KINDS = ['critical', 'resolved', 'digest', 'lead', 'jobs', 'test', 'info'];
function classify(title, kind) {
  if (KINDS.includes(kind)) return kind;
  const t = String(title);
  if (/critical/i.test(t)) return 'critical';
  if (/resolved/i.test(t)) return 'resolved';
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

/** Queue a WhatsApp message. Never throws: an alert must not break its caller. */
async function sendNotification({ title, message, url, kind, icon }) {
  const id = `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
  const severity = classify(title, kind);
  const head = String(title).slice(0, 120).trim();
  const mark = icon || (/^\p{Extended_Pictographic}/u.test(head) ? '' : ICONS[severity] || '');
  const text = [`${mark ? `${mark} ` : ''}*${head}*`, String(message || '').trim().slice(0, 3000), url].filter(Boolean).join('\n');
  const at = Date.now();
  try {
    await mergeDocs(OUTBOX, [{ id, data: { text, at } }]);
    // The history entry is best-effort: losing it must not lose the alert.
    await mergeDocs(LOG, [{ id, data: {
      title: String(title).slice(0, 120), message: String(message || '').slice(0, 3000), url: url || '',
      severity, site: siteOf(`${title} ${message}`), at, status: 'queued',
    } }]).catch(() => {});
    return { queued: id };
  } catch (e) {
    return { error: e.message };
  }
}

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
  return Object.entries(docs).map(([id, d]) => ({ id, text: d.text, at: d.at })).sort((a, b) => a.at - b.at);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const who = await requireOwnerOrMonitor(req, res);
  if (!who) return;
  try {
    if (req.method === 'GET' && req.query?.history === '1') {
      return res.status(200).json({ items: await history(), keepDays: KEEP_MS / 86400e3 });
    }
    if (req.method === 'GET') {
      const items = await waiting();
      // A laptop off for weeks shouldn't come back to hundreds of messages.
      for (const old of items.slice(0, Math.max(0, items.length - MAX_WAITING))) await deleteDoc(OUTBOX, old.id);
      return res.status(200).json({ items: items.slice(-MAX_WAITING) });
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
    const { title = 'Admin test', message = 'Test message: alerts will look like this.', url, kind, icon } = body;
    const r = await sendNotification({ title, message, url, kind: typeof kind === 'string' ? kind : undefined, icon: typeof icon === 'string' ? icon.slice(0, 4) : undefined });
    return r.error ? res.status(502).json(r) : res.status(200).json(r);
  } catch (e) {
    return res.status(e.status || 502).json({ error: e.message });
  }
};
module.exports.sendNotification = sendNotification;
