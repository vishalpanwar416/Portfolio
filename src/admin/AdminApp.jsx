import { useCallback, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import {
  Bell, Briefcase, BriefcaseBusiness, ChevronRight, FolderKanban, IndianRupee, LayoutDashboard, Linkedin, LogOut, Megaphone, Menu, Plus, RefreshCw, Search, Server,
  Settings, ShieldAlert, Smartphone, X,
} from 'lucide-react'
import { auth } from './firebase'
import { mergeContent } from '../contexts/PortfolioContext'
import { GROUPS, leadsFrom, projectDocId, projectStats, saveDoc, slugify, timeAgo, useAdminData } from './data'
import { computeAlerts } from './alerts'
import { Button, Glass, Input, StatusDot, cx } from './ui'
import OverviewView from './OverviewView'
import ProjectView from './ProjectView'
import ProjectsView from './ProjectsView'
import MoneyView from './MoneyView'
import AppsView from './AppsView'
import InfraView, { INFRA_TABS } from './InfraView'
import MarketingView, { MARKETING_TABS, followUpDue } from './MarketingView'
import LinkedInView, { linkedinReplies } from './LinkedInView'
import JobsView from './JobsView'
import PortfolioEditor, { PORTFOLIO_TABS } from './PortfolioEditor'
import AlertsView from './AlertsView'
import SettingsView from './SettingsView'
import CommandPalette, { useHotkey } from './CommandPalette'
import logoMark from './logo-mark.png'

// ── routing ────────────────────────────────────────────
// #/ #/alerts #/projects #/money #/marketing/<tab> #/portfolio/<tab> #/apps #/infra/<tab> #/linkedin #/jobs #/settings #/p/<slug>

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
    <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(255,255,255,0.075),transparent_70%)]" />
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
  { to: '/portfolio/profile', label: 'Portfolio', icon: Briefcase, match: '/portfolio' },
  { to: '/apps', label: 'Apps', icon: Smartphone },
  { to: '/infra/uptime', label: 'Infrastructure', icon: Server, match: '/infra' },
  { to: '/linkedin', label: 'LinkedIn', icon: Linkedin },
  { to: '/jobs', label: 'Jobs', icon: BriefcaseBusiness },
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
        active ? 'bg-gradient-to-r from-white/[0.11] to-white/[0.04] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
      )}
    >
      {active && <span className="absolute -left-1.5 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />}
      {children}
      {badge > 0 && (
        <span className={cx('ml-auto rounded-full px-1.5 text-[10px] tabular-nums', badgeTone === 'red' ? 'bg-red-500/20 text-red-300' : 'bg-amber-400/15 text-amber-300')}>{badge}</span>
      )}
    </button>
  )
}

