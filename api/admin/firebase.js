// Daily Firestore reads / writes / deletes for a few Firebase projects, from
// Cloud Monitoring, so a runaway listener shows up before the bill does.
// GET ?projects=sanero-media,aarambh-20a47
//
// Needs GCP_SA_KEY: a service account key (raw JSON or base64 of it) whose
// account has roles/monitoring.viewer on each project.
const crypto = require('node:crypto');
const { requireOwner } = require('./_auth');

const MAX = 8;
const DAYS = 7;
const ID_RE = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
// Spark/Blaze free tier per day.
const FREE = { reads: 50000, writes: 20000, deletes: 20000 };
const METRICS = {
  reads: 'firestore.googleapis.com/document/read_count',
  writes: 'firestore.googleapis.com/document/write_count',
  deletes: 'firestore.googleapis.com/document/delete_count',
};

function serviceAccount() {
  const raw = process.env.GCP_SA_KEY;
  if (!raw) return null;
  const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(json);
}

let tokenCache = { token: null, exp: 0 };
async function accessToken(sa) {
  if (tokenCache.token && Date.now() < tokenCache.exp - 60e3) return tokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/monitoring.read',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  if (!r.ok) throw new Error(`Google auth ${r.status}`);
  const body = await r.json();
  tokenCache = { token: body.access_token, exp: Date.now() + body.expires_in * 1000 };
  return tokenCache.token;
}

async function series(token, project, metric) {
  const end = new Date();
  const start = new Date(end.getTime() - DAYS * 86400e3);
  const q = new URLSearchParams({
    filter: `metric.type="${metric}"`,
    'interval.startTime': start.toISOString(),
    'interval.endTime': end.toISOString(),
    'aggregation.alignmentPeriod': '86400s',
    'aggregation.perSeriesAligner': 'ALIGN_SUM',
    'aggregation.crossSeriesReducer': 'REDUCE_SUM',
  });
  const r = await fetch(`https://monitoring.googleapis.com/v3/projects/${project}/timeSeries?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 403) throw new Error('no monitoring.viewer access');
  if (!r.ok) throw new Error(`Monitoring ${r.status}`);
  const points = (await r.json()).timeSeries?.[0]?.points || [];
  return points
    .map((p) => ({ day: p.interval.endTime.slice(0, 10), value: Number(p.value.int64Value ?? p.value.doubleValue ?? 0) }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

async function usage(token, project) {
  try {
    const entries = await Promise.all(Object.entries(METRICS).map(async ([k, m]) => [k, await series(token, project, m)]));
    const out = { project };
    for (const [k, points] of entries) {
      out[k] = { daily: points, latest: points.at(-1)?.value || 0, peak: Math.max(0, ...points.map((p) => p.value)), free: FREE[k] };
    }
    return out;
  } catch (e) {
    return { project, error: String(e.message || e) };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  let sa;
  try { sa = serviceAccount(); } catch { return res.status(500).json({ error: 'GCP_SA_KEY is not valid JSON.' }); }
  if (!sa) return res.status(503).json({ error: 'GCP_SA_KEY missing on the server.' });
  const projects = [...new Set(String(req.query.projects || '').split(','))].filter((p) => ID_RE.test(p)).slice(0, MAX);
  try {
    const token = await accessToken(sa);
    res.status(200).json({ projects: await Promise.all(projects.map((p) => usage(token, p))), account: sa.client_email });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
