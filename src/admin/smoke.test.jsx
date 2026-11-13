import { render, screen } from '@testing-library/react'
import projectsJson from './projects.json'
import OverviewView from './OverviewView'
import ProjectsView from './ProjectsView'
import AlertsView from './AlertsView'
import AppsView from './AppsView'
import InfraView from './InfraView'
import MoneyView from './MoneyView'
import ProjectView from './ProjectView'
import SettingsView from './SettingsView'
import MarketingView, { seoIssues } from './MarketingView'
import PortfolioEditor, { builtInContent } from './PortfolioEditor'
import { mergeContent } from '../contexts/PortfolioContext'
import LinkedInView from './LinkedInView'
import { campaignMonths, costIn, leadProject, leadsFrom } from './data'

jest.mock('./firebase', () => ({ auth: { currentUser: { getIdToken: async () => 't' } }, db: {}, SITES_COLLECTION: 'vp_sites' }))
jest.mock('firebase/firestore', () => ({ collection: () => ({}), doc: () => ({}), onSnapshot: () => () => {}, setDoc: async () => {}, deleteDoc: async () => {} }))
global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) }))

const EMPTY = { summary: '', stack: [], domains: [], repos: [], vercel: [], firebase: [], stacky: [], cloud: [], apps: [], payments: [], supabase: [], services: [], revenue: [], invoices: [], expenses: [], clients: [], updates: [], links: [], notes: '' }
const m = new Date().toISOString().slice(0, 7)
const projects = projectsJson.filter((p) => !p.hidden).map((p) => ({ ...EMPTY, ...p, id: `proj-${p.slug}`, vercelProjects: [],
  autoRevenue: { [m]: 1200 }, invoices: p.slug === 'aarambh' ? [{ id: 'i1', number: 'AARA-1', client: 'X', month: m, amount: 5000, status: 'sent', due: '2020-01-01' }] : [],
  clients: p.slug === 'aarambh' ? [{ id: 'c1', name: 'Gym', monthly: 5000, status: 'active', contractEnd: '2020-01-05' }] : [] }))
const ok = (data) => ({ data, error: null, loading: false, notConfigured: false, reload: () => {} })
const nowS = Math.round(Date.now() / 1000)
const hist = { points: Array.from({ length: 50 }, (_, i) => ({ t: nowS - (50 - i) * 120, l: 0.3, m: 40 + i / 5, d: 70, b: 80, x: i % 5 ? [] : ['media-man@sanero.service'] })) }
const data = {
  projects, vercel: [], docs: { [`laptop-h-${new Date().toISOString().slice(0, 10)}`]: hist, laptop: { at: new Date().toISOString(), host: 'lap', services: [{ unit: 'media-man@sanero.service', project: 'media-man', state: 'failed', result: 'exit-code', ok: false }, { unit: 'hermes-gateway.service', project: 'hermes', state: 'active', ok: true }], disk: { total: 5e11, free: 1e11 }, memory: { total: 16e9, available: 8e9 }, load: [1, 1, 1], docker: { state: 'active', ok: true, containers: [{ name: 'splink-postgres', image: 'postgres', status: 'Up 2h', running: true }] }, processes: [{ name: 'cursor', cpu: 60, mem: 1.4 }], cpus: 16, battery: { percent: 80, status: 'Charging' }, uptimeSec: 3600 } },
  docsReady: true, checks: { 'cms.edition.tv': { host: 'cms.edition.tv', up: false, error: 'ENOTFOUND' }, 'sanero.in': { host: 'sanero.in', up: true, status: 200, ms: 100, certValidTo: new Date(Date.now() + 5 * 864e5).toISOString() } },
  checking: false, lastChecked: new Date(), refresh: () => {}, settings: { monthlyGoal: 100000, pinned: ['aarambh'] },
  domains: ok({ domains: [{ domain: 'sanero.in', expiresAt: new Date(Date.now() + 20 * 864e5).toISOString(), registrar: 'GoDaddy' }] }),
  integrations: ok({ vercel: true, monitor: { conclusion: 'success', at: new Date().toISOString() } }),
  traffic: ok({ projects: {} }), stacky: { ...ok(null), notConfigured: true, error: 'x' }, hiddenProjects: [],
  payments: ok({ sources: [{ source: 'razorpay:tabletap', months: [{ month: m, gross: 1500, net: 1200, fees: 300, refunds: 0, count: 3 }], last: { at: new Date().toISOString(), amount: 500, method: 'upi' } }, { source: 'razorpay:aarambh', error: 'missing', notConfigured: true }] }),
  apps: ok({ apps: [{ spec: 'play:com.reignactive.aarambh', platform: 'android', published: true, name: 'Aarambh', rating: 3.5, reviews: '7', downloads: '100+', updated: '22 Oct 2026', vitals: { crashRate: 0.02, anrRate: 0.001 } }, { spec: 'ios:Com.Aarambh.Fitness', platform: 'ios', published: false, id: 'Com.Aarambh.Fitness' }] }),
  supabase: ok({ projects: [{ spec: 'tabletap:vogixryubhpqziivspks', ref: 'vogixryubhpqziivspks', name: 'tt', status: 'INACTIVE', free: { dbBytes: 5e8, storageBytes: 1e9 } }, { spec: 'splink:altpnwfozryqufjbarti', ref: 'a', name: 'sp', status: 'ACTIVE_HEALTHY', health: [{ name: 'db', healthy: true }], dbBytes: 4.8e8, storageBytes: 1e7, requests24h: 1000, free: { dbBytes: 524288000, storageBytes: 1e9 } }] }),
}
const go = () => {}
data.docs['lead-1'] = { kind: 'lead', status: 'new', name: 'Asha', email: 'a@x.in', site: 'sanero.in', message: 'Need a site', utm: { source: 'google', campaign: 'diwali' }, createdAt: Date.now() }
projects.find((p) => p.slug === 'sanero').campaigns = [{ id: 'c1', name: 'Diwali', channel: 'Meta Ads', start: `${m}-01`, end: null, budget: 5000, spent: 3000, utm: 'diwali' }]

