// Mobile apps across projects: store listing, rating, downloads, version,
// and (with Play Console access) crash / ANR rates.
import { ExternalLink, Smartphone, Star } from 'lucide-react'
import { Badge, ConnectHint, Empty, Section, StatusDot, cx } from './ui'

const PLATFORM = { android: 'Google Play', ios: 'App Store' }
const pct = (v) => (v === null || v === undefined ? '—' : `${(v * 100).toFixed(2)}%`)

export function AppCard({ a, project, go }) {
  if (a.error) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm">
        <div className="text-xs text-zinc-500">{PLATFORM[a.platform]} · {a.id}</div>
        <div className="mt-1 text-zinc-400">{a.error}</div>
      </div>
    )
  }
  if (!a.published) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-xs text-zinc-400">{a.id}</span>
          <Badge>not published</Badge>
        </div>
        <div className="mt-1 text-xs text-zinc-600">{PLATFORM[a.platform]}{project ? ` · ${project.name}` : ''}</div>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start gap-3">
        {a.icon ? <img src={a.icon} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-white/10" loading="lazy" referrerPolicy="no-referrer" />
          : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"><Smartphone size={18} className="text-zinc-500" /></div>}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-zinc-100">{a.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
            <span>{PLATFORM[a.platform]}</span>
            {project && go && <button onClick={() => go(`/p/${project.slug}`)} className="inline-flex items-center gap-1 hover:text-white"><StatusDot status={project.status} /> {project.name}</button>}
          </div>
        </div>
        <a href={a.url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white" aria-label="Open store page"><ExternalLink size={14} /></a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/[0.03] py-2">
          <div className={cx('flex items-center justify-center gap-1 text-lg font-semibold tabular-nums', a.rating && a.rating < 4 ? 'text-amber-300' : 'text-zinc-50')}>
            {a.rating ? a.rating.toFixed(1) : '—'} <Star size={13} className="fill-current opacity-70" />
          </div>
          <div className="text-[10px] text-zinc-500">{a.reviews} reviews</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] py-2">
          <div className="text-lg font-semibold tabular-nums text-zinc-50">{a.downloads || (a.version ? `v${a.version}` : '—')}</div>
          <div className="text-[10px] text-zinc-500">{a.downloads ? 'downloads' : 'version'}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] py-2">
          <div className="text-sm font-medium tabular-nums text-zinc-200">{a.updated || '—'}</div>
          <div className="text-[10px] text-zinc-500">last update</div>
        </div>
      </div>
      {a.platform === 'android' && a.vitals && (
        <div className="mt-3 text-xs text-zinc-500">
          {a.vitals.error ? a.vitals.error : (
            <span>Crash rate <b className={cx('font-medium', a.vitals.crashRate > 0.0109 ? 'text-red-300' : 'text-zinc-300')}>{pct(a.vitals.crashRate)}</b> · ANR <b className={cx('font-medium', a.vitals.anrRate > 0.0047 ? 'text-red-300' : 'text-zinc-300')}>{pct(a.vitals.anrRate)}</b> <span className="text-zinc-600">(7 days)</span></span>
          )}
        </div>
      )}
    </div>
  )
}

export function ProjectApps({ p, apps }) {
  if (!(p.apps || []).length) return null
  const mine = (apps.data?.apps || []).filter((a) => p.apps.includes(a.spec))
  return (
    <Section title="Mobile apps">
      {apps.error ? <Empty>{apps.error}</Empty> : !apps.data ? <div className="text-sm text-zinc-500">Loading store listings…</div> : (
        <div className="grid gap-3 sm:grid-cols-2">{mine.map((a) => <AppCard key={a.spec} a={a} />)}</div>
      )}
    </Section>
  )
}

export default function AppsView({ data, go }) {
  const owner = {}
  for (const p of data.projects) for (const s of p.apps || []) owner[s] = p
  const all = data.apps.data?.apps || []
  const live = all.filter((a) => a.published)
  const draft = all.filter((a) => !a.published)

  return (
    <div className="space-y-5">
      {!Object.keys(owner).length ? (
        <ConnectHint>No apps yet — add store IDs under Edit on a project (play:com.example.app, ios:com.example.app).</ConnectHint>
      ) : data.apps.error ? <Empty>{data.apps.error}</Empty> : !data.apps.data ? <div className="text-sm text-zinc-500">Loading store listings…</div> : (
        <>
          <Section title={`Live in stores · ${live.length}`}>
            {live.length === 0 ? <Empty>Nothing published yet.</Empty> : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{live.map((a) => <AppCard key={a.spec} a={a} project={owner[a.spec]} go={go} />)}</div>
            )}
          </Section>
          {draft.length > 0 && (
            <Section title={`Not published · ${draft.length}`}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{draft.map((a) => <AppCard key={a.spec} a={a} project={owner[a.spec]} go={go} />)}</div>
            </Section>
          )}
          <p className="text-xs text-zinc-600">Ratings and downloads come from the public store pages (refreshed hourly). Crash and ANR rates need the dashboard’s service account added in Play Console — see Settings.</p>
        </>
      )}
    </div>
  )
}
