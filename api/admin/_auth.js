// Verifies the Firebase ID token the admin dashboard sends, without the
// Admin SDK: it's an RS256 JWT signed by Google's securetoken service, so
// checking it against Google's published certs is enough.
//
// Sign-in reuses the sanero-media Firebase project (same owner account as the
// Sanero admin), and only the `superAdmin` custom claim gets in — that claim
// is set server-side by sanero-next/scripts/set-admin.mjs and can't be forged.
// Files starting with `_` under api/ are not deployed as routes.
const crypto = require('node:crypto');

const PROJECT_ID = 'sanero-media';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certCache = { certs: null, fetchedAt: 0 };
async function googleCerts() {
  if (certCache.certs && Date.now() - certCache.fetchedAt < 30 * 60e3) return certCache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error('cert fetch failed');
  certCache = { certs: await res.json(), fetchedAt: Date.now() };
  return certCache.certs;
}

const b64urlJson = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

async function verifyOwner(idToken) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) return null;
  const header = b64urlJson(parts[0]);
  const payload = b64urlJson(parts[1]);
  const pem = (await googleCerts())[header.kid];
  if (!pem || header.alg !== 'RS256') return null;
  const ok = crypto
    .createVerify('RSA-SHA256')
    .update(`${parts[0]}.${parts[1]}`)
    .verify(crypto.createPublicKey(pem), Buffer.from(parts[2], 'base64url'));
  const now = Math.floor(Date.now() / 1000);
  if (
    !ok ||
    payload.aud !== PROJECT_ID ||
    payload.iss !== `https://securetoken.google.com/${PROJECT_ID}` ||
    payload.exp <= now ||
    payload.email_verified !== true ||
    payload.superAdmin !== true
  ) return null;
  return { uid: payload.user_id || payload.sub, email: payload.email };
}

/** Sends 401 and returns null unless the request carries the owner's token. */
async function requireOwner(req, res) {
  const idToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let owner = null;
  try { owner = await verifyOwner(idToken); } catch { owner = null; }
  if (!owner) res.status(401).json({ error: 'unauthorized' });
  return owner;
}

/**
 * Like requireOwner, but also lets the uptime monitor (GitHub Actions) in
 * with the shared MONITOR_SECRET. Returns 'owner' | 'monitor' | null.
 */
async function requireOwnerOrMonitor(req, res) {
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const secret = process.env.MONITOR_SECRET;
  if (secret && bearer.length === secret.length &&
      crypto.timingSafeEqual(Buffer.from(bearer), Buffer.from(secret))) return 'monitor';
  return (await requireOwner(req, res)) ? 'owner' : null;
}

module.exports = { requireOwner, requireOwnerOrMonitor };
