#!/usr/bin/env node
// Laptop heartbeat for VP Control. Runs every 5 minutes from a systemd user
// timer (scripts/install-laptop-agent.sh) and sends the state of every
// service listed under `services` in src/admin/projects.json, any other
// failed user unit, plus disk, memory, battery and uptime, to the dashboard
// API, which keeps it in the owner-only Firestore collection.
//
// Reads the monitor secret from ~/.config/vp-control/agent.json
// ({ "secret": "…" }, mode 600). `--dry-run` prints instead of sending.
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, statfsSync } from 'node:fs'
import { hostname } from 'node:os'
import { join } from 'node:path'

const API = 'https://admin.vishalpanwar.in/api/admin/laptop'
const CONFIG = join(process.env.HOME, '.config', 'vp-control', 'agent.json')
const sh = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', timeout: 15000 }).trim() } catch (e) { return (e.stdout || '').toString().trim() }
}

const projects = JSON.parse(readFileSync(new URL('../src/admin/projects.json', import.meta.url)))
const watched = projects.flatMap((p) => (p.services || []).map((unit) => ({ unit, project: p.slug })))

function unitState(unit, system = false) {
  const out = sh('systemctl', [...(system ? [] : ['--user']), 'show', unit, '-p', 'ActiveState,SubState,Result,Description,ActiveEnterTimestamp,InactiveEnterTimestamp,LoadState'])
  const kv = Object.fromEntries(out.split('\n').filter(Boolean).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
  // A oneshot service (run by a timer) that exited cleanly is idle, not down.
  const oneshotOk = unit.endsWith('.service') && kv.ActiveState === 'inactive' && kv.Result === 'success'
  return {
    unit,
    description: kv.Description || unit,
    state: kv.ActiveState || 'unknown',
    sub: kv.SubState || '',
    result: kv.Result || '',
    since: kv.ActiveState === 'active' ? kv.ActiveEnterTimestamp : kv.InactiveEnterTimestamp,
    ok: kv.LoadState === 'loaded' && (kv.ActiveState === 'active' || oneshotOk),
    missing: kv.LoadState === 'not-found',
  }
}

const services = watched.map(({ unit, project }) => ({ project, ...unitState(unit) }))
const failedOthers = sh('systemctl', ['--user', '--failed', '--plain', '--no-legend'])
  .split('\n').map((l) => l.trim().split(/\s+/)[0]).filter((u) => u && !watched.some((w) => w.unit === u))
  .map((u) => ({ project: null, ...unitState(u) }))
const docker = unitState('docker.service', true)

const mem = Object.fromEntries(readFileSync('/proc/meminfo', 'utf8').split('\n').filter(Boolean)
  .map((l) => { const [k, v] = l.split(':'); return [k, Number.parseInt(v, 10) * 1024] }))
const disk = statfsSync('/')
const battery = (() => {
  for (const b of ['BAT0', 'BAT1']) {
    const dir = `/sys/class/power_supply/${b}`
    if (existsSync(dir)) return { percent: Number(readFileSync(`${dir}/capacity`, 'utf8')), status: readFileSync(`${dir}/status`, 'utf8').trim() }
  }
  return null
})()

const status = {
  host: hostname(),
  uptimeSec: Math.round(Number(readFileSync('/proc/uptime', 'utf8').split(' ')[0])),
  load: readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).map(Number),
  memory: { total: mem.MemTotal, available: mem.MemAvailable },
  disk: { total: disk.blocks * disk.bsize, free: disk.bavail * disk.bsize },
  battery,
  docker: { state: docker.state, ok: docker.ok },
  services: [...services, ...failedOthers],
}

if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify(status, null, 1))
  process.exit(0)
}

if (!existsSync(CONFIG)) { console.error(`missing ${CONFIG}`); process.exit(1) }
const { secret } = JSON.parse(readFileSync(CONFIG, 'utf8'))
const r = await fetch(API, {
  method: 'POST',
  headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(status),
  signal: AbortSignal.timeout(20000),
})
if (!r.ok) { console.error('report failed', r.status, await r.text()); process.exit(1) }
const bad = status.services.filter((s) => !s.ok)
console.log(`reported ${status.services.length} services, ${bad.length} not ok${bad.length ? `: ${bad.map((s) => s.unit).join(', ')}` : ''}`)
