import { fireEvent, render, screen } from '@testing-library/react'
import projectsJson from './projects.json'
import OverviewView from './OverviewView'
import ProjectsView from './ProjectsView'
import AlertsView from './AlertsView'
import AppsView from './AppsView'
import InfraView from './InfraView'
import MoneyView from './MoneyView'
import ProjectView from './ProjectView'
import SettingsView from './SettingsView'
import MarketingView, { followUpDue, replyText, seoIssues, utmUrl } from './MarketingView'
import PortfolioEditor, { builtInContent } from './PortfolioEditor'
import { mergeContent } from '../contexts/PortfolioContext'
import LinkedInView from './LinkedInView'
import JobsView from './JobsView'
import { campaignMonths, costIn, leadProject, leadsFrom } from './data'
import { bestTimes, followerSeries, formatStats, relativePosts, slotOf } from './InstagramInsights'
import { matchPlan, plansFrom } from './CalendarView'

jest.mock('./firebase', () => ({ auth: { currentUser: { getIdToken: async () => 't' } }, db: {}, SITES_COLLECTION: 'vp_sites', JOBS_COLLECTION: 'vp_jobs' }))
// Pipeline posts (PostsView) arrive through onSnapshot; one sample per brand.
// Saved openings (JobsView) also arrive through onSnapshot, already cleaned by api/admin/_routes/jobs.js.
const FEED = [
  { id: 1, company: 'Google', title: 'Staff Software Engineer, Search Evals', location: 'Bengaluru, Karnataka, India', url: 'https://www.google.com/about/careers/applications/jobs/results/1', techStack: 'C++, Go, Not specified', minExperienceYears: 8, maxExperienceYears: 8, scrapedAt: '2026-11-13T17:56:06Z', qualifications: '- 8 years of experience' },
  { id: 2, company: 'Microsoft', title: 'Support Escalation Engineer - CSP', location: 'Hyderabad, TS, IN', url: 'https://apply.careers.microsoft.com/careers/job/2', minExperienceYears: 3, scrapedAt: '2026-11-13T17:56:06Z' },
  { id: 3, company: 'PhonePe', title: 'Software Engineer, Backend (3-5 years)', location: 'Pune', url: 'javascript:alert(1)', minExperienceYears: 3, maxExperienceYears: 5, scrapedAt: '2026-11-12T10:00:00Z' },
  { id: 4, company: 'Confluent', title: 'Software Developer - Confluent', location: 'Bangalore', url: 'https://careers.ibm.com/x', minExperienceYears: 6, maxExperienceYears: 1, scrapedAt: '2026-11-11T10:00:00Z' },
]
const JOBS = () => FEED.map((j) => require('../../api/admin/_routes/jobs').clean(j)).map((j, i) => ({ id: `fp-${j.sourceId}`, data: () => ({ ...j, ...(i === 3 ? { status: 'applied', appliedOn: '2026-11-14', notes: 'Referral from Riya' } : {}) }) }))
const POST = (brand) => ({ id: `${brand}-1`, data: () => ({ postId: `${brand}-1`, title: `${brand} sample post`, caption: 'caption', pillar: 'product', state: 'published', createdAt: '2026-11-13T10:00:00.000Z', publishedAt: '2026-11-13T12:00:00.000Z', permalink: 'https://instagram.com/p/x', metrics: { likes: 12, comments: 3, reach: 400 } }) })
jest.mock('firebase/firestore', () => ({
  collection: (_, name) => ({ name }), doc: () => ({}), query: (c) => c, orderBy: () => ({}), limit: () => ({}),
  onSnapshot: (ref, ok) => { if (ref?.name?.endsWith('_posts')) ok({ docs: [POST(ref.name)] }); if (ref?.name === 'vp_jobs') ok({ docs: JOBS() }); return () => {} },
  setDoc: async () => {}, deleteDoc: async () => {},
}))
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
  docsReady: true, checks: { 'edition.tv': { host: 'edition.tv', up: false, error: 'ENOTFOUND' }, 'sanero.in': { host: 'sanero.in', up: true, status: 200, ms: 100, certValidTo: new Date(Date.now() + 5 * 864e5).toISOString() } },
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
  ...['traffic', 'instagram', 'posts', 'calendar', 'seo', 'search', 'speed', 'campaigns', 'leads'].map((t) => [`marketing ${t}`, <MarketingView data={data} go={go} tab={t} />]),
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
  expect(titles.some((t) => t.includes('edition.tv is down'))).toBe(true)
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

test('tracked links carry clean utm tags', () => {
  expect(utmUrl({ host: 'sanero.in', path: 'offers', source: 'Instagram', medium: 'social', campaign: 'Diwali Offer!', content: '' }))
    .toBe('https://sanero.in/offers?utm_source=instagram&utm_medium=social&utm_campaign=diwali-offer')
  expect(utmUrl({ host: '' })).toBe('')
})

