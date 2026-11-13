// Where traffic comes from, per Vercel project: unique visitors, top pages,
// referrers, countries and devices, from Vercel Web Analytics via the
// observability query API. GET ?days=30. Ordering by the value key is what
// makes the API return `summary` (totals over the whole range).
const { requireOwner } = require('../_auth');

const API = 'https://api.vercel.com';
const BREAKDOWNS = {
  paths: 'request_path',
  referrers: 'referrer_hostname',
  countries: 'country',
  devices: 'device_type',
};
const TOP = 10;

async function query(token, teamId, { aggregation, groupBy, start, end }) {
  const valueKey = `vercel_analytics_pageview_count_${aggregation.replace('/', '_')}`;
  const r = await fetch(`${API}/v2/observability/query?teamId=${teamId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scope: { type: 'owner', ownerId: teamId },
      metric: 'vercel.analytics_pageview.count',
      aggregation,
      groupBy,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      granularity: { days: 1 },
      limit: 200,
      orderBy: valueKey,
      orderDirection: 'desc',
    }),
  });
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))).error || {};
    throw new Error(`Vercel API ${r.status}${err.code ? ` (${err.code}: ${err.message})` : ''}`);
  }
  const body = await r.json();
  return (body.summary || []).map((row) => ({ ...row, value: Number(row[valueKey]) || 0 }));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return res.status(503).json({ error: 'VERCEL_TOKEN / VERCEL_TEAM_ID missing on the server.' });

  const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400e3);
  try {
    const keys = Object.keys(BREAKDOWNS);
    const [visitors, views, ...breakdowns] = await Promise.all([
      query(token, teamId, { aggregation: 'unique/visitor_id', groupBy: ['project_id'], start, end }),
      query(token, teamId, { aggregation: 'sum', groupBy: ['project_id'], start, end }),
      ...keys.map((k) => query(token, teamId, { aggregation: 'sum', groupBy: ['project_id', BREAKDOWNS[k]], start, end })),
    ]);

    const projects = {};
    const get = (id) => (projects[id] ||= { visitors: 0, views: 0, ...Object.fromEntries(keys.map((k) => [k, []])) });
    for (const row of visitors) if (row.project_id) get(row.project_id).visitors = row.value;
    for (const row of views) if (row.project_id) get(row.project_id).views = row.value;
    keys.forEach((k, i) => {
      for (const row of breakdowns[i]) {
        if (!row.project_id || !row.value) continue;
        const list = get(row.project_id)[k];
        // An empty referrer is a direct visit (typed URL, bookmark, app).
        if (list.length < TOP) list.push({ key: row[BREAKDOWNS[k]] || (k === 'referrers' ? '(direct)' : '(unknown)'), count: row.value });
      }
    });
    res.status(200).json({ days, since: start.toISOString(), projects });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
