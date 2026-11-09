import { useCallback, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { CalendarClock, Globe, IndianRupee, LayoutDashboard, LogOut, Menu, Plus, RefreshCw, Search, Settings, ShieldAlert, X } from 'lucide-react'
import { auth } from './firebase'
import { GROUPS, projectDocId, projectStats, saveDoc, slugify, timeAgo, useAdminData } from './data'
import { Button, Glass, Input, StatusDot, cx } from './ui'
import OverviewView from './OverviewView'
import ProjectView from './ProjectView'
import SitesView from './SitesView'
import MoneyView from './MoneyView'
import RenewalsView, { renewalAlerts } from './RenewalsView'
import SettingsView from './SettingsView'
import CommandPalette, { useHotkey } from './CommandPalette'

// ── routing: #/, #/money, #/renewals, #/sites, #/settings, #/p/<slug> ──

function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (to) => { window.location.hash = to }
  return [route, go]
}

const Backdrop = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
    <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-white/[0.07] blur-[120px]" />
    <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-zinc-400/[0.06] blur-[120px]" />
    <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-[120px]" />
    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
  </div>
)

// ── sidebar ────────────────────────────────────────────

function NavItem({ active, onClick, children, dim, badge }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition',
        active ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100',
        dim && !active && 'text-zinc-600'
      )}
    >
      {children}
      {badge > 0 && <span className="ml-auto rounded-full bg-amber-400/15 px-1.5 text-[10px] tabular-nums text-amber-300">{badge}</span>}
    </button>
  )
}

export const PAGES = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/money', label: 'Money', icon: IndianRupee },
  { to: '/renewals', label: 'Renewals', icon: CalendarClock },
  { to: '/sites', label: 'Sites & uptime', icon: Globe },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ projects, route, go, onNavigate, badges = {} }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const nav = (to) => { go(to); onNavigate?.() }

  const addProject = async () => {
    const slug = slugify(name)
    if (!slug) return
    await saveDoc(projectDocId(slug), { kind: 'project', name: name.trim(), status: 'building', category: 'Product' })
    setName('')
    setAdding(false)
    nav(`/p/${slug}`)
  }

  const decommissioned = projects.filter((p) => p.status === 'decommissioned')

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-3 pb-4 pt-1">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-sm font-semibold text-white">VP</div>
        <div>
          <div className="text-sm font-medium text-white">Control</div>
          <div className="text-[11px] text-zinc-500">vishalpanwar.in</div>
        </div>
      </div>

      <div className="space-y-0.5 px-1.5">
        {PAGES.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} active={route === to} onClick={() => nav(to)} badge={badges[to]}><Icon size={15} /> {label}</NavItem>
        ))}
      </div>

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto px-1.5 pb-4">
        {GROUPS.map((g) => {
          const list = projects.filter((p) => g.categories.includes(p.category) && p.status !== 'decommissioned')
          if (!list.length) return null
          return (
            <div key={g.title}>
              <div className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600">{g.title}</div>
              <div className="space-y-0.5">
                {list.map((p) => (
                  <NavItem key={p.slug} active={route === `/p/${p.slug}`} onClick={() => nav(`/p/${p.slug}`)}>
                    <StatusDot status={p.status} /> <span className="truncate">{p.name}</span>
                  </NavItem>
                ))}
              </div>
            </div>
          )
        })}
        {decommissioned.length > 0 && (
          <div>
            <div className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600">Decommissioned</div>
            <div className="space-y-0.5">
              {decommissioned.map((p) => (
                <NavItem key={p.slug} dim active={route === `/p/${p.slug}`} onClick={() => nav(`/p/${p.slug}`)}>
                  <StatusDot status={p.status} /> <span className="truncate line-through decoration-zinc-700">{p.name}</span>
                </NavItem>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] px-1.5 pt-3">
        {adding ? (
          <div className="flex gap-1.5">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addProject(); if (e.key === 'Escape') setAdding(false) }} placeholder="Project name" className="min-w-0 flex-1" />
            <Button variant="glass" onClick={addProject} aria-label="Create project"><Plus size={14} /></Button>
          </div>
        ) : (
          <NavItem onClick={() => setAdding(true)}><Plus size={15} /> New project</NavItem>
        )}
      </div>
    </div>
  )
}

// ── shell ──────────────────────────────────────────────

