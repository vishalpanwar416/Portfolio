// The project registry: every project is a `proj-<slug>` doc in vp_sites
// (kind:'project'), edited from the dashboard. This is the only copy; nothing
// is read from the repo any more.
//
// GET  (owner or MONITOR_SECRET): { projects } with slug, name, status,
//      domains, services and alert level. The laptop agent uses it to know
//      which systemd units to watch.
// POST { action: 'seed', projects } (owner or monitor): one-time import of a
//      project list. Existing docs win over the imported values, so dashboard
//      edits are kept; docs already imported are left alone.
// POST { action: 'patch', slug, fields } (owner or monitor): updates a few
//      safe fields of one project (domains, logo, summary) without the editor.
const { requireOwnerOrMonitor } = require('../_auth');
const { readSites, mergeDocs, deleteSite, registryProjects, getSite } = require('../_firestore');

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

async function seed(list, res) {
  const docs = await readSites();
  if (!docs) return res.status(503).json({ error: 'Firestore not readable' });
  const writes = [];
  const removed = [];
  const seen = new Set();
  list.forEach((p, i) => {
    const slug = String(p?.slug || '');
    if (!SLUG_RE.test(slug) || seen.has(slug)) return;
    seen.add(slug);
    const id = `proj-${slug}`;
    const existing = docs[id];
    if (existing?.seeded) return;
    if (existing?.deleted) { removed.push(id); return; }
    writes.push({ id, data: { ...p, ...(existing || {}), slug, kind: 'project', order: existing?.order ?? i * 10, seeded: true } });
  });
  // Projects added by hand in the dashboard before the import.
  let extra = 1000;
  for (const [id, d] of Object.entries(docs)) {
    if (d.kind !== 'project' || !id.startsWith('proj-') || d.seeded || seen.has(id.slice(5))) continue;
    if (d.deleted) { removed.push(id); continue; }
    writes.push({ id, data: { category: 'Product', status: 'building', ...d, name: d.name || id.slice(5), slug: id.slice(5), kind: 'project', order: d.order ?? (extra += 10), seeded: true } });
  }
  if (writes.length) await mergeDocs('vp_sites', writes);
  for (const id of removed) await deleteSite(id);
  return res.status(200).json({ imported: writes.map((w) => w.id), removed });
}

const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})*\.[a-z]{2,63}$/i;

async function patch(body, res) {
  const slug = String(body.slug || '');
  const f = body.fields || {};
  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: 'bad slug' });
  const doc = await getSite(`proj-${slug}`);
  if (!doc || doc.kind !== 'project') return res.status(404).json({ error: 'no such project' });
  const data = {};
  if (Array.isArray(f.domains)) data.domains = [...new Set(f.domains.map((h) => String(h).trim().toLowerCase()))].filter((h) => HOST_RE.test(h)).slice(0, 20);
  if (typeof f.logo === 'string' && (f.logo === '' || /^(https:\/\/|\/logos\/)/.test(f.logo))) data.logo = f.logo.slice(0, 500);
  if (typeof f.summary === 'string') data.summary = f.summary.slice(0, 400);
  if (!Object.keys(data).length) return res.status(400).json({ error: 'nothing to change (domains, logo, summary)' });
  await mergeDocs('vp_sites', [{ id: `proj-${slug}`, data }]);
  return res.status(200).json({ ok: true, slug, changed: data });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwnerOrMonitor(req, res))) return;
  try {
    if (req.method === 'POST') {
      if (req.body?.action === 'patch') return await patch(req.body, res);
      if (req.body?.action !== 'seed' || !Array.isArray(req.body.projects)) return res.status(400).json({ error: 'POST { action: "seed", projects: [...] } or { action: "patch", slug, fields }' });
      return await seed(req.body.projects.slice(0, 200), res);
    }
    const { projects, docs } = await registryProjects({ includeHidden: true });
    if (!docs) return res.status(503).json({ error: 'Firestore not readable' });
    res.status(200).json({
      projects: projects.map((p) => ({
        slug: p.slug, name: p.name, status: p.status, hidden: !!p.hidden, alerts: p.alerts || null,
        domains: p.domains || [], services: p.services || [],
      })),
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
