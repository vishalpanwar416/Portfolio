// On-page SEO basics for a list of hostnames: the home page's title, meta
// description, canonical, Open Graph tags and noindex, plus robots.txt and
// sitemap.xml. POST { hosts: ["sanero.in", ...] }. Reads the served HTML, so
// client-rendered pages are judged on what crawlers see before JS runs.
const { requireOwner } = require('../_auth');

const MAX_HOSTS = 25;
const TIMEOUT_MS = 8000;
const MAX_HTML = 512 * 1024;
const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})*\.[a-z]{2,63}$/i;
const UA = 'Mozilla/5.0 (compatible; vishalpanwar-admin-seo/1.0)';

const decode = (s) => String(s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/\s+/g, ' ').trim();

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) out[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5];
  return out;
}

async function get(url) {
  const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': UA } });
  const text = (await r.text()).slice(0, MAX_HTML);
  return { status: r.status, url: r.url, text };
}

function readHead(html) {
  const head = html.split(/<\/head>/i)[0];
  const meta = {};
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = (a.name || a.property || '').toLowerCase();
    if (key && a.content !== undefined && !(key in meta)) meta[key] = decode(a.content);
  }
  const link = (rel) => {
    for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
      const a = attrs(m[0]);
      if ((a.rel || '').toLowerCase().split(/\s+/).includes(rel)) return a.href || null;
    }
    return null;
  };
  return {
    title: decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]) || null,
    description: meta.description || null,
    canonical: link('canonical'),
    ogTitle: meta['og:title'] || null,
    ogImage: meta['og:image'] || null,
    twitterCard: meta['twitter:card'] || null,
    robots: meta.robots || null,
    lang: attrs(html.match(/<html\b[^>]*>/i)?.[0] || '').lang || null,
  };
}

/** True when robots.txt shuts every crawler out of the whole site. */
function blocksAll(robots) {
  let agents = [];
  let inRules = false;
  for (const raw of robots.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const [field, ...rest] = line.split(':');
    const key = field.trim().toLowerCase();
    const val = rest.join(':').trim();
    if (key === 'user-agent') {
      if (inRules) { agents = []; inRules = false }
      agents.push(val);
    } else if (key === 'allow' || key === 'disallow') {
      inRules = true;
      if (key === 'disallow' && val === '/' && agents.includes('*')) return true;
    }
  }
  return false;
}

async function checkHost(host) {
  const out = { host, checkedAt: new Date().toISOString() };
  try {
    const page = await get(`https://${host}/`);
    Object.assign(out, { status: page.status, finalUrl: page.url, ...readHead(page.text) });
  } catch (e) {
    out.error = e.name === 'TimeoutError' ? 'timeout' : String(e.cause?.code || e.message || e);
    return out;
  }
  const [robots, sitemap] = await Promise.all([
    get(`https://${host}/robots.txt`).catch(() => null),
    get(`https://${host}/sitemap.xml`).catch(() => null),
  ]);
  // SPAs answer every path with index.html, so a 200 alone isn't proof.
  const robotsOk = robots?.status === 200 && !/<html/i.test(robots.text);
  out.robotsTxt = robotsOk;
  out.robotsBlocksAll = robotsOk && blocksAll(robots.text);
  out.sitemapInRobots = robotsOk && /^sitemap:/im.test(robots.text);
  out.sitemap = sitemap?.status === 200 && /<(urlset|sitemapindex)\b/i.test(sitemap.text);
  out.sitemapUrls = out.sitemap ? (sitemap.text.match(/<loc>/gi) || []).length : 0;
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!(await requireOwner(req, res))) return;
  const hosts = [...new Set((req.body?.hosts || []).map((h) => String(h).trim().toLowerCase()))]
    .filter((h) => HOST_RE.test(h))
    .slice(0, MAX_HOSTS);
  res.status(200).json({ results: await Promise.all(hosts.map(checkHost)) });
};
