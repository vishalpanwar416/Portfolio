// Google service-account auth shared by firebase.js and cloud.js.
// GCP_SA_KEY holds the key file as raw JSON or base64 of it.
const crypto = require('node:crypto');

function serviceAccount() {
  const raw = process.env.GCP_SA_KEY;
  if (!raw) return null;
  const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(json);
}

const tokens = new Map(); // scope -> { token, exp }
async function accessToken(sa, scope) {
  const hit = tokens.get(scope);
  if (hit && Date.now() < hit.exp - 60e3) return hit.token;
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({
    iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  if (!r.ok) throw new Error(`Google auth ${r.status}`);
  const body = await r.json();
  tokens.set(scope, { token: body.access_token, exp: Date.now() + body.expires_in * 1000 });
  return body.access_token;
}

module.exports = { serviceAccount, accessToken };
