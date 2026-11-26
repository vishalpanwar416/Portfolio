// VP Control monitor. The laptop runs it every 10 minutes (vp-monitor.timer,
// installed by scripts/install-laptop-agent.sh, secret from
// ~/.config/vp-control/agent.json). .github/workflows/monitor.yml is the
// backup: GitHub only gets round to it every few hours, and it skips its run
// when the laptop has checked within the last 20 minutes.
//
// Gets the list of things to watch from the dashboard API (/api/admin/monitor,
// with MONITOR_SECRET; projects and their alert levels live in the dashboard's
// database), falling back to the host list cached from the last good run:
//   critical  (own WhatsApp message): a live project's site down, a Supabase
//             project paused or unhealthy, a domain or certificate < 7 days
//   warning   (no message of its own): other sites down, laptop services
//             failing, disk nearly full; listed in the morning check instead
//   digest    (once a day, 9am IST): open warnings, renewals, overdue
//             invoices, contracts, low store ratings, lead follow-ups due,
//             and a PageSpeed run that notes sites whose score dropped
// Critical problems get one message when they start and one when they're
// fixed, repeated every 6 hours while open. Messages are queued at
// /api/admin/notify and the laptop agent delivers them to the WhatsApp ops
// group, so they arrive while the laptop is on. State is cached between runs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import tls from 'node:tls'

if (!process.env.MONITOR_SECRET && process.env.HOME) {
  try { process.env.MONITOR_SECRET = JSON.parse(readFileSync(join(process.env.HOME, '.config', 'vp-control', 'agent.json'), 'utf8')).secret || '' } catch { /* logged-only mode */ }
}

const API = 'https://admin.vishalpanwar.in/api/admin'
const STATE_FILE = process.env.MONITOR_STATE || '.monitor-state.json'
const TIMEOUT_MS = 10000
const REALERT_MS = 6 * 3600e3
const DIGEST_HOUR_UTC = 3 // ~9am IST
const PLATFORM = ['vercel.app', 'web.app', 'firebaseapp.com', 'netlify.app', 'github.io', 'pages.dev', 'onrender.com', 'run.app']
const TWO_PART = ['co.in', 'net.in', 'org.in', 'co.uk', 'com.au']

const now = Date.now()
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {}
state.open ||= {} // key -> { since, alertedAt, severity, text }
const days = (ts) => Math.floor((new Date(ts).getTime() - now) / 86400e3)
const dur = (ms) => (ms < 3600e3 ? `${Math.round(ms / 60e3)}m` : ms < 86400e3 ? `${(ms / 3600e3).toFixed(1)}h` : `${(ms / 86400e3).toFixed(1)}d`)
const todayKey = new Date(now + 5.5 * 3600e3).toISOString().slice(0, 10)
const digestDue = new Date(now).getUTCHours() >= DIGEST_HOUR_UTC && state.lastDigest !== todayKey

// ── what to watch ──────────────────────────────────────

