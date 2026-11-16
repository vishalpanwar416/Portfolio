// Jobs: openings at product companies and banks in India, pulled from
// FAANGPlus and kept in vp_jobs, one doc per opening. The server does the sync
// (api/admin/_routes/jobs.js), every morning on its own and from the Sync
// button: it merges the listing fields in and leaves the status, notes and
// applied date set here alone; openings FAANGPlus drops are marked `gone`.
// Defaults to software engineering roles at multinationals.
import { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { Briefcase, Building2, CheckCircle2, Download, ExternalLink, RefreshCw, Search, Send, X } from 'lucide-react'
import { db, JOBS_COLLECTION } from './firebase'
import { api, downloadCsv, timeAgo, today } from './data'
import { Badge, Button, Empty, Glass, Input, Select, Stat, Tag, Textarea, cx } from './ui'

export const JOB_STATUSES = [
  { key: 'new', label: 'New', tone: 'zinc' },
  { key: 'saved', label: 'Saved', tone: 'sky' },
  { key: 'applied', label: 'Applied', tone: 'amber' },
  { key: 'interviewing', label: 'Interviewing', tone: 'amber' },
  { key: 'offer', label: 'Offer', tone: 'green' },
  { key: 'rejected', label: 'Rejected', tone: 'red' },
  { key: 'skipped', label: 'Skipped', tone: 'zinc' },
]
const statusOf = (j) => j.status || 'new'
const tone = (s) => JOB_STATUSES.find((x) => x.key === s)?.tone || 'zinc'
const IN_PLAY = ['applied', 'interviewing', 'offer']

const SCOPES = [
  { key: 'sde-mnc', label: 'SDE · multinationals', test: (j) => j.sde && j.mnc },
  { key: 'sde', label: 'All SDE', test: (j) => j.sde },
  { key: 'all', label: 'All openings', test: () => true },
]
const EXPERIENCE = [
  { key: 'any', label: 'Any experience' },
  { key: '0-3', label: '0–3 yrs', lo: 0, hi: 3 },
  { key: '3-6', label: '3–6 yrs', lo: 3, hi: 6 },
  { key: '6-10', label: '6–10 yrs', lo: 6, hi: 10 },
  { key: '10+', label: '10+ yrs', lo: 10, hi: 99 },
]
// A role fits a band when the years it asks for (its minimum) fall inside it.
const inBand = (j, band) => band.key === 'any' || (j.minYears !== null && j.minYears !== undefined && j.minYears >= band.lo && j.minYears < band.hi)

export const years = (j) => {
  const lo = j.minYears
  const hi = j.maxYears
  if (lo === null || lo === undefined) return null
  if (hi === null || hi === undefined) return `${lo}+ yrs`
  return hi === lo ? `${lo} yrs` : `${lo}–${hi} yrs`
}
const day = (s) => {
  const t = Date.parse(s || '')
  return Number.isNaN(t) ? '—' : new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function useJobs() {
  const [state, setState] = useState({ jobs: null, error: null })
  useEffect(() => onSnapshot(
    collection(db, JOBS_COLLECTION),
    (snap) => setState({ jobs: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
    (e) => setState({ jobs: [], error: e.code || e.message })
  ), [])
  return state
}

const saveJob = (id, patch) => setDoc(doc(db, JOBS_COLLECTION, id), { ...patch, updatedAt: Date.now() }, { merge: true })

// First seen in the last two days: the daily sync's new arrivals.
const isFresh = (j) => !j.gone && Date.now() - (Date.parse(j.firstSeenAt || '') || 0) < 2 * 864e5

function StatusSelect({ job, className }) {
  return (
    <Select
      value={statusOf(job)}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const status = e.target.value
        saveJob(job.id, { status, ...(status === 'applied' && !job.appliedOn ? { appliedOn: today() } : {}) })
      }}
      className={cx('py-1 text-xs sm:text-xs', className)}
      aria-label={`Status of ${job.title}`}
    >
      {JOB_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
    </Select>
  )
}

function JobRow({ j, onOpen }) {
  const s = statusOf(j)
  return (
    <li
      onClick={() => onOpen(j)}
      className={cx('cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition hover:border-white/15', j.gone && 'opacity-60')}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-medium text-zinc-400">{j.company}</span>
            {s !== 'new' && <Badge tone={tone(s)}>{JOB_STATUSES.find((x) => x.key === s)?.label}</Badge>}
            {j.gone && <Badge tone="red">No longer listed</Badge>}
            {isFresh(j) && <Badge tone="green">New</Badge>}
          </div>
          <div className="mt-0.5 text-sm font-medium text-zinc-100">{j.title}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
            {years(j) && <span>{years(j)}</span>}
            {j.location && <span className="max-w-[28rem] truncate">{j.location}</span>}
            <span>posted {day(j.postedAt)}</span>
            {j.appliedOn && <span>applied {day(j.appliedOn)}</span>}
          </div>
          {j.stack?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {j.stack.slice(0, 6).map((t) => <Tag key={t}>{t}</Tag>)}
              {j.stack.length > 6 && <span className="text-[11px] text-zinc-600">+{j.stack.length - 6}</span>}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusSelect job={j} className="w-32" />
          {j.url && (
            <a href={j.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
              Apply <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

function Block({ title, children }) {
  if (!children) return null
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-zinc-600">{title}</div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{children}</p>
    </div>
  )
}

function JobDetail({ j, onClose }) {
  const [notes, setNotes] = useState(j.notes || '')
  useEffect(() => {
    const on = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])
  const rows = [
    // The feed's own text only adds something when it lists several ("8 years, 5 years, 3 years").
    ['Experience', [years(j), j.experience?.includes(',') && `(${j.experience})`].filter(Boolean).join(' ') || j.experience],
    ['Location', j.location],
    ['Type', j.employmentType],
    ['Posted', j.postedAt && new Date(j.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
    ['Applied on', j.appliedOn && day(j.appliedOn)],
    ['Role', [j.sde ? 'Software engineering' : 'Other role', j.mnc ? 'multinational' : 'Indian company'].join(' · ')],
    ['Job id', j.jobId],
    ['Listing', j.gone ? `dropped by FAANGPlus ${day(j.goneAt)}` : j.syncedAt && `seen on FAANGPlus ${timeAgo(Date.parse(j.syncedAt))}`],
  ].filter(([, v]) => v)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-3" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <Glass className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-zinc-950/90 p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-zinc-500 hover:text-white" aria-label="Close"><X size={18} /></button>
        <div className="pr-6 text-xs font-medium text-zinc-400">{j.company}</div>
        <div className="pr-6 text-lg font-medium text-white">{j.title}</div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {j.url && (
            <a href={j.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm text-black hover:bg-zinc-200">
              Apply on {j.company} <ExternalLink size={13} />
            </a>
          )}
          <StatusSelect job={j} className="w-36" />
        </div>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          {rows.flatMap(([k, v]) => [<dt key={k} className="text-zinc-500">{k}</dt>, <dd key={`${k}v`} className="text-zinc-200">{v}</dd>])}
        </dl>
        {j.stack?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{j.stack.map((t) => <Tag key={t}>{t}</Tag>)}</div>}
        <div className="mt-4">
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-zinc-600">Your notes</div>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (j.notes || '') && saveJob(j.id, { notes })}
            placeholder="Referral, recruiter, interview rounds…"
          />
        </div>
        <div className="mt-5 space-y-4">
          <Block title="Qualifications">{j.qualifications}</Block>
          <Block title="Responsibilities">{j.responsibilities}</Block>
          <Block title="About the role">{j.description}</Block>
        </div>
      </Glass>
    </div>
  )
}

export default function JobsView() {
  const { jobs, error } = useJobs()
  const [scope, setScope] = useState('sde-mnc')
  const [status, setStatus] = useState('open')
  const [company, setCompany] = useState('')
  const [exp, setExp] = useState('any')
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(60)
  const [openId, setOpenId] = useState(null)
  const [sync, setSync] = useState({ busy: false, msg: null, error: null })

  const all = useMemo(() => jobs || [], [jobs])
  const inScope = useMemo(() => all.filter(SCOPES.find((s) => s.key === scope).test), [all, scope])
  const companies = useMemo(() => [...new Set(inScope.map((j) => j.company))].sort((a, b) => a.localeCompare(b)), [inScope])
  const list = useMemo(() => {
    const band = EXPERIENCE.find((e) => e.key === exp)
    const needle = q.trim().toLowerCase()
    return inScope
      .filter((j) => {
        const s = statusOf(j)
        if (status === 'open' ? (j.gone && s === 'new') || s === 'skipped' || s === 'rejected' : s !== status) return false
        if (company && j.company !== company) return false
        if (!inBand(j, band)) return false
        return !needle || `${j.company} ${j.title} ${j.location} ${(j.stack || []).join(' ')}`.toLowerCase().includes(needle)
      })
      .sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || '') || a.company.localeCompare(b.company))
  }, [inScope, status, company, exp, q])

  const live = all.filter((j) => !j.gone)
  const lastSync = all.reduce((m, j) => Math.max(m, Date.parse(j.syncedAt || '') || 0), 0)
  const count = (s) => inScope.filter((j) => statusOf(j) === s).length
  const open = all.find((j) => j.id === openId)

  const runSync = async () => {
    setSync({ busy: true, msg: null, error: null })
    try {
      const r = await api('/api/admin/jobs', { method: 'POST' })
      setSync({ busy: false, msg: `${r.listed} openings synced${r.added && !r.seeded ? `, ${r.added} new` : ''}${r.gone ? `, ${r.gone} no longer listed` : ''}.`, error: null })
    } catch (e) {
      setSync({ busy: false, msg: null, error: e.message })
    }
  }

  const exportCsv = () => downloadCsv(`jobs-${today()}.csv`, list.map((j) => ({
    company: j.company, title: j.title, experience: years(j) || '', location: j.location || '', status: statusOf(j),
    applied_on: j.appliedOn || '', posted: (j.postedAt || '').slice(0, 10), stack: (j.stack || []).join(', '), notes: j.notes || '', url: j.url || '',
  })))

  const chip = (active, onClick, label, n) => (
    <button key={label} onClick={onClick} className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition', active ? 'border-white/25 bg-white/[0.1] text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-100')}>
      {label} {n !== undefined && <span className="tabular-nums text-zinc-500">{n}</span>}
    </button>
  )

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
          Can’t read saved jobs ({error}).
          {error === 'permission-denied' && <> Deploy the <code>vp_jobs</code> rule: <code>firebase deploy --only firestore:rules --project sanero-media</code> in sanero-next.</>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs text-zinc-500">
          From <a href="https://www.faangplus.com/browse/explore/openings" target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white">FAANGPlus openings</a>
          {lastSync ? ` · synced ${timeAgo(lastSync)}, again every morning at 8` : ''}
          {sync.msg && <span className="text-emerald-300"> · {sync.msg}</span>}
          {sync.error && <span className="text-red-300"> · sync failed: {sync.error}</span>}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="glass" onClick={exportCsv} disabled={!list.length}><Download size={14} /> <span className="hidden sm:inline">Export</span></Button>
          <Button variant="glass" onClick={runSync} disabled={sync.busy || !!error}>
            <RefreshCw size={14} className={sync.busy ? 'animate-spin' : ''} /> {sync.busy ? 'Syncing…' : 'Sync'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Openings listed" value={live.length} icon={Briefcase} sub={`${new Set(live.map((j) => j.company)).size} companies`} />
        <Stat label="SDE · multinationals" value={live.filter((j) => j.sde && j.mnc).length} icon={Building2} sub={`${live.filter((j) => j.sde).length} SDE roles in all`} />
        <Stat label="Applied" value={all.filter((j) => IN_PLAY.includes(statusOf(j))).length} icon={Send} sub={`${all.filter((j) => statusOf(j) === 'saved').length} saved to apply`} tone="text-amber-200" />
        <Stat label="Interviews · offers" value={`${all.filter((j) => statusOf(j) === 'interviewing').length} · ${all.filter((j) => statusOf(j) === 'offer').length}`} icon={CheckCircle2} sub="in progress" tone="text-emerald-200" />
      </div>

      <Glass className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => chip(scope === s.key, () => { setScope(s.key); setCompany('') }, s.label, all.filter((j) => !j.gone && s.test(j)).length))}
        </div>
        <div className="flex flex-wrap gap-2">
          {chip(status === 'open', () => setStatus('open'), 'Open')}
          {JOB_STATUSES.map((s) => chip(status === s.key, () => setStatus(s.key), s.label, count(s.key)))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <div className="relative col-span-2 sm:min-w-[16rem] sm:flex-1">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, company, stack, city…" className="w-full pl-8" />
          </div>
          <Select value={company} onChange={(e) => setCompany(e.target.value)} className="min-w-0 sm:w-48" aria-label="Company">
            <option value="">All companies ({companies.length})</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={exp} onChange={(e) => setExp(e.target.value)} className="min-w-0 sm:w-40" aria-label="Experience">
            {EXPERIENCE.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </Select>
        </div>
      </Glass>

      {jobs === null ? <div className="text-sm text-zinc-500">Loading jobs…</div>
        : all.length === 0 ? (
          <Empty>
            No jobs saved yet.{' '}
            {!error && <button onClick={runSync} disabled={sync.busy} className="text-zinc-200 underline decoration-white/20 hover:text-white">Sync from FAANGPlus</button>}
          </Empty>
        ) : list.length === 0 ? <Empty>No openings match.</Empty> : (
          <>
            <div className="text-xs text-zinc-500">{list.length} opening{list.length === 1 ? '' : 's'}</div>
            <ul className="space-y-2.5">{list.slice(0, shown).map((j) => <JobRow key={j.id} j={j} onOpen={(x) => setOpenId(x.id)} />)}</ul>
            {list.length > shown && (
              <button onClick={() => setShown((n) => n + 60)} className="w-full rounded-xl border border-white/[0.08] py-2 text-sm text-zinc-400 hover:text-white">
                Show more ({list.length - shown} left)
              </button>
            )}
          </>
        )}

      {open && <JobDetail key={open.id} j={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}
