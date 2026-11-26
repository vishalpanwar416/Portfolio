// Alerts go to WhatsApp, to the ops group Media-man reports to, through the
// hermes bridge on the laptop. The bridge only listens on loopback, so nothing
// here sends directly: messages wait in the server-only vp_outbox collection
// and the laptop agent (scripts/laptop-agent.mjs, every 2 minutes) delivers
// them. While the laptop is off they wait, and arrive later with their time.
//
//   POST { title, message }   queue one (the monitor, or a test from Alerts)
//   GET                       agent: messages waiting, oldest first
//   POST { ack: [ids] }       agent: these were delivered
//   POST { ack: [ids], discard: true }  drop them unsent (stale alerts), without
//                             marking WhatsApp as delivered
const crypto = require('node:crypto');
const { requireOwnerOrMonitor } = require('../_auth');
const { listDocs, mergeDocs, deleteDoc, writeSite } = require('../_firestore');

const OUTBOX = 'vp_outbox';
const MAX_WAITING = 200;

/** Queue a WhatsApp message. Never throws: an alert must not break its caller. */
async function sendNotification({ title, message, url }) {
  const id = `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
  const text = [`*${String(title).slice(0, 120)}*`, String(message || '').slice(0, 3000), url].filter(Boolean).join('\n');
  try {
    await mergeDocs(OUTBOX, [{ id, data: { text, at: Date.now() } }]);
    return { queued: id };
  } catch (e) {
    return { error: e.message };
  }
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
      return res.status(200).json({ removed: ids.length, discarded: !!body.discard });
    }
    const { title = 'VP Control', message = 'Test message: alerts will look like this.' } = body;
    const r = await sendNotification({ title, message });
    return r.error ? res.status(502).json(r) : res.status(200).json(r);
  } catch (e) {
    return res.status(e.status || 502).json({ error: e.message });
  }
};
module.exports.sendNotification = sendNotification;
