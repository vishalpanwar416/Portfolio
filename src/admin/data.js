// Shared state for the admin dashboard: Vercel projects, the vp_sites
// Firestore collection (site notes *and* project records) and uptime checks.
//
// Project records live in vp_sites as `proj-<slug>` docs with kind:'project'
// so they fall under the existing owner-only rule in sanero-next's
// firestore.rules — no rules deploy needed. A doc only holds what was edited;
// everything else comes from DEFAULT_PROJECTS below.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, SITES_COLLECTION } from './firebase'
import defaultProjects from './projects.json'

export const VERCEL_TEAM_SLUG = 'vishal-panwars-projects'
export const CHECK_EVERY_MS = 5 * 60e3
export const SSL_WARN_DAYS = 14
const CHECK_BATCH = 40 // api/admin/check.js caps a request at 40 hosts

export const STATUSES = {
  live: { label: 'Live', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  building: { label: 'Building', dot: 'bg-sky-400', text: 'text-sky-300' },
  maintenance: { label: 'Maintenance', dot: 'bg-amber-400', text: 'text-amber-300' },
  paused: { label: 'Paused', dot: 'bg-zinc-400', text: 'text-zinc-300' },
  decommissioned: { label: 'Decommissioned', dot: 'bg-red-500/70', text: 'text-red-300/80' },
}

export const CATEGORIES = ['Client', 'Employment', 'Freelance', 'Product', 'Personal', 'Utility', 'Automation']

// Sidebar groups, in order. Decommissioned projects get their own group
// whatever their category.
export const GROUPS = [
  { title: 'Clients & work', categories: ['Client', 'Employment', 'Freelance'] },
  { title: 'Products', categories: ['Product', 'Personal'] },
  { title: 'Utilities & automation', categories: ['Utility', 'Automation'] },
]

// Starting point, taken from ~/Development on 2026-11-08 (projects.json is
// shared with scripts/monitor.mjs). Status is a best guess from recent
// activity; revenue and clients start empty on purpose.
export const DEFAULT_PROJECTS = defaultProjects

const EMPTY = {
  summary: '', stack: [], domains: [], repos: [], vercel: [], firebase: [], stacky: [], cloud: [],
  revenue: [], invoices: [], expenses: [], clients: [], updates: [], links: [], notes: '',
}

export const projectDocId = (slug) => `proj-${slug}`
export const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ── formatting ─────────────────────────────────────────

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const money = (n) => inr.format(Number(n) || 0)
export const moneyShort = (n) => {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(1)}k`
  return `₹${v}`
}

export function timeAgo(ts) {
  if (!ts) return '—'
  const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 60) return `${Math.floor(s / 86400)}d ago`
  return `${Math.floor(s / (86400 * 30))}mo ago`
}

export const daysUntil = (ts) => (ts ? Math.floor((new Date(ts).getTime() - Date.now()) / 86400e3) : null)

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

/** The last `n` month keys, oldest first. */
export function lastMonths(n) {
  const out = []
  const d = new Date()
  d.setDate(1)
  for (let i = n - 1; i >= 0; i--) out.push(monthKey(new Date(d.getFullYear(), d.getMonth() - i, 1)))
  return out
}

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short' })
}

// www.* is almost always a redirect to the apex, so it isn't checked separately.
export const checkable = (hosts) => (hosts || []).filter((h) => !h.startsWith('www.'))

// ── money ──────────────────────────────────────────────
//
// Revenue for a month = hand-logged revenue entries + invoices marked paid
// (counted in the month they were paid). Costs come from expenses: monthly
// ones every month in range, yearly ones spread over 12 months, one-offs in
// their month.

// Local date, not UTC — in India UTC is still yesterday until 5:30am.
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60e3).toISOString().slice(0, 10)
export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const INVOICE_STATUSES = ['draft', 'sent', 'paid']
export const invoiceState = (inv) =>
  inv.status === 'sent' && inv.due && inv.due < today() ? 'overdue' : inv.status || 'draft'
const paidMonth = (inv) => (inv.paidOn || '').slice(0, 7) || inv.month

export function revenueIn(p, month) {
  const logged = (p.revenue || []).filter((r) => r.month === month).reduce((t, r) => t + (Number(r.amount) || 0), 0)
  const paid = (p.invoices || []).filter((i) => i.status === 'paid' && paidMonth(i) === month).reduce((t, i) => t + (Number(i.amount) || 0), 0)
  return logged + paid
}

export function costIn(p, month) {
  let total = 0
  for (const e of p.expenses || []) {
    const amount = Number(e.amount) || 0
    const start = e.start || '0000-00'
    if (e.cycle === 'once') { if (start === month) total += amount; continue }
    if (month < start || (e.end && month > e.end)) continue
    total += e.cycle === 'yearly' ? amount / 12 : amount
  }
  return Math.round(total)
}

export const monthlyCost = (p) => costIn(p, monthKey())

export function outstanding(p) {
  const open = (p.invoices || []).filter((i) => i.status === 'sent')
  const overdue = open.filter((i) => invoiceState(i) === 'overdue')
  const sum = (l) => l.reduce((t, i) => t + (Number(i.amount) || 0), 0)
  return { amount: sum(open), count: open.length, overdueAmount: sum(overdue), overdueCount: overdue.length }
}

// ── per-project numbers ────────────────────────────────

export function projectStats(p, checks = {}) {
  const thisMonth = monthKey()
  const clients = p.clients || []
  const active = clients.filter((c) => c.status !== 'past')
  const hostChecks = checkable(p.domains).map((h) => checks[h]).filter(Boolean)
  const months = new Set([
    ...(p.revenue || []).map((r) => r.month),
    ...(p.invoices || []).filter((i) => i.status === 'paid').map(paidMonth),
  ])
  const monthRevenue = revenueIn(p, thisMonth)
  const monthCost = costIn(p, thisMonth)
  return {
    monthRevenue,
    monthCost,
    monthProfit: monthRevenue - monthCost,
    totalRevenue: [...months].reduce((t, m) => t + revenueIn(p, m), 0),
    mrr: active.reduce((s, c) => s + (Number(c.monthly) || 0), 0),
    activeClients: active.length,
    totalClients: clients.length,
    hostsUp: hostChecks.filter((c) => c.up).length,
    hostsChecked: hostChecks.length,
    down: hostChecks.filter((c) => !c.up).length,
    owed: outstanding(p),
  }
}

export function revenueByMonth(projects, months) {
  return months.map((m) => {
    const amount = projects.reduce((t, p) => t + revenueIn(p, m), 0)
    const cost = projects.reduce((t, p) => t + costIn(p, m), 0)
    return { month: m, amount, cost, profit: amount - cost }
  })
}

// ── renewals: client contracts, domains, SSL ───────────

export const RENEWAL_WARN_DAYS = 30

export function clientRenewals(projects, withinDays = RENEWAL_WARN_DAYS) {
  return projects.flatMap((p) => (p.clients || [])
    .filter((c) => c.status !== 'past' && c.contractEnd)
    .map((c) => ({ project: p, client: c, days: daysUntil(c.contractEnd) }))
    .filter((r) => r.days !== null && r.days <= withinDays))
    .sort((a, b) => a.days - b.days)
}

// Registrable domain for a host: sanero.in for admin.sanero.in. Hosting
// platform subdomains (x.vercel.app, x.web.app) have nothing to renew.
const TWO_PART_SUFFIXES = ['co.in', 'net.in', 'org.in', 'firm.in', 'gen.in', 'ind.in', 'co.uk', 'org.uk', 'com.au', 'co.nz', 'com.br']
const PLATFORM_SUFFIXES = ['vercel.app', 'web.app', 'firebaseapp.com', 'netlify.app', 'github.io', 'pages.dev', 'onrender.com', 'herokuapp.com', 'run.app']
export function apexDomain(host) {
  const h = String(host || '').toLowerCase()
  if (PLATFORM_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`))) return null
  const parts = h.split('.')
  if (parts.length < 2) return null
  const lastTwo = parts.slice(-2).join('.')
  return TWO_PART_SUFFIXES.includes(lastTwo) ? parts.slice(-3).join('.') : lastTwo
}

