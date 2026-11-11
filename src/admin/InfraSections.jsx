// Infrastructure pieces used on the Infrastructure page and on project
// pages: payments (Razorpay), Supabase databases, laptop services.
import { Battery, Cpu, ExternalLink, HardDrive, Laptop } from 'lucide-react'
import { laptopStatus } from './alerts'
import { money, moneyShort, monthLabel, saveDoc, timeAgo } from './data'
import { Badge, BarChart, ConnectHint, Empty, Section, cx } from './ui'

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
      {!laptop ? <ConnectHint>The laptop agent hasn’t reported yet — run scripts/setup-alerts.sh (Settings → Alerts).</ConnectHint> : (
        <ul className="divide-y divide-white/[0.05]">{mine.map((s) => <ServiceRow key={s.unit} s={s} />)}</ul>
      )}
    </Section>
  )
}

export function LaptopPanel({ data, go }) {
  const l = laptopStatus(data.docs)
  if (!l) {
    return (
      <Section title="Laptop">
        <ConnectHint go={go}>The laptop agent hasn’t reported yet. Run <code>bash scripts/setup-alerts.sh</code> once in the Portfolio repo — see Settings.</ConnectHint>
      </Section>
    )
  }
  const byProject = {}
  for (const s of l.services || []) (byProject[s.project || 'other'] ||= []).push(s)
  const names = Object.fromEntries(data.projects.map((p) => [p.slug, p]))
  const memUsed = l.memory?.total ? 1 - l.memory.available / l.memory.total : null
  const diskUsed = l.disk?.total ? 1 - l.disk.free / l.disk.total : null
  const bad = (l.services || []).filter((s) => !s.ok && !s.missing).length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Laptop, label: l.host, value: l.online ? 'Online' : 'Offline', sub: `checked ${timeAgo(l.at)}`, tone: l.online ? 'text-emerald-300' : 'text-amber-300' },
          { icon: Cpu, label: 'Memory', value: memUsed === null ? '—' : `${Math.round(memUsed * 100)}%`, sub: `load ${l.load?.[0] ?? '—'} · up ${Math.round((l.uptimeSec || 0) / 3600)}h` },
          { icon: HardDrive, label: 'Disk', value: diskUsed === null ? '—' : `${Math.round(diskUsed * 100)}%`, sub: `${gb(l.disk?.free)} free`, tone: diskUsed > 0.9 ? 'text-red-300' : 'text-zinc-50' },
          { icon: Battery, label: 'Battery', value: l.battery ? `${l.battery.percent}%` : '—', sub: l.battery?.status || 'no battery' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-zinc-500"><span className="truncate">{c.label}</span><c.icon size={14} className="text-zinc-600" /></div>
            <div className={cx('mt-2 text-2xl font-semibold tabular-nums', c.tone || 'text-zinc-50')}>{c.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{c.sub}</div>
          </div>
        ))}
      </div>
      <Section title={`Services · ${bad ? `${bad} failing` : 'all running'}`} action={<Badge tone={l.docker?.ok ? 'zinc' : 'red'}>docker {l.docker?.state}</Badge>}>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {Object.entries(byProject).map(([slug, list]) => (
            <div key={slug}>
              <button onClick={() => names[slug] && go(`/p/${slug}`)} className="mb-1 text-xs text-zinc-500 hover:text-white">{names[slug]?.name || 'Other failed units'}</button>
              <ul className="divide-y divide-white/[0.05]">{list.map((s) => <ServiceRow key={s.unit} s={s} />)}</ul>
            </div>
          ))}
        </div>
        {!l.online && <p className="mt-3 text-xs text-amber-300/80">The laptop hasn’t checked in for {Math.round(l.ageMs / 60e3)} minutes — these states are from then.</p>}
      </Section>
    </div>
  )
}
