import { Activity, AlertTriangle, Briefcase, IndianRupee, Repeat, TrendingUp, Users, Wallet } from 'lucide-react'
import {
  GROUPS, STATUSES, invoiceState, lastMonths, revenueIn, money, moneyShort, monthLabel, projectStats, revenueByMonth, timeAgo,
} from './data'
import { BarChart, Badge, Empty, Glass, Section, ShareBars, Sparkline, Stat, StatusDot, cx } from './ui'
import { GoalCard } from './MoneyView'
import { renewalAlerts } from './RenewalsView'
import { stackyProjectIds, trafficFor } from './IntegrationSections'

function ProjectTile({ p, checks, go, traffic }) {
  const s = projectStats(p, checks)
  const t = trafficFor(p, traffic)
  const lastDeploy = p.vercelProjects.map((v) => v.production?.createdAt).filter(Boolean).sort((a, b) => b - a)[0]
  const lastUpdate = [...(p.updates || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
  return (
    <Glass
      as="button"
      onClick={() => go(`/p/${p.slug}`)}
      className={cx('p-4 text-left transition hover:border-white/20 hover:bg-white/[0.06]', p.status === 'decommissioned' && 'opacity-60')}
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
          <div className={cx('tabular-nums', s.down ? 'text-red-400' : 'text-zinc-200')}>
            {s.hostsChecked ? `${s.hostsUp}/${s.hostsChecked}` : '—'}
          </div>
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
  const prevMonth = monthly[monthly.length - 2]?.amount || 0
  const thisMonth = monthly[monthly.length - 1]?.amount || 0
  const delta = prevMonth ? Math.round(((thisMonth - prevMonth) / prevMonth) * 100) : null

  const running = projects.filter((p) => ['live', 'building', 'maintenance'].includes(p.status)).length
  const decommissioned = projects.filter((p) => p.status === 'decommissioned').length
  const down = sum('down')

  const byProject = stats
    .map(({ p }) => ({ key: p.slug, label: p.name, value: months.reduce((t, m) => t + revenueIn(p, m), 0), onClick: () => go(`/p/${p.slug}`) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)

  // Hand-written updates and production deploys, newest first.
  const activity = [
    ...projects.flatMap((p) => (p.updates || []).map((u) => ({ key: `${p.slug}-${u.id}`, at: new Date(u.date).getTime(), project: p, text: u.text, kind: 'update' }))),
    ...projects.flatMap((p) => p.vercelProjects.filter((v) => v.production).map((v) => ({ key: `${p.slug}-${v.production.id}`, at: v.production.createdAt, project: p, text: v.production.commit || `Deployed ${v.name}`, kind: 'deploy', state: v.production.state }))),
  ].filter((a) => a.at).sort((a, b) => b.at - a.at).slice(0, 12)

  const statusOrder = ['live', 'building', 'maintenance', 'paused', 'decommissioned']
  const cur = monthly[monthly.length - 1]
  const owed = stats.reduce((t, x) => t + x.s.owed.amount, 0)
  const overdueInvoices = projects.flatMap((p) => (p.invoices || []).filter((i) => invoiceState(i) === 'overdue').map((i) => ({ ...i, project: p })))

  // One list of everything that needs a look today.
  const ren = renewalAlerts(data)
  const blocked = data.stacky.data ? projects.flatMap((p) => {
    const ids = stackyProjectIds(p, data.stacky.data)
    return data.stacky.data.tasks.filter((t) => t.status === 'blocked' && ids.has(t.projectId)).map((t) => ({ t, p }))
  }) : []
  const attention = [
    ...Object.values(checks).filter((c) => !c.up).map((c) => ({ key: `down-${c.host}`, tone: 'red', tag: 'down', text: `${c.host} — ${c.status ?? c.error}`, to: '/sites' })),
    ...overdueInvoices.map((i) => ({ key: `inv-${i.id}`, tone: 'red', tag: 'overdue', text: `${i.project.name} · ${i.client || i.number} · ${money(i.amount)}`, to: '/money' })),
    ...ren.domains.map((d) => ({ key: `dom-${d.domain}`, tone: 'amber', tag: 'domain', text: `${d.domain} expires ${d.expiresAt.slice(0, 10)}`, to: '/renewals' })),
    ...ren.certs.map((c) => ({ key: `ssl-${c.host}`, tone: 'amber', tag: 'ssl', text: `${c.host} certificate ends ${c.certValidTo.slice(0, 10)}`, to: '/renewals' })),
    ...ren.clients.map(({ project: p, client: c, days }) => ({ key: `cl-${p.slug}-${c.id}`, tone: days < 0 ? 'red' : 'amber', tag: 'contract', text: `${c.name} (${p.name}) ${days < 0 ? 'ended' : 'ends'} ${c.contractEnd}`, to: `/p/${p.slug}` })),
    ...blocked.map(({ t, p }) => ({ key: `task-${t.id}`, tone: 'zinc', tag: 'blocked', text: `${p.name} · ${t.title}`, to: `/p/${p.slug}` })),
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="This month" value={moneyShort(thisMonth)} sub={delta === null ? monthLabel(months[11]) : `${delta >= 0 ? '+' : ''}${delta}% vs last month`} icon={IndianRupee} />
        <Stat label="Profit this month" value={moneyShort(cur.profit)} tone={cur.profit < 0 ? 'text-red-400' : 'text-zinc-50'} sub={`${moneyShort(cur.cost)} costs`} icon={TrendingUp} />
        <Stat label="Last 12 months" value={moneyShort(yearTotal)} sub={money(yearTotal)} icon={IndianRupee} />
        <Stat label="Owed to you" value={moneyShort(owed)} tone={overdueInvoices.length ? 'text-amber-300' : 'text-zinc-50'} sub={overdueInvoices.length ? `${overdueInvoices.length} overdue` : 'unpaid invoices'} icon={Wallet} />
        <Stat label="Monthly recurring" value={moneyShort(sum('mrr'))} sub="active client retainers" icon={Repeat} />
        <Stat label="Active clients" value={sum('activeClients')} sub={`${sum('totalClients')} all time`} icon={Users} />
        <Stat label="Projects running" value={`${running}/${projects.length}`} sub={`${decommissioned} decommissioned`} icon={Briefcase} />
        <Stat label="Sites down" value={down} tone={down ? 'text-red-400' : 'text-emerald-300'} sub={data.lastChecked ? `checked ${timeAgo(data.lastChecked)}` : 'checking…'} icon={down ? AlertTriangle : Activity} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <GoalCard settings={data.settings} thisMonth={thisMonth} />
        <Section title={`Needs attention${attention.length ? ` · ${attention.length}` : ''}`} className="lg:col-span-2">
          {attention.length === 0 ? (
            <Empty>Nothing on fire — all sites up, nothing overdue or expiring.</Empty>
          ) : (
            <ul className="max-h-56 divide-y divide-white/[0.05] overflow-y-auto">
              {attention.map((a) => (
                <li key={a.key}>
                  <button onClick={() => go(a.to)} className="flex w-full items-center gap-3 py-2 text-left text-sm hover:text-white">
                    <span className="w-16 shrink-0"><Badge tone={a.tone}>{a.tag}</Badge></span>
                    <span className="min-w-0 flex-1 truncate text-zinc-300">{a.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Section title="Revenue · last 12 months" className="lg:col-span-2">
          {yearTotal === 0 ? (
            <Empty>No revenue logged yet. Open a project and add its monthly income under Revenue.</Empty>
          ) : (
            <BarChart data={monthly.map((m) => ({ label: monthLabel(m.month), value: m.amount }))} format={money} />
          )}
        </Section>
        <Section title="By project · 12 months">
          {byProject.length ? <ShareBars rows={byProject} format={moneyShort} /> : <Empty>Nothing yet.</Empty>}
        </Section>
      </div>

      <Section title="Status">
        <div className="mb-4 flex flex-wrap gap-2">
          {statusOrder.map((st) => {
            const n = projects.filter((p) => p.status === st).length
            return (
              <span key={st} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
                <StatusDot status={st} /> {STATUSES[st].label} <span className="tabular-nums text-zinc-500">{n}</span>
              </span>
            )
          })}
        </div>
        {GROUPS.map((g) => {
          const list = projects.filter((p) => g.categories.includes(p.category) && p.status !== 'decommissioned')
          if (!list.length) return null
          return (
            <div key={g.title} className="mb-5 last:mb-0">
              <div className="mb-2 text-xs text-zinc-500">{g.title}</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {list.map((p) => <ProjectTile key={p.slug} p={p} checks={checks} go={go} traffic={data.traffic} />)}
              </div>
            </div>
          )
        })}
        {decommissioned > 0 && (
          <div>
            <div className="mb-2 text-xs text-zinc-500">Decommissioned</div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {projects.filter((p) => p.status === 'decommissioned').map((p) => <ProjectTile key={p.slug} p={p} checks={checks} go={go} traffic={data.traffic} />)}
            </div>
          </div>
        )}
      </Section>

      <Section title="Recent activity">
        {activity.length === 0 ? (
          <Empty>Updates you log on a project and production deploys show up here.</Empty>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {activity.map((a) => (
              <li key={a.key} className="flex items-center gap-3 py-2.5 text-sm">
                <StatusDot status={a.project.status} />
                <button onClick={() => go(`/p/${a.project.slug}`)} className="w-32 shrink-0 truncate text-left text-zinc-300 hover:text-white">{a.project.name}</button>
                <span className="min-w-0 flex-1 truncate text-zinc-400">
                  {a.kind === 'deploy' && <span className="mr-1.5 text-zinc-600">▲</span>}
                  {a.text}
                </span>
                {a.state === 'ERROR' && <span className="text-xs text-red-400">failed</span>}
                <span className="shrink-0 text-xs text-zinc-500">{timeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