// ── CSV export ─────────────────────────────────────────

export function downloadCsv(filename, rows) {
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

// ── API ────────────────────────────────────────────────

export async function api(path, options = {}) {
  const token = await auth.currentUser.getIdToken()
  const res = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status })
  return body
}

export const saveDoc = (id, patch) =>
  setDoc(doc(db, SITES_COLLECTION, id), { ...patch, updatedAt: Date.now() }, { merge: true })
export const removeDoc = (id) => deleteDoc(doc(db, SITES_COLLECTION, id))

/**
 * GET an admin API path; `path` null skips the call. A 503 means the
 * integration isn't configured yet, which pages show as a "connect" hint
 * rather than an error.
 */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path, notConfigured: false })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!path) { setState({ data: null, error: null, loading: false, notConfigured: false }); return }
    let live = true
    setState((s) => ({ ...s, loading: true }))
    api(path)
      .then((data) => live && setState({ data, error: null, loading: false, notConfigured: false }))
      .catch((e) => live && setState({ data: null, error: e.message, loading: false, notConfigured: e.status === 503 }))
    return () => { live = false }
  }, [path, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}

// ── the one hook the shell uses ────────────────────────

export function useAdminData() {
  const [vercel, setVercel] = useState([])
  const [vercelError, setVercelError] = useState(null)
  const [docs, setDocs] = useState({})
  const [docsReady, setDocsReady] = useState(false)
  const [checks, setChecks] = useState({})
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)

  const loadVercel = useCallback(async () => {
    try {
      setVercel((await api('/api/admin/projects')).projects)
      setVercelError(null)
    } catch (e) {
      setVercelError(e.message)
    }
  }, [])

  useEffect(() => { loadVercel() }, [loadVercel])

  useEffect(
    () => onSnapshot(collection(db, SITES_COLLECTION), (snap) => {
      const next = {}
      snap.forEach((d) => { next[d.id] = d.data() })
      setDocs(next)
      setDocsReady(true)
    }),
    []
  )

  // Defaults overlaid with their Firestore edits, plus projects added by hand.
  const projects = useMemo(() => {
    const vercelByName = Object.fromEntries(vercel.map((v) => [v.name, v]))
    const known = new Set(DEFAULT_PROJECTS.map((p) => p.slug))
    const custom = Object.entries(docs)
      .filter(([id, d]) => d.kind === 'project' && id.startsWith('proj-') && !known.has(id.slice(5)))
      .map(([id, d]) => ({ slug: id.slice(5), name: d.name || id.slice(5), category: 'Product', status: 'building', custom: true }))
    return [...DEFAULT_PROJECTS, ...custom]
      .map((base) => {
        const p = { ...EMPTY, ...base, ...(docs[projectDocId(base.slug)] || {}) }
        p.id = projectDocId(p.slug)
        p.vercelProjects = (p.vercel || []).map((n) => vercelByName[n]).filter(Boolean)
        return p
      })
      .filter((p) => !p.deleted)
  }, [docs, vercel])

  const settings = docs.settings || {}

  // Registrable domains behind every project and Vercel domain, for renewals.
  const apexKey = useMemo(() => {
    const set = new Set()
    projects.forEach((p) => (p.domains || []).forEach((h) => { const a = apexDomain(h); if (a) set.add(a) }))
    vercel.forEach((v) => (v.domains || []).forEach((h) => { const a = apexDomain(h); if (a) set.add(a) }))
    return [...set].sort().join(',')
  }, [projects, vercel])
  const domains = useApi(apexKey ? `/api/admin/domains?domains=${encodeURIComponent(apexKey)}` : null)
  const integrations = useApi('/api/admin/status')
  const traffic = useApi('/api/admin/traffic')
  const stacky = useApi('/api/admin/stacky')

  // Everything worth pinging: project domains plus Vercel custom domains and
  // hand-added sites from the Sites view.
  const hostKey = useMemo(() => {
    const hosts = new Set()
    projects.forEach((p) => checkable(p.domains).forEach((h) => hosts.add(h)))
    vercel.forEach((v) => checkable(v.domains).forEach((h) => hosts.add(h)))
    Object.values(docs).forEach((d) => d.manual && checkable(d.hosts).forEach((h) => hosts.add(h)))
    return [...hosts].sort().join(',')
  }, [projects, vercel, docs])

  const runChecks = useCallback(async () => {
    const hosts = hostKey ? hostKey.split(',') : []
    if (!hosts.length) return
    setChecking(true)
    try {
      const batches = []
      for (let i = 0; i < hosts.length; i += CHECK_BATCH) batches.push(hosts.slice(i, i + CHECK_BATCH))
      const results = (await Promise.all(
        batches.map((b) => api('/api/admin/check', { method: 'POST', body: JSON.stringify({ hosts: b }) }))
      )).flatMap((r) => r.results)
      setChecks((prev) => ({ ...prev, ...Object.fromEntries(results.map((r) => [r.host, r])) }))
      setLastChecked(new Date())
    } catch (e) {
      console.error('uptime check failed', e)
    } finally {
      setChecking(false)
    }
  }, [hostKey])

  useEffect(() => {
    runChecks()
    const t = setInterval(runChecks, CHECK_EVERY_MS)
    return () => clearInterval(t)
  }, [runChecks])

  const { reload: reloadDomains } = domains
  const { reload: reloadTraffic } = traffic
  const { reload: reloadStacky } = stacky
  const refresh = useCallback(() => {
    loadVercel(); runChecks(); reloadDomains(); reloadTraffic(); reloadStacky()
  }, [loadVercel, runChecks, reloadDomains, reloadTraffic, reloadStacky])

  return {
    projects, vercel, vercelError, docs, docsReady, checks, checking, lastChecked, refresh,
    settings, domains, integrations, traffic, stacky,
  }
}
