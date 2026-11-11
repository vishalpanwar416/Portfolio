// Daily Firestore reads / writes / deletes for a few Firebase projects, from
// Cloud Monitoring, so a runaway listener shows up before the bill does.
// GET ?projects=sanero-media,aarambh-20a47
//
// Needs GCP_SA_KEY: a service account key (raw JSON or base64 of it) whose
// account has roles/monitoring.viewer on each project.
const { requireOwner } = require('../_auth');
const { serviceAccount, accessToken } = require('../_gcp');

const SCOPE = 'https://www.googleapis.com/auth/monitoring.read';

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
    const token = await accessToken(sa, SCOPE);
    res.status(200).json({ projects: await Promise.all(projects.map((p) => usage(token, p))), account: sa.client_email });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
