// Infrastructure, one page with tabs: uptime, renewals, cloud bills,
// databases, the laptop.
import { CloudCosts, FirestoreUsage } from './IntegrationSections'
import { LaptopPanel, SupabaseCard } from './InfraSections'
import RenewalsView from './RenewalsView'
import SitesView from './SitesView'
import { ConnectHint, Empty, Section, cx } from './ui'

export const INFRA_TABS = [
  { key: 'uptime', label: 'Uptime' },
  { key: 'renewals', label: 'Renewals' },
  { key: 'cloud', label: 'Cloud bills' },
  { key: 'data', label: 'Databases' },
  { key: 'laptop', label: 'Laptop' },
]

function Databases({ data, go }) {
  const owner = {}
  for (const p of data.projects) for (const s of p.supabase || []) owner[s] = p
  const firebaseIds = [...new Set(data.projects.flatMap((p) => p.firebase || []))]
  const sb = data.supabase
  return (
    <div className="space-y-5">
      <Section title="Supabase">
        {!Object.keys(owner).length ? <Empty>No Supabase projects linked.</Empty>
          : sb.error ? <Empty>{sb.error}</Empty> : !sb.data ? <div className="text-sm text-zinc-500">Loading…</div>
            : sb.data.projects.some((s) => s.notConfigured) ? <ConnectHint go={go}>Add a Supabase access token to see health, size and pauses.</ConnectHint> : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sb.data.projects.map((s) => <SupabaseCard key={s.spec} s={s} project={owner[s.spec]} />)}</div>
            )}
      </Section>
      <Section title="Firestore · reads and writes per day">
        <FirestoreUsage ids={firebaseIds} />
      </Section>
    </div>
  )
}

export default function InfraView({ data, go, tab }) {
  const current = INFRA_TABS.some((t) => t.key === tab) ? tab : 'uptime'
  const cloudSources = [...new Set(data.projects.flatMap((p) => p.cloud || []))]
  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl">
        {INFRA_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => go(`/infra/${t.key}`)}
            className={cx('shrink-0 rounded-lg px-3.5 py-1.5 text-sm transition', current === t.key ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-zinc-400 hover:text-zinc-100')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {current === 'uptime' && <SitesView data={data} />}
      {current === 'renewals' && <RenewalsView data={data} go={go} />}
      {current === 'cloud' && (cloudSources.length ? <CloudCosts sources={cloudSources} go={go} /> : <Empty>No cloud accounts linked.</Empty>)}
      {current === 'data' && <Databases data={data} go={go} />}
      {current === 'laptop' && <LaptopPanel data={data} go={go} />}
    </div>
  )
}
