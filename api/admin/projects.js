// Every Vercel project on the team with its domains and latest deployments.
// Needs VERCEL_TOKEN (a read-capable token for the team) and VERCEL_TEAM_ID.
// Only whitelisted fields go back to the browser — the raw project objects
// also carry env vars and protection-bypass secrets.
const { requireOwner } = require('./_auth');

const API = 'https://api.vercel.com';

const pickDeploy = (d) => d && ({
  id: d.id,
  url: d.url ? `https://${d.url}` : null,
  state: d.readyState || d.state || null,
  target: d.target || 'preview',
  createdAt: d.createdAt || null,
  branch: d.meta?.githubCommitRef || null,
  commit: d.meta?.githubCommitMessage?.split('\n')[0] || null,
  sha: d.meta?.githubCommitSha?.slice(0, 7) || null,
});

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return res.status(503).json({ error: 'VERCEL_TOKEN / VERCEL_TEAM_ID missing on the server.' });

  try {
    const projects = [];
    let until = '';
    do {
      const r = await fetch(`${API}/v10/projects?teamId=${teamId}&limit=100${until ? `&until=${until}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))).error || {};
        throw new Error(`Vercel API ${r.status}${err.code ? ` (${err.code}: ${err.message})` : ''}`);
      }
      const body = await r.json();
      projects.push(...body.projects);
      until = body.pagination?.next || '';
    } while (until);

    const out = projects.map((p) => {
      const prod = p.targets?.production;
      const aliases = prod?.alias || [];
      return {
        id: p.id,
        name: p.name,
        framework: p.framework || null,
        repo: p.link?.repo ? `${p.link.org || p.link.projectNamespace}/${p.link.repo}` : null,
        productionBranch: p.link?.productionBranch || null,
        // Custom domains first; *.vercel.app only when there is nothing else.
        domains: aliases.filter((a) => !a.endsWith('.vercel.app')),
        vercelUrl: aliases.find((a) => a.endsWith('.vercel.app')) || null,
        production: pickDeploy(prod),
        latest: pickDeploy(p.latestDeployments?.[0]),
        updatedAt: p.updatedAt || null,
      };
    });
    res.status(200).json({ projects: out });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
