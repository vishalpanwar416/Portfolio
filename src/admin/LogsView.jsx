// Marketing → Logs: what the Media-man pipeline did, run by run, with the full
// output of each run. Media-man (src/lib/firestore.js recordRun there) writes
// one document per step into tabletap_runs / media_runs: the slot runs
// ("run", with the whole console output in `log`), posts prepared ahead of a
// slot ("prepare"), catch-up decisions when a slot is owed ("catch-up"), and
// the older one-line records ("generate", "publish", "engagement").
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Search } from 'lucide-react'
import { timeAgo } from './data'
import { BRANDS, ms, useCollection } from './PostsView'
import { Badge, Empty, Glass, Input, Stat, cx } from './ui'

const KINDS = [
  { key: 'all', label: 'All' },
  { key: 'run', label: 'Slot runs' },
  { key: 'prepare', label: 'Prepared' },
  { key: 'catch-up', label: 'Catch-up' },
  { key: 'publish', label: 'Publish' },
  { key: 'generate', label: 'Generate' },
]
const brandLabel = (k) => BRANDS.find((b) => b.key === k)?.label || k
const stamp = (t) => (t ? new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

// Lines worth a colour in a run log.
const lineTone = (l) => (/error|failed|❌|rejected|⚠/i.test(l) ? 'text-red-300'
  : /published!|✅|posted|prepared|queued:/i.test(l) ? 'text-emerald-300'
    : /retry|trying next|held|holding|waiting/i.test(l) ? 'text-amber-200' : 'text-zinc-400')

function LogText({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
      >
        <Copy size={11} /> {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/40 p-3 pr-16 font-mono text-[11.5px] leading-relaxed">
        {text.split('\n').map((l, i) => <div key={i} className={lineTone(l)}>{l || ' '}</div>)}
      </pre>
    </div>
  )
}

function Row({ r }) {
  const [open, setOpen] = useState(false)
  const detail = r.log || r.error || r.summary
  const title = r.summary?.split('\n')[0] || r.error?.split('\n')[0] || r.postId || '—'
  return (
    <div className="py-2">
      <button
        onClick={() => detail && setOpen((o) => !o)}
        className={cx('flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left text-sm', detail ? 'cursor-pointer' : 'cursor-default')}
      >
        <span className="w-4 text-zinc-600">{detail ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}</span>
        <span className={cx('h-2 w-2 shrink-0 rounded-full', r.ok ? 'bg-emerald-400' : 'bg-red-500')} />
        <span className="w-20 text-zinc-300">{brandLabel(r.brandKey)}</span>
        <span className="w-20"><Badge tone={r.ok ? (r.step === 'catch-up' ? 'amber' : 'zinc') : 'red'}>{r.step}</Badge></span>
        <span className={cx('min-w-0 flex-1 truncate text-xs', r.ok ? 'text-zinc-400' : 'text-red-300')}>{title}</span>
        {r.durationS != null && <span className="text-xs tabular-nums text-zinc-600">{Math.round(r.durationS)}s</span>}
        <span className="w-28 text-right text-xs tabular-nums text-zinc-500" title={stamp(ms(r.at))}>{r.at ? `${stamp(ms(r.at))}` : '—'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 pl-7">
          {r.postId && <div className="text-xs text-zinc-500">Post: <span className="text-zinc-300">{r.postId}</span> · {timeAgo(ms(r.at))}</div>}
          {r.summary && r.log && <div className="whitespace-pre-wrap text-xs text-zinc-300">{r.summary}</div>}
          <LogText text={r.log || r.error || r.summary} />
        </div>
      )}
    </div>
  )
}

export default function LogsView() {
  const tt = useCollection('tabletap_runs', 'at', 150)
  const sn = useCollection('media_runs', 'at', 150)
  const [brand, setBrand] = useState('all')
  const [kind, setKind] = useState('all')
  const [failedOnly, setFailedOnly] = useState(false)
  const [q, setQ] = useState('')

  const ready = tt.rows && sn.rows
  const all = useMemo(() => [
    ...(tt.rows || []).map((r) => ({ ...r, brandKey: 'tabletap' })),
    ...(sn.rows || []).map((r) => ({ ...r, brandKey: 'sanero' })),
  ].sort((a, b) => ms(b.at) - ms(a.at)), [tt.rows, sn.rows])

  const inBrand = all.filter((r) => brand === 'all' || r.brandKey === brand)
  const list = inBrand.filter((r) => (kind === 'all' || r.step === kind)
    && (!failedOnly || !r.ok)
    && (!q || `${r.summary} ${r.error} ${r.postId} ${r.log}`.toLowerCase().includes(q.toLowerCase())))

  const day = Date.now() - 86400e3
  const last24 = inBrand.filter((r) => ms(r.at) > day)
  const lastRun = (key) => all.find((r) => r.brandKey === key && r.step === 'run')

  const chip = (active, onClick, label, n) => (
    <button key={label} onClick={onClick} className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition', active ? 'border-white/25 bg-white/[0.1] text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-100')}>
      {label}{n !== undefined && <span className="tabular-nums text-zinc-500">{n}</span>}
    </button>
  )
  const err = tt.error || sn.error

  return (
    <div className="space-y-5">
      {err && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
          Can’t read the run logs ({err}).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Runs, last 24h" value={last24.length} sub={`${last24.filter((r) => !r.ok).length} failed`} />
        <Stat label="Failures, last 24h" value={last24.filter((r) => !r.ok).length} tone={last24.some((r) => !r.ok) ? 'text-red-300' : 'text-zinc-50'} sub="runs that errored" />
        {BRANDS.map((b) => {
          const r = lastRun(b.key)
          return <Stat key={b.key} label={`${b.label} last slot run`} value={r ? (r.ok ? 'OK' : 'Failed') : '—'} tone={r && !r.ok ? 'text-red-300' : 'text-zinc-50'} sub={r ? stamp(ms(r.at)) : 'no full log yet'} />
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip(brand === 'all', () => setBrand('all'), 'All brands', all.length)}
        {BRANDS.map((b) => chip(brand === b.key, () => setBrand(b.key), b.label, all.filter((r) => r.brandKey === b.key).length))}
        <span className="mx-1 h-4 w-px bg-white/10" />
        {KINDS.map((k) => chip(kind === k.key, () => setKind(k.key), k.label))}
        {chip(failedOnly, () => setFailedOnly((v) => !v), 'Failures only')}
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search logs…" className="w-full pl-8" />
        </div>
      </div>

      <Glass className="px-4 py-2">
        {!ready ? <div className="py-3 text-sm text-zinc-500">Loading logs…</div>
          : list.length === 0 ? <Empty>No runs match.</Empty> : (
            <div className="divide-y divide-white/[0.06]">
              {list.map((r) => <Row key={`${r.brandKey}-${r.id}`} r={r} />)}
            </div>
          )}
      </Glass>
      <p className="text-xs text-zinc-600">Full logs start from 20 Nov 2026; older entries have a one-line summary only. Click a row to open its log.</p>
    </div>
  )
}
