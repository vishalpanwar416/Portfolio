// Laptop backend. The agent on the laptop (scripts/laptop-agent.mjs, a
// systemd user timer) POSTs a snapshot every 2 minutes while the laptop is on,
// authenticated with MONITOR_SECRET. Stored in the owner-only vp_sites
// collection (sanero-media Firestore), which the dashboard reads live:
//
//   vp_sites/laptop                 latest full snapshot
//   vp_sites/laptop-h-<YYYY-MM-DD>  that day's history (IST): compact points
//                                   for charts, kept for HISTORY_DAYS days
//
// Snapshots taken while offline are queued on the laptop and arrive later as
// `backfill` points, so the history has no holes for time the laptop was on.
// GET returns the latest snapshot with its age (used by the monitor).
const { requireOwnerOrMonitor } = require('../_auth');
const { readSites, writeSite, getSite, deleteSite } = require('../_firestore');

const STALE_MS = 20 * 60e3;
const HISTORY_DAYS = 7;
const MAX_SERVICES = 60;
const MAX_POINTS_PER_DAY = 1500;

const istDay = (ms) => new Date(ms + 5.5 * 3600e3).toISOString().slice(0, 10);
const str = (v, n = 200) => String(v ?? '').slice(0, n);
const num = (v) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
const pct = (used, total) => (total ? Math.round((used / total) * 1000) / 10 : null);

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

// Keep only the expected shape — this lands in Firestore as-is.
function clean(b, at) {
  return {
    kind: 'laptop',
    at,
    host: str(b.host, 80),
    os: str(b.os, 80),
    uptimeSec: num(b.uptimeSec),
    cpus: num(b.cpus),
    load: (b.load || []).slice(0, 3).map(num),
    memory: { total: num(b.memory?.total), available: num(b.memory?.available) },
    disk: { total: num(b.disk?.total), free: num(b.disk?.free) },
    battery: b.battery ? { percent: num(b.battery.percent), status: str(b.battery.status, 20) } : null,
    network: b.network ? { online: !!b.network.online, iface: str(b.network.iface, 30), ssid: str(b.network.ssid, 60) } : null,
    docker: {
      state: str(b.docker?.state, 20),
      ok: !!b.docker?.ok,
      containers: (b.docker?.containers || []).slice(0, 30).map((c) => ({ name: str(c.name, 80), image: str(c.image, 120), status: str(c.status, 60), running: !!c.running })),
    },
    processes: (b.processes || []).slice(0, 8).map((p) => ({ name: str(p.name, 60), cpu: num(p.cpu), mem: num(p.mem) })),
    services: (b.services || []).slice(0, MAX_SERVICES).map((s) => ({
      unit: str(s.unit, 100), project: s.project ? str(s.project, 60) : null, description: str(s.description),
      state: str(s.state, 20), sub: str(s.sub, 20), result: str(s.result, 30), since: str(s.since, 60),
      ok: !!s.ok, missing: !!s.missing,
      log: (s.log || []).slice(-6).map((l) => str(l, 300)),
    })),
  };
}

// One chart point: time, load per core, memory %, disk %, battery, and the
// units that weren't ok at that moment.
function point(s, t) {
  return {
    t: Math.round(t / 1000),
    l: s.load?.[0] !== null && s.cpus ? Math.round((s.load[0] / s.cpus) * 100) / 100 : s.load?.[0] ?? null,
    m: pct((s.memory?.total || 0) - (s.memory?.available || 0), s.memory?.total),
    d: pct((s.disk?.total || 0) - (s.disk?.free || 0), s.disk?.total),
    b: s.battery?.percent ?? null,
    x: (s.services || []).filter((x) => !x.ok && !x.missing).map((x) => x.unit),
  };
}

async function appendHistory(points) {
  const byDay = {};
  for (const p of points) (byDay[istDay(p.t * 1000)] ||= []).push(p);
  const cutoff = istDay(Date.now() - HISTORY_DAYS * 86400e3);
  for (const [day, pts] of Object.entries(byDay)) {
    if (day < cutoff) continue;
    const id = `laptop-h-${day}`;
    const existing = await getSite(id);
    if (!existing) await deleteSite(`laptop-h-${istDay(Date.now() - (HISTORY_DAYS + 1) * 86400e3)}`).catch(() => {}); // new day: drop the oldest
    const seen = new Set((existing?.points || []).map((p) => p.t));
    const merged = [...(existing?.points || []), ...pts.filter((p) => !seen.has(p.t))]
      .sort((a, b) => a.t - b.t)
      .slice(-MAX_POINTS_PER_DAY);
    await writeSite(id, { kind: 'laptop-history', day, points: merged });
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const who = await requireOwnerOrMonitor(req, res);
  if (!who) return;
  if (req.method === 'POST') {
    if (who !== 'monitor') return res.status(403).json({ error: 'agent only' });
    const b = req.body || {};
    const now = Date.now();
    const status = clean(b, new Date(now).toISOString());
    const backfill = (b.backfill || []).slice(-720)
      .filter((p) => num(p.t) && p.t * 1000 < now && p.t * 1000 > now - HISTORY_DAYS * 86400e3)
      .map((p) => ({ t: Math.round(p.t), l: num(p.l), m: num(p.m), d: num(p.d), b: num(p.b), x: (p.x || []).slice(0, 20).map((u) => str(u, 100)) }));
    try {
      await writeSite('laptop', status);
      await appendHistory([...backfill, point(status, now)]);
      return res.status(200).json({ ok: true, stored: backfill.length + 1 });
    } catch (e) {
      return res.status(e.status || 502).json({ error: String(e.message || e) });
    }
  }
  res.status(200).json(await loadLaptop());
};
module.exports.loadLaptop = loadLaptop;
module.exports.point = point;