async function fromApi() {
  const secret = process.env.MONITOR_SECRET
  if (!secret) return null
  try {
    const r = await fetch(`${API}/monitor${digestDue ? '?daily=1' : ''}`, { headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(45000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } catch (e) {
    console.warn('monitor API unavailable, using the cached host list:', e.message)
    return null
  }
}

const remote = await fromApi()
if (!remote && !state.hosts?.length) {
  console.error('monitor API unavailable and no cached host list yet')
  process.exit(1)
}
// GitHub backup run: the laptop already did this recently, so don't double-send.
const LAPTOP_FRESH_MS = 20 * 60e3
if (process.env.GITHUB_ACTIONS && remote?.laptop?.monitor?.at && now - Date.parse(remote.laptop.monitor.at) < LAPTOP_FRESH_MS) {
  console.log(`laptop ran the monitor at ${remote.laptop.monitor.at}; skipping this backup run`)
  process.exit(0)
}
const hosts = remote ? remote.hosts : state.hosts.map((h) => ({ ...h }))
if (remote) state.hosts = remote.hosts
for (const h of String(process.env.MONITOR_EXTRA_HOSTS || '').split(',').map((x) => x.trim()).filter(Boolean)) {
  if (!hosts.some((x) => x.host === h)) hosts.push({ host: h, project: h, critical: false })
}

// ── checks ─────────────────────────────────────────────

function certExpiry(host) {
  return new Promise((resolve) => {
    const s = tls.connect({ host, port: 443, servername: host, timeout: TIMEOUT_MS }, () => {
      const c = s.getPeerCertificate()
      s.end()
      resolve(c?.valid_to ? new Date(c.valid_to).toISOString() : null)
    })
    s.on('error', () => resolve(null))
    s.on('timeout', () => { s.destroy(); resolve(null) })
  })
}

async function probe(host) {
  try {
    const r = await fetch(`https://${host}/`, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'vp-control-monitor/2.0' } })
    await r.arrayBuffer().catch(() => {})
    return { up: r.status < 500, detail: `HTTP ${r.status}` }
  } catch (e) {
    return { up: false, detail: e.name === 'TimeoutError' ? 'timeout' : String(e.cause?.code || e.message) }
  }
}

async function check(h) {
  let res = await probe(h.host)
  if (!res.up) { await new Promise((r) => setTimeout(r, 5000)); res = await probe(h.host) } // one retry against blips
  return { ...h, ...res, cert: await certExpiry(h.host) }
}

// Current problems as { key, severity, text }.
const problems = []
const results = await Promise.all(hosts.map(check))

// When (nearly) every site fails at once, it's this machine's connection,
// not the sites: say nothing and keep the previous state, so a dropped Wi-Fi
// doesn't page "21 sites down" and then "21 back up" an hour later.
const downCount = results.filter((r) => !r.up).length
if (results.length >= 4 && downCount / results.length >= 0.8) {
  const reachable = await fetch('https://www.google.com/generate_204', { signal: AbortSignal.timeout(8000) }).then((r) => r.ok || r.status === 204).catch(() => false)
  if (!reachable || !remote) {
    console.log(`${downCount}/${results.length} sites unreachable and ${remote ? 'the internet check failed' : 'the dashboard API is unreachable'}: this machine looks offline, skipping this run`)
    process.exit(0)
  }
}

for (const r of results) {
  if (!r.up) problems.push({ key: `site:${r.host}`, severity: r.critical ? 'critical' : 'warning', text: `${r.host} (${r.project}) is DOWN — ${r.detail}`, back: `${r.host} is back up` })
  if (r.cert && days(r.cert) < 7) problems.push({ key: `ssl:${r.host}`, severity: 'critical', text: `SSL for ${r.host} expires in ${days(r.cert)}d`, back: `SSL for ${r.host} renewed` })
}

const laptop = remote?.laptop
if (laptop && laptop.online) {
  for (const s of laptop.services || []) {
    if (!s.ok && !s.missing) problems.push({ key: `svc:${s.unit}`, severity: 'warning', text: `Laptop: ${s.unit} is ${s.state}${s.result && s.result !== 'success' ? ` (${s.result})` : ''}`, back: `Laptop: ${s.unit} is running again` })
  }
  if (laptop.disk?.total && laptop.disk.free / laptop.disk.total < 0.05) {
    problems.push({ key: 'disk', severity: 'warning', text: `Laptop disk almost full — ${Math.round(laptop.disk.free / 1e9)} GB free`, back: 'Laptop disk has space again' })
  }
}

for (const p of remote?.supabase || []) {
  if (p.error || p.notConfigured) continue
  if (p.status === 'INACTIVE' || p.status === 'PAUSED') problems.push({ key: `sb:${p.ref}`, severity: 'critical', text: `Supabase ${p.name} (${p.project}) is PAUSED — restore it in the Supabase dashboard`, back: `Supabase ${p.name} is active again` })
  else if (p.status === 'ACTIVE_UNHEALTHY' || (p.health || []).some((h) => !h.healthy)) {
    const bad = (p.health || []).filter((h) => !h.healthy).map((h) => h.name).join(', ')
    problems.push({ key: `sb:${p.ref}`, severity: 'critical', text: `Supabase ${p.name} (${p.project}) unhealthy${bad ? `: ${bad}` : ''}`, back: `Supabase ${p.name} is healthy again` })
  }
  if (p.dbBytes && p.dbBytes / p.free.dbBytes > 0.9) problems.push({ key: `sbdb:${p.ref}`, severity: 'warning', text: `Supabase ${p.name} database is ${Math.round((p.dbBytes / p.free.dbBytes) * 100)}% of the free 500 MB`, back: `Supabase ${p.name} database back under 90%` })
}

// ── diff against last run → messages ───────────────────

const messages = []
const current = new Set(problems.map((p) => p.key))
for (const p of problems) {
  const prev = state.open[p.key]
  if (!prev) {
    state.open[p.key] = { since: now, alertedAt: now, severity: p.severity, text: p.text, back: p.back }
    if (p.severity === 'critical') messages.push({ severity: 'critical', title: 'CRITICAL', text: p.text })
  } else {
    prev.text = p.text
    if (p.severity === 'critical' && now - prev.alertedAt > REALERT_MS) {
      prev.alertedAt = now
      messages.push({ severity: 'critical', title: 'Still down', text: `${p.text} (for ${dur(now - prev.since)})` })
    }
  }
}
for (const [key, prev] of Object.entries(state.open)) {
  if (current.has(key)) continue
  delete state.open[key]
  if (prev.severity === 'critical') messages.push({ severity: 'info', title: 'Resolved', text: `${prev.back || `${key} resolved`} after ${dur(now - prev.since)}` })
}

// ── morning digest ─────────────────────────────────────

if (digestDue) {
  state.lastDigest = todayKey
  const lines = []
  for (const p of problems) if (p.severity === 'warning') lines.push(`⚠️ ${p.text}`)
  for (const r of results) if (r.cert && days(r.cert) < 14 && days(r.cert) >= 7) lines.push(`🔐 SSL ${r.host}: ${days(r.cert)}d left`)
  const apex = (h) => {
    if (PLATFORM.some((s) => h === s || h.endsWith(`.${s}`))) return null
    const p = h.split('.')
    return TWO_PART.includes(p.slice(-2).join('.')) ? p.slice(-3).join('.') : p.slice(-2).join('.')
  }
  for (const d of [...new Set(hosts.map((h) => apex(h.host)).filter(Boolean))]) {
    try {
      const r = await fetch(`https://rdap.org/domain/${d}`, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!r.ok) continue
      const exp = (await r.json()).events?.find((e) => e.eventAction === 'expiration')?.eventDate
      if (exp && days(exp) < 30) lines.push(`🌐 ${d} expires in ${days(exp)}d (${exp.slice(0, 10)})`)
    } catch { /* try again tomorrow */ }
  }
  for (const i of remote?.overdue || []) lines.push(`💸 Overdue: ${i.project} · ${i.client || i.number} · ₹${i.amount} (due ${i.due})`)
  for (const c of remote?.contracts || []) lines.push(`📄 ${c.client} (${c.project}) contract ${c.days < 0 ? 'ended' : `ends in ${c.days}d`}`)
  for (const a of remote?.apps || []) if (a.published && a.rating && a.rating < 4) lines.push(`⭐ ${a.name} (${a.platform}) rated ${a.rating}`)
  for (const f of remote?.followUps || []) lines.push(`📞 Follow up with ${f.name}${f.site ? ` (${f.site})` : ''}${f.due < todayKey ? ` · due ${f.due}` : ''}`)
  if (remote?.vitalsHosts?.length) {
    try {
      const r = await fetch(`${API}/vitals`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.MONITOR_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hosts: remote.vitalsHosts }),
        signal: AbortSignal.timeout(180e3),
      })
      const { drops = [] } = r.ok ? await r.json() : {}
      for (const d of drops) lines.push(`⚡ ${d.host}: PageSpeed ${d.from} → ${d.to}`)
    } catch (e) {
      console.warn('PageSpeed run failed:', e.message)
    }
  }
  if (lines.length) messages.push({ severity: 'info', title: `Morning check · ${lines.length}`, text: lines.join('\n') })
}

state.lastRun = { at: new Date(now).toISOString(), hosts: results.length, down: results.filter((r) => !r.up).length, open: Object.keys(state.open).length, source: remote ? 'api' : 'cache' }
writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
console.log(`source: ${remote ? 'dashboard API' : 'cached host list'} · ${results.length} hosts, ${results.filter((r) => !r.up).length} down · ${problems.length} open problems`)

// ── send ───────────────────────────────────────────────

const ICON = { critical: '🚨', info: '✅' }
for (const m of messages) {
  console.log(`[${m.severity}] ${m.title}: ${m.text}`)
  if (!process.env.MONITOR_SECRET) continue
  const r = await fetch(`${API}/notify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.MONITOR_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: `${m.title.startsWith('Morning') ? '☀️' : ICON[m.severity] || ''} ${m.title}`.trim(), message: m.text, url: 'https://admin.vishalpanwar.in/#/alerts' }),
    signal: AbortSignal.timeout(20000),
  }).catch((e) => ({ ok: false, status: e.message }))
  if (!r.ok) { console.error('queueing message failed', r.status); process.exitCode = 1 }
}
if (messages.length && !process.env.MONITOR_SECRET) console.log('No MONITOR_SECRET — alerts only logged.')