function Shell({ user }) {
  const data = useAdminData()
  const [route, go] = useHashRoute()
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const openPalette = useCallback(() => setPalette(true), [])
  useHotkey(openPalette)
  const install = useInstallPrompt()

  const alerts = renewalAlerts(data)
  const overdue = data.projects.reduce((t, p) => t + projectStats(p).owed.overdueCount, 0)
  const down = Object.values(data.checks).filter((c) => !c.up).length
  const badges = { '/renewals': alerts.count, '/money': overdue, '/sites': down }

  const slug = route.startsWith('/p/') ? route.slice(3) : null
  const project = slug ? data.projects.find((p) => p.slug === slug) : null

  let title = 'Overview'
  let view = <OverviewView data={data} go={go} />
  if (route === '/sites') {
    title = 'Sites & uptime'
    view = <SitesView data={data} />
  } else if (route === '/money') {
    title = 'Money'
    view = <MoneyView data={data} go={go} />
  } else if (route === '/renewals') {
    title = 'Renewals'
    view = <RenewalsView data={data} go={go} />
  } else if (route === '/settings') {
    title = 'Settings'
    view = <SettingsView data={data} install={install} />
  } else if (slug) {
    title = project?.name || 'Project'
    view = project
      ? <ProjectView key={project.slug} project={project} data={data} go={go} />
      : <Glass className="p-6 text-sm text-zinc-400">{data.docsReady ? 'No such project.' : 'Loading…'}</Glass>
  }

  useEffect(() => { document.title = `${title} · Control` }, [title])

  return (
    <div className="min-h-screen text-zinc-100">
      <Backdrop />

      <aside className="fixed inset-y-3 left-3 hidden w-60 lg:block">
        <Glass className="h-full p-3"><Sidebar projects={data.projects} route={route} go={go} badges={badges} /></Glass>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-3 left-3 w-64 rounded-2xl bg-zinc-950/80">
            <Glass className="h-full p-3">
              <button onClick={() => setDrawer(false)} className="absolute right-3 top-3 text-zinc-500 hover:text-white" aria-label="Close menu"><X size={18} /></button>
              <Sidebar projects={data.projects} route={route} go={go} badges={badges} onNavigate={() => setDrawer(false)} />
            </Glass>
          </div>
        </div>
      )}

      <div className="lg:pl-[16.5rem]">
        <div className="sticky top-0 z-30 px-3 pt-3 lg:px-4">
          <Glass className="flex items-center gap-3 px-4 py-2.5">
            <button onClick={() => setDrawer(true)} className="text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu"><Menu size={18} /></button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{title}</div>
              <div className="text-[11px] text-zinc-500">
                {data.lastChecked ? `Uptime checked ${timeAgo(data.lastChecked)} · every 5 min` : 'Checking sites…'}
              </div>
            </div>
            <button onClick={openPalette} className="hidden items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 md:flex">
              <Search size={13} /> Search <kbd className="rounded border border-white/10 px-1 text-[10px]">Ctrl K</kbd>
            </button>
            <Button variant="glass" onClick={openPalette} className="md:hidden" aria-label="Search"><Search size={14} /></Button>
            <Button variant="glass" onClick={data.refresh} disabled={data.checking}>
              <RefreshCw size={14} className={data.checking ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => signOut(auth)} title={user.email}><LogOut size={14} /> <span className="hidden sm:inline">Sign out</span></Button>
          </Glass>
        </div>

        <main className="px-3 pb-10 pt-5 lg:px-4">
          {data.vercelError && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300 backdrop-blur-xl">
              Couldn't load Vercel projects: {data.vercelError}
            </div>
          )}
          {view}
        </main>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        pages={PAGES}
        projects={data.projects}
        go={go}
        actions={[{ label: 'Refresh everything', icon: RefreshCw, run: data.refresh }, { label: 'Sign out', icon: LogOut, run: () => signOut(auth) }]}
      />
    </div>
  )
}

// ── installable app ────────────────────────────────────

// Point the page at the admin manifest (the build ships the portfolio's), so
// "Install" gives a VP Control app that opens on the dashboard.
function useAdminManifest() {
  useEffect(() => {
    let link = document.querySelector('link[rel="manifest"]')
    if (!link) {
      link = Object.assign(document.createElement('link'), { rel: 'manifest' })
      document.head.appendChild(link)
    }
    link.href = '/admin.webmanifest'
    const meta = (name, content) => {
      let m = document.querySelector(`meta[name="${name}"]`)
      if (!m) { m = Object.assign(document.createElement('meta'), { name }); document.head.appendChild(m) }
      m.content = content
    }
    meta('theme-color', '#000000')
    meta('apple-mobile-web-app-capable', 'yes')
    meta('apple-mobile-web-app-status-bar-style', 'black-translucent')
    meta('apple-mobile-web-app-title', 'VP Control')
  }, [])
}

function useInstallPrompt() {
  const [evt, setEvt] = useState(null)
  useEffect(() => {
    const on = (e) => { e.preventDefault(); setEvt(e) }
    const done = () => setEvt(null)
    window.addEventListener('beforeinstallprompt', on)
    window.addEventListener('appinstalled', done)
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done) }
  }, [])
  return evt ? async () => { evt.prompt(); await evt.userChoice; setEvt(null) } : null
}

// ── auth gate ──────────────────────────────────────────

function Centered({ children }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Backdrop />
      <Glass className="w-full max-w-sm p-8 text-center">{children}</Glass>
    </div>
  )
}

export default function AdminApp() {
  useAdminManifest()
  // undefined = still resolving, null = signed out
  const [user, setUser] = useState(undefined)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'Control · vishalpanwar.in'
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

  if (user === undefined) {
    return <div className="grid min-h-screen place-items-center bg-black text-sm text-zinc-500">Loading…</div>
  }
  if (!user) {
    return (
      <Centered>
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10 font-semibold text-white">VP</div>
        <h1 className="mt-4 text-lg font-semibold text-white">Control</h1>
        <p className="mt-1 text-sm text-zinc-500">Projects, revenue and uptime.</p>
        <Button variant="primary" onClick={signIn} className="mt-6 w-full py-2">Sign in with Google</Button>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </Centered>
    )
  }
  if (!allowed) {
    return (
      <Centered>
        <ShieldAlert className="mx-auto text-red-400" />
        <p className="mt-3 text-sm text-zinc-300">{user.email} isn't allowed here.</p>
        <Button onClick={() => signOut(auth)} className="mt-4">Sign out</Button>
      </Centered>
    )
  }
  return <Shell user={user} />
}
