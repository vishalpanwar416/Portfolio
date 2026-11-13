import { useCallback, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import {
  Bell, ChevronRight, FolderKanban, IndianRupee, LayoutDashboard, LogOut, Megaphone, Menu, Plus, RefreshCw, Search, Server,
  Settings, ShieldAlert, Smartphone, X,
} from 'lucide-react'
import { auth } from './firebase'
import { GROUPS, leadsFrom, projectDocId, projectStats, saveDoc, slugify, timeAgo, useAdminData } from './data'
import { computeAlerts } from './alerts'
import { Button, Glass, Input, StatusDot, cx } from './ui'
import OverviewView from './OverviewView'
import ProjectView from './ProjectView'
import ProjectsView from './ProjectsView'
import MoneyView from './MoneyView'
import AppsView from './AppsView'
import InfraView, { INFRA_TABS } from './InfraView'
import MarketingView, { MARKETING_TABS } from './MarketingView'
import AlertsView from './AlertsView'
import SettingsView from './SettingsView'
import CommandPalette, { useHotkey } from './CommandPalette'

// ── routing ────────────────────────────────────────────
// #/ #/alerts #/projects #/money #/marketing/<tab> #/apps #/infra/<tab> #/settings #/p/<slug>

const LEGACY = { '/sites': '/infra/uptime', '/renewals': '/infra/renewals' }

function useHashRoute() {
  const read = () => {
    const r = window.location.hash.replace(/^#/, '') || '/'
    return LEGACY[r] || r
  }
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = useCallback((to) => { window.location.hash = to }, [])
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

export const PAGES = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/money', label: 'Money', icon: IndianRupee },
  { to: '/marketing/traffic', label: 'Marketing', icon: Megaphone, match: '/marketing' },
  { to: '/apps', label: 'Apps', icon: Smartphone },
  { to: '/infra/uptime', label: 'Infrastructure', icon: Server, match: '/infra' },
]
const SETTINGS = { to: '/settings', label: 'Settings', icon: Settings }

const isActive = (route, page) => (page.match ? route.startsWith(page.match) : route === page.to)

// Remembered per browser: which sidebar sections are open.
function useStoredToggle(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s === null ? initial : s === '1' } catch { return initial }
  })
  const toggle = () => setV((x) => { try { localStorage.setItem(key, x ? '0' : '1') } catch { /* private mode */ } return !x })
  return [v, toggle]
}

// ── sidebar ────────────────────────────────────────────

function NavItem({ active, onClick, children, badge, badgeTone = 'amber' }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition lg:py-1.5',
        active ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
      )}
    >
      {active && <span className="absolute -left-1.5 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white/80" />}
      {children}
      {badge > 0 && (
        <span className={cx('ml-auto rounded-full px-1.5 text-[10px] tabular-nums', badgeTone === 'red' ? 'bg-red-500/20 text-red-300' : 'bg-amber-400/15 text-amber-300')}>{badge}</span>
      )}
    </button>
  )
}

const SectionLabel = ({ children, onClick, open }) => (
  <button onClick={onClick} disabled={!onClick} className="flex w-full items-center gap-1 px-2.5 pb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-600 enabled:hover:text-zinc-400">
    {onClick && <ChevronRight size={11} className={cx('transition', open && 'rotate-90')} />} {children}
  </button>
)