// The site's neon VP mark, with a soft glow like the original.
export const Logo = ({ className }) => (
  <img src={logoMark} alt="Vishal Panwar" className={cx('select-none object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]', className)} draggable={false} />
)

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
    if (projects.some((p) => p.slug === slug)) { nav(`/p/${slug}`); return }
    await saveDoc(projectDocId(slug), { kind: 'project', name: name.trim(), status: 'building', category: 'Product', order: Math.max(0, ...projects.map((p) => p.order ?? 0)) + 10, createdAt: Date.now() })
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
      <a href="https://vishalpanwar.in" target="_blank" rel="noreferrer" className="group mb-1 flex items-center gap-3 rounded-xl px-2.5 pb-4 pt-1" title="Open vishalpanwar.in">
        <Logo className="h-10 w-10 transition duration-300 group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.7)]" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-white">Vishal Panwar</div>
          <div className="text-[11px] text-zinc-500 transition group-hover:text-zinc-300">Admin · vishalpanwar.in</div>
        </div>
      </a>

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
  const items = [PAGES[0], PAGES[1], PAGES[2], PAGES[3], { ...PAGES.find((pg) => pg.match === '/infra'), label: 'Infra' }]
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
  const newLeads = leadsFrom(data.docs).filter((l) => l.status === 'new' || followUpDue(l)).length
  const badges = { '/alerts': alerts.filter((a) => a.severity !== 'info').length, critical, '/money': overdue, '/marketing/traffic': newLeads, '/infra/uptime': infraIssues, '/linkedin': linkedinReplies(data.docs.linkedin).length }

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
  } else if (route.startsWith('/portfolio')) {
    const tab = route.split('/')[2] || 'profile'
    title = 'Portfolio'
    sub = PORTFOLIO_TABS.find((t) => t.key === tab)?.label
    view = <PortfolioEditor data={data} go={go} tab={tab} />
  } else if (route === '/linkedin') { title = 'LinkedIn'; sub = 'Outreach'; view = <LinkedInView data={data} /> }
  else if (route === '/jobs') { title = 'Jobs'; sub = 'Openings'; view = <JobsView /> }
  else if (route === '/settings') { title = 'Settings'; view = <SettingsView data={data} install={install} /> }
  else if (slug) {
    title = project?.name || 'Project'
    view = project
      ? <ProjectView key={project.slug} project={project} data={data} go={go} />
      : <Glass className="p-6 text-sm text-zinc-400">{data.docsReady ? 'No such project.' : 'Loading…'}</Glass>
  }

  useEffect(() => { document.title = `${critical ? `(${critical}) ` : ''}${title} · Admin` }, [title, critical])

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
          {data.docsError && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300 backdrop-blur-xl">
              Can't read the dashboard's saved data ({data.docsError}). Notes, leads, campaigns and the portfolio editor need the
              vp_sites rule deployed on sanero-media: run <code className="text-red-200">firebase deploy --only firestore:rules --project sanero-media</code> in sanero-next.
            </div>
          )}
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
        pages={[...PAGES, ...MARKETING_TABS.map((t) => ({ to: `/marketing/${t.key}`, label: `Marketing · ${t.label}`, icon: Megaphone })), ...PORTFOLIO_TABS.map((t) => ({ to: `/portfolio/${t.key}`, label: `Portfolio · ${t.label}`, icon: Briefcase })), ...INFRA_TABS.map((t) => ({ to: `/infra/${t.key}`, label: `Infrastructure · ${t.label}`, icon: Server })), SETTINGS]}
        projects={data.projects}
        go={go}
        actions={[{ label: 'Refresh everything', icon: RefreshCw, run: data.refresh }, { label: 'Sign out', icon: LogOut, run: () => signOut(auth) }]}
      />
    </div>
  )
}

// ── installable app ────────────────────────────────────

// Point the page at the admin manifest (the build ships the portfolio's), so
// "Install" gives an Admin app that opens on the dashboard.
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
    meta('apple-mobile-web-app-title', 'Admin')
    for (const rel of ['icon', 'apple-touch-icon']) {
      let l = document.querySelector(`link[rel="${rel}"]`)
      if (!l) { l = Object.assign(document.createElement('link'), { rel }); document.head.appendChild(l) }
      l.href = '/admin-icon-192.png'
    }
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


function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

// Readable text for a sign-in failure; null when the user just closed the popup.
function signInMessage(e) {
  switch (e?.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return null
    case 'auth/network-request-failed':
      return "Couldn't reach Google. Check your connection and try again."
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.'
    case 'auth/unauthorized-domain':
      return "Sign-in isn't enabled for this address."
    default:
      return `Sign-in didn't work: ${e?.message || e}`
  }
}

// Popup first; when the browser blocks it (some phones and in-app browsers),
// a full-page redirect instead.
async function googleSignIn() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider)
    } else {
      throw e
    }
  }
}

function GoogleButton({ busy, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-60"
    >
      {busy ? <RefreshCw size={16} className="animate-spin text-zinc-500" /> : <GoogleMark />}
      {children}
    </button>
  )
}

// ── welcome / sign-in ──────────────────────────────────

// Remembered on this device after a successful sign-in, so the next visit
// can greet you by name. Only name and photo; nothing secret.
const LAST_USER_KEY = 'admin-last-user'
const readLastUser = () => { try { return JSON.parse(localStorage.getItem(LAST_USER_KEY)) || null } catch { return null } }
const rememberUser = (u) => {
  try { localStorage.setItem(LAST_USER_KEY, JSON.stringify({ name: u.displayName || '', photo: u.photoURL || '' })) } catch { /* private mode */ }
}

const IST = 'Asia/Kolkata'
function greeting(d) {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: IST }).format(d))
  if (h < 5) return 'Working late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

