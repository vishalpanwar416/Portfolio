// Single entry point for every /api/admin/<route> call. Vercel's Hobby plan
// allows 12 functions per deployment, so the handlers live in _routes/
// (underscore = not deployed on their own) and this file dispatches.
const routes = {
  apps: require('./_routes/apps'),
  check: require('./_routes/check'),
  cloud: require('./_routes/cloud'),
  deploys: require('./_routes/deploys'),
  domains: require('./_routes/domains'),
  firebase: require('./_routes/firebase'),
  github: require('./_routes/github'),
  instagram: require('./_routes/instagram'),
  laptop: require('./_routes/laptop'),
  lead: require('./_routes/lead'),
  marketing: require('./_routes/marketing'),
  monitor: require('./_routes/monitor'),
  notify: require('./_routes/notify'),
  payments: require('./_routes/payments'),
  projects: require('./_routes/projects'),
  seo: require('./_routes/seo'),
  stacky: require('./_routes/stacky'),
  status: require('./_routes/status'),
  supabase: require('./_routes/supabase'),
  traffic: require('./_routes/traffic'),
};

module.exports = async (req, res) => {
  const handler = routes[String(req.query.route || '')];
  if (!handler) return res.status(404).json({ error: 'not found' });
  return handler(req, res);
};
