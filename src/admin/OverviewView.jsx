import { Activity, AlertTriangle, ArrowRight, Briefcase, IndianRupee, Repeat, TrendingUp, Users, Wallet } from 'lucide-react'
import {
  STATUSES, invoiceState, lastMonths, money, moneyShort, monthLabel, projectStats, revenueByMonth, revenueIn, timeAgo,
} from './data'
import { Badge, BarChart, Empty, Glass, Section, ShareBars, Sparkline, Stat, StatusDot, cx } from './ui'
import { GoalCard } from './MoneyView'
import { SEVERITY, computeAlerts } from './alerts'
import { trafficFor } from './IntegrationSections'

export function ProjectTile({ p, checks, go, traffic }) {
  const s = projectStats(p, checks)
  const t = trafficFor(p, traffic)
  const lastDeploy = p.vercelProjects.map((v) => v.production?.createdAt).filter(Boolean).sort((a, b) => b - a)[0]
  const lastUpdate = [...(p.updates || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
  return (
    <Glass
      as="button"
      onClick={() => go(`/p/${p.slug}`)}
      className={cx('group p-4 text-left transition hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.06]', p.status === 'decommissioned' && 'opacity-60')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot status={p.status} />
          <span className="truncate font-medium text-zinc-100">{p.name}</span>
        </div>
        <span className={cx('shrink-0 text-[11px]', STATUSES[p.status]?.text)}>{STATUSES[p.status]?.label}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 min-h-[2.5em] text-xs text-zinc-500">{p.summary || p.category}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-xs">
        <div>
          <div className="tabular-nums text-zinc-200">{moneyShort(s.monthRevenue)}</div>
          <div className="text-zinc-600">this month</div>
        </div>
        <div>
          <div className="tabular-nums text-zinc-200">{s.activeClients}</div>
          <div className="text-zinc-600">clients</div>
        </div>
        <div>
          <div className={cx('tabular-nums', s.down ? 'text-red-400' : 'text-zinc-200')}>{s.hostsChecked ? `${s.hostsUp}/${s.hostsChecked}` : '—'}</div>
          <div className="text-zinc-600">sites up</div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="min-w-0 flex-1 truncate">{lastUpdate ? `${lastUpdate.date} · ${lastUpdate.text}` : lastDeploy ? `Deployed ${timeAgo(lastDeploy)}` : p.category}</span>
        {t.tracked && <span className="flex shrink-0 items-center gap-1.5 tabular-nums"><Sparkline values={t.daily} width={44} height={14} /> {t.total}</span>}
      </div>
    </Glass>
  )
}

export default function OverviewView({ data, go }) {
  const { projects, checks } = data
  const months = lastMonths(12)
  const stats = projects.map((p) => ({ p, s: projectStats(p, checks) }))
  const sum = (k) => stats.reduce((t, x) => t + x.s[k], 0)

  const monthly = revenueByMonth(projects, months)
  const yearTotal = monthly.reduce((t, m) => t + m.amount, 0)
  const cur = monthly.at(-1)
  const prev = monthly.at(-2)?.amount || 0
  const delta = prev ? Math.round(((cur.amount - prev) / prev) * 100) : null
  const owed = stats.reduce((t, x) => t + x.s.owed.amount, 0)
  const overdue = projects.flatMap((p) => (p.invoices || []).filter((i) => invoiceState(i) === 'overdue')).length

  const running = projects.filter((p) => ['live', 'building', 'maintenance'].includes(p.status)).length
  const alerts = computeAlerts(data)
  const critical = alerts.filter((a) => a.severity === 'critical').length

  const byProject = projects
    .map((p) => ({ key: p.slug, label: p.name, value: months.reduce((t, m) => t + revenueIn(p, m), 0), onClick: () => go(`/p/${p.slug}`) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)

  const activity = [
    ...projects.flatMap((p) => (p.updates || []).map((u) => ({ key: `${p.slug}-${u.id}`, at: new Date(u.date).getTime(), project: p, text: u.text, kind: 'update' }))),
    ...projects.flatMap((p) => p.vercelProjects.filter((v) => v.production).map((v) => ({ key: `${p.slug}-${v.production.id}`, at: v.production.createdAt, project: p, text: v.production.commit || `Deployed ${v.name}`, kind: 'deploy', state: v.production.state }))),
  ].filter((a) => a.at).sort((a, b) => b.at - a.at).slice(0, 10)

  const live = stats.filter(({ p }) => p.status === 'live').sort((a, b) => b.s.monthRevenue - a.s.monthRevenue || a.p.name.localeCompare(b.p.name))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="This month" value={moneyShort(cur.amount)} sub={delta === null ? monthLabel(months[11]) : `${delta >= 0 ? '+' : ''}${delta}% vs last month`} icon={IndianRupee} />
        <Stat label="Profit this month" value={moneyShort(cur.profit)} tone={cur.profit < 0 ? 'text-red-400' : 'text-zinc-50'} sub={`${moneyShort(cur.cost)} costs`} icon={TrendingUp} />
        <Stat label="Owed to you" value={moneyShort(owed)} tone={overdue ? 'text-amber-300' : 'text-zinc-50'} sub={overdue ? `${overdue} overdue` : 'unpaid invoices'} icon={Wallet} />
        <Stat label="Monthly recurring" value={moneyShort(sum('mrr'))} sub={`${moneyShort(yearTotal)} last 12 months`} icon={Repeat} />
        <Stat label="Active clients" value={sum('activeClients')} sub={`${sum('totalClients')} all time`} icon={Users} />
        <Stat label="Projects running" value={`${running}/${projects.length}`} sub={`${projects.filter((p) => p.status === 'decommissioned').length} decommissioned`} icon={Briefcase} />
        <Stat label="Critical alerts" value={critical} tone={critical ? 'text-red-400' : 'text-emerald-300'} sub={`${alerts.length - critical} other open`} icon={critical ? AlertTriangle : Activity} />
        <Stat label="Sites down" value={sum('down')} tone={sum('down') ? 'text-red-400' : 'text-emerald-300'} sub={data.lastChecked ? `checked ${timeAgo(data.lastChecked)}` : 'checking…'} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GoalCard settings={data.settings} thisMonth={cur.amount} />
        <Section
          title={`Needs attention${alerts.length ? ` · ${alerts.length}` : ''}`}
          className="lg:col-span-2"
          action={alerts.length > 0 && <button onClick={() => go('/alerts')} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white">All alerts <ArrowRight size={12} /></button>}
        >
          {alerts.length === 0 ? <Empty>Nothing on fire — all sites up, nothing overdue or expiring.</Empty> : (
            <ul className="divide-y divide-white/[0.05]">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.key}>
                  <button onClick={() => go(a.to)} className="flex w-full items-center gap-3 py-2 text-left text-sm hover:text-white">
                    <span className="w-16 shrink-0"><Badge tone={SEVERITY[a.severity].tone}>{a.severity}</Badge></span>
                    <span className="min-w-0 flex-1 truncate text-zinc-200">{a.title}</span>
                    <span className="hidden max-w-[40%] truncate text-xs text-zinc-500 sm:block">{a.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Section title="Revenue · last 12 months" className="lg:col-span-2">
          {yearTotal === 0 ? <Empty>No revenue yet. Log income on a project, mark invoices paid, or connect Razorpay.</Empty>
            : <BarChart data={monthly.map((m) => ({ label: monthLabel(m.month), value: m.amount }))} format={money} />}
        </Section>
        <Section title="By project · 12 months">
          {byProject.length ? <ShareBars rows={byProject} format={moneyShort} /> : <Empty>Nothing yet.</Empty>}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Section title={`Live projects · ${live.length}`} className="lg:col-span-3" action={<button onClick={() => go('/projects')} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white">All projects <ArrowRight size={12} /></button>}>
          <ul className="divide-y divide-white/[0.05]">
            {live.map(({ p, s }) => (
              <li key={p.slug}>
                <button onClick={() => go(`/p/${p.slug}`)} className="flex w-full items-center gap-3 py-2 text-left text-sm">
                  <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', s.down ? 'bg-red-500' : s.hostsChecked ? 'bg-emerald-400' : 'bg-zinc-600')} />
                  <span className="min-w-0 flex-1 truncate text-zinc-200 hover:text-white">{p.name}</span>
                  <span className="hidden w-24 shrink-0 text-xs text-zinc-500 sm:block">{p.category}</span>
                  <span className="w-16 shrink-0 text-right text-xs tabular-nums text-zinc-400">{s.hostsChecked ? `${s.hostsUp}/${s.hostsChecked} up` : '—'}</span>
                  <span className="w-16 shrink-0 text-right tabular-nums text-zinc-200">{moneyShort(s.monthRevenue)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Recent activity" className="lg:col-span-2">
          {activity.length === 0 ? <Empty>Updates and production deploys show up here.</Empty> : (
            <ul className="divide-y divide-white/[0.05]">
              {activity.map((a) => (
                <li key={a.key} className="flex items-center gap-2.5 py-2 text-sm">
                  <StatusDot status={a.project.status} />
                  <button onClick={() => go(`/p/${a.project.slug}`)} className="w-24 shrink-0 truncate text-left text-zinc-300 hover:text-white">{a.project.name}</button>
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{a.kind === 'deploy' && '▲ '}{a.text}</span>
                  {a.state === 'ERROR' && <span className="text-xs text-red-400">failed</span>}
                  <span className="shrink-0 text-[11px] text-zinc-600">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}
