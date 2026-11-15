// Everything the scheduled monitor (scripts/monitor.mjs in GitHub Actions)
// needs in one call: hosts to ping (with dashboard edits applied), laptop
// services, Supabase status, and with ?daily=1 the slower checks (store
// listings, cloud bill forecasts, overdue invoices, contract renewals, and
// the day's Instagram follower counts for the trend chart).
// Auth: MONITOR_SECRET bearer, or the owner.
const { requireOwnerOrMonitor } = require('../_auth');
const { mergedProjects } = require('../_firestore');
const { loadLaptop } = require('./laptop');
const { loadProject } = require('./supabase');
const { loadApp } = require('./apps');
const { snapshotFollowers } = require('./instagram');

// Same rule as the dashboard's SEO tab: app, admin and API hosts aren't public sites.
const NOT_PUBLIC = /^(admin|app|api|api\d+|owner|restaurant|creator|automation|cms|dashboard|staging|dev)\./;

const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwnerOrMonitor(req, res))) return;
  const { projects, docs } = await mergedProjects();
  const active = projects.filter((p) => p.status !== 'decommissioned');

  const hosts = [];
  const seen = new Set();
  for (const p of active) {
    for (const h of p.domains || []) {
      if (h.startsWith('www.') || seen.has(h)) continue;
      seen.add(h);
      // Only live projects page you at night; others are warnings.
      hosts.push({ host: h, project: p.name, critical: p.status === 'live' });
    }
  }
  for (const d of Object.values(docs || {})) {
    for (const h of d.manual && !d.hidden ? d.hosts || [] : []) {
      if (!seen.has(h)) { seen.add(h); hosts.push({ host: h, project: d.name || h, critical: false }); }
    }
  }

  const supabaseSpecs = active.flatMap((p) => (p.supabase || []).map((s) => [s, p.name]));
  const [laptop, supabase] = await Promise.all([
    loadLaptop(docs),
    Promise.all(supabaseSpecs.map(async ([s, name]) => ({ project: name, ...(await loadProject(s)) }))),
  ]);

  const out = { at: new Date().toISOString(), firestore: !!docs, hosts, laptop, supabase };

  if (req.query.daily === '1') {
    const t = today();
    const appSpecs = active.flatMap((p) => (p.apps || []).map((a) => [a, p.name]));
    const igKeys = [...new Set(active.flatMap((p) => p.instagram || []))];
    [out.apps, out.instagram] = await Promise.all([
      Promise.all(appSpecs.map(async ([a, name]) => ({ project: name, ...(await loadApp(a)) }))),
      snapshotFollowers(igKeys),
    ]);
    out.overdue = active.flatMap((p) => (p.invoices || [])
      .filter((i) => i.status === 'sent' && i.due && i.due < t)
      .map((i) => ({ project: p.name, client: i.client, number: i.number, amount: i.amount, due: i.due })));
    out.contracts = active.flatMap((p) => (p.clients || [])
      .filter((c) => c.status !== 'past' && c.contractEnd)
      .map((c) => ({ project: p.name, client: c.name, ends: c.contractEnd, days: Math.floor((Date.parse(c.contractEnd) - Date.parse(t)) / 86400e3) }))
      .filter((c) => c.days <= 14));
    out.followUps = Object.entries(docs || {})
      .filter(([id, d]) => id.startsWith('lead-') && d.kind === 'lead' && d.followUp && d.followUp <= t && (d.status === 'new' || d.status === 'contacted'))
      .map(([, d]) => ({ name: d.name || d.email || d.phone || 'lead', site: d.site || d.project || '', due: d.followUp }));
    out.vitalsHosts = [...new Set(active
      .filter((p) => p.status === 'live')
      .flatMap((p) => (p.domains || []).filter((h) => !h.startsWith('www.') && !NOT_PUBLIC.test(h))))];
  }
  res.status(200).json(out);
};
