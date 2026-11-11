// Push notifications: ntfy (phone app, works on Android and iOS) and
// Telegram. POST {title, message, priority} from the dashboard sends a test.
const { requireOwnerOrMonitor } = require('../_auth');

/** priority: 'critical' | 'warning' | 'info' */
async function sendNotification({ title, message, priority = 'info', url }) {
  const sent = [];
  const errors = [];
  const topic = process.env.NTFY_TOPIC;
  if (topic) {
    const r = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        Title: title.replace(/[^\x20-\x7e]/g, ''),
        Priority: priority === 'critical' ? 'urgent' : priority === 'warning' ? 'high' : 'default',
        Tags: priority === 'critical' ? 'rotating_light' : priority === 'warning' ? 'warning' : 'information_source',
        ...(url ? { Click: url } : {}),
      },
      body: message,
    }).catch((e) => ({ ok: false, status: e.message }));
    (r.ok ? sent : errors).push(r.ok ? 'ntfy' : `ntfy ${r.status}`);
  }
  const bot = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (bot && chat) {
    const r = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `${title}\n${message}`, disable_web_page_preview: true }),
    }).catch((e) => ({ ok: false, status: e.message }));
    (r.ok ? sent : errors).push(r.ok ? 'telegram' : `telegram ${r.status}`);
  }
  return { sent, errors };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!(await requireOwnerOrMonitor(req, res))) return;
  const { title = 'VP Control', message = 'Test notification — alerts will look like this.', priority = 'info' } = req.body || {};
  if (!process.env.NTFY_TOPIC && !process.env.TELEGRAM_BOT_TOKEN) return res.status(503).json({ error: 'No notification channel configured.' });
  res.status(200).json(await sendNotification({ title: String(title).slice(0, 120), message: String(message).slice(0, 2000), priority, url: 'https://admin.vishalpanwar.in/#/alerts' }));
};
module.exports.sendNotification = sendNotification;
