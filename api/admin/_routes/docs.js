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
//   setLock         { locked }                   only the owner can open protected docs
//   block / unblock { who }                      an email or @domain loses / regains access
//   pauseWorkspace  { id, paused }               its members lose / regain access
// GET ?sizes=1 adds bytes per document and workspace (reads photo bytes, so
// it's slower; cached for 10 minutes).
//
// Lock, blocks and paused workspaces are enforced by firestore.rules in
// sanero-next (vp_docs_access/settings and vp_workspaces.paused), so they
// hold for the docs site itself, not just this page.
//
// Writes keep each workspace's `docs` index in step with its documents, like
// the docs site's dashboard and MCP server.
const { requireOwner, requireOwnerOrMonitor } = require('../_auth');
const { serviceAccount, accessToken } = require('../_gcp');
const fs = require('../_docsstore');

const SITE = 'https://docs.vishalpanwar.in';
const DOCS = 'vp_docs';
const WORKSPACES = 'vp_workspaces';
const IMAGES = 'vp_images';
const FILES = 'vp_files';
const ACCESS = 'vp_docs_access';
const SETTINGS = 'settings';
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
  paused: !!w.paused,
  link: `${SITE}/#${w.id}`,
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

async function accessSettings() {
  const s = (await fs.get(ACCESS, SETTINGS)) || {};
  return {
    locked: !!s.locked,
    blocked: [...(s.blockedEmails || []), ...(s.blockedDomains || []).map((x) => '@' + x)],
    updatedAt: s.updatedAt || null,
  };
}

