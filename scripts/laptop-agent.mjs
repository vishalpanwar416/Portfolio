#!/usr/bin/env node
// Laptop agent for VP Control. A systemd user timer runs it every 2 minutes
// while the laptop is on (and right after it wakes up). Each run collects a
// snapshot and POSTs it to the dashboard backend (/api/admin/laptop), which
// stores it in the owner-only Firestore collection and keeps 7 days of
// history for the charts on Infrastructure → Laptop.
//
// Snapshot: every service listed under a project's `services` in the dashboard
// (+ any other failed user unit, with its last log lines), Docker and its
// containers, the busiest processes, CPU load, memory, disk, battery, network.
// It also forwards the LinkedIn outreach trackers when they change (bottom).
//
// Offline? The snapshot's chart point is queued in ~/.config/vp-control/
// queue.json and sent with the next successful run.
//
// Config: ~/.config/vp-control/agent.json  { "secret": "<MONITOR_SECRET>" }
// `--dry-run` prints the snapshot instead of sending.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, statfsSync, statSync, readdirSync } from 'node:fs'
import { cpus, hostname } from 'node:os'
import { join } from 'node:path'

const API = process.env.VP_API || 'https://admin.vishalpanwar.in/api/admin/laptop'
const DIR = join(process.env.HOME, '.config', 'vp-control')
const CONFIG = join(DIR, 'agent.json')
const QUEUE = join(DIR, 'queue.json')
const MAX_QUEUE = 720 // a day at 2-minute intervals

const sh = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch (e) { return (e.stdout || '').toString().trim() }
}
const readJson = (f, fallback) => { try { return JSON.parse(readFileSync(f, 'utf8')) } catch { return fallback } }

// ── services ───────────────────────────────────────────

