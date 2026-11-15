// Google Search Console: clicks, impressions, CTR and average position per
// site, with daily totals, top queries and top pages. GET ?days=28.
//
// Uses the GCP_SA_KEY service account. Each site has to list that account's
// email as a user (Search Console → Settings → Users and permissions →
// Add user, "Restricted" is enough); the response includes the email so the
// dashboard can show it. Search data lags 2–3 days, so ranges end then.
const { requireOwner } = require('../_auth');
const { serviceAccount, accessToken } = require('../_gcp');

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const BASE = 'https://www.googleapis.com/webmasters/v3';
const TTL_MS = 30 * 60e3;
const cache = new Map();

const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);

/** "sc-domain:sanero.in" or "https://sanero.in/" → "sanero.in" */
const hostOf = (siteUrl) => siteUrl.startsWith('sc-domain:')
  ? siteUrl.slice(10)
  : siteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

async function gsc(token, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = json.error?.message || `HTTP ${r.status}`;
    throw new Error(/has not been used|is disabled/i.test(msg) ? 'Turn on the Search Console API in the service account’s Google Cloud project' : msg);
  }
  return json;
}

const rows = (res, key) => (res.rows || []).map((r) => ({
  [key]: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
}));

async function loadSite(token, siteUrl, startDate, endDate) {
  const path = `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const q = (extra) => gsc(token, path, { startDate, endDate, dataState: 'all', ...extra });
  const [totals, daily, queries, pages] = await Promise.all([
    q({}),
    q({ dimensions: ['date'], rowLimit: 500 }),
    q({ dimensions: ['query'], rowLimit: 25 }),
    q({ dimensions: ['page'], rowLimit: 15 }),
  ]);
  const t = totals.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: null };
  return {
    siteUrl,
    host: hostOf(siteUrl),
    clicks: t.clicks,
    impressions: t.impressions,
    ctr: t.ctr,
    position: t.position,
    daily: rows(daily, 'date'),
    queries: rows(queries, 'query'),
    pages: rows(pages, 'page'),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  let sa;
  try { sa = serviceAccount(); } catch { sa = null; }
  if (!sa) return res.status(503).json({ error: 'GCP_SA_KEY missing on the server' });

  const days = Math.min(Math.max(Number(req.query.days) || 28, 7), 90);
  const hit = cache.get(days);
  if (hit && Date.now() - hit.at < TTL_MS && req.query.fresh !== '1') return res.status(200).json(hit.body);

  try {
    const token = await accessToken(sa, SCOPE);
    const { siteEntry = [] } = await gsc(token, '/sites');
    const usable = siteEntry.filter((s) => s.permissionLevel !== 'siteUnverifiedUser');
    const end = Date.now() - 2 * 86400e3;
    const startDate = ymd(end - (days - 1) * 86400e3);
    const endDate = ymd(end);
    const sites = await Promise.all(usable.map((s) => loadSite(token, s.siteUrl, startDate, endDate)
      .catch((e) => ({ siteUrl: s.siteUrl, host: hostOf(s.siteUrl), error: e.message }))));
    const body = { days, startDate, endDate, account: sa.client_email, sites };
    cache.set(days, { at: Date.now(), body });
    res.status(200).json(body);
  } catch (e) {
    res.status(502).json({ error: `${e.message} (service account ${sa.client_email}, project ${sa.project_id}).`, account: sa.client_email });
  }
};
