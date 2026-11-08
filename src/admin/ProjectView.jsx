import { useEffect, useState } from 'react'
import {
  ExternalLink, GitBranch, Github, IndianRupee, Pencil, Plus, Repeat, Trash2, Users, Globe,
} from 'lucide-react'
import {
  CATEGORIES, STATUSES, VERCEL_TEAM_SLUG, api, daysUntil, lastMonths, money, moneyShort, monthKey,
  monthLabel, projectStats, removeDoc, revenueByMonth, saveDoc, SSL_WARN_DAYS, timeAgo,
} from './data'
import {
  BarChart, Button, Empty, Input, Section, Select, Stat, StatusPill, Tag, Textarea, UpDot, cx,
} from './ui'

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const today = () => new Date().toISOString().slice(0, 10)
const list = (s) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean)

// ── revenue ────────────────────────────────────────────

function Revenue({ p, save }) {
  const [row, setRow] = useState({ month: monthKey(), amount: '', note: '' })
  const months = lastMonths(12)
  const chart = revenueByMonth([p], months).map((m) => ({ label: monthLabel(m.month), value: m.amount }))
  const entries = [...(p.revenue || [])].sort((a, b) => b.month.localeCompare(a.month))

  const add = () => {
    const amount = Number(String(row.amount).replace(/[^\d.-]/g, ''))
    if (!row.month || !amount) return
    save({ revenue: [...(p.revenue || []), { id: newId(), month: row.month, amount, note: row.note.trim() }] })
    setRow({ ...row, amount: '', note: '' })
  }

  return (
    <Section title="Revenue">
      {entries.length > 0 && <div className="mb-5"><BarChart data={chart} format={money} height={110} /></div>}
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

// ── clients ────────────────────────────────────────────

function Clients({ p, save }) {
  const [row, setRow] = useState({ name: '', monthly: '', since: monthKey() })
  const clients = [...(p.clients || [])].sort((a, b) => Number(a.status === 'past') - Number(b.status === 'past'))

  const add = () => {
    if (!row.name.trim()) return
    save({ clients: [...(p.clients || []), { id: newId(), name: row.name.trim(), monthly: Number(row.monthly) || 0, since: row.since, status: 'active' }] })
    setRow({ ...row, name: '', monthly: '' })
  }
  const update = (id, patch) => save({ clients: p.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  return (
    <Section title="Clients">
      <div className="flex flex-wrap gap-2">
        <Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Client name" className="min-w-0 flex-1" />
        <Input value={row.monthly} onChange={(e) => setRow({ ...row, monthly: e.target.value })} placeholder="₹ / month" inputMode="numeric" className="w-28" />
        <Input type="month" value={row.since} onChange={(e) => setRow({ ...row, since: e.target.value })} className="w-40" />
        <Button variant="glass" onClick={add}><Plus size={14} /> Add</Button>
      </div>
      {clients.length === 0 ? (
        <div className="mt-4"><Empty>No clients yet.</Empty></div>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {clients.map((c) => (
            <li key={c.id} className={cx('group flex items-center gap-3 py-2 text-sm', c.status === 'past' && 'opacity-50')}>
              <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', c.status === 'past' ? 'bg-zinc-600' : 'bg-emerald-400')} />
              <span className="min-w-0 flex-1 truncate text-zinc-100">{c.name}</span>
              <span className="shrink-0 tabular-nums text-zinc-300">{c.monthly ? `${moneyShort(c.monthly)}/mo` : '—'}</span>
              <span className="hidden w-20 shrink-0 text-right text-xs text-zinc-500 sm:block">since {c.since ? `${monthLabel(c.since)} ${c.since.slice(2, 4)}` : '—'}</span>
              <button onClick={() => update(c.id, { status: c.status === 'past' ? 'active' : 'past' })} className="w-14 shrink-0 text-right text-xs text-zinc-500 hover:text-zinc-200">
                {c.status === 'past' ? 'Restore' : 'End'}
              </button>
              <button onClick={() => save({ clients: p.clients.filter((x) => x.id !== c.id) })} className="text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100" aria-label="Remove client">
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
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async () => {
    await save({
      name: f.name.trim() || p.name, category: f.category, summary: f.summary.trim(), stack: list(f.stack),
      domains: list(f.domains).map((d) => d.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')),
      repos: list(f.repos).map((r) => r.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')),
      vercel: list(f.vercel),
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
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Button variant="danger" onClick={remove}><Trash2 size={14} /> Remove project</Button>
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="This month" value={moneyShort(s.monthRevenue)} icon={IndianRupee} />
        <Stat label="All-time revenue" value={moneyShort(s.totalRevenue)} sub={money(s.totalRevenue)} icon={IndianRupee} />
        <Stat label="Monthly recurring" value={moneyShort(s.mrr)} icon={Repeat} />
        <Stat label="Active clients" value={s.activeClients} sub={`${s.totalClients} all time`} icon={Users} />
        <Stat label="Sites up" value={s.hostsChecked ? `${s.hostsUp}/${s.hostsChecked}` : '—'} tone={s.down ? 'text-red-400' : 'text-zinc-50'} icon={Globe} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Revenue p={p} save={save} />
        <Clients p={p} save={save} />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3"><Updates p={p} save={save} /></div>
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
