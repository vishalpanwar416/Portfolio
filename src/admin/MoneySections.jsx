// Per-project money sections: clients (with contacts and contract dates),
// invoices and expenses. Each edits arrays on the project doc via `save`.
import { useState } from 'react'
import { ChevronDown, Mail, Phone, Plus, Receipt, Trash2 } from 'lucide-react'
import {
  RENEWAL_WARN_DAYS, costIn, daysUntil, invoiceState, money, moneyShort, monthKey, monthLabel, newId, today,
} from './data'
import { Badge, Button, Empty, FIELD_MAIN, Input, Label, Section, Select, Textarea, cx, formRow } from './ui'

const num = (v) => Number(String(v).replace(/[^\d.-]/g, '')) || 0
const addDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 10)
}
const monthText = (m) => (m ? `${monthLabel(m)} ${m.slice(0, 4)}` : '—')

export function renewalBadge(contractEnd) {
  const d = daysUntil(contractEnd)
  if (d === null) return null
  if (d < 0) return <Badge tone="red">contract ended {-d}d ago</Badge>
  if (d <= RENEWAL_WARN_DAYS) return <Badge tone="amber">renew in {d}d</Badge>
  return null
}

// ── clients ────────────────────────────────────────────

function ClientDetails({ c, update }) {
  const [f, setF] = useState({
    company: c.company || '', email: c.email || '', phone: c.phone || '',
    contractEnd: c.contractEnd || '', monthly: c.monthly || '', notes: c.notes || '',
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const commit = () => {
    const next = { ...f, monthly: num(f.monthly) }
    if (Object.keys(next).some((k) => String(next[k] ?? '') !== String(c[k] ?? ''))) update(next)
  }
  return (
    <div className="grid grid-cols-1 gap-3 pb-3 pt-1 sm:grid-cols-2" onBlur={commit}>
      <label><Label>Company</Label><Input value={f.company} onChange={set('company')} className="w-full" /></label>
      <label><Label>₹ / month</Label><Input value={f.monthly} onChange={set('monthly')} inputMode="numeric" className="w-full" /></label>
      <label><Label>Email</Label><Input type="email" value={f.email} onChange={set('email')} className="w-full" /></label>
      <label><Label>Phone</Label><Input type="tel" value={f.phone} onChange={set('phone')} className="w-full" /></label>
      <label><Label>Contract ends</Label><Input type="date" value={f.contractEnd} onChange={set('contractEnd')} className="w-full" /></label>
      <label className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={set('notes')} placeholder="Scope, payment terms, point of contact…" /></label>
    </div>
  )
}

export function Clients({ p, save }) {
  const [row, setRow] = useState({ name: '', monthly: '', since: monthKey() })
  const [open, setOpen] = useState(null)
  const clients = [...(p.clients || [])].sort((a, b) => Number(a.status === 'past') - Number(b.status === 'past'))

  const add = () => {
    if (!row.name.trim()) return
    const id = newId()
    save({ clients: [...(p.clients || []), { id, name: row.name.trim(), monthly: num(row.monthly), since: row.since, status: 'active' }] })
    setRow({ ...row, name: '', monthly: '' })
    setOpen(id)
  }
  const update = (id, patch) => save({ clients: p.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  return (
    <Section title="Clients">
      <div className={formRow}>
        <Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Client name" className={FIELD_MAIN} />
        <Input value={row.monthly} onChange={(e) => setRow({ ...row, monthly: e.target.value })} placeholder="₹ / month" inputMode="numeric" className="min-w-0 sm:w-28" />
        <Input type="month" value={row.since} onChange={(e) => setRow({ ...row, since: e.target.value })} className="min-w-0 sm:w-40" title="Client since" />
        <Button variant="glass" onClick={add} className="col-span-2"><Plus size={14} /> Add</Button>
      </div>
      {clients.length === 0 ? (
        <div className="mt-4"><Empty>No clients yet.</Empty></div>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {clients.map((c) => (
            <li key={c.id} className={cx('group', c.status === 'past' && 'opacity-50')}>
              <div className="flex items-center gap-3 py-2 text-sm">
                <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', c.status === 'past' ? 'bg-zinc-600' : 'bg-emerald-400')} />
                <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-left">
                  <span className="max-w-full truncate text-zinc-100">{c.name}</span>
                  {c.company && <span className="hidden truncate text-xs text-zinc-500 sm:inline">{c.company}</span>}
                  {c.status !== 'past' && renewalBadge(c.contractEnd)}
                  <ChevronDown size={13} className={cx('shrink-0 text-zinc-600 transition', open === c.id && 'rotate-180')} />
                </button>
                {c.email && <a href={`mailto:${c.email}`} className="-m-1 p-1 text-zinc-500 hover:text-white" title={c.email}><Mail size={13} /></a>}
                {c.phone && <a href={`tel:${c.phone}`} className="-m-1 p-1 text-zinc-500 hover:text-white" title={c.phone}><Phone size={13} /></a>}
                <span className="shrink-0 tabular-nums text-zinc-300">{c.monthly ? `${moneyShort(c.monthly)}/mo` : '—'}</span>
                <span className="hidden w-20 shrink-0 text-right text-xs text-zinc-500 sm:block">since {c.since ? `${monthLabel(c.since)} ${c.since.slice(2, 4)}` : '—'}</span>
                <button onClick={() => update(c.id, { status: c.status === 'past' ? 'active' : 'past' })} className="shrink-0 text-right text-xs text-zinc-500 hover:text-zinc-200 sm:w-14">
                  {c.status === 'past' ? 'Restore' : 'End'}
                </button>
                <button onClick={() => save({ clients: p.clients.filter((x) => x.id !== c.id) })} className="text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100 [@media(hover:none)]:opacity-100" aria-label="Remove client">
                  <Trash2 size={13} />
                </button>
              </div>
              {open === c.id && <ClientDetails key={c.id} c={c} update={(patch) => update(c.id, patch)} />}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

// ── invoices ───────────────────────────────────────────

const STATE_TONE = { draft: 'zinc', sent: 'sky', overdue: 'red', paid: 'green' }

export function invoiceNumber(p, month, existing) {
  const prefix = p.slug.replace(/-/g, '').slice(0, 4).toUpperCase()
  const n = existing.filter((i) => i.month === month).length + 1
  return `${prefix}-${month.replace('-', '')}-${n}`
}

export function Invoices({ p, save }) {
  const invoices = p.invoices || []
  const activeClients = (p.clients || []).filter((c) => c.status !== 'past')
  const [row, setRow] = useState({ client: '', month: monthKey(), amount: '', due: addDays(7) })

  const pickClient = (name) => {
    const c = activeClients.find((x) => x.name === name)
    setRow({ ...row, client: name, amount: row.amount || (c?.monthly ? String(c.monthly) : '') })
  }

  const add = () => {
    const amount = num(row.amount)
    if (!amount || !row.month) return
    save({ invoices: [...invoices, {
      id: newId(), number: invoiceNumber(p, row.month, invoices), client: row.client.trim(), month: row.month,
      amount, status: 'draft', issued: today(), due: row.due,
    }] })
    setRow({ ...row, client: '', amount: '' })
  }

  // One draft per active retainer client that hasn't been billed this month.
  const billable = activeClients.filter((c) => c.monthly > 0 && !invoices.some((i) => i.month === monthKey() && i.client === c.name))
  const billMonth = () => {
    const created = []
    for (const c of billable) {
      created.push({
        id: newId(), number: invoiceNumber(p, monthKey(), [...invoices, ...created]), client: c.name, month: monthKey(),
        amount: c.monthly, status: 'draft', issued: today(), due: addDays(7),
      })
    }
    if (created.length) save({ invoices: [...invoices, ...created] })
  }

  const update = (id, patch) => save({ invoices: invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  const sorted = [...invoices].sort((a, b) => (b.issued || '').localeCompare(a.issued || '') || b.number?.localeCompare(a.number))

  return (
    <Section
      title="Invoices"
      action={billable.length > 0 && (
        <Button variant="glass" onClick={billMonth}><Receipt size={14} /> Bill {monthLabel(monthKey())} ({billable.length})</Button>
      )}
    >
      <div className={formRow}>
        <Input list={`clients-${p.slug}`} value={row.client} onChange={(e) => pickClient(e.target.value)} placeholder="Client" className={FIELD_MAIN} />
        <datalist id={`clients-${p.slug}`}>{activeClients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
        <Input type="month" value={row.month} onChange={(e) => setRow({ ...row, month: e.target.value })} className="min-w-0 sm:w-36" title="Billing month" />
        <Input value={row.amount} onChange={(e) => setRow({ ...row, amount: e.target.value })} placeholder="₹" inputMode="numeric" className="min-w-0 sm:w-24" />
        <Input type="date" value={row.due} onChange={(e) => setRow({ ...row, due: e.target.value })} className="min-w-0 sm:w-36" title="Due date" />
        <Button variant="glass" onClick={add}><Plus size={14} /> Add</Button>
      </div>
      {sorted.length === 0 ? (
        <div className="mt-4"><Empty>No invoices. Add one, or add clients with a monthly amount and use “Bill this month”.</Empty></div>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {sorted.map((i) => {
            const st = invoiceState(i)
            return (
              <li key={i.id} className="group flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <span className="hidden w-28 shrink-0 font-mono text-xs text-zinc-500 sm:block">{i.number}</span>
                <span className="min-w-[55%] flex-1 sm:min-w-[35%]">
                  <span className="block truncate text-zinc-200">{i.client || '—'} <span className="hidden text-xs text-zinc-500 sm:inline">· {monthText(i.month)}</span></span>
                  <span className="block truncate text-xs text-zinc-500 sm:hidden"><span className="font-mono">{i.number}</span> · {monthText(i.month)}</span>
                </span>
                <span className="w-24 shrink-0 text-right tabular-nums text-zinc-100">{money(i.amount)}</span>
                <Badge tone={STATE_TONE[st]}>{st}{st === 'paid' && i.paidOn ? ` ${i.paidOn.slice(5)}` : ''}{(st === 'sent' || st === 'overdue') && i.due ? ` · due ${i.due.slice(5)}` : ''}</Badge>
                <span className="flex shrink-0 gap-1">
                  {i.status === 'draft' && <Button className="px-2 py-0.5 text-xs" onClick={() => update(i.id, { status: 'sent', issued: today() })}>Mark sent</Button>}
                  {i.status === 'sent' && <Button className="px-2 py-0.5 text-xs" onClick={() => update(i.id, { status: 'paid', paidOn: today() })}>Mark paid</Button>}
                  {i.status === 'paid' && <Button className="px-2 py-0.5 text-xs opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100" onClick={() => update(i.id, { status: 'sent', paidOn: null })}>Undo</Button>}
                  <button onClick={() => save({ invoices: invoices.filter((x) => x.id !== i.id) })} className="px-1 text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100 [@media(hover:none)]:opacity-100" aria-label="Delete invoice">
                    <Trash2 size={13} />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

// ── expenses ───────────────────────────────────────────

const CYCLES = { monthly: '/ month', yearly: '/ year', once: 'one-off' }

export function Expenses({ p, save }) {
  const expenses = p.expenses || []
  const [row, setRow] = useState({ label: '', amount: '', cycle: 'monthly', start: monthKey() })

  const add = () => {
    const amount = num(row.amount)
    if (!row.label.trim() || !amount) return
    save({ expenses: [...expenses, { id: newId(), label: row.label.trim(), amount, cycle: row.cycle, start: row.start }] })
    setRow({ ...row, label: '', amount: '' })
  }
  const update = (id, patch) => save({ expenses: expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  const ended = (e) => e.cycle === 'once' ? e.start < monthKey() : e.end && e.end < monthKey()

  return (
    <Section title="Expenses" action={<span className="text-xs tabular-nums text-zinc-400">{money(costIn(p, monthKey()))} this month</span>}>
      <div className={formRow}>
        <Input value={row.label} onChange={(e) => setRow({ ...row, label: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Hosting, domain, API…" className={FIELD_MAIN} />
        <Input value={row.amount} onChange={(e) => setRow({ ...row, amount: e.target.value })} placeholder="₹" inputMode="numeric" className="min-w-0 sm:w-24" />
        <Select value={row.cycle} onChange={(e) => setRow({ ...row, cycle: e.target.value })} className="min-w-0">
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="once">One-off</option>
        </Select>
        <Input type="month" value={row.start} onChange={(e) => setRow({ ...row, start: e.target.value })} className="min-w-0 sm:w-36" title="Starts / paid in" />
        <Button variant="glass" onClick={add}><Plus size={14} /> Add</Button>
      </div>
      {expenses.length === 0 ? (
        <div className="mt-4"><Empty>No costs logged. Add hosting, domains and API bills to see real profit.</Empty></div>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {[...expenses].sort((a, b) => Number(!!ended(a)) - Number(!!ended(b)) || b.amount - a.amount).map((e) => (
            <li key={e.id} className={cx('group flex items-center gap-3 py-2 text-sm', ended(e) && 'opacity-50')}>
              <span className="min-w-0 flex-1 truncate text-zinc-200">{e.label}</span>
              <span className="shrink-0 tabular-nums text-zinc-100">{money(e.amount)}</span>
              <span className="w-16 shrink-0 text-xs text-zinc-500">{CYCLES[e.cycle]}</span>
              <span className="hidden w-32 shrink-0 text-right text-xs text-zinc-500 sm:block">
                {e.cycle === 'once' ? monthText(e.start) : `${monthText(e.start)}${e.end ? ` → ${monthText(e.end)}` : ''}`}
              </span>
              {e.cycle !== 'once' && (
                <button onClick={() => update(e.id, { end: e.end ? null : monthKey() })} className="w-12 shrink-0 text-right text-xs text-zinc-500 hover:text-zinc-200">
                  {e.end ? 'Resume' : 'Stop'}
                </button>
              )}
              <button onClick={() => save({ expenses: expenses.filter((x) => x.id !== e.id) })} className="text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100 [@media(hover:none)]:opacity-100" aria-label="Remove expense">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
