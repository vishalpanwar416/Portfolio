// Uptime, SSL and domain-renewal alerts for every project, run by
// .github/workflows/monitor.yml every 10 minutes. Sends Telegram messages only
// when something changes (down, back up), repeats a still-down alert every 6
// hours, and sends one morning digest of certificates and domains expiring soon.
//
// Env: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (without them it only logs),
// optional VERCEL_TOKEN + VERCEL_TEAM_ID to include every Vercel custom
// domain, optional MONITOR_EXTRA_HOSTS (comma separated).
// State lives in MONITOR_STATE (a JSON file the workflow caches between runs).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import tls from 'node:tls'

const STATE_FILE = process.env.MONITOR_STATE || '.monitor-state.json'
const TIMEOUT_MS = 10000
const REALERT_MS = 6 * 3600e3
const SSL_WARN_DAYS = 14
const DOMAIN_WARN_DAYS = 30
const DIGEST_HOUR_UTC = 3 // 8:30–9:30 IST
const PLATFORM = ['vercel.app', 'web.app', 'firebaseapp.com', 'netlify.app', 'github.io', 'pages.dev', 'onrender.com', 'run.app']
const TWO_PART = ['co.in', 'net.in', 'org.in', 'co.uk', 'com.au']

const projects = JSON.parse(readFileSync(new URL('../src/admin/projects.json', import.meta.url)))
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : { hosts: {} }
const now = Date.now()
const days = (ts) => Math.floor((new Date(ts).getTime() - now) / 86400e3)
const mins = (ms) => (ms < 3600e3 ? `${Math.round(ms / 60e3)}m` : `${(ms / 3600e3).toFixed(1)}h`)

function apex(host) {
  if (PLATFORM.some((s) => host === s || host.endsWith(`.${s}`))) return null
  const p = host.split('.')
  return TWO_PART.includes(p.slice(-2).join('.')) ? p.slice(-3).join('.') : p.slice(-2).join('.')
}

async function vercelDomains() {
  const { VERCEL_TOKEN: token, VERCEL_TEAM_ID: team } = process.env
  if (!token || !team) return []
  try {
    const r = await fetch(`https://api.vercel.com/v10/projects?teamId=${team}&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) throw new Error(`Vercel ${r.status}`)
    return (await r.json()).projects.flatMap((p) => p.targets?.production?.alias || []).filter((a) => !a.endsWith('.vercel.app'))
  } catch (e) {
    console.warn('vercel domains:', e.message)
    return []
  }
}

// Which project a host belongs to, for nicer messages.
const owner = Object.fromEntries(projects.flatMap((p) => (p.domains || []).map((d) => [d, p.name])))

const hosts = [...new Set([
  ...projects.filter((p) => p.status !== 'decommissioned' && !p.hidden).flatMap((p) => p.domains || []),
  ...(await vercelDomains()),
  ...String(process.env.MONITOR_EXTRA_HOSTS || '').split(','),
].map((h) => h.trim().toLowerCase()).filter((h) => h && !h.startsWith('www.')))].sort()

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
    const r = await fetch(`https://${host}/`, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'vishalpanwar-monitor/1.0' } })
    await r.arrayBuffer().catch(() => {})
    return { up: r.status < 500, detail: `HTTP ${r.status}` }
  } catch (e) {
    return { up: false, detail: e.name === 'TimeoutError' ? 'timeout' : String(e.cause?.code || e.message) }
  }
}

async function check(host) {
  let res = await probe(host)
  if (!res.up) { await new Promise((r) => setTimeout(r, 5000)); res = await probe(host) } // one retry against blips
  return { host, ...res, cert: await certExpiry(host) }
}

const messages = []
const results = await Promise.all(hosts.map(check))
for (const r of results) {
  const prev = state.hosts[r.host]
  const label = owner[r.host] ? `${r.host} (${owner[r.host]})` : r.host
  if (!r.up) {
    if (!prev || prev.up) {
      state.hosts[r.host] = { up: false, since: now, alertedAt: now, cert: r.cert }
      messages.push(`🔴 ${label} is DOWN — ${r.detail}`)
    } else {
      state.hosts[r.host] = { ...prev, cert: r.cert }
      if (now - (prev.alertedAt || 0) > REALERT_MS) {
        state.hosts[r.host].alertedAt = now
        messages.push(`🔴 ${label} still down for ${mins(now - prev.since)} — ${r.detail}`)
      }
    }
  } else {
    if (prev && !prev.up) messages.push(`🟢 ${label} is back up after ${mins(now - prev.since)}`)
    state.hosts[r.host] = { up: true, since: prev?.up ? prev.since : now, cert: r.cert }
  }
}
// Forget hosts that were removed from every project.
for (const h of Object.keys(state.hosts)) if (!hosts.includes(h)) delete state.hosts[h]

// Morning digest: certificates and domain registrations running out.
const todayKey = new Date(now).toISOString().slice(0, 10)
if (new Date(now).getUTCHours() >= DIGEST_HOUR_UTC && state.lastDigest !== todayKey) {
  state.lastDigest = todayKey
  const lines = []
  for (const r of results) {
    if (r.cert && days(r.cert) < SSL_WARN_DAYS) lines.push(`🔐 SSL for ${r.host} expires in ${days(r.cert)}d`)
  }
  const apexes = [...new Set(hosts.map(apex).filter(Boolean))]
  for (const d of apexes) {
    try {
      const r = await fetch(`https://rdap.org/domain/${d}`, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!r.ok) continue
      const exp = (await r.json()).events?.find((e) => e.eventAction === 'expiration')?.eventDate
      if (exp && days(exp) < DOMAIN_WARN_DAYS) lines.push(`🌐 ${d} registration expires in ${days(exp)}d (${exp.slice(0, 10)}) — renew it`)
    } catch { /* RDAP hiccup; try again tomorrow */ }
  }
  if (lines.length) messages.push(`Morning check — ${lines.length} thing${lines.length > 1 ? 's' : ''} to renew:\n${lines.join('\n')}`)
}

writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
const down = results.filter((r) => !r.up)
console.log(`checked ${results.length} hosts, ${down.length} down${down.length ? `: ${down.map((r) => `${r.host} (${r.detail})`).join(', ')}` : ''}`)

const { TELEGRAM_BOT_TOKEN: bot, TELEGRAM_CHAT_ID: chat } = process.env
for (const text of messages) {
  console.log('alert:', text)
  if (!bot || !chat) continue
  const r = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  })
  if (!r.ok) { console.error('telegram failed', r.status, await r.text()); process.exitCode = 1 }
}
if (messages.length && (!bot || !chat)) console.log('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — alerts only logged.')
