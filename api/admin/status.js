// Which integrations are configured, and how the uptime monitor (a GitHub
// Actions workflow in this repo) last ran. Never returns secret values.
const { requireOwner } = require('./_auth');

const REPO = 'vishalpanwar416/Portfolio';
const WORKFLOW = 'monitor.yml';

async function monitorRun() {
  try {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'vishalpanwar-admin' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=1`, { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const run = (await r.json()).workflow_runs?.[0];
    return run ? { status: run.status, conclusion: run.conclusion, at: run.created_at, url: run.html_url } : null;
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const has = (k) => !!process.env[k];
  res.status(200).json({
    vercel: has('VERCEL_TOKEN') && has('VERCEL_TEAM_ID'),
    github: has('GITHUB_TOKEN'),
    stacky: has('STACKY_MCP_TOKEN'),
    firebase: has('GCP_SA_KEY'),
    aws: Object.keys(process.env).filter((k) => /^AWS_COST_[A-Z0-9_]+_KEY_ID$/.test(k)).map((k) => k.slice(9, -7).toLowerCase()),
    monitor: await monitorRun(),
    monitorWorkflow: `https://github.com/${REPO}/actions/workflows/${WORKFLOW}`,
  });
};