function Sidebar({ projects, route, go, onNavigate, badges, pinned }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [allOpen, toggleAll] = useStoredToggle('vp-sidebar-all', false)
  const nav = (to) => { go(to); onNavigate?.() }

  const addProject = async () => {
    const slug = slugify(name)
    if (!slug) return
    await saveDoc(projectDocId(slug), { kind: 'project', name: name.trim(), status: 'building', category: 'Product' })
    setName('')
    setAdding(false)
    nav(`/p/${slug}`)
  }

  const pinnedProjects = pinned.map((s) => projects.find((p) => p.slug === s)).filter(Boolean)
  const current = route.startsWith('/p/') ? projects.find((p) => p.slug === route.slice(3)) : null
  const projectLink = (p) => (
    <NavItem key={p.slug} active={route === `/p/${p.slug}`} onClick={() => nav(`/p/${p.slug}`)}>
      <StatusDot status={p.status} /> <span className={cx('truncate', p.status === 'decommissioned' && 'text-zinc-600 line-through decoration-zinc-700')}>{p.name}</span>
    </NavItem>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-3 pb-4 pt-1">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-gradient-to-br from-white/20 to-white/[0.04] text-sm font-semibold text-white">VP</div>
        <div>
          <div className="text-sm font-medium text-white">Control</div>
          <div className="text-[11px] text-zinc-500">vishalpanwar.in</div>
        </div>
      </div>

      <div className="space-y-0.5 px-1.5">
        {PAGES.map((pg) => (
          <NavItem key={pg.to} active={isActive(route, pg)} onClick={() => nav(pg.to)} badge={badges[pg.to]} badgeTone={pg.to === '/alerts' && badges.critical ? 'red' : 'amber'}>
            <pg.icon size={15} /> {pg.label}
          </NavItem>
        ))}
      </div>

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto px-1.5 pb-4">
        {pinnedProjects.length > 0 && (
          <div>
            <SectionLabel>Pinned</SectionLabel>
            <div className="space-y-0.5">{pinnedProjects.map(projectLink)}</div>
          </div>
        )}
        {current && !pinned.includes(current.slug) && !allOpen && (
          <div>
            <SectionLabel>Viewing</SectionLabel>
            {projectLink(current)}
          </div>
        )}
        <div>
          <SectionLabel onClick={toggleAll} open={allOpen}>All projects · {projects.length}</SectionLabel>
          {allOpen && (
            <div className="space-y-3">
              {[...GROUPS, { title: 'Decommissioned', decom: true }].map((g) => {
                const list = projects.filter((p) => (g.decom ? p.status === 'decommissioned' : g.categories.includes(p.category) && p.status !== 'decommissioned'))
                if (!list.length) return null
                return (
                  <div key={g.title}>
                    <div className="px-2.5 pb-0.5 pt-1 text-[10px] text-zinc-700">{g.title}</div>
                    <div className="space-y-0.5">{list.map(projectLink)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-0.5 border-t border-white/[0.06] px-1.5 pt-3">
        {adding ? (
          <div className="flex gap-1.5 pb-1">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addProject(); if (e.key === 'Escape') setAdding(false) }} placeholder="Project name" className="min-w-0 flex-1" />
            <Button variant="glass" onClick={addProject} aria-label="Create project"><Plus size={14} /></Button>
          </div>
        ) : (
          <NavItem onClick={() => setAdding(true)}><Plus size={15} /> New project</NavItem>
        )}
        <NavItem active={route === SETTINGS.to} onClick={() => nav(SETTINGS.to)}><Settings size={15} /> {SETTINGS.label}</NavItem>
        {onNavigate && <NavItem onClick={() => signOut(auth)}><LogOut size={15} /> Sign out</NavItem>}
      </div>
    </div>
  )
}

// Phone: the main places as a bottom bar; Apps, projects and settings in More.
function BottomBar({ route, go, onMenu, badges }) {
  const items = [PAGES[0], PAGES[1], PAGES[2], PAGES[3], { ...PAGES[6], label: 'Infra' }]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] bg-black/70 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-6">
        {items.map((pg) => (
          <button key={pg.to} onClick={() => go(pg.to)} className={cx('relative flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px]', isActive(route, pg) ? 'text-white' : 'text-zinc-500')}>
            <pg.icon size={19} />
            {pg.label}
            {badges[pg.to] > 0 && <span className={cx('absolute right-[24%] top-1.5 h-2 w-2 rounded-full', pg.to === '/alerts' && badges.critical ? 'bg-red-500' : 'bg-amber-400')} />}
          </button>
        ))}
        <button onClick={onMenu} className="flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] text-zinc-500"><Menu size={19} /> More</button>
      </div>
    </nav>
  )
}

// ── shell ──────────────────────────────────────────────

function Shell({ user }) {
  const data = useAdminData()
  const [route, go] = useHashRoute()
  const [drawer, setDrawer] = useState(false)
  // Any navigation (a link, the phone's back gesture) closes the menu.
  useEffect(() => setDrawer(false), [route])
  const [palette, setPalette] = useState(false)
  const openPalette = useCallback(() => setPalette(true), [])
  useHotkey(openPalette)
  const install = useInstallPrompt()

  const alerts = computeAlerts(data)
  const critical = alerts.filter((a) => a.severity === 'critical').length
  const overdue = data.projects.reduce((t, p) => t + projectStats(p).owed.overdueCount, 0)
  const infraIssues = alerts.filter((a) => ['site', 'ssl', 'domain', 'database', 'laptop'].includes(a.kind)).length
  const newLeads = leadsFrom(data.docs).filter((l) => l.status === 'new').length
  const badges = { '/alerts': alerts.filter((a) => a.severity !== 'info').length, critical, '/money': overdue, '/marketing/traffic': newLeads, '/infra/uptime': infraIssues }

  const slug = route.startsWith('/p/') ? route.slice(3) : null
  const project = slug ? data.projects.find((p) => p.slug === slug) : null

  let title = 'Overview'
  let sub = null
  let view = <OverviewView data={data} go={go} />
  if (route === '/alerts') { title = 'Alerts'; sub = `${alerts.length} open`; view = <AlertsView data={data} go={go} /> }
  else if (route === '/projects') { title = 'Projects'; view = <ProjectsView data={data} go={go} /> }
  else if (route === '/money') { title = 'Money'; view = <MoneyView data={data} go={go} /> }
  else if (route.startsWith('/marketing')) {
    const tab = route.split('/')[2] || 'traffic'
    title = 'Marketing'
    sub = MARKETING_TABS.find((t) => t.key === tab)?.label
    view = <MarketingView data={data} go={go} tab={tab} />
  } else if (route === '/apps') { title = 'Apps'; view = <AppsView data={data} go={go} /> }
  else if (route.startsWith('/infra')) {
    const tab = route.split('/')[2] || 'uptime'
    title = 'Infrastructure'
    sub = INFRA_TABS.find((t) => t.key === tab)?.label
    view = <InfraView data={data} go={go} tab={tab} />
  } else if (route === '/settings') { title = 'Settings'; view = <SettingsView data={data} install={install} /> }
  else if (slug) {
    title = project?.name || 'Project'
    view = project
      ? <ProjectView key={project.slug} project={project} data={data} go={go} />
      : <Glass className="p-6 text-sm text-zinc-400">{data.docsReady ? 'No such project.' : 'Loading…'}</Glass>
  }

  useEffect(() => { document.title = `${critical ? `(${critical}) ` : ''}${title} · Control` }, [title, critical])

  const pinned = data.settings.pinned || []

  return (
    <div className="min-h-screen text-zinc-100">
      <Backdrop />

      <aside className="fixed inset-y-3 left-3 hidden w-60 lg:block">
        <Glass className="h-full p-3"><Sidebar projects={data.projects} route={route} go={go} badges={badges} pinned={pinned} /></Glass>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute bottom-3 left-3 top-[max(0.75rem,env(safe-area-inset-top))] w-72 max-w-[85vw] rounded-2xl bg-zinc-950/85">
            <Glass className="h-full p-3">
              <button onClick={() => setDrawer(false)} className="absolute right-3 top-3 z-10 text-zinc-500 hover:text-white" aria-label="Close menu"><X size={18} /></button>
              <Sidebar projects={data.projects} route={route} go={go} badges={badges} pinned={pinned} onNavigate={() => setDrawer(false)} />
            </Glass>
          </div>
        </div>
      )}

      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-[16.5rem]">
        <div className="sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-4">
          <Glass className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-medium text-white">{title}</span>
                {sub && <span className="truncate text-xs text-zinc-500">{sub}</span>}
              </div>
              <div className="text-[11px] text-zinc-500">
                {critical > 0 ? <button onClick={() => go('/alerts')} className="text-red-300 hover:text-red-200">{critical} critical alert{critical > 1 ? 's' : ''}</button>
                  : data.lastChecked ? `All systems checked ${timeAgo(data.lastChecked)}` : 'Checking sites…'}
              </div>
            </div>
            <button onClick={openPalette} className="hidden items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 md:flex">
              <Search size={13} /> Search <kbd className="rounded border border-white/10 px-1 text-[10px]">Ctrl K</kbd>
            </button>
            <Button variant="glass" onClick={openPalette} className="md:hidden" aria-label="Search"><Search size={14} /></Button>
            <Button variant="glass" onClick={data.refresh} disabled={data.checking} aria-label="Refresh">
              <RefreshCw size={14} className={data.checking ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => signOut(auth)} title={user.email} className="hidden sm:inline-flex"><LogOut size={14} /> Sign out</Button>
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

      <BottomBar route={route} go={go} onMenu={() => setDrawer(true)} badges={badges} />

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        pages={[...PAGES, ...MARKETING_TABS.map((t) => ({ to: `/marketing/${t.key}`, label: `Marketing · ${t.label}`, icon: Megaphone })), ...INFRA_TABS.map((t) => ({ to: `/infra/${t.key}`, label: `Infrastructure · ${t.label}`, icon: Server })), SETTINGS]}
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
    meta('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
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
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-gradient-to-br from-white/20 to-white/[0.04] font-semibold text-white">VP</div>
        <h1 className="mt-4 text-lg font-semibold text-white">Control</h1>
        <p className="mt-1 text-sm text-zinc-500">Projects, money, apps and alerts.</p>
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
