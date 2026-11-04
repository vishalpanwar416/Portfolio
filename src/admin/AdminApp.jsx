import { useCallback, useEffect, useMemo, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import {
  ExternalLink, GitBranch, Github, LogOut, Plus, RefreshCw, ShieldAlert, Trash2,
} from 'lucide-react'
import { auth, db, SITES_COLLECTION } from './firebase'

const VERCEL_TEAM_SLUG = 'vishal-panwars-projects'
const CHECK_EVERY_MS = 5 * 60e3
const SSL_WARN_DAYS = 14

// ── helpers ────────────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return '—'
  const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const daysUntil = (ts) => (ts ? Math.floor((new Date(ts).getTime() - Date.now()) / 86400e3) : null)

// www.* is almost always a redirect to the apex, so it isn't checked separately.
const hostsToCheck = (site) => site.hosts.filter((h) => !h.startsWith('www.'))

async function api(path, options = {}) {
  const token = await auth.currentUser.getIdToken()
  const res = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
  return body
}

// ── small pieces ───────────────────────────────────────

const STATE_STYLE = {
  READY: 'bg-emerald-500/15 text-emerald-300',
  ERROR: 'bg-red-500/15 text-red-300',
  CANCELED: 'bg-zinc-500/15 text-zinc-300',
  BUILDING: 'bg-amber-500/15 text-amber-300',
  QUEUED: 'bg-amber-500/15 text-amber-300',
  INITIALIZING: 'bg-amber-500/15 text-amber-300',
}

function DeployChip({ state }) {
  if (!state) return null
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATE_STYLE[state] || 'bg-zinc-500/15 text-zinc-300'}`}>
      {state.toLowerCase()}
    </span>
  )
}

function StatusDot({ check }) {
  const color = !check ? 'bg-zinc-600' : check.up ? 'bg-emerald-400' : 'bg-red-500'
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`} />
}

function Stat({ label, value, tone = 'text-zinc-100' }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  )
}

// ── site card ──────────────────────────────────────────

