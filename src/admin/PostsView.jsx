// Marketing → Posts: every post the Media-man pipeline has made for Table Tap
// and Sanero (queued, published, discarded) plus its recent runs.
//
// Media-man mirrors these into sanero-media with the Admin SDK
// (src/lib/firestore.js there): Sanero into media_posts / media_runs, Table Tap
// into tabletap_posts / tabletap_runs. Read-only here; the rules for both live
// in sanero-next/firestore.rules. Posters are inlined as a small `thumb` data
// URI because the URL a post was published from expires.
import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { ExternalLink, Search, X } from 'lucide-react'
import { db } from './firebase'
import { timeAgo } from './data'
import { Badge, Empty, Glass, Input, Section, Stat, cx } from './ui'

const BRANDS = [
  { key: 'tabletap', label: 'Table Tap', handle: 'table_tap.in', posts: 'tabletap_posts', runs: 'tabletap_runs' },
  { key: 'sanero', label: 'Sanero', handle: 'saneromedia', posts: 'media_posts', runs: 'media_runs' },
]
const STATES = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published', tone: 'green' },
  { key: 'queued', label: 'Queued', tone: 'sky' },
  { key: 'discarded', label: 'Discarded', tone: 'zinc' },
]
const stateTone = (s) => STATES.find((x) => x.key === s)?.tone || 'zinc'

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
const fmt = (v) => (v === null || v === undefined ? '—' : compact.format(v))
const ms = (v) => (v?.toMillis ? v.toMillis() : Date.parse(v || '') || 0)
const when = (p) => ms(p.publishedAt) || ms(p.createdAt)
const day = (t) => (t ? new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

/** Live snapshot of one collection; error is the Firestore code (permission-denied when the rule isn't deployed). */
function useCollection(name, order, max) {
  const [state, setState] = useState({ rows: null, error: null })
  useEffect(() => onSnapshot(
    query(collection(db, name), orderBy(order, 'desc'), ...(max ? [limit(max)] : [])),
    (snap) => setState({ rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null }),
    (e) => setState({ rows: [], error: e.code || e.message })
  ), [name, order, max])
  return state
}

function usePipeline() {
  const ttPosts = useCollection('tabletap_posts', 'createdAt')
  const snPosts = useCollection('media_posts', 'createdAt')
  const ttRuns = useCollection('tabletap_runs', 'at', 40)
  const snRuns = useCollection('media_runs', 'at', 40)
  const tag = (res, brand) => (res.rows || []).map((r) => ({ ...r, brandKey: brand }))
  return {
    ready: [ttPosts, snPosts].every((r) => r.rows),
    errors: { tabletap: ttPosts.error || ttRuns.error, sanero: snPosts.error || snRuns.error },
    posts: [...tag(ttPosts, 'tabletap'), ...tag(snPosts, 'sanero')].sort((a, b) => when(b) - when(a)),
    runs: [...tag(ttRuns, 'tabletap'), ...tag(snRuns, 'sanero')].sort((a, b) => ms(b.at) - ms(a.at)).slice(0, 40),
  }
}

const brandLabel = (k) => BRANDS.find((b) => b.key === k)?.label || k

function PostCard({ p, onOpen }) {
  const m = p.metrics || {}
  return (
    <button onClick={() => onOpen(p)} className="group overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] text-left transition hover:border-white/20">
      <div className="relative aspect-[4/5] bg-white/[0.04]">
        {p.thumb && <img src={p.thumb} alt="" loading="lazy" className={cx('h-full w-full object-cover', p.state === 'discarded' && 'opacity-40 grayscale')} />}
        <div className="absolute left-2 top-2 flex gap-1"><Badge tone={stateTone(p.state)}>{p.state}</Badge></div>
      </div>
      <div className="space-y-1 p-3">
        <div className="line-clamp-2 text-sm text-zinc-100">{p.title || p.postId}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span>{brandLabel(p.brandKey)}</span>·<span>{day(when(p))}</span>{p.pillar && <>·<span className="truncate">{p.pillar}</span></>}
        </div>
        {p.state === 'published' && (
          <div className="flex gap-3 pt-1 text-[11px] text-zinc-400">
            <span><span className="tabular-nums text-zinc-100">{fmt(m.likes)}</span> likes</span>
            <span><span className="tabular-nums text-zinc-100">{fmt(m.comments)}</span> comments</span>
            {m.reach != null && <span><span className="tabular-nums text-zinc-100">{fmt(m.reach)}</span> reach</span>}
          </div>
        )}
      </div>
    </button>
  )
}

function PostDetail({ p, onClose }) {
  useEffect(() => {
    const on = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])
  const m = p.metrics || {}
  const rows = [
    ['Brand', brandLabel(p.brandKey)],
    ['State', p.state],
    ['Pillar', p.pillar],
    ['Created', p.createdAt && new Date(ms(p.createdAt)).toLocaleString('en-IN')],
    ['Published', p.publishedAt && new Date(ms(p.publishedAt)).toLocaleString('en-IN')],
    ['Likes', m.likes != null && fmt(m.likes)],
    ['Comments', m.comments != null && fmt(m.comments)],
    ['Reach', m.reach != null && fmt(m.reach)],
    ['Saves', m.saved != null && fmt(m.saved)],
    ['Shares', m.shares != null && fmt(m.shares)],
    ['Metrics updated', p.metricsAt && timeAgo(ms(p.metricsAt))],
    ['AI cost', p.costUsd != null && `$${Number(p.costUsd).toFixed(3)}`],
    ['IG media id', p.igMediaId],
    ['Post id', p.postId || p.id],
  ].filter(([, v]) => v)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-3" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <Glass className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-zinc-950/90 p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-zinc-500 hover:text-white" aria-label="Close"><X size={18} /></button>
        <div className="grid gap-5 md:grid-cols-[minmax(0,18rem)_1fr]">
          <div>
            {p.thumb ? <img src={p.thumb} alt="" className="w-full rounded-xl border border-white/10" /> : <Empty>No poster.</Empty>}
            {p.permalink && (
              <a href={p.permalink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white">
                <ExternalLink size={14} /> Open on Instagram
              </a>
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <div className="pr-6 text-base font-medium text-white">{p.title || p.postId}</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
              {rows.flatMap(([k, v]) => [<dt key={k} className="text-zinc-500">{k}</dt>, <dd key={`${k}v`} className="truncate text-zinc-200">{v}</dd>])}
            </dl>
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-zinc-600">Caption</div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{p.caption || '—'}</p>
            </div>
            {p.imagePrompt && (
              <div>
                <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-zinc-600">Image prompt</div>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-500">{p.imagePrompt}</p>
              </div>
            )}
          </div>
        </div>
      </Glass>
    </div>
  )
}

function Runs({ runs }) {
  if (!runs.length) return <Empty>No runs recorded yet.</Empty>
  return (
    <div className="divide-y divide-white/[0.06] text-sm">
      {runs.map((r) => (
        <div key={`${r.brandKey}-${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
          <span className={cx('h-2 w-2 rounded-full', r.ok ? 'bg-emerald-400' : 'bg-red-500')} />
          <span className="w-20 text-zinc-300">{brandLabel(r.brandKey)}</span>
          <span className="w-24 text-zinc-400">{r.step}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{r.error ? <span className="text-red-300">{r.error}</span> : r.postId}</span>
          <span className="text-xs tabular-nums text-zinc-500">{r.at ? timeAgo(ms(r.at)) : '—'}</span>
        </div>
      ))}
    </div>
  )
}

export default function PostsView() {
  const { ready, errors, posts, runs } = usePipeline()
  const [brand, setBrand] = useState('all')
  const [state, setState] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const [shown, setShown] = useState(48)

  const inBrand = useMemo(() => posts.filter((p) => brand === 'all' || p.brandKey === brand), [posts, brand])
  const list = useMemo(() => inBrand.filter((p) => {
    if (state !== 'all' && p.state !== state) return false
    const hay = `${p.title} ${p.caption} ${p.pillar} ${p.postId}`.toLowerCase()
    return !q || hay.includes(q.toLowerCase())
  }), [inBrand, state, q])

  const published = inBrand.filter((p) => p.state === 'published')
  const week = published.filter((p) => ms(p.publishedAt) > Date.now() - 7 * 86400e3).length
  const withMetrics = published.filter((p) => p.metrics)
  const avgLikes = withMetrics.length ? withMetrics.reduce((t, p) => t + (p.metrics.likes || 0), 0) / withMetrics.length : null
  const reach = withMetrics.reduce((t, p) => t + (p.metrics.reach || 0), 0)
  const cost = inBrand.reduce((t, p) => t + (Number(p.costUsd) || 0), 0)
  const count = (fn) => inBrand.filter(fn).length

  const chip = (active, onClick, label, n) => (
    <button onClick={onClick} className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition', active ? 'border-white/25 bg-white/[0.1] text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-100')}>
      {label} <span className="tabular-nums text-zinc-500">{n}</span>
    </button>
  )
  const brandErrors = BRANDS.filter((b) => errors[b.key])

  return (
    <div className="space-y-5">
      {brandErrors.map((b) => (
        <div key={b.key} className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
          Can’t read {b.label} posts ({errors[b.key]}).
          {errors[b.key] === 'permission-denied' && <> Deploy the <code>{b.posts}</code> rule: <code>firebase deploy --only firestore:rules</code> in sanero-next.</>}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        {chip(brand === 'all', () => setBrand('all'), 'All brands', posts.length)}
        {BRANDS.map((b) => chip(brand === b.key, () => setBrand(b.key), b.label, posts.filter((p) => p.brandKey === b.key).length))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Published" value={fmt(published.length)} sub={`${week} in the last 7 days`} />
        <Stat label="Queued" value={fmt(count((p) => p.state === 'queued'))} sub="waiting to go out" />
        <Stat label="Avg likes" value={avgLikes === null ? '—' : fmt(avgLikes)} sub={`${withMetrics.length} posts with metrics`} />
        <Stat label="Total reach" value={fmt(reach)} sub="published posts" />
        <Stat label="AI spend" value={`$${cost.toFixed(2)}`} sub="generation cost" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATES.map((s) => chip(state === s.key, () => setState(s.key), s.label, s.key === 'all' ? inBrand.length : count((p) => p.state === s.key)))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and captions…" className="w-full pl-8" />
        </div>
      </div>

      {!ready ? <div className="text-sm text-zinc-500">Loading posts…</div>
        : list.length === 0 ? <Empty>No posts match.</Empty> : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {list.slice(0, shown).map((p) => <PostCard key={`${p.brandKey}-${p.id}`} p={p} onOpen={setOpen} />)}
            </div>
            {list.length > shown && (
              <button onClick={() => setShown((n) => n + 48)} className="w-full rounded-xl border border-white/[0.08] py-2 text-sm text-zinc-400 hover:text-white">
                Show more ({list.length - shown} left)
              </button>
            )}
          </>
        )}

      <Section title="Pipeline runs"><Runs runs={brand === 'all' ? runs : runs.filter((r) => r.brandKey === brand)} /></Section>

      {open && <PostDetail p={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
