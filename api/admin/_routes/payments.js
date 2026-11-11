// Money taken through Razorpay, per account, by month (IST).
// GET ?sources=razorpay:tabletap,razorpay:aarambh
// Needs RAZORPAY_<LABEL>_KEY_ID and RAZORPAY_<LABEL>_KEY_SECRET — a
// read-only API key from Razorpay Dashboard → Account & Settings → API keys.
const { requireOwnerOrMonitor } = require('../_auth');

const TTL_MS = 3600e3;
const MONTHS = 6;
const MAX_PAGES = 50; // 100 payments a page
const RE = /^razorpay:([a-z0-9_]{1,30})$/;
const cache = new Map();

const istMonth = (unix) => new Date(unix * 1000 + 5.5 * 3600e3).toISOString().slice(0, 7);

function monthKeys() {
  const t = new Date(Date.now() + 5.5 * 3600e3);
  const out = [];
  for (let i = MONTHS - 1; i >= 0; i--) out.push(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - i, 1)).toISOString().slice(0, 7));
  return out;
}

async function razorpay(label) {
  const id = process.env[`RAZORPAY_${label.toUpperCase()}_KEY_ID`];
  const secret = process.env[`RAZORPAY_${label.toUpperCase()}_KEY_SECRET`];
  if (!id || !secret) throw Object.assign(new Error(`RAZORPAY_${label.toUpperCase()}_KEY_ID / _KEY_SECRET missing on the server`), { notConfigured: true });
  const auth = `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
  const keys = monthKeys();
  const from = Math.floor((Date.parse(`${keys[0]}-01T00:00:00+05:30`)) / 1000);
  const months = Object.fromEntries(keys.map((m) => [m, { month: m, gross: 0, fees: 0, refunds: 0, count: 0 }]));
  let last = null;
  let truncated = false;
  for (let page = 0; page < MAX_PAGES; page++) {
    const r = await fetch(`https://api.razorpay.com/v1/payments?from=${from}&count=100&skip=${page * 100}`, {
      headers: { Authorization: auth }, signal: AbortSignal.timeout(15000),
    });
    if (r.status === 401) throw new Error('Razorpay rejected the API key');
    if (!r.ok) throw new Error(`Razorpay ${r.status}`);
    const items = (await r.json()).items || [];
    for (const p of items) {
      const m = months[istMonth(p.created_at)];
      if (!m) continue;
      if (p.status === 'captured' || p.status === 'refunded') {
        m.gross += p.amount / 100;
        m.fees += ((p.fee || 0)) / 100;
        m.refunds += (p.amount_refunded || 0) / 100;
        m.count += 1;
        if (!last || p.created_at > last.at) last = { at: new Date(p.created_at * 1000).toISOString(), amount: p.amount / 100, method: p.method };
      }
    }
    if (items.length < 100) break;
    if (page === MAX_PAGES - 1) truncated = true;
  }
  const rows = keys.map((k) => {
    const m = months[k];
    const round = (n) => Math.round(n * 100) / 100;
    return { ...m, gross: round(m.gross), fees: round(m.fees), refunds: round(m.refunds), net: round(m.gross - m.fees - m.refunds) };
  });
  return { currency: 'INR', months: rows, last, truncated };
}

async function loadPayments(source) {
  const hit = cache.get(source);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const label = source.match(RE)[1];
  try {
    const value = { source, provider: 'razorpay', account: label, ...(await razorpay(label)) };
    cache.set(source, { at: Date.now(), value });
    return value;
  } catch (e) {
    return { source, provider: 'razorpay', account: label, error: String(e.message || e), notConfigured: !!e.notConfigured };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwnerOrMonitor(req, res))) return;
  const sources = [...new Set(String(req.query.sources || '').split(','))].filter((s) => RE.test(s)).slice(0, 10);
  res.status(200).json({ sources: await Promise.all(sources.map(loadPayments)) });
};
module.exports.loadPayments = loadPayments;
