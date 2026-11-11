import { useEffect, useState } from 'react'
import {
  ExternalLink, GitBranch, Github, IndianRupee, Pencil, Plus, Repeat, Trash2, Users, Globe, Wallet, TrendingUp,
} from 'lucide-react'
import {
  CATEGORIES, STATUSES, VERCEL_TEAM_SLUG, api, daysUntil, lastMonths, money, moneyShort, monthKey,
  monthLabel, newId, projectStats, removeDoc, revenueByMonth, saveDoc, SSL_WARN_DAYS, timeAgo, today,
} from './data'
import {
  BarChart, Button, Empty, Input, Section, Select, Stat, StatusPill, Tag, Textarea, UpDot, cx,
} from './ui'
import { Clients, Expenses, Invoices } from './MoneySections'
import { CloudCosts, GitHubActivity, StackyTasks, Usage } from './IntegrationSections'

const list = (s) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean)

// ── revenue ────────────────────────────────────────────

function Revenue({ p, save }) {
  const [row, setRow] = useState({ month: monthKey(), amount: '', note: '' })
  const months = lastMonths(12)
  const chart = revenueByMonth([p], months).map((m) => ({ label: monthLabel(m.month), value: m.amount }))
  const entries = [...(p.revenue || [])].sort((a, b) => b.month.localeCompare(a.month))
  const hasPaid = (p.invoices || []).some((i) => i.status === 'paid')

  const add = () => {
    const amount = Number(String(row.amount).replace(/[^\d.-]/g, ''))
    if (!row.month || !amount) return
    save({ revenue: [...(p.revenue || []), { id: newId(), month: row.month, amount, note: row.note.trim() }] })
    setRow({ ...row, amount: '', note: '' })
  }

  return (
    <Section title="Revenue" action={<span className="text-[11px] text-zinc-600">paid invoices add here automatically</span>}>
      {(entries.length > 0 || hasPaid) && <div className="mb-5"><BarChart data={chart} format={money} height={110} /></div>}
      <div className="flex flex-wrap gap-2">
        <Input type="month" value={row.month} onChange={(e) => setRow({ ...row, month: e.target.value })} className="w-40" />
        <Input value={row.amount} onChange={(e) => setRow({ ...row, amount: e.target.value })} placeholder="Amount ₹" inputMode="numeric" className="w-32" />
        <Input value={row.note} onChange={(e) => setRow({ ...row, note: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Note (invoice, client…)" className="min-w-0 flex-1" />
        <Button variant="glass" onClick={add}><Plus size={14} /> Add</Button>
      </div>
      {entries.length === 0 ? (
        <div className="mt-4"><Empty>No income logged for {p.name} yet.</Empty></div>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {entries.map((r) => (
            <li key={r.id} className="group flex items-center gap-3 py-2 text-sm">
              <span className="w-20 shrink-0 text-zinc-500">{monthLabel(r.month)} {r.month.slice(0, 4)}</span>
              <span className="w-28 shrink-0 tabular-nums text-zinc-100">{money(r.amount)}</span>
              <span className="min-w-0 flex-1 truncate text-zinc-400">{r.note}</span>
              <button onClick={() => save({ revenue: p.revenue.filter((x) => x.id !== r.id) })} className="text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100" aria-label="Remove entry">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

// ── updates: hand-written log + Vercel deploys ─────────

function Updates({ p, save }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState(today())
  const [deploys, setDeploys] = useState([])
  const ids = p.vercelProjects.map((v) => v.id).join(',')

  useEffect(() => {
    if (!ids) { setDeploys([]); return }
    let live = true
    api(`/api/admin/deploys?projects=${encodeURIComponent(ids)}`)
      .then((r) => live && setDeploys(r.deploys))
      .catch(() => live && setDeploys([]))
    return () => { live = false }
  }, [ids])

  const add = () => {
    if (!text.trim()) return
    save({ updates: [...(p.updates || []), { id: newId(), date, text: text.trim() }] })
    setText('')
  }

  const items = [
    ...(p.updates || []).map((u) => ({ key: u.id, at: new Date(u.date).getTime(), label: u.date, text: u.text, update: u })),
    ...deploys.map((d) => ({ key: d.id, at: d.createdAt, label: timeAgo(d.createdAt), text: d.commit || d.url, deploy: d })),
  ].sort((a, b) => b.at - a.at).slice(0, 25)

  return (
    <Section title="Updates">
      <div className="flex flex-wrap gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="What happened? Shipped, signed, paused…" className="min-w-0 flex-1" />
        <Button variant="glass" onClick={add}><Plus size={14} /> Log</Button>
      </div>
      {items.length === 0 ? (
        <div className="mt-4"><Empty>No updates yet{p.vercelProjects.length ? '' : ' — link a Vercel project to see deploys here'}.</Empty></div>
      ) : (
        <ol className="relative mt-5 space-y-3 border-l border-white/[0.08] pl-5">
          {items.map((it) => (
            <li key={it.key} className="group relative text-sm">
              <span className={cx('absolute -left-[23.5px] top-1.5 h-2 w-2 rounded-full ring-4 ring-black', it.deploy ? (it.deploy.state === 'ERROR' ? 'bg-red-500' : 'bg-zinc-500') : 'bg-white')} />
              <div className="flex items-baseline gap-2">
                <span className="w-24 shrink-0 text-xs text-zinc-500">{it.label}</span>
                <span className="min-w-0 flex-1 text-zinc-200">
                  {it.deploy && <span className="mr-1.5 text-xs text-zinc-500">▲ {it.deploy.project} · {it.deploy.target}</span>}
                  {it.text}
                </span>
                {it.update && (
                  <button onClick={() => save({ updates: p.updates.filter((u) => u.id !== it.update.id) })} className="text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100" aria-label="Remove update">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}

// ── infrastructure ─────────────────────────────────────

function Infra({ p, checks }) {
  return (
    <Section title="Infrastructure">
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500"><Globe size={12} /> Domains</div>
          {p.domains.length === 0 ? <div className="text-sm text-zinc-600">None</div> : (
            <ul className="space-y-1.5">
              {p.domains.map((h) => {
                const c = checks[h]
                const ssl = daysUntil(c?.certValidTo)
                return (
                  <li key={h} className="flex items-center gap-2 text-sm">
                    <UpDot check={h.startsWith('www.') ? null : c} />
                    <a href={`https://${h}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-zinc-200 hover:underline">{h}</a>
                    {c && (
                      <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                        {c.status ?? c.error} · {c.ms}ms
                        {ssl !== null && <span className={ssl < SSL_WARN_DAYS ? ' text-amber-300' : ''}> · SSL {ssl}d</span>}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-2 text-xs text-zinc-500">▲ Vercel</div>
          {(p.vercel || []).length === 0 ? <div className="text-sm text-zinc-600">Not on Vercel</div> : (
            <ul className="space-y-2">
              {p.vercel.map((name) => {
                const v = p.vercelProjects.find((x) => x.name === name)
                const prod = v?.production
                return (
                  <li key={name} className="text-sm">
                    <div className="flex items-center gap-2">
                      <a href={`https://vercel.com/${VERCEL_TEAM_SLUG}/${name}`} target="_blank" rel="noreferrer" className="text-zinc-200 hover:underline">{name}</a>
                      {prod && <Tag>{prod.state?.toLowerCase()}</Tag>}
                      {!v && <span className="text-xs text-zinc-600">not found on the team</span>}
                      {prod && <span className="ml-auto text-xs text-zinc-500">{timeAgo(prod.createdAt)}</span>}
                    </div>
                    {prod?.commit && (
                      <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-zinc-500">
                        <GitBranch size={11} /> {prod.branch} {prod.sha && <code>{prod.sha}</code>} · {prod.commit}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500"><Github size={12} /> Repositories</div>
          {p.repos.length === 0 ? <div className="text-sm text-zinc-600">None</div> : (
            <div className="flex flex-wrap gap-1.5">
              {p.repos.map((r) => (
                <a key={r} href={`https://github.com/${r}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-xs text-zinc-300 hover:border-white/20 hover:text-white">
                  {r} <ExternalLink size={10} className="text-zinc-600" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

// ── edit details ───────────────────────────────────────

function EditDetails({ p, save, onClose, go }) {
  const [f, setF] = useState({
    name: p.name, category: p.category, summary: p.summary || '', stack: (p.stack || []).join(', '),
    domains: (p.domains || []).join('\n'), repos: (p.repos || []).join('\n'), vercel: (p.vercel || []).join('\n'),
    firebase: (p.firebase || []).join('\n'), stacky: (p.stacky || []).join('\n'), cloud: (p.cloud || []).join('\n'),
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async () => {
    await save({
      name: f.name.trim() || p.name, category: f.category, summary: f.summary.trim(), stack: list(f.stack),
      domains: list(f.domains).map((d) => d.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')),
      repos: list(f.repos).map((r) => r.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')),
      vercel: list(f.vercel), firebase: list(f.firebase), stacky: list(f.stacky), cloud: list(f.cloud),
    })
    onClose()
  }

  const remove = async () => {
    if (p.custom) await removeDoc(p.id)
    else await save({ deleted: true })
    go('/')
  }

  const label = 'mb-1 block text-xs text-zinc-500'
  return (
    <Section title="Edit details" action={<Button onClick={onClose}>Cancel</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className={label}>Name</span><Input value={f.name} onChange={set('name')} className="w-full" /></label>
        <label><span className={label}>Category</span>
          <Select value={f.category} onChange={set('category')} className="w-full">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </label>
        <label className="sm:col-span-2"><span className={label}>Summary</span><Input value={f.summary} onChange={set('summary')} className="w-full" /></label>
        <label className="sm:col-span-2"><span className={label}>Stack (comma separated)</span><Input value={f.stack} onChange={set('stack')} className="w-full" /></label>
        <label><span className={label}>Domains (one per line)</span><Textarea rows={4} value={f.domains} onChange={set('domains')} /></label>
        <label><span className={label}>GitHub repos (owner/name)</span><Textarea rows={4} value={f.repos} onChange={set('repos')} /></label>
        <label><span className={label}>Vercel project names</span><Textarea rows={4} value={f.vercel} onChange={set('vercel')} /></label>
        <label><span className={label}>Firebase project IDs</span><Textarea rows={4} value={f.firebase} onChange={set('firebase')} /></label>
        <label className="sm:col-span-2"><span className={label}>Cloud bills — one per line: gcp:&lt;project&gt;.&lt;dataset&gt;, aws:&lt;label&gt; or azure:&lt;label&gt;</span><Textarea rows={2} value={f.cloud} onChange={set('cloud')} placeholder="gcp:my-project.billing_export" /></label>
        <label className="sm:col-span-2"><span className={label}>Stacky project names (blank = match “{p.name}”)</span><Input value={f.stacky} onChange={set('stacky')} className="w-full" placeholder={p.name} /></label>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="danger" onClick={remove}><Trash2 size={14} /> Remove project</Button>
          <Button onClick={async () => { await save({ hidden: true }); go('/') }}>Hide for now</Button>
        </div>
        <Button variant="primary" onClick={submit}>Save</Button>
      </div>
    </Section>
  )
}

// ── page ───────────────────────────────────────────────

export default function ProjectView({ project: p, data, go }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(p.notes || '')
  useEffect(() => { setNotes(p.notes || ''); setEditing(false) }, [p.slug, p.notes])

  const save = (patch) => saveDoc(p.id, { kind: 'project', ...patch })
  const s = projectStats(p, data.checks)

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{p.name}</h1>
            <StatusPill status={p.status} />
            <Tag>{p.category}</Tag>
          </div>
          {p.summary && <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">{p.summary}</p>}
          {(p.stack || []).length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">{p.stack.map((t) => <Tag key={t}>{t}</Tag>)}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={p.status} onChange={(e) => save({ status: e.target.value })} aria-label="Status">
            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Button variant="glass" onClick={() => setEditing(!editing)}><Pencil size={14} /> Edit</Button>
        </div>
      </header>

      {editing && <EditDetails p={p} save={save} onClose={() => setEditing(false)} go={go} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="This month" value={moneyShort(s.monthRevenue)} sub={`${moneyShort(s.totalRevenue)} all time`} icon={IndianRupee} />
        <Stat label="Profit this month" value={moneyShort(s.monthProfit)} tone={s.monthProfit < 0 ? 'text-red-400' : 'text-zinc-50'} sub={`${moneyShort(s.monthCost)} costs`} icon={TrendingUp} />
        <Stat label="Monthly recurring" value={moneyShort(s.mrr)} icon={Repeat} />
        <Stat label="Owed to you" value={moneyShort(s.owed.amount)} tone={s.owed.overdueCount ? 'text-amber-300' : 'text-zinc-50'} sub={s.owed.overdueCount ? `${s.owed.overdueCount} overdue` : `${s.owed.count} unpaid`} icon={Wallet} />
        <Stat label="Active clients" value={s.activeClients} sub={`${s.totalClients} all time`} icon={Users} />
        <Stat label="Sites up" value={s.hostsChecked ? `${s.hostsUp}/${s.hostsChecked}` : '—'} tone={s.down ? 'text-red-400' : 'text-zinc-50'} icon={Globe} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Revenue p={p} save={save} />
        <Clients p={p} save={save} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Invoices p={p} save={save} />
        <Expenses p={p} save={save} />
      </div>

      {(p.cloud || []).length > 0 && <CloudCosts sources={p.cloud} go={go} />}

      <div className="grid gap-5 xl:grid-cols-2">
        <StackyTasks p={p} stacky={data.stacky} go={go} />
        <Usage p={p} traffic={data.traffic} go={go} />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="space-y-5 xl:col-span-3">
          <Updates p={p} save={save} />
          <GitHubActivity p={p} />
        </div>
        <div className="space-y-5 xl:col-span-2">
          <Infra p={p} checks={data.checks} />
          <Section title="Notes">
            <Textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (p.notes || '') && save({ notes })}
              placeholder="Contracts, credentials location, todos… (saved when you click away)"
            />
          </Section>
        </div>
      </div>
    </div>
  )
}
