// Public, read-only copy of the portfolio content edited in the dashboard
// (vp_sites/portfolio). The site fetches this on load and falls back to its
// built-in src/data for anything missing. Only whitelisted fields go out —
// vp_sites is otherwise owner-only — and links are limited to http(s).
const { getSite } = require('../_firestore');

const str = (v, n = 500) => (typeof v === 'string' ? v.slice(0, n) : '');
const url = (v) => (typeof v === 'string' && /^(https?:\/\/|\/)/i.test(v) ? v.slice(0, 1000) : null);
const list = (v, fn, max = 100) => (Array.isArray(v) ? v.slice(0, max).map(fn).filter(Boolean) : undefined);
const words = (v, max = 40) => list(v, (s) => str(s, 120) || null, max);

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
    certifications: list(d.certifications, (x) => x && str(x.title, 160) && {
      title: str(x.title, 160), issuer: str(x.issuer, 120), date: str(x.date, 40), icon: ['award', 'trophy', 'star'].includes(x.icon) ? x.icon : 'award', link: url(x.link),
    }, 30),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  let doc = null;
  try { doc = await getSite('portfolio'); } catch { doc = null; }
  // Edits show within a minute; the CDN serves everyone else from cache.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  res.status(200).json(doc?.published ? clean(doc.published) : {});
};
module.exports.clean = clean;
