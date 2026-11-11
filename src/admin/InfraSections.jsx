// Infrastructure pieces used on the Infrastructure page and on project
// pages: payments (Razorpay), Supabase databases, laptop services.
import { useState } from 'react'
import { Battery, Cpu, ExternalLink, HardDrive, Laptop } from 'lucide-react'
import { laptopHistory, laptopStatus } from './alerts'
import { money, moneyShort, monthLabel, saveDoc, timeAgo } from './data'
import { Badge, BarChart, ConnectHint, Empty, LineChart, Section, cx } from './ui'

const gb = (b) => (b === null || b === undefined ? '—' : b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`)

// ── payments ───────────────────────────────────────────

export function PaymentsSection({ p, payments, go }) {
  if (!(p.payments || []).length) return null
  const mine = (payments.data?.sources || []).filter((s) => p.payments.includes(s.source))
  const toggle = () => saveDoc(p.id, { kind: 'project', paymentsIncome: !p.paymentsIncome })
  return (
    <Section
      title="Payments · Razorpay"
      action={
        <button onClick={toggle} className="text-[11px] text-zinc-500 hover:text-zinc-200" title="Whether these takings are your income or the client's">
          {p.paymentsIncome ? 'Counts as your revenue ✓' : 'Client’s money — not your revenue'}
        </button>
      }
    >
      {payments.error ? <Empty>{payments.error}</Empty> : !payments.data ? <div className="text-sm text-zinc-500">Loading payments…</div> : mine.map((s) => (
        s.error ? <ConnectHint key={s.source} go={s.notConfigured ? go : null}>{s.error}.</ConnectHint> : (
          <div key={s.source}>
            <div className="mb-3 grid grid-cols-3 gap-3">
              <div><div className="text-xl font-semibold tabular-nums text-zinc-50">{moneyShort(s.months.at(-1).gross)}</div><div className="text-[11px] text-zinc-500">collected this month</div></div>
              <div><div className="text-xl font-semibold tabular-nums text-zinc-200">{moneyShort(s.months.at(-1).net)}</div><div className="text-[11px] text-zinc-500">after fees & refunds</div></div>
              <div><div className="text-xl font-semibold tabular-nums text-zinc-200">{s.months.at(-1).count}</div><div className="text-[11px] text-zinc-500">payments</div></div>
            </div>
            <BarChart data={s.months.map((m) => ({ label: monthLabel(m.month), value: m.gross }))} format={money} height={80} />
            <div className="mt-2 text-xs text-zinc-500">
              {s.last ? `Last payment ${money(s.last.amount)} via ${s.last.method} · ${timeAgo(s.last.at)}` : 'No payments in 6 months'}
              {s.truncated && ' · showing the first 5,000 payments'}
            </div>
          </div>
        )
      ))}
    </Section>
  )
}

// ── Supabase ───────────────────────────────────────────

function Meter({ label, used, total }) {
  const p = used !== null && used !== undefined && total ? Math.min(100, (used / total) * 100) : null
  return (
    <div>
      <div className="flex justify-between text-[11px] text-zinc-500"><span>{label}</span><span className="tabular-nums">{gb(used)} / {gb(total)}</span></div>
      <div className="mt-1 h-1.5 rounded-full bg-white/[0.06]">
        {p !== null && <div className={cx('h-1.5 rounded-full', p > 90 ? 'bg-red-400' : p > 70 ? 'bg-amber-400' : 'bg-white/50')} style={{ width: `${Math.max(2, p)}%` }} />}
      </div>
    </div>
  )
}

const SB_TONE = { ACTIVE_HEALTHY: ['green', 'healthy'], ACTIVE_UNHEALTHY: ['red', 'unhealthy'], INACTIVE: ['red', 'paused'], PAUSED: ['red', 'paused'], COMING_UP: ['sky', 'starting'], RESTORING: ['sky', 'restoring'] }

export function SupabaseCard({ s, project }) {
  if (s.error) {
    return <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm"><div className="font-mono text-xs text-zinc-500">{s.ref}</div><div className="mt-1 text-zinc-400">{s.error}</div></div>
  }
  const [tone, label] = SB_TONE[s.status] || ['zinc', s.status?.toLowerCase()]
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-100">{s.name}</div>
          <div className="text-xs text-zinc-500">{project ? `${project.name} · ` : ''}{s.region}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{label}</Badge>
          <a href={s.dashboard} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white" aria-label="Open in Supabase"><ExternalLink size={13} /></a>
        </div>
      </div>
      {(s.health || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.health.map((h) => <Badge key={h.name} tone={h.healthy ? 'zinc' : 'red'}>{h.name}{h.healthy ? '' : ' ✕'}</Badge>)}
        </div>
      )}
      <div className="mt-3 space-y-2">
        <Meter label="Database" used={s.dbBytes} total={s.free.dbBytes} />
        <Meter label="Storage" used={s.storageBytes} total={s.free.storageBytes} />
      </div>
      {s.requests24h !== null && s.requests24h !== undefined && <div className="mt-2 text-[11px] text-zinc-500">{s.requests24h.toLocaleString('en-IN')} API requests in the last day</div>}
      {(s.status === 'INACTIVE' || s.status === 'PAUSED') && <div className="mt-2 text-xs text-red-300">Free projects pause after a week without traffic — open Supabase and press Restore.</div>}
    </div>
  )
}

export function ProjectDatabases({ p, supabase, go }) {
  if (!(p.supabase || []).length) return null
  const mine = (supabase.data?.projects || []).filter((s) => p.supabase.includes(s.spec))
  const missing = mine.find((s) => s.notConfigured)
  return (
    <Section title="Supabase">
      {supabase.error ? <Empty>{supabase.error}</Empty> : !supabase.data ? <div className="text-sm text-zinc-500">Loading…</div>
        : missing ? <ConnectHint go={go}>Connect Supabase to see database health and size.</ConnectHint> : (
          <div className="grid gap-3 sm:grid-cols-2">{mine.map((s) => <SupabaseCard key={s.spec} s={s} />)}</div>
        )}
    </Section>
  )
}

// ── laptop ─────────────────────────────────────────────

function ServiceRow({ s }) {
  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', s.ok ? 'bg-emerald-400' : s.missing ? 'bg-zinc-600' : 'bg-red-500')} />
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-200" title={s.description}>{s.unit}</span>
      <span className={cx('shrink-0 text-xs', s.ok ? 'text-zinc-500' : 'text-red-300')}>{s.missing ? 'not installed' : `${s.state}${s.sub && s.sub !== s.state ? ` · ${s.sub}` : ''}${!s.ok && s.result && s.result !== 'success' ? ` · ${s.result}` : ''}`}</span>
    </li>
  )
}

export function ProjectServices({ p, docs }) {
  if (!(p.services || []).length) return null
  const laptop = laptopStatus(docs)
  const mine = (laptop?.services || []).filter((s) => s.project === p.slug)
  return (
    <Section title="Runs on the laptop" action={laptop && <span className={cx('text-[11px]', laptop.online ? 'text-zinc-500' : 'text-amber-300')}>{laptop.online ? `checked ${timeAgo(laptop.at)}` : `offline · last seen ${timeAgo(laptop.at)}`}</span>}>
      {!laptop ? <ConnectHint>The laptop hasn’t reported yet — run scripts/setup.sh once.</ConnectHint> : (
        <ul className="divide-y divide-white/[0.05]">{mine.map((s) => <ServiceRow key={s.unit} s={s} />)}</ul>
      )}
    </Section>
  )
}

const RANGES = { '24h': 24, '7d': 168 }

// Hour (24h) or 4-hour (7d) buckets showing when the laptop was reporting.
function OnlineStrip({ points, from, to, hours }) {
  const step = (hours > 24 ? 4 : 1) * 3600e3
  const buckets = []
  for (let t = from; t < to; t += step) buckets.push({ t, n: 0 })
  for (const p of points) {
    const i = Math.floor((p.t - from) / step)
    if (buckets[i]) buckets[i].n += 1
  }
  const expected = step / (2 * 60e3)
  const onShare = buckets.filter((b) => b.n > 0).length / Math.max(1, buckets.length)
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span className="text-zinc-500">Laptop on & reporting</span><span className="tabular-nums text-zinc-300">{Math.round(onShare * 100)}% of the time</span></div>
      <div className="flex h-6 gap-[2px]">
        {buckets.map((b) => (
          <div
            key={b.t}
            title={`${new Date(b.t).toLocaleString('en-IN', { weekday: 'short', hour: 'numeric' })}: ${b.n ? `${Math.round(Math.min(1, b.n / expected) * 100)}% reported` : 'off'}`}
            className={cx('flex-1 rounded-sm', b.n === 0 ? 'bg-white/[0.04]' : b.n / expected > 0.6 ? 'bg-emerald-400/70' : 'bg-emerald-400/30')}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
        <span>{new Date(from).toLocaleString('en-IN', hours > 24 ? { weekday: 'short' } : { hour: 'numeric' })}</span><span>now</span>
      </div>
    </div>
  )
}

function ServiceRowFull({ s, uptime }) {
  return (
    <li className="py-2 text-sm">
      <div className="flex items-center gap-3">
        <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', s.ok ? 'bg-emerald-400' : s.missing ? 'bg-zinc-600' : 'bg-red-500')} />
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-200" title={s.description}>{s.unit}</span>
        {uptime !== null && uptime !== undefined && <span className={cx('shrink-0 text-[11px] tabular-nums', uptime < 95 ? 'text-amber-300' : 'text-zinc-500')}>{uptime}% ok</span>}
        <span className={cx('w-28 shrink-0 truncate text-right text-xs', s.ok ? 'text-zinc-500' : 'text-red-300')}>{s.missing ? 'not installed' : `${s.state}${!s.ok && s.result && s.result !== 'success' ? ` · ${s.result}` : ''}`}</span>
      </div>
      {!s.ok && (s.log || []).length > 0 && (
        <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-black/40 px-2.5 py-1.5 font-mono text-[10.5px] leading-relaxed text-zinc-400">{s.log.join('\n')}</pre>
      )}
    </li>
  )
}

export function LaptopPanel({ data, go }) {
  const [range, setRange] = useState('24h')
  const l = laptopStatus(data.docs)
  if (!l) {
    return (
      <Section title="Laptop">
        <ConnectHint>The laptop hasn’t reported yet. Run <code>bash ~/Development/Projects/Portfolio/scripts/setup.sh</code> once — after that it reports every 2 minutes whenever the laptop is on.</ConnectHint>
      </Section>
    )
  }
  const hours = RANGES[range]
  const to = Date.now()
  const from = to - hours * 3600e3
  const hist = laptopHistory(data.docs, hours)
  const series = (k) => hist.map((p) => ({ t: p.t, v: p[k] }))
  const uptime = {}
  if (hist.length) for (const s of l.services || []) uptime[s.unit] = Math.round((hist.filter((p) => !(p.x || []).includes(s.unit)).length / hist.length) * 100)

  const byProject = {}
  for (const s of l.services || []) (byProject[s.project || 'other'] ||= []).push(s)
  const names = Object.fromEntries(data.projects.map((p) => [p.slug, p]))
  const memUsed = l.memory?.total ? 1 - l.memory.available / l.memory.total : null
  const diskUsed = l.disk?.total ? 1 - l.disk.free / l.disk.total : null
  const bad = (l.services || []).filter((s) => !s.ok && !s.missing).length
  const containers = l.docker?.containers || []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Laptop, label: l.host, value: l.online ? 'Online' : 'Offline', sub: `${l.online ? 'reported' : 'last seen'} ${timeAgo(l.at)}${l.network?.ssid ? ` · ${l.network.ssid}` : ''}`, tone: l.online ? 'text-emerald-300' : 'text-amber-300' },
          { icon: Cpu, label: `CPU · ${l.cpus || '?'} cores`, value: l.load?.[0] !== undefined && l.cpus ? `${Math.round((l.load[0] / l.cpus) * 100)}%` : '—', sub: `memory ${memUsed === null ? '—' : `${Math.round(memUsed * 100)}%`} · up ${Math.round((l.uptimeSec || 0) / 3600)}h` },
          { icon: HardDrive, label: 'Disk', value: diskUsed === null ? '—' : `${Math.round(diskUsed * 100)}%`, sub: `${gb(l.disk?.free)} free`, tone: diskUsed > 0.9 ? 'text-red-300' : 'text-zinc-50' },
          { icon: Battery, label: 'Battery', value: l.battery ? `${l.battery.percent}%` : '—', sub: l.battery?.status || 'no battery' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-zinc-500"><span className="truncate">{c.label}</span><c.icon size={14} className="text-zinc-600" /></div>
            <div className={cx('mt-2 text-2xl font-semibold tabular-nums', c.tone || 'text-zinc-50')}>{c.value}</div>
            <div className="mt-1 truncate text-xs text-zinc-500">{c.sub}</div>
          </div>
        ))}
      </div>

      <Section
        title="History"
        action={(
          <div className="flex gap-1 rounded-lg border border-white/[0.08] p-0.5">
            {Object.keys(RANGES).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={cx('rounded-md px-2 py-0.5 text-xs', range === r ? 'bg-white/[0.1] text-white' : 'text-zinc-500 hover:text-zinc-200')}>{r}</button>
            ))}
          </div>
        )}
      >
        {hist.length === 0 ? <Empty>History starts building from the first report.</Empty> : (
          <div className="space-y-5">
            <OnlineStrip points={hist} from={from} to={to} hours={hours} />
            <div className="grid gap-5 md:grid-cols-2">
              <LineChart label="CPU load (per core)" points={series('l')} from={from} to={to} max={Math.max(1, ...hist.map((p) => p.l || 0))} format={(v) => `${Math.round(v * 100)}%`} />
              <LineChart label="Memory used" points={series('m')} from={from} to={to} />
              <LineChart label="Disk used" points={series('d')} from={from} to={to} />
              {hist.some((p) => p.b !== null && p.b !== undefined) && <LineChart label="Battery" points={series('b')} from={from} to={to} />}
            </div>
          </div>
        )}
      </Section>

      <Section title={`Services · ${bad ? `${bad} failing` : 'all running'}`} action={<span className="text-[11px] text-zinc-600">% ok over {range}</span>}>
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
          {Object.entries(byProject).map(([slug, list]) => (
            <div key={slug}>
              <button onClick={() => names[slug] && go(`/p/${slug}`)} className="mb-1 text-xs text-zinc-500 hover:text-white">{names[slug]?.name || 'Other failed units'}</button>
              <ul className="divide-y divide-white/[0.05]">{list.map((s) => <ServiceRowFull key={s.unit} s={s} uptime={uptime[s.unit]} />)}</ul>
            </div>
          ))}
        </div>
        {!l.online && <p className="mt-3 text-xs text-amber-300/80">The laptop hasn’t reported for {Math.round(l.ageMs / 60e3)} minutes — these states are from then.</p>}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title={`Docker · ${containers.filter((c) => c.running).length}/${containers.length} running`} action={<Badge tone={l.docker?.ok ? 'zinc' : 'red'}>{l.docker?.state}</Badge>}>
          {containers.length === 0 ? <Empty>No containers.</Empty> : (
            <ul className="divide-y divide-white/[0.05]">
              {containers.map((c) => (
                <li key={c.name} className="flex items-center gap-3 py-2 text-sm">
                  <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', c.running ? 'bg-emerald-400' : 'bg-zinc-600')} />
                  <span className="min-w-0 flex-1 truncate text-zinc-200">{c.name}</span>
                  <span className="hidden truncate text-xs text-zinc-600 sm:block">{c.image}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Busiest right now">
          {(l.processes || []).length === 0 ? <Empty>—</Empty> : (
            <ul className="space-y-2">
              {l.processes.map((p, i) => (
                <li key={`${p.name}-${i}`} className="text-xs">
                  <div className="flex justify-between gap-2"><span className="truncate text-zinc-300">{p.name}</span><span className="tabular-nums text-zinc-500">{p.cpu}% CPU · {p.mem}% mem</span></div>
                  <div className="mt-0.5 h-1 rounded-full bg-white/[0.05]"><div className="h-1 rounded-full bg-white/40" style={{ width: `${Math.min(100, p.cpu / (l.cpus || 1))}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}
