import { render } from '@testing-library/react'
import projectsJson from './projects.json'
import OverviewView from './OverviewView'
import ProjectsView from './ProjectsView'
import AlertsView from './AlertsView'
import AppsView from './AppsView'
import InfraView from './InfraView'
import MoneyView from './MoneyView'
import ProjectView from './ProjectView'
import SettingsView from './SettingsView'

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

test.each([
  ['overview', <OverviewView data={data} go={go} />],
  ['projects', <ProjectsView data={data} go={go} />],
  ['alerts', <AlertsView data={data} go={go} />],
  ['apps', <AppsView data={data} go={go} />],
  ['money', <MoneyView data={data} go={go} />],
  ['settings', <SettingsView data={data} install={null} />],
  ...['uptime', 'renewals', 'cloud', 'data', 'laptop'].map((t) => [`infra ${t}`, <InfraView data={data} go={go} tab={t} />]),
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
