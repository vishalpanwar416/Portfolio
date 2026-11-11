// Laptop heartbeat. The agent on the laptop (scripts/laptop-agent.mjs, a
// systemd user timer) POSTs its status here every 5 minutes with the
// MONITOR_SECRET; it is stored in the owner-only vp_sites/laptop doc, which
// the dashboard reads live. GET returns it with its age, for the monitor.
const { requireOwnerOrMonitor } = require('../_auth');
const { readSites, writeSite } = require('../_firestore');

const STALE_MS = 20 * 60e3;
const MAX_SERVICES = 60;

async function loadLaptop(docs) {
  try {
    const all = docs || (await readSites());
    if (!all) return { notConfigured: true, error: 'GCP_SA_KEY missing or cannot read Firestore' };
    const s = all.laptop;
    if (!s?.at) return { error: 'the laptop agent has not reported yet' };
    const age = Date.now() - Date.parse(s.at);
    return { ...s, ageMs: age, online: age < STALE_MS };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

const str = (v, n = 200) => String(v ?? '').slice(0, n);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const who = await requireOwnerOrMonitor(req, res);
  if (!who) return;
  if (req.method === 'POST') {
    if (who !== 'monitor') return res.status(403).json({ error: 'agent only' });
    const b = req.body || {};
    // Keep only the expected shape — this lands in Firestore as-is.
    const status = {
      kind: 'laptop',
      at: new Date().toISOString(),
      host: str(b.host, 80),
      uptimeSec: num(b.uptimeSec),
      load: (b.load || []).slice(0, 3).map(num),
      memory: { total: num(b.memory?.total), available: num(b.memory?.available) },
      disk: { total: num(b.disk?.total), free: num(b.disk?.free) },
      battery: b.battery ? { percent: num(b.battery.percent), status: str(b.battery.status, 20) } : null,
      docker: { state: str(b.docker?.state, 20), ok: !!b.docker?.ok },
      services: (b.services || []).slice(0, MAX_SERVICES).map((s) => ({
        unit: str(s.unit, 100), project: s.project ? str(s.project, 60) : null, description: str(s.description),
        state: str(s.state, 20), sub: str(s.sub, 20), result: str(s.result, 30), since: str(s.since, 60),
        ok: !!s.ok, missing: !!s.missing,
      })),
    };
    try {
      await writeSite('laptop', status);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(e.status || 502).json({ error: String(e.message || e) });
    }
  }
  res.status(200).json(await loadLaptop());
};
module.exports.loadLaptop = loadLaptop;