test('follow-ups are due on or after their date, only while the lead is open', () => {
  expect(followUpDue({ status: 'contacted', followUp: '2026-11-10' }, '2026-11-15')).toBe(true)
  expect(followUpDue({ status: 'new', followUp: '2026-11-15' }, '2026-11-15')).toBe(true)
  expect(followUpDue({ status: 'new', followUp: '2026-11-16' }, '2026-11-15')).toBe(false)
  expect(followUpDue({ status: 'won', followUp: '2026-11-10' }, '2026-11-15')).toBe(false)
  expect(replyText({ name: 'Asha Rao' }, { name: 'Sanero' })).toMatch(/^Hi Asha, thanks for getting in touch about Sanero\./)
})

test('leads tab flags an overdue follow-up and offers a prefilled reply', () => {
  const docs = { ...data.docs, 'lead-2': { kind: 'lead', status: 'contacted', name: 'Ravi', phone: '9876543210', site: 'sanero.in', followUp: '2020-01-01', createdAt: Date.now() - 1000 } }
  render(<MarketingView data={{ ...data, docs }} go={go} tab="leads" />)
  expect(screen.getByText('Follow up · 2020-01-01')).toBeTruthy()
  fireEvent.click(screen.getByText('Ravi'))
  expect(screen.getByText('Reply on WhatsApp').closest('a').getAttribute('href')).toMatch(/^https:\/\/wa\.me\/919876543210\?text=Hi%20Ravi/)
})

test('speed tab shows saved PageSpeed runs with the change since last time', () => {
  const runs = [{ at: Date.now() - 864e5, performance: 90 }, { at: Date.now(), performance: 72, seo: 100, accessibility: 95, bestPractices: 100, lcp: 3100, cls: 0.02, tbt: 120, field: null }]
  render(<MarketingView data={{ ...data, docs: { ...data.docs, vitals: { kind: 'vitals', sites: [{ host: 'sanero.in', runs }] } } }} go={go} tab="speed" />)
  expect(screen.getByText('72')).toBeTruthy()
  expect(screen.getByText(/-18/)).toBeTruthy()
  expect(screen.getByText('3.1s')).toBeTruthy()
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

test('posts tab lists pipeline posts from both brands', () => {
  render(<MarketingView data={data} go={go} tab="posts" />)
  expect(screen.getByText('tabletap_posts sample post')).toBeTruthy()
  expect(screen.getByText('media_posts sample post')).toBeTruthy()
})

test('best time groups posts by IST day and 3-hour block, and needs two posts to pick a winner', () => {
  // 2026-11-16 is a Monday; 13:00Z is 6:30pm IST.
  expect(slotOf('2026-11-16T13:00:00Z')).toEqual({ day: 0, block: 18 })
  const posts = [
    { at: '2026-11-16T13:00:00Z', likes: 40, comments: 10, type: 'REEL' },
    { at: '2026-11-23T13:30:00Z', likes: 30, comments: 0, type: 'REEL' },
    { at: '2026-11-18T04:00:00Z', likes: 500, comments: 0, type: 'IMAGE' }, // one viral Wednesday morning post
    { at: '2026-11-19T04:00:00Z', likes: 5, comments: 1, type: 'IMAGE' },
  ]
  const t = bestTimes(posts)
  expect(t.bestSlot).toMatchObject({ key: '0-18', n: 2, avg: 40 })
  expect(t.grid['2-9']).toEqual({ avg: 500, n: 1 })
  expect(t.bestBlock.key).toBe('9') // Wed + Thu mornings average 253
  expect(formatStats(posts).map((f) => f.label)).toEqual(['Post', 'Reel'])
})

test('combined heatmap weighs each post against its own account', () => {
  const at = '2026-11-16T13:00:00Z'
  const rel = relativePosts([
    { key: 'big', label: 'Big', posts: [{ at, likes: 1000 }, { at, likes: 3000 }] },
    { key: 'small', label: 'Small', posts: [{ at, likes: 10 }, { at, likes: 30 }] },
  ])
  expect(rel.map((p) => p.rel)).toEqual([0.5, 1.5, 0.5, 1.5])
  expect(relativePosts([{ key: 'none', label: 'None', posts: [{ at, likes: 0 }] }])).toEqual([])
})

test('instagram tab opens on the combined heatmap when two accounts load', async () => {
  const posts = (n, base) => Array.from({ length: n }, (_, i) => ({ id: `${base}${i}`, type: i % 2 ? 'REEL' : 'IMAGE', permalink: 'https://instagram.com/p/x', at: `2026-11-${10 + i}T13:00:00Z`, likes: base + i, comments: 1 }))
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ accounts: [
    { account: 'tabletap', username: 'table_tap.in', followers: 1200, posts: posts(6, 100) },
    { account: 'sanero', username: 'saneromedia', followers: 300, posts: posts(5, 10) },
  ] }) }))
  render(<MarketingView data={data} go={go} tab="instagram" />)
  expect(await screen.findByText(/all accounts · 11 posts/)).toBeTruthy()
  expect(screen.getByText('vs account average')).toBeTruthy()
  fireEvent.click(screen.getByText('Table Tap'))
  expect(await screen.findByText('@table_tap.in')).toBeTruthy()
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) }))
})

