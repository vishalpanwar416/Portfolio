// Docs admin: run docs.vishalpanwar.in from the dashboard. Changes are owner
// only; the read-only overview also takes MONITOR_SECRET (for health checks).
//
// GET  → { docs, workspaces, people, storage }   (no markdown or file bytes)
// POST { action, ... }:
//   updateDoc       { slug, title?, visibility?, workspace?, sharedWith? }
//   deleteDoc       { slug }                     doc, its photos and files
//   createWorkspace { name, description?, id?, members? }
//   updateWorkspace { id, name?, description?, addMembers?, removeMembers? }
//   deleteWorkspace { id }                       its docs stay, outside any workspace
//   revoke          { who }                      remove an email or @domain everywhere
//
// Writes keep each workspace's `docs` index in step with its documents, like
// the docs site's dashboard and MCP server.
const { requireOwner, requireOwnerOrMonitor } = require('../_auth');
const fs = require('../_docsstore');

const SITE = 'https://docs.vishalpanwar.in';
const DOCS = 'vp_docs';
const WORKSPACES = 'vp_workspaces';
const IMAGES = 'vp_images';
const FILES = 'vp_files';
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

const bad = (message) => Object.assign(new Error(message), { status: 400 });

function checkSlug(value, what = 'Address') {
  if (typeof value !== 'string' || !SLUG.test(value)) throw bad(`${what} "${value}" must be lowercase letters, numbers and dashes.`);
  return value;
}

// "a@b.com" is a person, "@b.com" (or "b.com") everyone at that company.
function splitPeople(entries = []) {
  const emails = [];
  const domains = [];
  for (const raw of Array.isArray(entries) ? entries : []) {
    const entry = String(raw).trim().toLowerCase();
    if (!entry) continue;
    if (EMAIL.test(entry)) emails.push(entry);
    else if (DOMAIN.test(entry.replace(/^@/, ''))) domains.push(entry.replace(/^@/, ''));
    else throw bad(`"${raw}" is neither an email nor a domain like @company.com.`);
  }
  return { emails: [...new Set(emails)], domains: [...new Set(domains)] };
}

const docSummary = (d) => ({
  slug: d.id,
  title: d.title || d.id,
  visibility: d.visibility || 'protected',
  workspace: d.workspace || '',
  sharedWith: [...(d.allowEmails || []), ...(d.allowDomains || []).map((x) => '@' + x)],
  createdAt: d.createdAt || null,
  updatedAt: d.updatedAt || null,
  url: `${SITE}/${d.id}`,
});

const workspaceSummary = (w) => ({
  id: w.id,
  name: w.name || w.id,
  description: w.description || '',
  members: [...(w.memberEmails || []), ...(w.memberDomains || []).map((x) => '@' + x)],
  createdAt: w.createdAt || null,
  updatedAt: w.updatedAt || null,
});

/** Everyone with access, and through what. */
function people(docs, workspaces) {
  const map = new Map();
  const entry = (who) => map.get(who) || map.set(who, { who, kind: who.startsWith('@') ? 'domain' : 'person', workspaces: [], docs: [] }).get(who);
  for (const w of workspaces) for (const who of w.members) entry(who).workspaces.push(w.id);
  for (const d of docs) for (const who of d.sharedWith) entry(who).docs.push(d.slug);
  return [...map.values()].sort((a, b) => a.who.localeCompare(b.who));
}

async function overview() {
  const [rawDocs, rawWs, images, files] = await Promise.all([
    fs.list(DOCS, ['title', 'visibility', 'workspace', 'allowEmails', 'allowDomains', 'createdAt', 'updatedAt']),
    fs.list(WORKSPACES, ['name', 'description', 'memberEmails', 'memberDomains', 'createdAt', 'updatedAt']),
    fs.list(IMAGES, ['doc']),
    fs.list(FILES, ['doc', 'kind', 'size']),
  ]);
  const docs = rawDocs.map(docSummary).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const counts = {};
  for (const i of images) (counts[i.doc] ??= { photos: 0, files: 0, bytes: 0 }).photos++;
  for (const f of files) { const c = (counts[f.doc] ??= { photos: 0, files: 0, bytes: 0 }); c.files++; c.bytes += f.size || 0; }
  for (const d of docs) Object.assign(d, counts[d.slug] || { photos: 0, files: 0, bytes: 0 });
  const workspaces = rawWs.map(workspaceSummary).sort((a, b) => a.name.localeCompare(b.name));
  for (const w of workspaces) w.docs = docs.filter((d) => d.workspace === w.id).map((d) => d.slug);
  return {
    site: SITE,
    docs,
    workspaces,
    people: people(docs, workspaces),
    storage: { photos: images.length, files: files.length, fileBytes: files.reduce((t, f) => t + (f.size || 0), 0) },
  };
}

