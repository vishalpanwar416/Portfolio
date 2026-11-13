// Public intake for contact-form enquiries from any of the sites. POST
// { name, email, phone, message, site, page, referrer, utm: {source, medium,
// campaign} }. Saved as a `lead-<id>` doc in vp_sites (the dashboard reads
// them from there) and pushed to the phone.
//
// No sign-in, so: CORS open for POST, a honeypot field (`website`) that
// people never fill, length caps, and a per-instance rate limit. Sites can
// send it as text/plain to skip the CORS preflight.
const crypto = require('node:crypto');
const { writeSite } = require('../_firestore');
const { sendNotification } = require('./notify');

const LIMIT = 5; // per IP per window, per warm instance
const WINDOW_MS = 10 * 60e3;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const seen = new Map();

const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

function limited(ip) {
  const now = Date.now();
  const hits = (seen.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  seen.set(ip, hits);
  if (seen.size > 5000) seen.clear();
  return hits.length > LIMIT;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  // Bots fill every field; pretend it worked so they don't retry.
  if (body.website) return res.status(200).json({ ok: true });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Too many messages — try again in a few minutes.' });

  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};
  const lead = {
    kind: 'lead',
    status: 'new',
    name: clip(body.name, 100),
    email: clip(body.email, 200).toLowerCase(),
    phone: clip(body.phone, 30),
    message: clip(body.message, 4000),
    site: clip(body.site, 100).toLowerCase(),
    page: clip(body.page, 300),
    referrer: clip(body.referrer, 300),
    utm: { source: clip(utm.source, 100), medium: clip(utm.medium, 100), campaign: clip(utm.campaign, 100) },
    createdAt: Date.now(),
  };
  if (!lead.name && !lead.email && !lead.phone) return res.status(400).json({ error: 'Add a name, email or phone.' });
  if (lead.email && !EMAIL_RE.test(lead.email)) return res.status(400).json({ error: 'That email doesn’t look right.' });
  if (!lead.message && !lead.email && !lead.phone) return res.status(400).json({ error: 'Add a message.' });

  const id = `lead-${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
  try {
    await writeSite(id, lead);
  } catch (e) {
    return res.status(e.status || 502).json({ error: 'Couldn’t save your message.' });
  }
  await sendNotification({
    title: `New lead${lead.site ? ` · ${lead.site}` : ''}`,
    message: [lead.name, lead.email, lead.phone].filter(Boolean).join(' · ') + (lead.message ? `\n${lead.message.slice(0, 300)}` : ''),
    priority: 'info',
    url: 'https://admin.vishalpanwar.in/#/marketing/leads',
  }).catch(() => {});
  res.status(200).json({ ok: true });
};