const WELCOME_AREAS = ['Projects', 'Money', 'Marketing', 'Instagram', 'Alerts', 'Infrastructure', 'LinkedIn', 'Jobs']

/** The public profile from vishalpanwar.in (published content over the built-in copy). */
function usePublicProfile() {
  const [content, setContent] = useState(() => mergeContent(null))
  useEffect(() => {
    let live = true
    fetch('/api/admin/portfolio').then((r) => (r.ok ? r.json() : null)).then((c) => { if (live && c) setContent(mergeContent(c)) }).catch(() => {})
    return () => { live = false }
  }, [])
  return content
}

/** Owner on a device they've signed in on before: a personal greeting. */
function OwnerGreeting({ now, name }) {
  const date = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: IST }).format(now)
  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">{date}</div>
      <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
        {greeting(now)},<br />
        <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">{name}.</span>
      </h1>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
        Welcome back to your control center. Everything you run, in one place.
      </p>
      <div className="mt-7 flex flex-wrap gap-2">
        {WELCOME_AREAS.map((a) => (
          <span key={a} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">{a}</span>
        ))}
      </div>
    </div>
  )
}

/** Anyone else: who Vishal is and how to reach him. */
function AboutMe({ profile }) {
  const { personalInfo: me, sectionContent: text, socialLinks, externalLinks, workExperience, projects } = profile
  const role = me.title.split('|').map((x) => x.trim()).filter(Boolean)
  const current = workExperience?.[0]
  const shown = projects.filter((p) => p.featured).slice(0, 3)
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-500">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> {me.availability.badge}
      </div>
      <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
        Hi, I'm<br />
        <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">{me.name.full}.</span>
      </h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {role.map((r) => <span key={r} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs uppercase tracking-wider text-zinc-300">{r}</span>)}
      </div>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">{text.hero.description}</p>
      <div className="mt-5 grid max-w-xl grid-cols-1 gap-2 text-sm text-zinc-400 sm:grid-cols-2">
        {current && <div><span className="text-zinc-600">Now · </span>{current.position} at {current.company}</div>}
        <div><span className="text-zinc-600">Based in · </span>{me.location.display}</div>
        <div className="sm:col-span-2"><span className="text-zinc-600">Open to · </span>{me.availability.status}</div>
      </div>
      {shown.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {shown.map((p) => (
            <a key={p.title} href={p.live || p.github || 'https://vishalpanwar.in/#portfolio'} target="_blank" rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300 transition hover:border-white/25 hover:text-white">
              {p.title} ↗
            </a>
          ))}
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a href="https://vishalpanwar.in" className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200">View my portfolio</a>
        <a href={externalLinks.calendarBooking} target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-white/30 hover:text-white">Book a call</a>
        <a href={`mailto:${me.contact.email}`} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-white/30 hover:text-white">Email me</a>
        <div className="flex items-center gap-1">
          {socialLinks.slice(0, 5).map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" aria-label={l.name} title={l.name}
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-white">
              <l.icon size={16} />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Full-screen sign-in page. On a device the owner has used before it greets
 * them; anyone else sees who Vishal is and how to reach him, with the private
 * sign-in kept small on the side.
 */
function Welcome({ owner, children }) {
  const now = useClock()
  const profile = usePublicProfile()
  const last = readLastUser()
  const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: IST }).format(now)
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden text-zinc-100 lg:flex-row">
      <Backdrop />
      <img src={logoMark} alt="" aria-hidden className="pointer-events-none absolute -left-24 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 select-none opacity-[0.06] lg:left-[8%]" />

      <section className="relative flex flex-1 flex-col justify-between gap-10 px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-10 lg:px-16 lg:py-12">
        <a href="https://vishalpanwar.in" className="flex w-fit items-center gap-3 text-sm text-zinc-400 transition hover:text-white">
          <Logo className="h-9 w-9" />
          <span>vishalpanwar.in</span>
        </a>
        {owner ? <OwnerGreeting now={now} name={(last?.name || profile.personalInfo.name.first).split(' ')[0]} /> : <AboutMe profile={profile} />}
        <div className="hidden font-mono text-sm tabular-nums text-zinc-600 lg:block">{time} IST · {profile.personalInfo.location.display}</div>
      </section>

      <aside className="relative flex w-full items-center justify-center border-t border-white/[0.06] bg-black/40 px-6 py-10 backdrop-blur-2xl sm:px-10 lg:w-[28rem] lg:border-l lg:border-t-0 lg:py-12 xl:w-[32rem]">
        <div className="w-full max-w-sm">{children}</div>
      </aside>
    </div>
  )
}

function SignInPanel({ busy, error, onSignIn, checking }) {
  const last = readLastUser()
  const first = last?.name?.split(' ')[0]
  return (
    <div>
      <div className="flex items-center gap-3">
        {last?.photo
          ? <img src={last.photo} alt="" referrerPolicy="no-referrer" className="h-12 w-12 rounded-full ring-1 ring-white/20" />
          : <Logo className="h-12 w-12" />}
        <div>
          <div className="text-lg font-semibold tracking-tight text-white">{first ? `Welcome back, ${first}` : 'Private dashboard'}</div>
          <div className="text-sm text-zinc-500">{first ? 'Vishal Panwar · Admin' : 'Where Vishal runs his projects'}</div>
        </div>
      </div>
      {!first && (
        <p className="mt-6 text-sm leading-relaxed text-zinc-400">
          This is my private control center for projects, uptime and marketing. If you're here to work with me, the portfolio and links on this page are the way in.
        </p>
      )}
      <div className="mt-8">
        {checking ? (
          <div className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 text-sm text-zinc-500">
            <RefreshCw size={14} className="animate-spin" /> Checking sign-in…
          </div>
        ) : first ? (
          <GoogleButton busy={busy} onClick={onSignIn}>Continue as {first}</GoogleButton>
        ) : (
          <button onClick={onSignIn} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm text-zinc-300 transition hover:border-white/30 hover:text-white disabled:opacity-60">
            {busy ? <RefreshCw size={14} className="animate-spin" /> : <GoogleMark />} Owner sign-in
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
      <p className="mt-8 border-t border-white/10 pt-4 text-xs leading-relaxed text-zinc-600">
        Only Vishal's Google account can open this dashboard.
      </p>
    </div>
  )
}

/** Signed in with someone else's account: say so, and offer to switch. */
function NotOwnerPanel({ user, busy, error, onSwitch }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-white"><ShieldAlert size={16} className="text-red-400" /> This account can't open Admin</div>
      <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 text-sm text-zinc-300">
        {user.photoURL
          ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-6 w-6 rounded-full" />
          : <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-xs font-semibold">{(user.email || '?')[0].toUpperCase()}</span>}
        <span className="truncate">{user.email}</span>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-zinc-400">
        Thanks for stopping by{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! This dashboard is private, but everything about my work is on the left and on my portfolio.
      </p>
      <div className="mt-6 space-y-2">
        <Button onClick={() => signOut(auth)} className="w-full py-2">Sign out</Button>
        <button onClick={onSwitch} disabled={busy} className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300">Use another account</button>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export default function AdminApp() {
  useAdminManifest()
  // undefined = still resolving, null = signed out
  const [user, setUser] = useState(undefined)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Admin · Vishal Panwar'
    return onAuthStateChanged(auth, async (u) => {
      // Force a fresh token so a newly granted claim is picked up.
      const ok = u ? (await u.getIdTokenResult(true)).claims.superAdmin === true : false
      if (ok) rememberUser(u)
      setAllowed(ok)
      setUser(u)
    })
  }, [])

  const run = async (action) => {
    setError(null)
    setBusy(true)
    try { await action() } catch (e) { setError(signInMessage(e)) } finally { setBusy(false) }
  }
  const signIn = () => run(googleSignIn)
  const switchAccount = () => run(async () => { await signOut(auth); await googleSignIn() })

  if (user === undefined || !user) {
    return (
      <Welcome owner={!!readLastUser()}>
        <SignInPanel checking={user === undefined} busy={busy} error={error} onSignIn={signIn} />
      </Welcome>
    )
  }
  if (!allowed) {
    return (
      <Welcome owner={false}>
        <NotOwnerPanel user={user} busy={busy} error={error} onSwitch={switchAccount} />
      </Welcome>
    )
  }
  return <Shell user={user} />
}
