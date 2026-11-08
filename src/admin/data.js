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

// Starting point, taken from ~/Development on 2026-11-08. Status is a best
// guess from recent activity; revenue and clients start empty on purpose.
export const DEFAULT_PROJECTS = [
  {
    slug: 'bluecopa', name: 'Bluecopa', category: 'Employment', status: 'live',
    summary: 'Finance operations platform — infrastructure, data plane, DR and UI.',
    stack: ['GCP', 'Terraform', 'Kubernetes', 'Java', 'Svelte'],
    repos: ['bluecopa/blui', 'bluecopa/data-plane-api', 'bluecopa/fx-runtime', 'bluecopa/infrastructure', 'bluecopa/samyx'],
  },
  {
    slug: 'aarambh', name: 'Aarambh', category: 'Client', status: 'live',
    summary: 'Fitness app — Flutter app, Node backend, admin panel and landing page.',
    stack: ['Flutter', 'Node.js', 'Postgres', 'Firebase', 'Next.js'],
    domains: ['aarambh.app', 'api.aarambh.app'],
    repos: ['Aarambhadmin/Aarambh-2.0', 'Aarambhadmin/aarambhapp_android_30.6.2026', 'developer7696/admin-web', 'developer7696/aarambh-web', 'developer7696/aarambh-ai'],
  },
  {
    slug: 'edition-tv', name: 'Edition TV', category: 'Client', status: 'live',
    summary: 'TSP news platform — backend, CMS, Flutter app, reel audio service and GCP infra.',
    stack: ['Node.js', 'Flutter', 'GCP', 'Terraform', 'Cloud SQL'],
    domains: ['edition.tv', 'cms.edition.tv', 'api1.editiontv.com'],
    repos: ['MOHAMMEDSAVOOD/Edition-Tv', 'MOHAMMEDSAVOOD/Edition-Tv-Frontend', 'MOHAMMEDSAVOOD/editiontv-audioservice', 'vishalpanwar416/Edition-TV-App-Flutter', 'vishalpanwar416/Edition-terraform', 'vishalpanwar416/social-media-module'],
  },
  {
    slug: 'tsp-certification', name: 'TSP Certification', category: 'Client', status: 'maintenance',
    summary: 'Certificate generation and delivery module for TSP.',
    stack: ['React', 'Firebase'],
    domains: ['tspc.vishalpanwar.in'],
    repos: ['vishalpanwar416/TSP-Certification-module'],
    vercel: ['tsp-certification-module', 'tspc-api'],
  },
  {
    slug: 'splinkpro', name: 'SplinkPro', category: 'Client', status: 'live',
    summary: 'Sports platform — athletes, students, AI service, API, web and mobile.',
    stack: ['Next.js', 'Flutter', 'AWS', 'Terraform', 'Python'],
    domains: ['splinkpro.ai', 'app.splinkpro.ai'],
    repos: ['Splink-pro/splink-platform', 'Splink-pro/splinkpro-api', 'Splink-pro/splinkpro-ai', 'Splink-pro/splinkpro-web', 'Splink-pro/splinkpro-mobile', 'Splink-pro/splinkpro-student', 'Splink-pro/splinkpro-site'],
  },
  {
    slug: 'sarai', name: 'Sarai', category: 'Freelance', status: 'maintenance',
    summary: 'Freelance site with AI search.',
    domains: ['sarai.vishalpanwar.in'],
    repos: ['vishalpanwar416/sarai'],
    vercel: ['sarai'],
  },
  {
    slug: 'sanero', name: 'Sanero Media', category: 'Product', status: 'live',
    summary: 'Creator and social media agency — site, admin and outreach.',
    stack: ['Next.js', 'Firebase'],
    domains: ['sanero.in', 'admin.sanero.in'],
    repos: ['vishalpanwar416/sanero-website'],
  },
  {
    slug: 'table-tap', name: 'Table Tap', category: 'Product', status: 'live',
    summary: 'QR ordering for restaurants — customer app, restaurant and admin panels, AI ops.',
    stack: ['React', 'Supabase', 'Terraform'],
    domains: ['table-tap.in', 'app.table-tap.in', 'restaurant.table-tap.in', 'admin.table-tap.in'],
    repos: ['vishalpanwar416/Table-Tap-QR', 'vishalpanwar416/table-tap-AI'],
    vercel: ['table-tap-qr'],
  },
  {
    slug: 'stacky', name: 'Stacky', category: 'Product', status: 'live',
    summary: 'Task tracker with an MCP server for Claude.',
    stack: ['React', 'Firebase', 'MCP'],
    domains: ['stacky-f7f42.web.app'],
    repos: ['vishalpanwar416/Stacky'],
  },
  {
    slug: 'penspace', name: 'Penspace', category: 'Product', status: 'paused',
    summary: 'Flutter reading app — feed, discover, notes.',
    stack: ['Flutter'],
    repos: ['Jahanvikumawat14/penspace_clone'],
  },
  {
    slug: 'panwar-travels', name: 'Panwar Travels', category: 'Product', status: 'paused',
    summary: 'Travel agency site with SEO landing pages.',
    domains: ['panwartravels.in'],
    repos: ['vishalpanwar416/panwar-travels'],
  },
  {
    slug: 'multiqr', name: 'MultiQR', category: 'Product', status: 'paused',
    summary: 'Multi-link QR code generator.',
    repos: ['vishalpanwar416/multiqr'],
  },
  {
    slug: 'portfolio', name: 'Portfolio', category: 'Personal', status: 'live',
    summary: 'vishalpanwar.in and this dashboard.',
    stack: ['React', 'Tailwind', 'Vercel'],
    domains: ['vishalpanwar.in', 'admin.vishalpanwar.in'],
    repos: ['vishalpanwar416/Portfolio'],
    vercel: ['portfolio', 'vishal-s-portfolio'],
  },
  {
    slug: 'leo', name: 'Leo', category: 'Personal', status: 'paused',
    summary: 'Voice AI companion with memory.',
    stack: ['Python', 'React'],
    repos: ['vishalpanwar416/leo'],
  },
  {
    slug: 'hermes', name: 'Hermes', category: 'Utility', status: 'live',
    summary: 'Personal agent — gateway, dashboard and cron jobs (social, job hunt).',
    stack: ['Python', 'Node.js', 'systemd'],
    repos: ['vishalpanwar416/hermes-jobs', 'NousResearch/hermes-agent'],
  },
  {
    slug: 'bezelrig', name: 'Bezelrig', category: 'Utility', status: 'live',
    summary: 'GNOME desktop rig — chats, wake word, clipboard drop, token usage.',
    repos: ['vishalpanwar416/bezelrig'],
  },
  {
    slug: 'jarvis', name: 'Jarvis', category: 'Utility', status: 'live',
    summary: 'Local assistant for this machine.',
    repos: ['vishalpanwar416/jarvis'],
  },
  {
    slug: 'job-automation', name: 'Job automation', category: 'Automation', status: 'live',
    summary: 'Naukri / Indeed scrapers, tailored resumes and auto-apply.',
    repos: ['vishalpanwar416/job-automation'],
  },
  {
    slug: 'media-man', name: 'Media-man', category: 'Automation', status: 'live',
    summary: 'Scheduled Instagram posts and outreach for Sanero and Table Tap.',
    stack: ['Node.js', 'systemd'],
  },
]

