// Instagram accounts and their recent posts, live from the Instagram API
// (Instagram Login tokens, graph.instagram.com — the same kind Media-man posts
// with). GET ?accounts=tabletap,sanero.
//
// Each account needs IG_TOKEN_<KEY> on the server (e.g. IG_TOKEN_TABLETAP).
// Tokens last 60 days; this route refreshes one once it's a week old and keeps
// the new copy in vp_secrets (server-only), so the env value only has to be
// set once.
const { requireOwner } = require('../_auth');
const { getSecret, putSecret } = require('../_firestore');

const HOST = 'https://graph.instagram.com';
const VERSION = process.env.IG_GRAPH_VERSION || 'v23.0';
const KEY_RE = /^[a-z0-9_-]{1,40}$/;
const POSTS = 24;
const WITH_INSIGHTS = 12; // per-post insights are one call each
const REFRESH_AFTER_MS = 7 * 86400e3;

async function graph(path, params, token) {
  const url = new URL(`${HOST}/${VERSION}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.error) throw new Error(body.error?.message || `Instagram API ${r.status}`);
  return body;
}

/** The freshest token we have for an account, refreshed when it's a week old. */
async function tokenFor(key) {
  const envToken = process.env[`IG_TOKEN_${key.toUpperCase().replace(/-/g, '_')}`];
  let stored = null;
  try { stored = await getSecret(`ig-${key}`); } catch { stored = null; }
  // A new env value (token re-issued by hand) wins over an older stored one.
  const useStored = stored?.token && (!envToken || stored.envToken === envToken);
  const token = useStored ? stored.token : envToken;
  if (!token) return null;
  const refreshedAt = useStored ? stored.refreshedAt || 0 : 0;
  if (Date.now() - refreshedAt < REFRESH_AFTER_MS) return { token, expiresAt: stored.expiresAt || null };
  try {
    const url = new URL(`${HOST}/refresh_access_token`);
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', token);
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const body = await r.json();
    if (r.ok && body.access_token) {
      const expiresAt = Date.now() + (Number(body.expires_in) || 0) * 1000;
      await putSecret(`ig-${key}`, { token: body.access_token, envToken: envToken || '', refreshedAt: Date.now(), expiresAt });
      return { token: body.access_token, expiresAt };
    }
  } catch { /* refresh is best-effort; the current token still works */ }
  return { token, expiresAt: useStored ? stored.expiresAt || null : null };
}

async function postInsights(id, token) {
  // Available metrics vary by media type and age; fall back to the core set.
  for (const metric of ['reach,saved,shares,total_interactions,views', 'reach,saved,total_interactions']) {
    try {
      const { data } = await graph(`${id}/insights`, { metric }, token);
      return Object.fromEntries((data || []).map((d) => [d.name, d.values?.[0]?.value ?? d.total_value?.value ?? null]));
    } catch { /* try the smaller set */ }
  }
  return {};
}

async function accountInsights(token) {
  const until = Math.floor(Date.now() / 1000);
  try {
    const { data } = await graph('me/insights', {
      metric: 'reach,profile_views,accounts_engaged,total_interactions',
      period: 'day', metric_type: 'total_value', since: String(until - 28 * 86400), until: String(until),
    }, token);
    return Object.fromEntries((data || []).map((d) => [d.name, d.total_value?.value ?? null]));
  } catch {
    return null;
  }
}

async function loadAccount(key) {
  const auth = await tokenFor(key);
  if (!auth) return { account: key, notConfigured: true, error: `IG_TOKEN_${key.toUpperCase()} missing on the server` };
  const { token, expiresAt } = auth;
  try {
    const [me, media, insights] = await Promise.all([
      graph('me', { fields: 'user_id,username,name,followers_count,follows_count,media_count,profile_picture_url' }, token),
      graph('me/media', { fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count', limit: String(POSTS) }, token),
      accountInsights(token),
    ]);
    const list = media.data || [];
    const extra = await Promise.all(list.slice(0, WITH_INSIGHTS).map((m) => postInsights(m.id, token)));
    return {
      account: key,
      username: me.username,
      name: me.name || null,
      picture: me.profile_picture_url || null,
      followers: me.followers_count ?? null,
      follows: me.follows_count ?? null,
      mediaCount: me.media_count ?? null,
      insights,
      tokenExpiresAt: expiresAt,
      posts: list.map((m, i) => ({
        id: m.id,
        caption: (m.caption || '').slice(0, 600),
        type: m.media_product_type === 'REELS' ? 'REEL' : m.media_type,
        image: m.media_type === 'VIDEO' ? m.thumbnail_url || null : m.media_url || null,
        permalink: m.permalink,
        at: m.timestamp,
        likes: m.like_count ?? null,
        comments: m.comments_count ?? null,
        ...(extra[i] || {}),
      })),
    };
  } catch (e) {
    return { account: key, error: String(e.message || e).slice(0, 300) };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const keys = [...new Set(String(req.query.accounts || '').split(',').map((k) => k.trim().toLowerCase()))].filter((k) => KEY_RE.test(k)).slice(0, 10);
  res.status(200).json({ accounts: await Promise.all(keys.map(loadAccount)) });
};