test.each([
  ['overview', <OverviewView data={data} go={go} />],
  ['projects', <ProjectsView data={data} go={go} />],
  ['alerts', <AlertsView data={data} go={go} />],
  ['apps', <AppsView data={data} go={go} />],
  ['money', <MoneyView data={data} go={go} />],
  ['settings', <SettingsView data={data} install={null} />],
  ...['uptime', 'renewals', 'cloud', 'data', 'laptop'].map((t) => [`infra ${t}`, <InfraView data={data} go={go} tab={t} />]),
  ...['traffic', 'instagram', 'seo', 'campaigns', 'leads'].map((t) => [`marketing ${t}`, <MarketingView data={data} go={go} tab={t} />]),
  ...['profile', 'projects', 'skills', 'experience', 'education', 'certifications'].map((t) => [`portfolio ${t}`, <PortfolioEditor data={data} go={go} tab={t} />]),
  ...['aarambh', 'table-tap', 'media-man', 'splinkpro'].map((s) => [`project ${s}`, <ProjectView project={projects.find((p) => p.slug === s)} data={data} go={go} />]),
])('%s renders', (name, el) => {
  const { container } = render(el)
  expect(container.textContent.length).toBeGreaterThan(20)
})

test('alerts are computed', () => {
  const { computeAlerts } = require('./alerts')
  const a = computeAlerts(data)
  const titles = a.map((x) => `${x.severity}:${x.title}`)
  console.log(titles.join('\n'))
  expect(titles.some((t) => t.startsWith('critical:Supabase tt is paused'))).toBe(true)
  expect(titles.some((t) => t.includes('cms.edition.tv is down'))).toBe(true)
})

test('campaign spend counts as a cost, spread over its months', () => {
  expect(campaignMonths({ start: '2026-10-20', end: '2026-12-05' })).toEqual(['2026-10', '2026-11', '2026-12'])
  expect(campaignMonths({ start: '2026-10-20' })).toEqual(['2026-10'])
  const p = { expenses: [], campaigns: [{ start: '2026-10-01', end: '2026-11-30', spent: 2000 }] }
  expect(costIn(p, '2026-10')).toBe(1000)
  expect(costIn(p, '2026-12')).toBe(0)
})

test('leads are matched to projects by site', () => {
  const [lead] = leadsFrom(data.docs)
  expect(leadProject(lead, projects)?.slug).toBe('sanero')
  expect(leadProject({ site: 'www.sanero.in' }, projects)?.slug).toBe('sanero')
  expect(leadProject({ site: 'unknown.example' }, projects)).toBeNull()
})

test('seo issues flag the basics', () => {
  const titles = seoIssues({ status: 200, robots: 'noindex', title: null, description: 'x'.repeat(200) }).map((i) => i.text)
  expect(titles).toEqual(expect.arrayContaining(['Home page is noindex', 'No <title>', 'Description is 200 chars (keep ≤ 160)', 'No sitemap.xml']))
  expect(seoIssues({ error: 'timeout' })[0].tone).toBe('red')
})