// Which units to watch comes from the project registry in the dashboard's
// database; the last good copy is kept so the agent works offline.
const REGISTRY = join(DIR, 'projects.json')
async function loadRegistry() {
  const { secret: key } = readJson(CONFIG, {})
  try {
    const r = await fetch(API.replace(/\/laptop$/, '/registry'), { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const { projects } = await r.json()
    writeFileSync(REGISTRY, JSON.stringify(projects))
    return projects
  } catch (e) {
    console.warn('project registry unavailable, using the cached copy:', e.message)
    return readJson(REGISTRY, [])
  }
}
const projects = await loadRegistry()
const watched = projects.filter((p) => !p.hidden && p.status !== 'decommissioned')
  .flatMap((p) => (p.services || []).map((unit) => ({ unit, project: p.slug })))

// The service's own last lines, without systemd's start/stop boilerplate.
const BOILERPLATE = /^(Starting|Started|Stopping|Stopped|Finished|Failed to start|.*: (Consumed|Main process exited|Failed with result|Scheduled restart|Deactivated))/
function lastLog(unit, scope) {
  return sh('journalctl', [...scope, '-u', unit, '-n', '40', '--no-pager', '-o', 'cat'])
    .split('\n').filter((l) => l.trim() && !BOILERPLATE.test(l)).slice(-6).map((l) => l.slice(0, 300))
}

function unitState(unit, system = false) {
  const scope = system ? [] : ['--user']
  const out = sh('systemctl', [...scope, 'show', unit, '-p', 'ActiveState,SubState,Result,Description,ActiveEnterTimestamp,InactiveEnterTimestamp,LoadState'])
  const kv = Object.fromEntries(out.split('\n').filter(Boolean).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
  // A oneshot service (run by a timer) that exited cleanly is idle, not down.
  const oneshotOk = unit.endsWith('.service') && kv.ActiveState === 'inactive' && kv.Result === 'success'
  const ok = kv.LoadState === 'loaded' && (kv.ActiveState === 'active' || oneshotOk)
  return {
    unit,
    description: kv.Description || unit,
    state: kv.ActiveState || 'unknown',
    sub: kv.SubState || '',
    result: kv.Result || '',
    since: kv.ActiveState === 'active' ? kv.ActiveEnterTimestamp : kv.InactiveEnterTimestamp,
    ok,
    missing: kv.LoadState === 'not-found',
    // Last log lines explain a failure without opening a terminal.
    log: ok || kv.LoadState !== 'loaded' ? [] : lastLog(unit, scope),
  }
}

const services = watched.map(({ unit, project }) => ({ project, ...unitState(unit) }))
const failedOthers = sh('systemctl', ['--user', '--failed', '--plain', '--no-legend'])
  .split('\n').map((l) => l.trim().split(/\s+/)[0]).filter((u) => u && !watched.some((w) => w.unit === u))
  .map((u) => ({ project: null, ...unitState(u) }))

// ── docker ─────────────────────────────────────────────

const dockerUnit = unitState('docker.service', true)
const containers = dockerUnit.state === 'active'
  ? sh('docker', ['ps', '-a', '--format', '{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.State}}']).split('\n').filter(Boolean).map((l) => {
    const [name, image, status, st] = l.split('\t')
    return { name, image, status, running: st === 'running' }
  })
  : []

// ── machine ────────────────────────────────────────────

const mem = Object.fromEntries(readFileSync('/proc/meminfo', 'utf8').split('\n').filter(Boolean)
  .map((l) => { const [k, v] = l.split(':'); return [k, Number.parseInt(v, 10) * 1024] }))
const disk = statfsSync('/')
const battery = (() => {
  for (const b of ['BAT0', 'BAT1']) {
    const d = `/sys/class/power_supply/${b}`
    if (existsSync(d)) return { percent: Number(readFileSync(`${d}/capacity`, 'utf8')), status: readFileSync(`${d}/status`, 'utf8').trim() }
  }
  return null
})()
const network = (() => {
  const route = sh('ip', ['route', 'show', 'default'])
  const iface = route.match(/ dev (\S+)/)?.[1] || ''
  const ssid = iface ? sh('iwgetid', ['-r']) : ''
  return { online: !!iface, iface, ssid }
})()
// Current CPU use (a short top sample), not ps's lifetime average.
const processes = sh('top', ['-bn1', '-o', '%CPU', '-w', '200']).split('\n')
  .slice(7).map((l) => l.trim().split(/\s+/)).filter((c) => c.length >= 12 && c[11] !== 'top')
  .slice(0, 6).map((c) => ({ name: c.slice(11).join(' '), cpu: Number(c[8]), mem: Number(c[9]) }))
const osName = (readFileSync('/etc/os-release', 'utf8').match(/^PRETTY_NAME="?([^"\n]+)/m) || [])[1] || ''

// ── scheduled jobs ─────────────────────────────────────
// Every scheduled job on this laptop, for the Alerts page's job health and
// the monitor's missed-run / failed-job alerts: hermes cron jobs (its
// jobs.json) and this user's systemd timers (Media-man, the monitor…).

function hermesJobs() {
  const raw = readJson(join(process.env.HOME, '.hermes', 'cron', 'jobs.json'), null)
  const list = Array.isArray(raw?.jobs) ? raw.jobs : raw?.jobs ? Object.values(raw.jobs) : []
  return list.map((j) => ({
    id: `hermes:${j.id}`, name: j.name || j.id, kind: 'hermes',
    schedule: j.schedule_display || j.schedule?.display || '', enabled: j.enabled !== false && j.state !== 'paused',
    lastRun: j.last_run_at ? Date.parse(j.last_run_at) : null, nextRun: j.next_run_at ? Date.parse(j.next_run_at) : null,
    ok: !j.last_status || ['ok', 'silent', 'success', 'skipped'].includes(String(j.last_status).toLowerCase()),
    status: j.last_status || '', error: String(j.last_error || j.last_delivery_error || '').slice(0, 200),
    deliver: j.deliver || '',
  }))
}

function systemdTimers() {
  let timers = []
  try { timers = JSON.parse(sh('systemctl', ['--user', 'list-timers', '--all', '--output=json', '--no-pager']) || '[]') } catch { return [] }
  return timers.filter((t) => t.unit && t.activates).map((t) => {
    const svc = Object.fromEntries(sh('systemctl', ['--user', 'show', t.activates, '-p', 'Result,ExecMainStatus,ActiveState'])
      .split('\n').filter(Boolean).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
    return {
      id: `timer:${t.unit}`, name: t.activates.replace(/\.service$/, ''), kind: 'systemd', schedule: '', enabled: true,
      lastRun: t.last ? Math.round(t.last / 1000) : null, nextRun: t.next ? Math.round(t.next / 1000) : null,
      ok: svc.Result === 'success' || svc.ActiveState === 'activating', status: svc.Result || '',
      error: svc.Result && svc.Result !== 'success' ? `exit ${svc.ExecMainStatus || '?'} (${svc.Result})` : '', deliver: '',
    }
  })
}

const jobs = [...hermesJobs(), ...systemdTimers()].slice(0, 120)

const snapshot = {
  jobs,
  host: hostname(),
  os: osName,
  uptimeSec: Math.round(Number(readFileSync('/proc/uptime', 'utf8').split(' ')[0])),
  cpus: cpus().length,
  load: readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).map(Number),
  memory: { total: mem.MemTotal, available: mem.MemAvailable },
  disk: { total: disk.blocks * disk.bsize, free: disk.bavail * disk.bsize },
  battery,
  network,
  docker: { state: dockerUnit.state, ok: dockerUnit.ok, containers },
  processes,
  services: [...services, ...failedOthers],
  monitor: readJson(join(DIR, 'monitor-state.json'), {}).lastRun || null,
}

if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify(snapshot, null, 1))
  process.exit(0)
}