async function requireWorkspace(id) {
  const w = await fs.get(WORKSPACES, checkSlug(id, 'Workspace id'));
  if (!w) throw Object.assign(new Error(`No workspace "${id}".`), { status: 404 });
  return w;
}

async function updateDoc(b) {
  const slug = checkSlug(b.slug);
  const doc = await fs.get(DOCS, slug);
  if (!doc) throw Object.assign(new Error(`No document "${slug}".`), { status: 404 });
  const paths = [];
  const values = {};
  if (typeof b.title === 'string' && b.title.trim()) { paths.push('title'); values.title = b.title.trim().slice(0, 200); }
  if (b.visibility !== undefined) {
    if (!['protected', 'public'].includes(b.visibility)) throw bad('visibility is protected or public');
    paths.push('visibility'); values.visibility = b.visibility;
  }
  if (b.sharedWith !== undefined) {
    const p = splitPeople(b.sharedWith);
    paths.push('allowEmails', 'allowDomains'); values.allowEmails = p.emails; values.allowDomains = p.domains;
  }
  const before = doc.workspace || '';
  const after = b.workspace === undefined ? before : String(b.workspace);
  if (after !== before) {
    if (after) await requireWorkspace(after);
    paths.push('workspace'); values.workspace = after;
  }
  if (!paths.length) throw bad('Nothing to change.');
  const title = values.title || doc.title || slug;
  const writes = [fs.patch(DOCS, slug, paths, values, { serverTime: ['updatedAt'] })];
  if (before && before !== after && (await fs.get(WORKSPACES, before))) {
    writes.push(fs.patch(WORKSPACES, before, [fs.fieldPath('docs', slug)], {}, { serverTime: ['updatedAt'] }));
  }
  if (after && (after !== before || values.title)) {
    const key = fs.fieldPath('docs', slug, 'title');
    writes.push(fs.patch(WORKSPACES, after, [key], { [key]: title }, { serverTime: [fs.fieldPath('docs', slug, 'updatedAt')] }));
  }
  await fs.commit(writes);
  return { saved: slug };
}

async function deleteDocument(b) {
  const slug = checkSlug(b.slug);
  const doc = await fs.get(DOCS, slug);
  if (!doc) throw Object.assign(new Error(`No document "${slug}".`), { status: 404 });
  const [images, files] = await Promise.all([fs.list(IMAGES, ['doc']), fs.list(FILES, ['doc', 'chunks'])]);
  const photos = images.filter((i) => i.doc === slug);
  const own = files.filter((f) => f.doc === slug);
  const writes = [fs.remove(DOCS, slug), ...photos.map((i) => fs.remove(IMAGES, i.id))];
  for (const f of own) {
    writes.push(fs.remove(FILES, f.id));
    for (let n = 0; n < (f.chunks || 0); n++) writes.push(fs.remove(`${FILES}/${f.id}/chunks`, String(n).padStart(3, '0')));
  }
  if (doc.workspace && (await fs.get(WORKSPACES, doc.workspace))) {
    writes.push(fs.patch(WORKSPACES, doc.workspace, [fs.fieldPath('docs', slug)], {}, { serverTime: ['updatedAt'] }));
  }
  await fs.commit(writes);
  return { deleted: slug, photos: photos.length, files: own.length };
}

async function createWorkspace(b) {
  const nm = String(b.name || '').trim();
  if (!nm) throw bad('A workspace needs a name.');
  const id = checkSlug(b.id || nm.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80), 'Workspace id');
  const p = splitPeople(b.members);
  try {
    await fs.commit([fs.create(WORKSPACES, id, { name: nm.slice(0, 120), description: String(b.description || '').trim().slice(0, 500), memberEmails: p.emails, memberDomains: p.domains, docs: {} }, ['createdAt', 'updatedAt'])]);
  } catch (e) {
    if (e.status === 409) throw Object.assign(new Error(`Workspace "${id}" already exists.`), { status: 409 });
    throw e;
  }
  return { created: id };
}

