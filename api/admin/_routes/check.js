// Live uptime check for a list of hostnames: HTTP status, response time and
// days until the TLS certificate expires. POST { hosts: ["sanero.in", ...] }.
const tls = require('node:tls');
const { requireOwner } = require('../_auth');

const MAX_HOSTS = 40;
const TIMEOUT_MS = 8000;
// Public DNS names only — no IPs, localhost or internal names.
const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})*\.[a-z]{2,63}$/i;

function certExpiry(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, timeout: TIMEOUT_MS }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve(cert?.valid_to ? new Date(cert.valid_to).toISOString() : null);
    });
    socket.on('error', () => resolve(null));
    socket.on('timeout', () => { socket.destroy(); resolve(null); });
  });
}

async function checkHost(host) {
  const started = Date.now();
  let status = null;
  let error = null;
  try {
    const r = await fetch(`https://${host}/`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'vishalpanwar-admin-uptime/1.0' },
    });
    status = r.status;
    await r.arrayBuffer().catch(() => {});
  } catch (e) {
    error = e.name === 'TimeoutError' ? 'timeout' : String(e.cause?.code || e.message || e);
  }
  const ms = Date.now() - started;
  const certValidTo = await certExpiry(host);
  return { host, up: status !== null && status < 500, status, ms, error, certValidTo, checkedAt: new Date().toISOString() };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!(await requireOwner(req, res))) return;
  const hosts = [...new Set((req.body?.hosts || []).map((h) => String(h).trim().toLowerCase()))]
    .filter((h) => HOST_RE.test(h))
    .slice(0, MAX_HOSTS);
  const results = await Promise.all(hosts.map(checkHost));
  res.status(200).json({ results });
};
