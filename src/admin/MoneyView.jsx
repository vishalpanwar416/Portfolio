// Money across every project: monthly goal, revenue vs costs, unpaid
// invoices, recurring costs, and CSV exports for taxes.
import { useState } from 'react'
import { Download, IndianRupee, Repeat, Target, TrendingUp, Wallet } from 'lucide-react'
import {
  costIn, downloadCsv, invoiceState, lastMonths, money, moneyShort, monthKey, monthLabel, projectStats,
  revenueByMonth, revenueIn, saveDoc, today,
} from './data'
import { Badge, BarChart, Button, Empty, Input, Progress, Section, Stat, StatusDot, cx } from './ui'

export function GoalCard({ settings, thisMonth, compact }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(settings.monthlyGoal || '')
  const goal = Number(settings.monthlyGoal) || 0
  const save = () => {
    saveDoc('settings', { kind: 'settings', monthlyGoal: Number(String(value).replace(/[^\d]/g, '')) || 0 })
    setEditing(false)
  }
  const now = new Date()
  const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const expected = goal * (now.getDate() / daysIn)

  return (
    <Section
      title={`Goal · ${monthLabel(monthKey())}`}
      action={<Button className="px-2 py-0.5 text-xs" onClick={() => { setValue(settings.monthlyGoal || ''); setEditing(!editing) }}>{editing ? 'Cancel' : goal ? 'Change' : 'Set goal'}</Button>}
      className={compact ? 'h-full' : ''}
    >
      {editing ? (
        <div className="flex gap-2">
          <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="Monthly target ₹" inputMode="numeric" className="min-w-0 flex-1" />
          <Button variant="primary" onClick={save}>Save</Button>
        </div>
      ) : !goal ? (
        <Empty>Set a monthly revenue target to track progress here.</Empty>
      ) : (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-2xl font-semibold tabular-nums text-zinc-50">{moneyShort(thisMonth)}</div>
            <div className="text-sm tabular-nums text-zinc-500">of {moneyShort(goal)}</div>
          </div>
          <Progress value={thisMonth} max={goal} className="mt-3" />
          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            <span>{Math.round((thisMonth / goal) * 100)}%</span>
            <span>
              {thisMonth >= goal ? 'Goal hit 🎉'
                : thisMonth >= expected ? `On pace · ${moneyShort(goal - thisMonth)} to go`
                  : `Behind pace · ${moneyShort(goal - thisMonth)} to go`}
            </span>
          </div>
        </div>
      )}
    </Section>
  )
}

