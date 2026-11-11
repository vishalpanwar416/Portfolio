// All projects as a filterable grid of status tiles.
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { GROUPS, STATUSES } from './data'
import { ProjectTile } from './OverviewView'
import { Empty, Input, StatusDot, cx } from './ui'

const ORDER = ['live', 'building', 'maintenance', 'paused', 'decommissioned']

export default function ProjectsView({ data, go }) {
  const [status, setStatus] = useState('active')
  const [q, setQ] = useState('')
  const counts = Object.fromEntries(ORDER.map((s) => [s, data.projects.filter((p) => p.status === s).length]))

  const list = useMemo(() => data.projects.filter((p) => {
    if (status === 'active' && p.status === 'decommissioned') return false
    if (status !== 'active' && status !== 'all' && p.status !== status) return false
    const hay = `${p.name} ${p.summary || ''} ${(p.stack || []).join(' ')} ${(p.domains || []).join(' ')}`.toLowerCase()
    return !q || hay.includes(q.toLowerCase())
  }), [data.projects, status, q])

  const chip = (key, label, n, dot) => (
    <button key={key} onClick={() => setStatus(key)} className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition', status === key ? 'border-white/25 bg-white/[0.1] text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-100')}>
      {dot && <StatusDot status={dot} />} {label} <span className="tabular-nums text-zinc-500">{n}</span>
    </button>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {chip('active', 'Active', data.projects.length - counts.decommissioned)}
        {ORDER.map((s) => counts[s] > 0 && chip(s, STATUSES[s].label, counts[s], s))}
        {chip('all', 'All', data.projects.length)}
        <div className="relative ml-auto w-full sm:w-56">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="w-full pl-8" />
        </div>
      </div>
      {list.length === 0 ? <Empty>No projects match.</Empty> : GROUPS.map((g) => {
        const items = list.filter((p) => g.categories.includes(p.category))
        if (!items.length) return null
        return (
          <section key={g.title}>
            <h2 className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">{g.title} · {items.length}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {items.map((p) => <ProjectTile key={p.slug} p={p} checks={data.checks} go={go} traffic={data.traffic} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
