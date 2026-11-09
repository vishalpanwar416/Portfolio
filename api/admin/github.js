// Latest commit, open PRs and the last CI run for a few repos.
// GET ?repos=owner/name,owner/name. Uses GITHUB_TOKEN when set (needed for
// private repos and for a sane rate limit); public repos work without it.
const { requireOwner } = require('./_auth');

const MAX_REPOS = 10;
const REPO_RE = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;

async function gh(path) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'vishalpanwar-admin', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(10000) });
  if (r.status === 404) throw new Error(process.env.GITHUB_TOKEN ? 'not found or no access' : 'private or missing (set GITHUB_TOKEN)');
  if (r.status === 403 || r.status === 429) throw new Error('GitHub rate limit');
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

async function repoInfo(repo) {
  try {
    const meta = await gh(`/repos/${repo}`);
    const [commits, pulls, runs] = await Promise.all([
      gh(`/repos/${repo}/commits?per_page=1&sha=${encodeURIComponent(meta.default_branch)}`).catch(() => []),
      gh(`/repos/${repo}/pulls?state=open&per_page=20`).catch(() => []),
      gh(`/repos/${repo}/actions/runs?per_page=1`).catch(() => ({ workflow_runs: [] })),
    ]);
    const c = commits[0];
    const run = runs.workflow_runs?.[0];
    return {
      repo,
      url: meta.html_url,
      private: meta.private,
      branch: meta.default_branch,
      pushedAt: meta.pushed_at,
      lastCommit: c && {
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split('\n')[0],
        author: c.author?.login || c.commit.author?.name || null,
        at: c.commit.author?.date || null,
        url: c.html_url,
      },
      openPrs: pulls.map((p) => ({ number: p.number, title: p.title, author: p.user?.login, url: p.html_url, draft: p.draft, at: p.created_at })),
      ci: run && {
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        at: run.created_at,
        url: run.html_url,
      },
    };
  } catch (e) {
    return { repo, error: String(e.message || e) };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const repos = [...new Set(String(req.query.repos || '').split(','))].filter((r) => REPO_RE.test(r)).slice(0, MAX_REPOS);
  res.status(200).json({ repos: await Promise.all(repos.map(repoInfo)), authenticated: !!process.env.GITHUB_TOKEN });
};