// Who has signed in with Google on the sanero-media Firebase project. Sanero,
// docs.vishalpanwar.in and Learn (/sdc) share it, so each account is tagged
// with the apps it uses: Sanero admin (the `admin` claim), owner
// (`superAdmin`), Learn (a vp_sdc_users/<uid> progress doc) and Docs (on a
// workspace or share list). Name, photo, joined, last sign-in.
// Needs roles/firebaseauth.viewer for the service account; without it the
// page says how to grant it and works without the details.
let userCache = { at: 0, value: null };
async function authUsers() {
  if (userCache.value && Date.now() - userCache.at < 5 * 60e3) return userCache.value;
  const sa = serviceAccount();
  if (!sa) return { error: 'GCP_SA_KEY missing on the server' };
  const token = await accessToken(sa, 'https://www.googleapis.com/auth/cloud-platform');
  const users = [];
  let next = '';
  do {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/sanero-media/accounts:batchGet?maxResults=1000${next ? `&nextPageToken=${encodeURIComponent(next)}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const value = { error: r.status === 403 ? `grant ${sa.client_email} the Firebase Authentication Viewer role on sanero-media` : (j.error?.message || `HTTP ${r.status}`), account: sa.client_email };
      return value;
    }
    for (const u of j.users || []) {
      if (!u.email) continue;
      let claims = {};
      try { claims = JSON.parse(u.customAttributes || '{}') } catch { claims = {} }
      users.push({
        uid: u.localId,
        role: claims.superAdmin ? 'owner' : claims.admin ? 'admin' : null,
        email: u.email.toLowerCase(), name: u.displayName || '', photo: u.photoUrl || '',
        createdAt: u.createdAt ? Number(u.createdAt) : null, lastLoginAt: u.lastLoginAt ? Number(u.lastLoginAt) : null,
        lastActiveAt: u.lastRefreshAt ? Date.parse(u.lastRefreshAt) : null, disabled: !!u.disabled, verified: !!u.emailVerified,
      });
    }
    next = j.nextPageToken || '';
  } while (next);
  // Learn: who syncs study progress, and how far along they are.
  try {
    const learn = await fs.list('vp_sdc_users', ['done', 'updatedAt']);
    const byUid = new Map(learn.map((l) => [l.id, l]));
    for (const u of users) {
      const l = byUid.get(u.uid);
      if (l) u.learn = { done: Object.keys(l.done || {}).length, updatedAt: l.updatedAt || null };
    }
  } catch { /* Learn tags are a bonus; keep the rest */ }
  for (const u of users) {
    u.apps = [
      ...(u.role === 'owner' ? ['Owner'] : u.role === 'admin' ? ['Sanero admin'] : []),
      ...(u.learn ? ['Learn'] : []),
    ];
  }
  userCache = { at: Date.now(), value: { users } };
  return userCache.value;
}

let sizeCache = { at: 0, value: null };
/** Bytes per document: its markdown, photos and files. */
async function docSizes() {
  if (sizeCache.value && Date.now() - sizeCache.at < 10 * 60e3) return sizeCache.value;
  const [docs, images, files] = await Promise.all([
    fs.list(DOCS, ['markdown']),
    fs.list(IMAGES, ['doc', 'data']),
    fs.list(FILES, ['doc', 'size']),
  ]);
  const out = {};
  const add = (slug, k, n) => { const e = (out[slug] ??= { text: 0, photos: 0, files: 0 }); e[k] += n || 0; };
  for (const d of docs) add(d.id, 'text', Buffer.byteLength(d.markdown || ''));
  for (const i of images) add(i.doc, 'photos', i.data?.$bytes);
  for (const f of files) add(f.doc, 'files', f.size);
  sizeCache = { at: Date.now(), value: out };
  return out;
}

async function overview({ sizes = false } = {}) {
  const [rawDocs, rawWs, images, files, access, bytes, auth] = await Promise.all([
    fs.list(DOCS, ['title', 'visibility', 'workspace', 'allowEmails', 'allowDomains', 'createdAt', 'updatedAt']),
    fs.list(WORKSPACES, ['name', 'description', 'memberEmails', 'memberDomains', 'paused', 'createdAt', 'updatedAt']),
    fs.list(IMAGES, ['doc']),
    fs.list(FILES, ['doc', 'kind', 'size']),
    accessSettings(),
    sizes ? docSizes() : null,
    authUsers().catch((e) => ({ error: e.message })),
  ]);
  const docs = rawDocs.map(docSummary).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const counts = {};
  for (const i of images) (counts[i.doc] ??= { photos: 0, files: 0, bytes: 0 }).photos++;
  for (const f of files) { const c = (counts[f.doc] ??= { photos: 0, files: 0, bytes: 0 }); c.files++; c.bytes += f.size || 0; }
  for (const d of docs) {
    Object.assign(d, counts[d.slug] || { photos: 0, files: 0, bytes: 0 });
    if (bytes) d.size = bytes[d.slug] || { text: 0, photos: 0, files: 0 };
  }
  const workspaces = rawWs.map(workspaceSummary).sort((a, b) => a.name.localeCompare(b.name));
  const total = (list) => list.reduce((t, d) => ({ text: t.text + d.size.text, photos: t.photos + d.size.photos, files: t.files + d.size.files }), { text: 0, photos: 0, files: 0 });
  for (const w of workspaces) {
    const own = docs.filter((d) => d.workspace === w.id);
    w.docs = own.map((d) => d.slug);
    if (bytes) w.size = total(own);
  }
  // Attach sign-in details: a person's own account, or everyone signed in at a domain.
  const everyone = people(docs, workspaces);
  const byEmail = new Map((auth.users || []).map((u) => [u.email, u]));
  const blocked = new Set(access.blocked);
  for (const p of everyone) {
    p.blocked = blocked.has(p.who);
    if (p.kind === 'person') p.user = byEmail.get(p.who) || null;
    else p.signedIn = (auth.users || []).filter((u) => u.email.endsWith(p.who)).map(({ email, name, photo, lastLoginAt }) => ({ email, name, photo, lastLoginAt }));
  }
  const covered = (email) => everyone.some((p) => (p.kind === 'person' ? p.who === email : email.endsWith(p.who)));
  const isBlocked = (u) => blocked.has(u.email) || blocked.has('@' + u.email.split('@')[1]);
  return {
    site: SITE,
    access,
    users: auth.error ? { error: auth.error, account: auth.account } : {
      total: auth.users.length,
      // The owner opens everything through the superAdmin claim, not a share.
      owners: auth.users.filter((u) => u.role === 'owner'),
      // Signed in on the project (Sanero, Learn…) but not given any docs access.
      withoutAccess: auth.users.filter((u) => u.role !== 'owner' && !covered(u.email)).map((u) => ({ ...u, blocked: isBlocked(u) })),
    },
    ...(bytes ? { unassignedSize: total(docs.filter((d) => !d.workspace)) } : {}),
    docs,
    workspaces,
    people: everyone,
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
    ? `Hi! I've added you to the "${values.name || w.name}" workspace on my docs site. Open ${SITE}/#${w.id} and sign in with your Google account to see its documents.`
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

async function setLock(b) {
  if (typeof b.locked !== 'boolean') throw bad('locked is true or false');
  await fs.commit([fs.upsert(ACCESS, SETTINGS, ['locked'], { locked: b.locked }, ['updatedAt'])]);
  return { locked: b.locked };
}

async function setBlocked(b, blocked) {
  const p = splitPeople([b.who]);
  if (!p.emails.length && !p.domains.length) throw bad('Give an email or @domain.');
  const op = blocked ? fs.arrayUnion : fs.arrayRemove;
  const transforms = [...(p.emails.length ? [op('blockedEmails', p.emails)] : []), ...(p.domains.length ? [op('blockedDomains', p.domains)] : [])];
  await fs.commit([fs.upsert(ACCESS, SETTINGS, [], {}, ['updatedAt'], transforms)]);
  return { [blocked ? 'blocked' : 'unblocked']: b.who };
}

async function pauseWorkspace(b) {
  const w = await requireWorkspace(b.id);
  if (typeof b.paused !== 'boolean') throw bad('paused is true or false');
  await fs.commit([fs.patch(WORKSPACES, w.id, ['paused'], { paused: b.paused }, { serverTime: ['updatedAt'] })]);
  return { id: w.id, paused: b.paused };
}

const ACTIONS = {
  updateDoc, deleteDoc: deleteDocument, createWorkspace, updateWorkspace, deleteWorkspace, revoke,
  setLock, block: (b) => setBlocked(b, true), unblock: (b) => setBlocked(b, false), pauseWorkspace,
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      if (!(await requireOwnerOrMonitor(req, res))) return;
      return res.status(200).json(await overview({ sizes: req.query?.sizes === '1' }));
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
