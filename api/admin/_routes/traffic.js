// Page views per Vercel project per day, from Vercel Web Analytics via the
// observability query API. GET ?days=30. Projects without Web Analytics
// enabled simply don't appear.
const { requireOwner } = require('../_auth');

const API = 'https://api.vercel.com';

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
    const r = await fetch(`${API}/v2/observability/query?teamId=${teamId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: { type: 'owner', ownerId: teamId },
        metric: 'vercel.analytics_pageview.count',
        aggregation: 'sum',
        groupBy: ['project_id'],
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        granularity: { days: 1 },
        limit: 50,
      }),
    });
    if (!r.ok) {
      const err = (await r.json().catch(() => ({}))).error || {};
      throw new Error(`Vercel API ${r.status}${err.code ? ` (${err.code}: ${err.message})` : ''}`);
    }
    const body = await r.json();
    const valueKey = (row) => Object.keys(row).find((k) => k.endsWith('_sum'));
    const projects = {};
    for (const row of body.data || []) {
      const id = row.project_id;
      if (!id) continue;
      const p = (projects[id] ||= { total: 0, daily: {} });
      const n = Number(row[valueKey(row)]) || 0;
      const day = String(row.timestamp).slice(0, 10);
      p.daily[day] = (p.daily[day] || 0) + n;
      p.total += n;
    }
    res.status(200).json({ days, since: start.toISOString(), projects });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
