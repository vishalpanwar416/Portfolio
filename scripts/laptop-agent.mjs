#!/usr/bin/env node
// Laptop agent for VP Control. A systemd user timer runs it every 2 minutes
// while the laptop is on (and right after it wakes up). Each run collects a
// snapshot and POSTs it to the dashboard backend (/api/admin/laptop), which
// stores it in the owner-only Firestore collection and keeps 7 days of
// history for the charts on Infrastructure → Laptop.
//
// Snapshot: every service listed under `services` in src/admin/projects.json
// (+ any other failed user unit, with its last log lines), Docker and its
// containers, the busiest processes, CPU load, memory, disk, battery, network.
//
// Offline? The snapshot's chart point is queued in ~/.config/vp-control/
// queue.json and sent with the next successful run.
//
// Config: ~/.config/vp-control/agent.json  { "secret": "<MONITOR_SECRET>" }
// `--dry-run` prints the snapshot instead of sending.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, statfsSync, readdirSync } from 'node:fs'
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

const projects = JSON.parse(readFileSync(new URL('../src/admin/projects.json', import.meta.url)))
const watched = projects.flatMap((p) => (p.services || []).map((unit) => ({ unit, project: p.slug })))

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

const snapshot = {
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
