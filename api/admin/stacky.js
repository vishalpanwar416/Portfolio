// Open Stacky tasks, via Stacky's hosted MCP server (the same one Claude
// uses). Needs STACKY_MCP_TOKEN — mint one in Stacky → Settings → MCP.
// STACKY_MCP_URL defaults to the production deployment.
const { requireOwner } = require('./_auth');

const DEFAULT_URL = 'https://stackyy.vercel.app/api/mcp';
const OPEN_STATUSES = ['in_progress', 'blocked', 'planned', 'backlog'];

let rpcId = 0;
async function callTool(url, token, name, args = {}) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args } }),
    signal: AbortSignal.timeout(15000),
  });
  if (r.status === 401) throw Object.assign(new Error('Stacky rejected STACKY_MCP_TOKEN'), { status: 502 });
  if (!r.ok) throw new Error(`Stacky ${r.status}`);
  const text = await r.text();
  // The stateless transport answers as SSE; plain JSON is handled too.
  const payload = r.headers.get('content-type')?.includes('text/event-stream')
    ? text.split('\n').filter((l) => l.startsWith('data:')).map((l) => JSON.parse(l.slice(5))).find((m) => m.id !== undefined)
    : JSON.parse(text);
  if (payload?.error) throw new Error(payload.error.message);
  const result = payload?.result;
  const body = result?.content?.find((c) => c.type === 'text')?.text || '';
  if (result?.isError) throw new Error(body.replace(/^Error:\s*/, ''));
  return JSON.parse(body);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const token = process.env.STACKY_MCP_TOKEN;
  if (!token) return res.status(503).json({ error: 'STACKY_MCP_TOKEN missing on the server.' });
  const url = process.env.STACKY_MCP_URL || DEFAULT_URL;
  try {
    const workspaces = await callTool(url, token, 'list_workspaces');
    const [projectLists, taskLists] = await Promise.all([
      Promise.all(workspaces.map((w) => callTool(url, token, 'list_projects', { workspaceId: w.id })
        .then((ps) => ps.map((p) => ({ ...p, workspaceId: w.id, workspace: w.name }))))),
      Promise.all(OPEN_STATUSES.map((status) => callTool(url, token, 'list_tasks', { status, limit: 100 }))),
    ]);
    res.status(200).json({
      workspaces,
      projects: projectLists.flat(),
      tasks: taskLists.flat(),
      appUrl: url.replace(/\/api\/mcp$/, ''),
    });
  } catch (e) {
    res.status(e.status || 502).json({ error: String(e.message || e) });
  }
};
