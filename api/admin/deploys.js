// Recent deployments for a few Vercel projects, for a project's update
// timeline. GET ?projects=<id>,<id> (project ids from /api/admin/projects).
const { requireOwner } = require('./_auth');

const API = 'https://api.vercel.com';
const MAX_PROJECTS = 6;
const PER_PROJECT = 10;
const ID_RE = /^prj_[A-Za-z0-9]+$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return res.status(503).json({ error: 'VERCEL_TOKEN / VERCEL_TEAM_ID missing on the server.' });

  const ids = [...new Set(String(req.query.projects || '').split(','))].filter((id) => ID_RE.test(id)).slice(0, MAX_PROJECTS);
  try {
    const lists = await Promise.all(ids.map(async (id) => {
      const r = await fetch(`${API}/v6/deployments?teamId=${teamId}&projectId=${id}&limit=${PER_PROJECT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`Vercel API ${r.status}`);
      return (await r.json()).deployments || [];
    }));
    // Only whitelisted fields go back to the browser.
    const deploys = lists.flat().map((d) => ({
      id: d.uid,
      project: d.name,
      url: d.url ? `https://${d.url}` : null,
      state: d.readyState || d.state || null,
      target: d.target || 'preview',
      createdAt: d.createdAt || d.created || null,
      branch: d.meta?.githubCommitRef || null,
      commit: d.meta?.githubCommitMessage?.split('\n')[0] || null,
    })).sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).json({ deploys });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