async function updateWorkspace(b) {
  const w = await requireWorkspace(b.id);
  const add = splitPeople(b.addMembers);
  const drop = splitPeople(b.removeMembers);
  const paths = [];
  const values = {};
  if (typeof b.name === 'string' && b.name.trim()) { paths.push('name'); values.name = b.name.trim().slice(0, 120); }
  if (typeof b.description === 'string') { paths.push('description'); values.description = b.description.trim().slice(0, 500); }
  const adds = [];
  if (add.emails.length) adds.push(fs.arrayUnion('memberEmails', add.emails));
  if (add.domains.length) adds.push(fs.arrayUnion('memberDomains', add.domains));
  const removes = [];
  if (drop.emails.length) removes.push(fs.arrayRemove('memberEmails', drop.emails));
  if (drop.domains.length) removes.push(fs.arrayRemove('memberDomains', drop.domains));
  if (!paths.length && !adds.length && !removes.length) throw bad('Nothing to change.');
  // One write can't both add to and remove from the same field.
  const writes = [fs.patch(WORKSPACES, w.id, paths, values, { serverTime: ['updatedAt'], transforms: adds })];
  if (removes.length) writes.push(fs.patch(WORKSPACES, w.id, [], {}, { transforms: removes }));
  await fs.commit(writes);
  return { saved: w.id, invite: add.emails.length || add.domains.length
    ? `Hi! I've added you to the "${values.name || w.name}" workspace on my docs site. Open ${SITE} and sign in with your Google account to see its documents.`
    : null };
}

async function deleteWorkspace(b) {
  const w = await requireWorkspace(b.id);
  const docs = (await fs.list(DOCS, ['workspace'])).filter((d) => d.workspace === w.id);
  await fs.commit([fs.remove(WORKSPACES, w.id), ...docs.map((d) => fs.patch(DOCS, d.id, ['workspace'], { workspace: '' }, { serverTime: ['updatedAt'] }))]);
  return { deleted: w.id, docsDetached: docs.map((d) => d.id) };
}

/** Take an email or @domain out of every workspace and every document's share list. */
async function revoke(b) {
  const p = splitPeople([b.who]);
  if (!p.emails.length && !p.domains.length) throw bad('Give an email or @domain.');
  const [docs, ws] = await Promise.all([
    fs.list(DOCS, ['allowEmails', 'allowDomains']),
    fs.list(WORKSPACES, ['memberEmails', 'memberDomains']),
  ]);
  const hits = (list, values) => values.some((v) => (list || []).includes(v));
  const transforms = (ef, df) => [
    ...(p.emails.length ? [fs.arrayRemove(ef, p.emails)] : []),
    ...(p.domains.length ? [fs.arrayRemove(df, p.domains)] : []),
  ];
  const writes = [];
  for (const w of ws) if (hits(w.memberEmails, p.emails) || hits(w.memberDomains, p.domains)) writes.push(fs.patch(WORKSPACES, w.id, [], {}, { serverTime: ['updatedAt'], transforms: transforms('memberEmails', 'memberDomains') }));
  for (const d of docs) if (hits(d.allowEmails, p.emails) || hits(d.allowDomains, p.domains)) writes.push(fs.patch(DOCS, d.id, [], {}, { serverTime: ['updatedAt'], transforms: transforms('allowEmails', 'allowDomains') }));
  if (writes.length) await fs.commit(writes);
  return { revoked: b.who, workspaces: writes.filter((w) => w.update.name.includes(`/${WORKSPACES}/`)).length, docs: writes.filter((w) => w.update.name.includes(`/${DOCS}/`)).length };
}

const ACTIONS = { updateDoc, deleteDoc: deleteDocument, createWorkspace, updateWorkspace, deleteWorkspace, revoke };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      if (!(await requireOwnerOrMonitor(req, res))) return;
      return res.status(200).json(await overview());
    }
    if (!(await requireOwner(req, res))) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });
    const fn = ACTIONS[req.body?.action];
    if (!fn) return res.status(400).json({ error: `action is one of ${Object.keys(ACTIONS).join(', ')}` });
    return res.status(200).json(await fn(req.body));
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
};
module.exports.splitPeople = splitPeople;
module.exports.people = people;