// ── send (or queue while offline) ──────────────────────

const pct = (used, total) => (total ? Math.round((used / total) * 1000) / 10 : null)
const localPoint = {
  t: Math.round(Date.now() / 1000),
  l: Math.round((snapshot.load[0] / snapshot.cpus) * 100) / 100,
  m: pct(snapshot.memory.total - snapshot.memory.available, snapshot.memory.total),
  d: pct(snapshot.disk.total - snapshot.disk.free, snapshot.disk.total),
  b: battery?.percent ?? null,
  x: snapshot.services.filter((s) => !s.ok && !s.missing).map((s) => s.unit),
}

const { secret } = readJson(CONFIG, {})
if (!secret) { console.error(`missing secret in ${CONFIG} — run scripts/setup-laptop.sh`); process.exit(1) }
const queue = readJson(QUEUE, [])

try {
  const r = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...snapshot, backfill: queue }),
    signal: AbortSignal.timeout(25000),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`)
  if (queue.length) writeFileSync(QUEUE, '[]')
  const bad = snapshot.services.filter((s) => !s.ok && !s.missing)
  console.log(`sent: ${snapshot.services.length} services (${bad.length} failing${bad.length ? `: ${bad.map((s) => s.unit).join(', ')}` : ''}), ${containers.length} containers${queue.length ? `, ${queue.length} queued points` : ''}`)
} catch (e) {
  writeFileSync(QUEUE, JSON.stringify([...queue, localPoint].slice(-MAX_QUEUE)))
  console.error(`offline or server error, queued (${queue.length + 1}): ${e.message}`)
  process.exitCode = 0 // not a failure of the agent itself
}

// ── WhatsApp alerts ────────────────────────────────────
// The alert gateway (/api/admin/notify) queues every app's alerts with the
// WhatsApp group its routing rules picked; this delivers each one through
// hermes' WhatsApp bridge (loopback only, which is why the laptop does it) to
// that group, then acks them. If hermes is down they stay queued and go out on
// a later run. Once an hour it also tells the gateway which groups the bridge
// can send to, so the Alerts page can offer them by name.

const BRIDGE = process.env.WHATSAPP_BRIDGE_URL || 'http://127.0.0.1:3000'
const WA_CHAT = readJson(CONFIG, {}).whatsappChat || '120363411809952493@g.us'
const NOTIFY = API.replace(/\/laptop$/, '/notify')

try {
  const r = await fetch(NOTIFY, { headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(20000) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const { items = [], gateway = false } = await r.json()
  const done = []
  for (const m of items) {
    // Held while the laptop was off: say when it actually happened.
    // Held for quiet hours: say when it happened, not that the laptop was off.
    const when = new Date(m.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    const late = m.holdUntil
      ? `\n_Held for quiet hours: happened ${when} IST_`
      : Date.now() - m.at > 15 * 60e3 ? `\n_Sent late: happened ${when} IST, while the laptop was off_` : ''
    const sent = await fetch(`${BRIDGE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: m.chatId || WA_CHAT, message: `${m.text}${late}` }),
      signal: AbortSignal.timeout(20000),
    }).catch((e) => ({ ok: false, status: e.message }))
    if (!sent.ok) { console.error(`whatsapp: bridge ${sent.status}, ${items.length - done.length} left for next run`); break }
    done.push(m.id)
  }
  if (done.length) {
    await fetch(NOTIFY, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ack: done }),
      signal: AbortSignal.timeout(20000),
    })
    console.log(`whatsapp: delivered ${done.length}`)
  }

  // Group names for the routing screen, at most once an hour.
  const GROUPS_STAMP = join(DIR, 'whatsapp-groups.json')
  // Only a gateway that understands { groups } gets them (an older one would queue a test alert).
  if (gateway && Date.now() - (readJson(GROUPS_STAMP, {}).at || 0) > 3600e3) {
    const g = await fetch(`${BRIDGE}/groups`, { signal: AbortSignal.timeout(15000) }).then((x) => (x.ok ? x.json() : null)).catch(() => null)
    const list = (g?.groups || (Array.isArray(g) ? g : [])).map((x) => ({ id: x.id || x.jid, name: x.subject || x.name })).filter((x) => x.id)
    if (list.length) {
      const saved = await fetch(NOTIFY, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: list }),
        signal: AbortSignal.timeout(20000),
      }).catch(() => null)
      if (saved?.ok) { writeFileSync(GROUPS_STAMP, JSON.stringify({ at: Date.now(), count: list.length })); console.log(`whatsapp: ${list.length} groups reported`) }
    }
  }
} catch (e) {
  console.error(`whatsapp: not checked, retrying next run: ${e.message}`)
}