function SiteCard({ site, checks, onSave, onDelete }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(site.meta.notes || '')
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const links = site.meta.links || []

  useEffect(() => setNotes(site.meta.notes || ''), [site.meta.notes])

  const prod = site.project?.production
  const latest = site.project?.latest
  const previewNewer = latest && prod && latest.id !== prod.id

  const addLink = () => {
    const url = newLink.url.trim()
    if (!url) return
    onSave({ links: [...links, { label: newLink.label.trim() || url, url: /^https?:\/\//.test(url) ? url : `https://${url}` }] })
    setNewLink({ label: '', url: '' })
  }

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-zinc-100">{site.name}</div>
          {site.project?.repo && (
            <a
              href={`https://github.com/${site.project.repo}`}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <Github size={12} /> {site.project.repo}
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {site.project && (
            <a
              href={`https://vercel.com/${VERCEL_TEAM_SLUG}/${site.project.name}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-200"
              title="Open in Vercel"
            >
              ▲
            </a>
          )}
          <DeployChip state={prod?.state} />
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {site.hosts.length === 0 && <li className="text-xs text-zinc-500">No domain</li>}
        {site.hosts.map((h) => {
          const c = checks[h]
          const sslDays = daysUntil(c?.certValidTo)
          return (
            <li key={h} className="flex items-center gap-2 text-sm">
              <StatusDot check={h.startsWith('www.') ? null : c} />
              <a href={`https://${h}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-zinc-200 hover:underline">
                {h}
              </a>
              {c && (
                <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                  {c.status ?? c.error} · {c.ms}ms
                  {sslDays !== null && (
                    <span className={sslDays < SSL_WARN_DAYS ? ' text-amber-300' : ''}> · SSL {sslDays}d</span>
                  )}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {prod && (
        <div className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} /> {prod.branch || '—'} {prod.sha && <code className="text-zinc-500">{prod.sha}</code>}
            <span className="ml-auto">{timeAgo(prod.createdAt)}</span>
          </div>
          {prod.commit && <div className="mt-1 truncate text-zinc-300">{prod.commit}</div>}
          {previewNewer && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-zinc-500">Newer {latest.target}:</span>
              <DeployChip state={latest.state} />
              <span className="truncate">{latest.branch}</span>
              <span className="ml-auto shrink-0">{timeAgo(latest.createdAt)}</span>
            </div>
          )}
        </div>
      )}

      {!open && (site.meta.notes || links.length > 0) && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          {site.meta.notes && <p className="line-clamp-2 whitespace-pre-line text-xs text-zinc-300">{site.meta.notes}</p>}
          {links.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">
                  {l.label} <ExternalLink size={10} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (site.meta.notes || '') && onSave({ notes })}
            rows={4}
            placeholder="Notes, todos, status…"
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
          <ul className="space-y-1">
            {links.map((l, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sky-300 hover:underline">
                  {l.label}
                </a>
                <button onClick={() => onSave({ links: links.filter((_, j) => j !== i) })} className="text-zinc-500 hover:text-red-400" aria-label="Remove link">
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-1.5">
            <input
              value={newLink.label}
              onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              placeholder="Label"
              className="w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 focus:outline-none"
            />
            <input
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              placeholder="https://…"
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 focus:outline-none"
            />
            <button onClick={addLink} className="rounded-md bg-zinc-800 px-2 text-zinc-200 hover:bg-zinc-700" aria-label="Add link">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex justify-between text-xs">
            <button onClick={() => onSave({ hidden: !site.meta.hidden })} className="text-zinc-400 hover:text-zinc-200">
              {site.meta.hidden ? 'Unhide' : 'Hide from dashboard'}
            </button>
            {site.manual && (
              <button onClick={onDelete} className="text-red-400 hover:text-red-300">
                Delete site
              </button>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} className="mt-3 self-start text-xs text-zinc-500 hover:text-zinc-300">
        {open ? 'Done' : 'Notes & links'}
      </button>
    </div>
  )
}

// ── dashboard ──────────────────────────────────────────

function Dashboard({ user }) {
  const [projects, setProjects] = useState([])
  const [projectsError, setProjectsError] = useState(null)
  const [metas, setMetas] = useState({})
  const [checks, setChecks] = useState({})
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [newSite, setNewSite] = useState('')

  const loadProjects = useCallback(async () => {
    try {
      setProjects((await api('/api/admin/projects')).projects)
      setProjectsError(null)
    } catch (e) {
      setProjectsError(e.message)
    }
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  useEffect(
    () => onSnapshot(collection(db, SITES_COLLECTION), (snap) => {
      const next = {}
      snap.forEach((d) => { next[d.id] = d.data() })
      setMetas(next)
    }),
    []
  )

  // Vercel projects plus hand-added sites, each merged with its notes doc.
  const sites = useMemo(() => {
    const fromVercel = projects.map((p) => ({
      id: p.name,
      name: p.name,
      project: p,
      hosts: p.domains.length ? p.domains : p.vercelUrl ? [p.vercelUrl] : [],
      custom: p.domains.length > 0,
      manual: false,
      meta: metas[p.name] || {},
    }))
    const manual = Object.entries(metas)
      .filter(([, m]) => m.manual)
      .map(([id, m]) => ({ id, name: m.name || m.hosts?.[0] || id, project: null, hosts: m.hosts || [], custom: true, manual: true, meta: m }))
    return [...manual, ...fromVercel]
  }, [projects, metas])

  const visible = sites
    .filter((s) => showAll || s.custom)
    .filter((s) => showHidden || !s.meta.hidden)
    .sort((a, b) => {
      const ad = a.project?.production?.createdAt || 0
      const bd = b.project?.production?.createdAt || 0
      return Number(b.custom) - Number(a.custom) || bd - ad
    })

  const hostKey = visible.flatMap(hostsToCheck).sort().join(',')

  const runChecks = useCallback(async () => {
    const hosts = hostKey ? hostKey.split(',') : []
    if (!hosts.length) return
    setChecking(true)
    try {
      const { results } = await api('/api/admin/check', { method: 'POST', body: JSON.stringify({ hosts }) })
      setChecks((prev) => Object.fromEntries([...Object.entries(prev), ...results.map((r) => [r.host, r])]))
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

  const save = (id, patch) => setDoc(doc(db, SITES_COLLECTION, id), { ...patch, updatedAt: Date.now() }, { merge: true })

  const addSite = () => {
    const host = newSite.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!host) return
    save(`manual-${host.replace(/[^a-z0-9]+/g, '-')}`, { manual: true, name: host, hosts: [host] })
    setNewSite('')
  }

  const checked = visible.flatMap(hostsToCheck).map((h) => checks[h]).filter(Boolean)
  const down = checked.filter((c) => !c.up).length
  const sslSoon = checked.filter((c) => {
    const d = daysUntil(c.certValidTo)
    return d !== null && d < SSL_WARN_DAYS
  }).length
  const failedDeploys = visible.filter((s) => s.project?.latest?.state === 'ERROR').length

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Sites</h1>
          <p className="text-xs text-zinc-500">
            {lastChecked ? `Checked ${timeAgo(lastChecked)} · every 5 min while open` : 'Checking…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadProjects(); runChecks() }}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => signOut(auth)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100"
            title={user.email}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sites" value={visible.length} />
        <Stat label="Down" value={down} tone={down ? 'text-red-400' : 'text-emerald-400'} />
        <Stat label={`SSL < ${SSL_WARN_DAYS} days`} value={sslSoon} tone={sslSoon ? 'text-amber-300' : 'text-zinc-100'} />
        <Stat label="Failed deploys" value={failedDeploys} tone={failedDeploys ? 'text-red-400' : 'text-zinc-100'} />
      </div>

      {projectsError && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          Couldn't load Vercel projects: {projectsError}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Include projects without a domain
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} /> Show hidden
        </label>
        <div className="flex gap-1.5 sm:ml-auto">
          <input
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSite()}
            placeholder="Add a site not on Vercel…"
            className="w-56 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <button onClick={addSite} className="rounded-md bg-zinc-800 px-2 text-zinc-200 hover:bg-zinc-700" aria-label="Add site">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((s) => (
          <SiteCard
            key={s.id}
            site={s}
            checks={checks}
            onSave={(patch) => save(s.id, patch)}
            onDelete={() => deleteDoc(doc(db, SITES_COLLECTION, s.id))}
          />
        ))}
      </div>
    </div>
  )
}

// ── auth gate ──────────────────────────────────────────

export default function AdminApp() {
  // undefined = still resolving, null = signed out
  const [user, setUser] = useState(undefined)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'Admin · vishalpanwar.in'
    return onAuthStateChanged(auth, async (u) => {
      // Force a fresh token so a newly granted claim is picked up.
      setAllowed(u ? (await u.getIdTokenResult(true)).claims.superAdmin === true : false)
      setUser(u)
    })
  }, [])

  const signIn = async () => {
    setError(null)
    try { await signInWithPopup(auth, new GoogleAuthProvider()) } catch (e) { setError(e.message) }
  }

  let body
  if (user === undefined) {
    body = <div className="grid min-h-screen place-items-center text-sm text-zinc-500">Loading…</div>
  } else if (!user) {
    body = (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-zinc-100">Admin</h1>
          <button onClick={signIn} className="mt-4 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
            Sign in with Google
          </button>
          {error && <p className="mt-3 max-w-xs text-xs text-red-400">{error}</p>}
        </div>
      </div>
    )
  } else if (!allowed) {
    body = (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center text-sm text-zinc-300">
          <ShieldAlert className="mx-auto text-red-400" />
          <p className="mt-2">{user.email} isn't allowed here.</p>
          <button onClick={() => signOut(auth)} className="mt-3 text-zinc-400 underline hover:text-zinc-100">Sign out</button>
        </div>
      </div>
    )
  } else {
    body = <Dashboard user={user} />
  }

  return <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100">{body}</div>
}
