// Supabase projects: paused/healthy, database and storage size against the
// free-plan limits, API requests in the last day.
// GET ?refs=tabletap:vogixryubhpqziivspks,splink:altpnwfozryqufjbarti
// Needs SUPABASE_<LABEL>_TOKEN, a personal access token from
// supabase.com/dashboard/account/tokens for the account that owns the project.
const { requireOwnerOrMonitor } = require('../_auth');

const TTL_MS = 15 * 60e3;
const RE = /^([a-z0-9_]{1,30}):([a-z]{20})$/;
const FREE = { dbBytes: 500 * 1024 ** 2, storageBytes: 1024 ** 3 };
const cache = new Map();

async function sb(token, path, init = {}) {
  const r = await fetch(`https://api.supabase.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
    signal: AbortSignal.timeout(15000),
  });
  if (r.status === 401) throw new Error('Supabase rejected the access token');
  if (r.status === 404) throw new Error('project not found for this token');
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

async function loadProject(spec) {
  const hit = cache.get(spec);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const [, label, ref] = spec.match(RE);
  const token = process.env[`SUPABASE_${label.toUpperCase()}_TOKEN`];
  if (!token) return { spec, ref, account: label, notConfigured: true, error: `SUPABASE_${label.toUpperCase()}_TOKEN missing on the server` };
  try {
    const project = await sb(token, `/projects/${ref}`);
    const out = {
      spec, ref, account: label,
      name: project.name,
      region: project.region,
      status: project.status, // ACTIVE_HEALTHY, INACTIVE (paused), COMING_UP, …
      createdAt: project.created_at,
      dashboard: `https://supabase.com/dashboard/project/${ref}`,
      free: FREE,
    };
    if (project.status === 'ACTIVE_HEALTHY' || project.status === 'ACTIVE_UNHEALTHY') {
      const [health, sizes, usage] = await Promise.all([
        sb(token, `/projects/${ref}/health?services=auth&services=db&services=rest&services=storage&services=realtime`).catch(() => null),
        sb(token, `/projects/${ref}/database/query`, {
          method: 'POST',
          body: JSON.stringify({ query: "select pg_database_size(current_database())::bigint as db, coalesce((select sum((metadata->>'size')::bigint) from storage.objects), 0)::bigint as storage" }),
        }).catch(() => null),
        sb(token, `/projects/${ref}/analytics/endpoints/usage.api-counts?interval=1day`).catch(() => null),
      ]);
      out.health = Array.isArray(health) ? health.map((h) => ({ name: h.name, healthy: h.healthy, status: h.status })) : null;
      const row = Array.isArray(sizes) ? sizes[0] : null;
      out.dbBytes = row ? Number(row.db) : null;
      out.storageBytes = row ? Number(row.storage) : null;
      const series = usage?.result || [];
      out.requests24h = series.length ? series.reduce((t, r) => t + Object.entries(r).filter(([k]) => k.startsWith('total_')).reduce((s, [, v]) => s + (Number(v) || 0), 0), 0) : null;
    }
    cache.set(spec, { at: Date.now(), value: out });
    return out;
  } catch (e) {
    return { spec, ref, account: label, error: String(e.message || e) };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwnerOrMonitor(req, res))) return;
  const refs = [...new Set(String(req.query.refs || '').split(','))].filter((s) => RE.test(s)).slice(0, 10);
  res.status(200).json({ projects: await Promise.all(refs.map(loadProject)) });
};
module.exports.loadProject = loadProject;
