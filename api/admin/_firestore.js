// Server-side read of the dashboard's Firestore collection (vp_sites in
// sanero-media) with the GCP_SA_KEY service account, so the monitor sees
// domains and statuses edited in the dashboard. Needs roles/datastore.viewer
// on sanero-media; without it callers fall back to projects.json.
const { serviceAccount, accessToken } = require('./_gcp');

const PROJECT = 'sanero-media';
const COLLECTION = 'vp_sites';

function value(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(value);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, value(x)]));
  return null;
}

/** All vp_sites docs as { id: data }, or null when not configured/allowed. */
async function readSites() {
  let sa;
  try { sa = serviceAccount(); } catch { return null; }
  if (!sa) return null;
  const token = await accessToken(sa, 'https://www.googleapis.com/auth/datastore');
  const docs = {};
  let pageToken = '';
  do {
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${COLLECTION}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const body = await r.json();
    for (const d of body.documents || []) {
      docs[d.name.split('/').pop()] = Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, value(v)]));
    }
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return docs;
}

/** projects.json merged with dashboard edits — same rules as the browser. */
async function mergedProjects() {
  const defaults = require('../../src/admin/projects.json');
  let docs = null;
  try { docs = await readSites(); } catch { docs = null; }
  if (!docs) return { projects: defaults.filter((p) => !p.hidden), docs: null };
  const known = new Set(defaults.map((p) => p.slug));
  const custom = Object.entries(docs)
    .filter(([id, d]) => d.kind === 'project' && id.startsWith('proj-') && !known.has(id.slice(5)))
    .map(([id, d]) => ({ slug: id.slice(5), name: d.name || id.slice(5), status: 'building' }));
  const projects = [...defaults, ...custom]
    .map((p) => ({ ...p, ...(docs[`proj-${p.slug}`] || {}) }))
    .filter((p) => !p.deleted && !p.hidden);
  return { projects, docs };
}

function encode(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)])) } };
}

/** Replace one vp_sites doc. Needs roles/datastore.user on sanero-media. */
async function writeSite(id, data) {
  const sa = serviceAccount();
  if (!sa) throw Object.assign(new Error('GCP_SA_KEY missing on the server'), { status: 503 });
  const token = await accessToken(sa, 'https://www.googleapis.com/auth/datastore');
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${COLLECTION}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encode(data).mapValue.fields }),
  });
  if (!r.ok) throw new Error(r.status === 403 ? 'service account needs Cloud Datastore User on sanero-media' : `Firestore ${r.status}`);
}

module.exports = { readSites, mergedProjects, writeSite };
