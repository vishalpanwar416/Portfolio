// PageSpeed Insights (mobile) for every public site: Lighthouse scores for
// performance, SEO, accessibility and best practices, lab LCP/CLS/TBT, and
// Chrome UX Report field data where Google has enough visits.
//
// POST { hosts } runs the checks and saves them to the `vitals` doc in
// vp_sites (last 30 runs per host), so the dashboard shows the history live.
// The scheduled monitor calls it once a day with MONITOR_SECRET and alerts on
// `drops`. Calls are billed to PAGESPEED_API_KEY if set, else to the
// GCP_SA_KEY service account's project (which needs the PageSpeed Insights
// API turned on); anonymous calls share a quota that's often used up.
const { requireOwnerOrMonitor } = require('../_auth');
const { getSite, writeSite } = require('../_firestore');
const { serviceAccount, accessToken } = require('../_gcp');

const MAX_HOSTS = 20;
const KEEP = 30;
const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})*\.[a-z]{2,63}$/i;
const CATEGORIES = ['performance', 'seo', 'accessibility', 'best-practices'];
const DROP = 10; // points of performance lost since the last run

const pick = (audits, id) => (audits[id]?.numericValue ?? null);

/** Turns Google's quota and API-disabled errors into what to do about them. */
function explain(msg, sa) {
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) {
    return `Turn on the PageSpeed Insights API in Google Cloud project ${sa?.project_id || '(service account’s)'}.`;
  }
  if (/quota/i.test(msg)) {
    return sa || process.env.PAGESPEED_API_KEY
      ? 'PageSpeed daily quota used up; try again tomorrow.'
      : 'Google’s shared PageSpeed quota is used up. Add PAGESPEED_API_KEY or GCP_SA_KEY on the server.';
  }
  return msg.slice(0, 200);
}

async function auth() {
  if (process.env.PAGESPEED_API_KEY) return { key: process.env.PAGESPEED_API_KEY };
  let sa = null;
  try { sa = serviceAccount(); } catch { sa = null; }
  if (!sa) return {};
  try {
    return { sa, headers: { Authorization: `Bearer ${await accessToken(sa, 'openid')}` } };
  } catch {
    return {};
  }
}

async function run(host, creds) {
  const qs = new URLSearchParams({ url: `https://${host}/`, strategy: 'mobile' });
  for (const c of CATEGORIES) qs.append('category', c);
  if (creds.key) qs.set('key', creds.key);
  const at = Date.now();
  try {
    const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, { headers: creds.headers, signal: AbortSignal.timeout(120e3) });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return { at, error: explain(body.error?.message || `HTTP ${r.status}`, creds.sa) };
    const lh = body.lighthouseResult || {};
    const cats = lh.categories || {};
    const audits = lh.audits || {};
    const score = (k) => (cats[k]?.score == null ? null : Math.round(cats[k].score * 100));
    const field = body.loadingExperience?.metrics || {};
    const p75 = (k) => field[k]?.percentile ?? null;
    return {
      at,
      performance: score('performance'),
      seo: score('seo'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      lcp: pick(audits, 'largest-contentful-paint'),
      cls: pick(audits, 'cumulative-layout-shift'),
      tbt: pick(audits, 'total-blocking-time'),
      fcp: pick(audits, 'first-contentful-paint'),
      field: body.loadingExperience?.overall_category ? {
        overall: body.loadingExperience.overall_category,
        lcp: p75('LARGEST_CONTENTFUL_PAINT_MS'),
        inp: p75('INTERACTION_TO_NEXT_PAINT'),
        cls: p75('CUMULATIVE_LAYOUT_SHIFT_SCORE'),
      } : null,
    };
  } catch (e) {
    return { at, error: e.name === 'TimeoutError' ? 'timeout' : String(e.message || e) };
  }
}

/** Last successful run before the newest one. */
const previous = (runs) => runs.slice(0, -1).reverse().find((r) => r.performance != null);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!(await requireOwnerOrMonitor(req, res))) return;
  const hosts = [...new Set((req.body?.hosts || []).map((h) => String(h).trim().toLowerCase()))]
    .filter((h) => HOST_RE.test(h))
    .slice(0, MAX_HOSTS);
  if (!hosts.length) return res.status(400).json({ error: 'No hosts' });

  const creds = await auth();
  const results = await Promise.all(hosts.map(async (host) => ({ host, run: await run(host, creds) })));

  let saved = null;
  try { saved = await getSite('vitals'); } catch { saved = null; }
  const sites = Array.isArray(saved?.sites) ? saved.sites : [];
  const drops = [];
  for (const { host, run: r } of results) {
    let site = sites.find((s) => s.host === host);
    if (!site) { site = { host, runs: [] }; sites.push(site); }
    site.runs = [...(site.runs || []), r].slice(-KEEP);
    const prev = previous(site.runs);
    if (r.performance != null && prev && prev.performance - r.performance >= DROP) {
      drops.push({ host, from: prev.performance, to: r.performance });
    }
  }
  try {
    await writeSite('vitals', { kind: 'vitals', sites, updatedAt: Date.now() });
  } catch (e) {
    return res.status(200).json({ results, drops, saveError: e.message });
  }
  res.status(200).json({ results, drops });
};
