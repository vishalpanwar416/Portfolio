// Firestore REST for docs.vishalpanwar.in's collections (vp_docs,
// vp_workspaces, vp_images, vp_files in sanero-media), signed in as the
// GCP_SA_KEY service account. A service account isn't checked against
// firestore.rules, so the docs route validates shapes itself, the same way
// the docs site's MCP server (docs-site/mcp/firestore.mjs) does.
const { serviceAccount, accessToken } = require('./_gcp');

const PROJECT = 'sanero-media';
const ROOT = `projects/${PROJECT}/databases/(default)/documents`;
const BASE = `https://firestore.googleapis.com/v1/${ROOT}`;

async function token() {
  const sa = serviceAccount();
  if (!sa) throw Object.assign(new Error('GCP_SA_KEY missing on the server'), { status: 503 });
  return accessToken(sa, 'https://www.googleapis.com/auth/datastore');
}

async function call(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) {
    if (r.status === 404) return null;
    const msg = data.error?.message || `Firestore ${r.status}`;
    throw Object.assign(new Error(r.status === 403 ? 'the service account needs Cloud Datastore User on sanero-media' : msg), { status: r.status === 409 || /exists/i.test(msg) ? 409 : 502 });
  }
  return data;
}

function encode(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'object') return { mapValue: { fields: encodeFields(v) } };
  return { stringValue: String(v) };
}
const encodeFields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, encode(v)]));

function decode(v) {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('bytesValue' in v) return { $bytes: Math.round((v.bytesValue.length * 3) / 4) };
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return undefined;
}
const decodeFields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, decode(v)]));
const fromDoc = (d) => ({ id: d.name.split('/').pop(), ...decodeFields(d.fields || {}) });

// Field paths with characters like "-" must be quoted with backticks.
const fieldPath = (...parts) => parts.map((p) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(p) ? p : '`' + p.replace(/([`\\])/g, '\\$1') + '`')).join('.');

async function get(collection, id) {
  const d = await call('GET', `${BASE}/${collection}/${encodeURIComponent(id)}`);
  return d ? fromDoc(d) : null;
}

/** Every document in a collection; `fields` limits what's read (skips markdown and bytes). */
async function list(collection, fields) {
  const mask = (fields || []).map((f) => `&mask.fieldPaths=${encodeURIComponent(f)}`).join('');
  const out = [];
  let pageToken = '';
  do {
    const data = await call('GET', `${BASE}/${collection}?pageSize=300${mask}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
    for (const d of data?.documents || []) out.push(fromDoc(d));
    pageToken = data?.nextPageToken || '';
  } while (pageToken);
  return out;
}

const name = (collection, id) => `${ROOT}/${collection}/${id}`;
const serverTimes = (paths) => paths.map((f) => ({ fieldPath: f, setToServerValue: 'REQUEST_TIME' }));

function splitPath(path) {
  const parts = [];
  for (const m of path.matchAll(/`((?:[^`\\]|\\.)*)`|([^.]+)/g)) parts.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : m[2]);
  return parts;
}

/** Set only `paths`; a path missing from `values` is deleted. */
function patch(collection, id, paths, values = {}, { serverTime = [], transforms = [] } = {}) {
  const fields = {};
  for (const [path, value] of Object.entries(values)) {
    const parts = splitPath(path);
    let node = fields;
    parts.slice(0, -1).forEach((p) => { node = node[p] ??= {}; });
    node[parts.at(-1)] = value;
  }
  return {
    update: { name: name(collection, id), fields: encodeFields(fields) },
    updateMask: { fieldPaths: paths },
    currentDocument: { exists: true },
    updateTransforms: [...serverTimes(serverTime), ...transforms],
  };
}

const create = (collection, id, fields, serverTime = []) => ({
  update: { name: name(collection, id), fields: encodeFields(fields) },
  currentDocument: { exists: false },
  ...(serverTime.length ? { updateTransforms: serverTimes(serverTime) } : {}),
});
const remove = (collection, id) => ({ delete: name(collection, id) });
/** Set `paths` on a doc that may not exist yet (creates it). */
function upsert(collection, id, paths, values = {}, serverTime = [], transforms = []) {
  return {
    update: { name: name(collection, id), fields: encodeFields(values) },
    updateMask: { fieldPaths: paths },
    updateTransforms: [...serverTimes(serverTime), ...transforms],
  };
}
const arrayUnion = (path, values) => ({ fieldPath: path, appendMissingElements: { values: values.map(encode) } });
const arrayRemove = (path, values) => ({ fieldPath: path, removeAllFromArray: { values: values.map(encode) } });

async function commit(writes) {
  for (let i = 0; i < writes.length; i += 450) await call('POST', `${BASE}:commit`, { writes: writes.slice(i, i + 450) });
}

module.exports = { get, list, patch, create, remove, upsert, arrayUnion, arrayRemove, commit, fieldPath };