const EMPTY = { summary: '', stack: [], domains: [], repos: [], vercel: [], revenue: [], clients: [], updates: [], links: [], notes: '' }

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

// ── per-project numbers ────────────────────────────────

export function projectStats(p, checks = {}) {
  const thisMonth = monthKey()
  const revenue = p.revenue || []
  const clients = p.clients || []
  const active = clients.filter((c) => c.status !== 'past')
  const hostChecks = checkable(p.domains).map((h) => checks[h]).filter(Boolean)
  return {
    monthRevenue: revenue.filter((r) => r.month === thisMonth).reduce((s, r) => s + (Number(r.amount) || 0), 0),
    totalRevenue: revenue.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    mrr: active.reduce((s, c) => s + (Number(c.monthly) || 0), 0),
    activeClients: active.length,
    totalClients: clients.length,
    hostsUp: hostChecks.filter((c) => c.up).length,
    hostsChecked: hostChecks.length,
    down: hostChecks.filter((c) => !c.up).length,
  }
}

export function revenueByMonth(projects, months) {
  const totals = Object.fromEntries(months.map((m) => [m, 0]))
  for (const p of projects) for (const r of p.revenue || []) if (r.month in totals) totals[r.month] += Number(r.amount) || 0
  return months.map((m) => ({ month: m, amount: totals[m] }))
}

// ── API ────────────────────────────────────────────────

export async function api(path, options = {}) {
  const token = await auth.currentUser.getIdToken()
  const res = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
  return body
}

export const saveDoc = (id, patch) =>
  setDoc(doc(db, SITES_COLLECTION, id), { ...patch, updatedAt: Date.now() }, { merge: true })
export const removeDoc = (id) => deleteDoc(doc(db, SITES_COLLECTION, id))

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

  const refresh = useCallback(() => { loadVercel(); runChecks() }, [loadVercel, runChecks])

  return { projects, vercel, vercelError, docs, docsReady, checks, checking, lastChecked, refresh }
}
