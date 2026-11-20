// Public, read-only copy of the portfolio content edited in the dashboard
// (vp_sites/portfolio). The site fetches this on load and falls back to its
// built-in src/data for anything missing. Only whitelisted fields go out —
// vp_sites is otherwise owner-only — and links are limited to http(s).
const { getSite, mergeDocs } = require('../_firestore');
const { requireOwnerOrMonitor } = require('../_auth');

const str = (v, n = 500) => (typeof v === 'string' ? v.slice(0, n) : '');
const url = (v) => (typeof v === 'string' && /^(https?:\/\/|\/)/i.test(v) ? v.slice(0, 1000) : null);
const list = (v, fn, max = 100) => (Array.isArray(v) ? v.slice(0, max).map(fn).filter(Boolean) : undefined);
const words = (v, max = 40) => list(v, (s) => str(s, 120) || null, max);
// Profile links may also be mailto: and tel:.
const link = (v) => (typeof v === 'string' && /^(https?:\/\/|mailto:|tel:)/i.test(v) ? v.slice(0, 500) : null);
const LINK_KINDS = ['github', 'linkedin', 'email', 'instagram', 'twitter', 'phone', 'calendar', 'link'];
const TEXT_KEYS = ['heroDescription', 'aboutTitle', 'aboutSubtitle', 'about', 'skillsTitle', 'skillsSubtitle', 'portfolioTitle', 'portfolioSubtitle', 'certificationsTitle', 'certificationsSubtitle', 'contactTitle', 'contactSubtitle', 'footerTagline'];

function clean(d) {
  const p = d.profile || {};
  return {
    updatedAt: d.publishedAt || d.updatedAt || null,
    profile: {
      title: str(p.title, 200), status: str(p.status, 200),
      badge: str(p.badge, 60), badgeShort: str(p.badgeShort, 30), location: str(p.location, 120),
      stack: words(p.stack, 6) || [], typing: words(p.typing, 12) || [],
    },
    projects: list(d.projects, (x) => x && str(x.title, 120) && {
      title: str(x.title, 120), description: str(x.description, 600), tech: words(x.tech, 15) || [],
      features: words(x.features, 8) || [], image: url(x.image), wideImage: !!x.wideImage,
      github: url(x.github), live: url(x.live), featured: !!x.featured, private: !!x.private, hidden: !!x.hidden,
    }),
    skills: list(d.skills, (x) => x && str(x.category, 80) && { category: str(x.category, 80), skills: words(x.skills, 30) || [] }, 20),
    experience: list(d.experience, (x) => x && str(x.position, 120) && {
      position: str(x.position, 120), company: str(x.company, 120), duration: str(x.duration, 120), highlights: words(x.highlights, 8) || [],
    }, 30),
    education: list(d.education, (x) => x && str(x.degree, 160) && { degree: str(x.degree, 160), institution: str(x.institution, 160), year: str(x.year, 40) }, 10),
    contact: {
      email: str(d.contact?.email, 120), phone: str(d.contact?.phone, 40), whatsapp: str(d.contact?.whatsapp, 40),
      calendar: url(d.contact?.calendar) || '', resume: url(d.contact?.resume) || '',
      workPreference: str(d.contact?.workPreference, 160), noticePeriod: str(d.contact?.noticePeriod, 80),
    },
    links: list(d.links, (x) => x && link(x.url) && {
      kind: LINK_KINDS.includes(x.kind) ? x.kind : 'link', label: str(x.label, 60), url: link(x.url),
      handle: str(x.handle, 120), social: !!x.social, contact: !!x.contact,
    }, 20),
    apps: list(d.apps, (x) => x && str(x.label, 40) && url(x.url) && /^https?:/i.test(x.url) && { label: str(x.label, 40), url: url(x.url), note: str(x.note, 80), description: str(x.description, 400), cta: str(x.cta, 30), icon: ['learn', 'docs', 'tasks', 'app'].includes(x.icon) ? x.icon : 'app' }, 12),
    text: Object.fromEntries(TEXT_KEYS.map((k) => [k, k === 'about' ? list(d.text?.about, (x) => str(x, 1200) || null, 6) || [] : str(d.text?.[k], 600)])),
    certifications: list(d.certifications, (x) => x && str(x.title, 160) && {
      title: str(x.title, 160), issuer: str(x.issuer, 120), date: str(x.date, 40), icon: ['award', 'trophy', 'star'].includes(x.icon) ? x.icon : 'award', link: url(x.link),
    }, 30),
  };
}

/**
 * POST { action: 'upsertProject', match, project } (owner or MONITOR_SECRET):
 * replaces the project card titled `match` (or adds it at the top) in both the
 * draft and the published content, so scripts can keep a card current
 * without the editor. The card goes through the same whitelist as reads.
 * Optional `position` moves the card to that index (0 = first).
 */
async function upsertProject(req, res) {
  if (!(await requireOwnerOrMonitor(req, res))) return;
  const { match, project, position } = req.body || {};
  const [card] = clean({ projects: [project] }).projects || [];
  if (!card) return res.status(400).json({ error: 'project needs at least a title' });
  const doc = (await getSite('portfolio')) || {};
  const apply = (content) => {
    if (!content) return content;
    const list = Array.isArray(content.projects) ? [...content.projects] : [];
    const i = list.findIndex((p) => p?.title === (match || card.title));
    if (i >= 0) list[i] = { ...list[i], ...card }; else list.unshift(card);
    if (Number.isInteger(position) && position >= 0) {
      const from = list.findIndex((p) => p?.title === card.title);
      const [moved] = list.splice(from, 1);
      list.splice(Math.min(position, list.length), 0, moved);
    }
    return { ...content, projects: list };
  };
  const data = { kind: 'portfolio', draft: apply(doc.draft || doc.published) };
  if (doc.published) Object.assign(data, { published: apply(doc.published), publishedAt: Date.now() });
  await mergeDocs('vp_sites', [{ id: 'portfolio', data }]);
  res.status(200).json({ ok: true, published: !!doc.published, card });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'POST' && req.body?.action === 'upsertProject') {
    res.setHeader('Cache-Control', 'no-store');
    try { return await upsertProject(req, res); } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  let doc = null;
  try { doc = await getSite('portfolio'); } catch { doc = null; }
  // Edits show within a minute; the CDN serves everyone else from cache.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  res.status(200).json(doc?.published ? clean(doc.published) : {});
};
module.exports.clean = clean;