test('follower series keeps the window and reports the change', () => {
  const day = (n) => new Date(Date.now() + 5.5 * 3600e3 - n * 86400e3).toISOString().slice(0, 10)
  const s = followerSeries({ [day(100)]: 800, [day(20)]: 1000, [day(10)]: 1040, [day(0)]: 1100 }, 30)
  expect(s.points.map((p) => p.n)).toEqual([1000, 1040, 1100])
  expect(s.change).toBe(100)
  expect(followerSeries({ [day(0)]: 5 }, 30).change).toBe(null)
})

test('plans link to the published post they became', () => {
  const post = (id, brandKey, publishedAt, title) => ({ id, brandKey, state: 'published', publishedAt, title, caption: '' })
  const posts = [
    post('a', 'sanero', '2026-11-13T12:00:00Z', 'Five creator contracts every D2C brand needs'),
    post('b', 'tabletap', '2026-11-13T12:00:00Z', 'Sold out dilemma'),
    post('c', 'sanero', '2026-11-14T12:00:00Z', 'Something unrelated entirely'),
  ]
  const plan = { brand: 'sanero', date: '2026-11-13', title: 'creator contracts', caption: '' }
  expect(matchPlan(plan, posts, new Set())?.id).toBe('a')
  expect(matchPlan(plan, posts, new Set(['a']))).toBe(null) // a day off needs similar captions
  expect(matchPlan({ ...plan, date: '2026-11-12' }, posts, new Set())?.id).toBe('a')
  expect(plansFrom({ 'plan-1': { kind: 'plan', date: '2026-12-01' }, 'plan-0': { kind: 'plan', date: '2026-11-01' }, 'lead-1': { kind: 'lead' } }).map((p) => p.id)).toEqual(['plan-0', 'plan-1'])
})

test('calendar shows a plan and marks it posted', () => {
  const d = { ...data, docs: { ...data.docs, 'plan-x': { kind: 'plan', brand: 'sanero', date: new Date().toISOString().slice(0, 10), title: 'Contracts carousel', caption: 'draft', postId: 'media_posts-1' } } }
  render(<MarketingView data={d} go={go} tab="calendar" />)
  expect(screen.getAllByText(/Contracts carousel/).length).toBeGreaterThan(0)
  expect(screen.getByText('Posted as planned')).toBeTruthy()
})

test('jobs are tagged on the server and listed SDE-at-multinationals first', () => {
  const { clean } = require('../../api/admin/_routes/jobs')
  const [google, support, phonepe, confluent] = FEED.map(clean)
  expect([google.sde, google.mnc, google.stack]).toEqual([true, true, ['C++', 'Go']])
  expect(support.sde).toBe(false)
  expect([phonepe.sde, phonepe.mnc, phonepe.url]).toEqual([true, false, null])
  expect([confluent.minYears, confluent.maxYears]).toEqual([6, null])
  // The morning message: roles asking up to a year more than the owner's 2, and not capped below it.
  const { fits, emailHtml } = require('../../api/admin/_routes/jobs')
  expect([{ minYears: null, maxYears: null }, { minYears: 3, maxYears: null }, { minYears: 4, maxYears: 8 }, { minYears: 0, maxYears: 1 }].map(fits)).toEqual([true, true, false, false])
  expect(emailHtml([{ ...google, title: 'SDE <II>' }])).toContain('SDE &lt;II&gt;')
  render(<JobsView />)
  expect(screen.getByText('Staff Software Engineer, Search Evals')).toBeTruthy()
  expect(screen.getByText('Software Developer - Confluent')).toBeTruthy()
  expect(screen.getByText('6+ yrs')).toBeTruthy()
  expect(screen.queryByText('Support Escalation Engineer - CSP')).toBeNull()
  expect(screen.queryByText('Software Engineer, Backend (3-5 years)')).toBeNull()
  fireEvent.click(screen.getByText('All openings'))
  expect(screen.getByText('Support Escalation Engineer - CSP')).toBeTruthy()
  fireEvent.click(screen.getByText('Software Developer - Confluent'))
  expect(screen.getByDisplayValue('Referral from Riya')).toBeTruthy()
  expect(screen.getByText('Apply on Confluent')).toBeTruthy()
})