export default function MoneyView({ data, go }) {
  const { projects, settings } = data
  const months = lastMonths(12)
  const monthly = revenueByMonth(projects, months)
  const cur = monthly.at(-1)
  const stats = projects.map((p) => ({ p, s: projectStats(p, data.checks) }))
  const mrr = stats.reduce((t, x) => t + x.s.mrr, 0)
  const owed = stats.reduce((t, x) => t + x.s.owed.amount, 0)
  const overdue = stats.reduce((t, x) => t + x.s.owed.overdueCount, 0)

  const allInvoices = projects.flatMap((p) => (p.invoices || []).map((i) => ({ ...i, project: p })))
  const unpaid = allInvoices.filter((i) => i.status !== 'paid')
    .sort((a, b) => Number(invoiceState(b) === 'overdue') - Number(invoiceState(a) === 'overdue') || (a.due || '').localeCompare(b.due || ''))
  const markPaid = (inv) => saveDoc(inv.project.id, {
    kind: 'project',
    invoices: inv.project.invoices.map((i) => (i.id === inv.id ? { ...i, status: 'paid', paidOn: today() } : i)),
  })
  const markSent = (inv) => saveDoc(inv.project.id, {
    kind: 'project',
    invoices: inv.project.invoices.map((i) => (i.id === inv.id ? { ...i, status: 'sent', issued: today() } : i)),
  })

  const costRows = projects.map((p) => ({ p, cost: costIn(p, monthKey()) })).filter((r) => r.cost > 0).sort((a, b) => b.cost - a.cost)

  const exports = {
    'Revenue by month': () => downloadCsv(`revenue-${today()}.csv`, months.flatMap((m) => projects
      .map((p) => ({ month: m, project: p.name, revenue: revenueIn(p, m), costs: costIn(p, m), profit: revenueIn(p, m) - costIn(p, m) }))
      .filter((r) => r.revenue || r.costs))),
    Invoices: () => downloadCsv(`invoices-${today()}.csv`, allInvoices.map((i) => ({
      number: i.number, project: i.project.name, client: i.client, month: i.month, amount: i.amount,
      status: invoiceState(i), issued: i.issued, due: i.due, paid_on: i.paidOn || '',
    }))),
    Expenses: () => downloadCsv(`expenses-${today()}.csv`, projects.flatMap((p) => (p.expenses || []).map((e) => ({
      project: p.name, label: e.label, amount: e.amount, cycle: e.cycle, start: e.start, end: e.end || '',
    })))),
    Clients: () => downloadCsv(`clients-${today()}.csv`, projects.flatMap((p) => (p.clients || []).map((c) => ({
      project: p.name, name: c.name, company: c.company || '', email: c.email || '', phone: c.phone || '',
      monthly: c.monthly || 0, since: c.since || '', contract_end: c.contractEnd || '', status: c.status,
    })))),
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Revenue this month" value={moneyShort(cur.amount)} sub={money(cur.amount)} icon={IndianRupee} />
        <Stat label="Costs this month" value={moneyShort(cur.cost)} icon={Wallet} />
        <Stat label="Profit this month" value={moneyShort(cur.profit)} tone={cur.profit < 0 ? 'text-red-400' : 'text-zinc-50'} icon={TrendingUp} />
        <Stat label="Owed to you" value={moneyShort(owed)} tone={overdue ? 'text-amber-300' : 'text-zinc-50'} sub={overdue ? `${overdue} overdue` : `${unpaid.filter((i) => i.status === 'sent').length} unpaid`} icon={Target} />
        <Stat label="Monthly recurring" value={moneyShort(mrr)} sub="active retainers" icon={Repeat} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <GoalCard settings={settings} thisMonth={cur.amount} />
        <Section title="Revenue · last 12 months" className="lg:col-span-2">
          {monthly.every((m) => !m.amount && !m.cost) ? <Empty>Nothing logged yet.</Empty> : (
            <>
              <BarChart data={monthly.map((m) => ({ label: monthLabel(m.month), value: m.amount }))} format={money} height={120} />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs tabular-nums">
                  <thead><tr className="text-zinc-500"><td className="py-1">Month</td><td className="text-right">Revenue</td><td className="text-right">Costs</td><td className="text-right">Profit</td></tr></thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {[...monthly].reverse().filter((m) => m.amount || m.cost).map((m) => (
                      <tr key={m.month} className="text-zinc-300">
                        <td className="py-1.5">{monthLabel(m.month)} {m.month.slice(0, 4)}</td>
                        <td className="text-right">{money(m.amount)}</td>
                        <td className="text-right text-zinc-500">{money(m.cost)}</td>
                        <td className={cx('text-right', m.profit < 0 ? 'text-red-300' : 'text-zinc-100')}>{money(m.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Section title={`Unpaid invoices${unpaid.length ? ` · ${unpaid.length}` : ''}`} className="lg:col-span-2">
          {unpaid.length === 0 ? <Empty>All paid up.</Empty> : (
            <ul className="divide-y divide-white/[0.05]">
              {unpaid.map((i) => {
                const st = invoiceState(i)
                return (
                  <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                    <StatusDot status={i.project.status} />
                    <button onClick={() => go(`/p/${i.project.slug}`)} className="w-28 shrink-0 truncate text-left text-zinc-400 hover:text-white">{i.project.name}</button>
                    <span className="min-w-0 flex-1 truncate text-zinc-200">{i.client || '—'} <span className="font-mono text-xs text-zinc-600">{i.number}</span></span>
                    <span className="tabular-nums text-zinc-100">{money(i.amount)}</span>
                    <Badge tone={st === 'overdue' ? 'red' : st === 'sent' ? 'sky' : 'zinc'}>{st}{i.due && st !== 'draft' ? ` · due ${i.due.slice(5)}` : ''}</Badge>
                    {i.status === 'draft'
                      ? <Button className="px-2 py-0.5 text-xs" onClick={() => markSent(i)}>Mark sent</Button>
                      : <Button className="px-2 py-0.5 text-xs" onClick={() => markPaid(i)}>Mark paid</Button>}
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
        <div className="space-y-5">
          <Section title="Costs this month">
            {costRows.length === 0 ? <Empty>No expenses logged.</Empty> : (
              <ul className="space-y-1.5 text-sm">
                {costRows.map(({ p, cost }) => (
                  <li key={p.slug} className="flex justify-between gap-2">
                    <button onClick={() => go(`/p/${p.slug}`)} className="truncate text-zinc-300 hover:text-white">{p.name}</button>
                    <span className="tabular-nums text-zinc-400">{money(cost)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Export CSV">
            <div className="flex flex-wrap gap-2">
              {Object.entries(exports).map(([label, run]) => (
                <Button key={label} variant="glass" onClick={run}><Download size={13} /> {label}</Button>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