test('linkedin page shows replies, both campaigns and request caps', () => {
  const { clean } = require('../../api/admin/_routes/linkedin')
  const day = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10)
  const li = clean({
    prospects: {
      request_log: { [day]: 4, 'not-a-day': 9 },
      prospects: [
        { name: 'Sana Khan', profile: 'https://www.linkedin.com/in/sana/', org: 'Solverines', role: 'Cloud Infrastructure Engineer', status: 'requested', note_sent: false, requested_on: `${day}T12:16+05:30` },
        { name: 'Oleksandra Garshina', profile: 'javascript:alert(1)', role: 'DevOps Engineer', status: 'accepted_messaged', replied: 'Please send your CV', awaiting_vishal_reply: true },
        { name: 'Chirag K.', role: 'System Engineer', status: 'accepted_messaged', fit_line: 'Helm and ArgoCD match.', messaged_on: `${day}T18:17+05:30` },
      ],
      run_notes: [{ at: `${day}T12:15+05:30`, note: 'Scheduled run.' }],
    },
    targets: {
      last_checked: `${day}T12:15:06+05:30`,
      targets: [
        { name: 'Pankaj S.', role: 'Senior SRE', messaged: true, replied: 'visa and location??', awaiting_vishal_reply: true },
        { name: 'Trang Duong', role: 'Senior DevOps', messaged: true, awaiting_reply: true },
        { name: 'Meet Patel', role: 'Cloud Engineer', messaged: false },
      ],
    },
  }, new Date().toISOString())
  expect(li.prospects[1].profile).toBeNull()
  expect(li.requestLog).toEqual([{ day, n: 4 }])
  render(<LinkedInView data={{ ...data, docs: { ...data.docs, linkedin: li } }} />)
  expect(screen.getByText('Needs your reply · 2')).toBeTruthy()
  expect(screen.getByText('Please send your CV')).toBeTruthy()
  expect(screen.getByText('visa and location??')).toBeTruthy()
  expect(screen.getByText('4 / 15')).toBeTruthy()
  expect(screen.getByText('Old campaign · not accepted · 1')).toBeTruthy()
  render(<LinkedInView data={{ ...data, docs: {} }} />)
  expect(screen.getByText(/No LinkedIn data yet/)).toBeTruthy()
})

test('instagram tab shows the account and its posts', async () => {
  const account = {
    account: 'tabletap', username: 'tabletap.in', followers: 1200, follows: 10, mediaCount: 40, insights: { reach: 5000 },
    posts: [{ id: '1', caption: 'Menu QR launch', type: 'REEL', permalink: 'https://instagram.com/p/1', at: '2026-11-01T10:00:00Z', likes: 50, comments: 4, reach: 900 }],
  }
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ accounts: [account, { account: 'sanero', notConfigured: true }] }) }))
  render(<MarketingView data={data} go={go} tab="instagram" />)
  expect(await screen.findByText('@tabletap.in')).toBeTruthy()
  expect(screen.getAllByText('Menu QR launch').length).toBe(2)
  expect(screen.getByText('4.5%')).toBeTruthy()
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) }))
})

test('portfolio content round-trips through the public endpoint into the site', () => {
  const { clean } = require('../../api/admin/_routes/portfolio')
  const draft = builtInContent()
  expect(draft.projects.length).toBeGreaterThan(5)
  expect(draft.certifications[0].icon).toBe('award')
  draft.projects[0] = { ...draft.projects[0], title: 'New thing', live: 'javascript:alert(1)', hidden: false }
  draft.projects[1] = { ...draft.projects[1], hidden: true }
  draft.skills = [{ category: 'Go stack', skills: ['Go', 'gRPC'] }]
  draft.profile.title = 'SRE | Platform'
  const site = mergeContent(clean(draft))
  expect(site.projects[0].title).toBe('New thing')
  expect(site.projects[0].live).toBeNull()
  expect(site.projects).toHaveLength(draft.projects.length - 1)
  expect(site.skillCategories).toEqual([{ category: 'Go stack', skills: ['Go', 'gRPC'] }])
  expect(site.personalInfo.title).toBe('SRE | Platform')
  expect(site.personalInfo.name.full).toBe('Vishal Panwar')
  expect(typeof site.certifications[0].icon).not.toBe('string')
  // Nothing published: the built-in data, unchanged.
  const fallback = mergeContent({})
  expect(fallback.projects.length).toBe(builtInContent().projects.length)
  expect(fallback.workExperience[0].company).toBe('Bluecopa')
})

test('portfolio editor explains a Firestore read failure instead of loading forever', () => {
  render(<PortfolioEditor data={{ ...data, docsReady: true, docsError: 'permission-denied' }} go={go} tab="projects" />)
  expect(screen.getByText(/can't load or save/)).toBeTruthy()
})