// ── linkedin trackers ──────────────────────────────────
// The linkedin-followup-dms scheduled task keeps its trackers in
// ~/linkedin-outreach. Send both files to /api/admin/linkedin whenever either
// changes, for the LinkedIn page. A failed send is retried on the next run.

const LI_DIR = join(process.env.HOME, 'linkedin-outreach')
const LI_FILES = { prospects: join(LI_DIR, 'prospects.json'), targets: join(LI_DIR, 'targets.json') }
const LI_STATE = join(DIR, 'linkedin-sync.json')

if (Object.values(LI_FILES).every(existsSync)) {
  const sig = Object.values(LI_FILES).map((f) => statSync(f).mtimeMs).join(':')
  if (readJson(LI_STATE, {}).sig !== sig) {
    const body = { prospects: readJson(LI_FILES.prospects, null), targets: readJson(LI_FILES.targets, null) }
    // A file mid-write by the task doesn't parse; try again next run.
    if (body.prospects && body.targets) {
      try {
        const r = await fetch(API.replace(/\/laptop$/, '/linkedin'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(25000),
        })
        if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`)
        writeFileSync(LI_STATE, JSON.stringify({ sig, at: new Date().toISOString() }))
        console.log(`linkedin: sent ${body.prospects.prospects?.length ?? 0} prospects, ${body.targets.targets?.length ?? 0} targets`)
      } catch (e) {
        console.error(`linkedin: not sent, retrying next run: ${e.message}`)
      }
    }
  }
}
