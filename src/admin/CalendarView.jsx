// Marketing → Calendar: planned Instagram posts for Table Tap and Sanero, each
// with a date and a draft caption, laid out by month next to what the
// pipeline actually published.
//
// Plans are `plan-<id>` docs in vp_sites ({ kind: 'plan', brand, date, title,
// caption, postId }). Once a published pipeline post (PostsView's usePipeline)
// lands on or a day either side of a plan's date with a similar caption, the
// plan is linked to it automatically; it can also be linked or unlinked by hand.
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Plus, Trash2, X } from 'lucide-react'
import { newId, removeDoc, saveDoc, today } from './data'
import { BRANDS, ms, usePipeline } from './PostsView'
import { Badge, Button, Empty, Input, Section, Select, Stat, Textarea, cx } from './ui'

const IST = 5.5 * 3600e3
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DOT = { tabletap: 'bg-amber-400', sanero: 'bg-violet-400' }
const CHIP = { tabletap: 'border-amber-400/25 bg-amber-400/10 text-amber-100', sanero: 'border-violet-400/25 bg-violet-400/10 text-violet-100' }
const brandLabel = (k) => BRANDS.find((b) => b.key === k)?.label || k

/** The IST calendar day a timestamp falls on, YYYY-MM-DD. */
export const istDay = (t) => (t ? new Date(t + IST).toISOString().slice(0, 10) : '')
const shift = (day, n) => new Date(Date.parse(day) + n * 86400e3).toISOString().slice(0, 10)
const gap = (a, b) => Math.round(Math.abs(Date.parse(a) - Date.parse(b)) / 86400e3)

const words = (s) => new Set(String(s || '').toLowerCase().match(/[a-z0-9]{4,}/g) || [])
/** Share of words two texts have in common (0–1). */
export function similarity(a, b) {
  const x = words(a)
  const y = words(b)
  if (!x.size || !y.size) return 0
  let common = 0
  for (const w of x) if (y.has(w)) common += 1
  return common / Math.min(x.size, y.size)
}

/**
 * The published post a plan most likely became: same brand, within a day of
 * the plan's date, not claimed by another plan. Same day wins on its own; a
 * day off needs the captions to overlap.
 */
export function matchPlan(plan, posts, taken) {
  let best = null
  for (const p of posts) {
    if (p.brandKey !== plan.brand || p.state !== 'published' || taken.has(p.id)) continue
    const d = gap(istDay(ms(p.publishedAt)), plan.date)
    if (d > 1) continue
    const sim = similarity(`${plan.title} ${plan.caption}`, `${p.title} ${p.caption}`)
    if (d === 1 && sim < 0.3) continue
    const score = (d === 0 ? 1 : 0) + sim
    if (!best || score > best.score) best = { post: p, score }
  }
  return best?.post || null
}

export const plansFrom = (docs) => Object.entries(docs || {})
  .filter(([id, d]) => id.startsWith('plan-') && d.kind === 'plan')
  .map(([id, d]) => ({ ...d, id }))
  .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

/** Monday-first weeks covering a month, as arrays of YYYY-MM-DD. */
function weeksOf(month) {
  const first = `${month}-01`
  const start = shift(first, -((new Date(first).getUTCDay() + 6) % 7))
  const weeks = []
  for (let d = start; d.slice(0, 7) <= month; ) {
    const week = []
    for (let i = 0; i < 7; i += 1) { week.push(d); d = shift(d, 1) }
    weeks.push(week)
  }
  return weeks
}
const monthName = (month) => new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const nextMonth = (month, n) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}
const dayLabel = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

const blank = (date) => ({ brand: BRANDS[0].key, date: date || today(), title: '', caption: '' })

function PlanForm({ initial, onSave, onCancel }) {
  const [row, setRow] = useState(initial)
  const ok = row.date && (row.title.trim() || row.caption.trim())
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Select value={row.brand} onChange={(e) => setRow({ ...row, brand: e.target.value })} className="min-w-0" aria-label="Brand">
          {BRANDS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
        </Select>
        <Input type="date" value={row.date} onChange={(e) => setRow({ ...row, date: e.target.value })} className="min-w-0 sm:w-40" aria-label="Date" />
        <Input autoFocus value={row.title} onChange={(e) => setRow({ ...row, title: e.target.value })} placeholder="Idea / title" className="col-span-2 min-w-0 sm:flex-1" />
      </div>
      <Textarea value={row.caption} onChange={(e) => setRow({ ...row, caption: e.target.value })} placeholder="Draft caption" rows={4} />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" disabled={!ok} onClick={() => ok && onSave({ ...row, title: row.title.trim(), caption: row.caption.trim() })}>Save</Button>
      </div>
    </div>
  )
}

function PlanDetail({ plan, post, candidates, onClose }) {
  const [editing, setEditing] = useState(false)
  const update = (patch) => saveDoc(plan.id, patch)
  return (
    <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
      <div className="flex items-start gap-2">
        <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', DOT[plan.brand])} />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-zinc-100">{plan.title || 'Untitled'}</div>
          <div className="text-xs text-zinc-500">{brandLabel(plan.brand)} · {dayLabel(plan.date)}</div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white" aria-label="Close"><X size={16} /></button>
      </div>
      {editing ? (
        <PlanForm initial={{ brand: plan.brand, date: plan.date, title: plan.title || '', caption: plan.caption || '' }} onCancel={() => setEditing(false)} onSave={(row) => { update(row); setEditing(false) }} />
      ) : (
        <>
          {plan.caption ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{plan.caption}</p> : <p className="text-sm text-zinc-600">No draft caption.</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {post ? (
              <>
                <Badge tone="green">Posted {istDay(ms(post.publishedAt)) === plan.date ? 'on the day' : dayLabel(istDay(ms(post.publishedAt)))}</Badge>
                {post.permalink && <a href={post.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-zinc-300 hover:text-white"><ExternalLink size={12} /> {post.title || 'Open post'}</a>}
              </>
            ) : <span className="text-zinc-500">Not matched to a published post yet.</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={plan.postId || ''}
              onChange={(e) => update(e.target.value ? { postId: e.target.value, matchedBy: 'hand' } : { postId: null, matchedBy: 'none' })}
              className="min-w-0 max-w-full py-1 text-xs sm:text-xs"
              aria-label="Published post"
            >
              <option value="">No published post</option>
              {candidates.map((p) => <option key={p.id} value={p.id}>{dayLabel(istDay(ms(p.publishedAt)))} · {(p.title || p.postId || p.id).slice(0, 60)}</option>)}
            </Select>
            <Button className="px-2 py-1 text-xs" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" className="ml-auto px-2 py-1 text-xs" onClick={() => { removeDoc(plan.id); onClose() }}><Trash2 size={12} /> Delete</Button>
          </div>
        </>
      )}
    </div>
  )
}

export default function CalendarView({ docs }) {
  const { ready, posts } = usePipeline()
  const plans = useMemo(() => plansFrom(docs), [docs])
  const [brand, setBrand] = useState('all')
  const [month, setMonth] = useState(today().slice(0, 7))
  const [adding, setAdding] = useState(null) // date being added, or null
  const [open, setOpen] = useState(null)

  const published = useMemo(() => posts.filter((p) => p.state === 'published' && p.publishedAt), [posts])
  const postById = useMemo(() => Object.fromEntries(published.map((p) => [p.id, p])), [published])

  // Link plans to the posts they became. Runs once the pipeline posts have
  // loaded; a plan unlinked by hand (matchedBy 'none') is left alone.
  useEffect(() => {
    if (!ready) return
    const taken = new Set(plans.map((p) => p.postId).filter(Boolean))
    for (const plan of plans) {
      if (plan.postId || plan.matchedBy === 'none' || plan.date > today()) continue
      const hit = matchPlan(plan, published, taken)
      if (hit) { taken.add(hit.id); saveDoc(plan.id, { postId: hit.id, matchedBy: 'auto' }) }
    }
  }, [ready, plans, published])

  const shownPlans = plans.filter((p) => brand === 'all' || p.brand === brand)
  const linked = new Set(plans.map((p) => p.postId).filter(Boolean))
  const shownPosts = published.filter((p) => (brand === 'all' || p.brandKey === brand) && !linked.has(p.id))
  const byDay = {}
  for (const p of shownPlans) (byDay[p.date] ||= { plans: [], posts: [] }).plans.push(p)
  for (const p of shownPosts) (byDay[istDay(ms(p.publishedAt))] ||= { plans: [], posts: [] }).posts.push(p)

  const t = today()
  const upcoming = shownPlans.filter((p) => p.date >= t && !p.postId)
  const missed = shownPlans.filter((p) => p.date < t && !p.postId)
  const done = shownPlans.filter((p) => p.postId)
  const week = shownPlans.filter((p) => p.date >= t && p.date <= shift(t, 6)).length

  const add = (row) => {
    saveDoc(`plan-${newId()}`, { kind: 'plan', ...row, postId: null, createdAt: Date.now() })
    setMonth(row.date.slice(0, 7))
    setAdding(null)
  }
  const openPlan = plans.find((p) => p.id === open)
  const candidates = openPlan
    ? published.filter((p) => p.brandKey === openPlan.brand && gap(istDay(ms(p.publishedAt)), openPlan.date) <= 7 && (!linked.has(p.id) || p.id === openPlan.postId))
    : []
  const monthDays = Object.keys(byDay).filter((d) => d.startsWith(month)).sort()

  const chip = (active, onClick, label) => (
    <button key={label} onClick={onClick} className={cx('rounded-full border px-3 py-1 text-xs transition', active ? 'border-white/25 bg-white/[0.1] text-white' : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-100')}>{label}</button>
  )
  const planChip = (p) => (
    <button key={p.id} onClick={() => setOpen(p.id)} className={cx('block w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px]', CHIP[p.brand], open === p.id && 'ring-1 ring-white/50', !p.postId && p.date < t && 'opacity-60')}>
      {p.postId ? '✓ ' : ''}{p.title || p.caption || 'Untitled'}
    </button>
  )
  const postLine = (p) => (
    <a key={p.id} href={p.permalink || undefined} target="_blank" rel="noreferrer" title={`Published, not planned: ${p.title || ''}`} className="flex items-center gap-1 truncate text-[11px] text-zinc-500 hover:text-zinc-200">
      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', DOT[p.brandKey])} />{p.title || 'post'}
    </a>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Planned ahead" value={upcoming.length} sub={`${week} in the next 7 days`} />
        <Stat label="Posted as planned" value={done.length} sub="matched to a published post" />
        <Stat label="Missed" value={missed.length} sub="date passed, nothing matched" tone={missed.length ? 'text-amber-300' : 'text-zinc-50'} />
        <Stat label="Unplanned posts" value={shownPosts.filter((p) => istDay(ms(p.publishedAt)).startsWith(month)).length} sub={`published in ${monthName(month).split(' ')[0]}`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip(brand === 'all', () => setBrand('all'), 'All brands')}
        {BRANDS.map((b) => chip(brand === b.key, () => setBrand(b.key), b.label))}
        <Button variant="glass" className="ml-auto" onClick={() => setAdding(t)}><Plus size={14} /> Plan a post</Button>
      </div>

      {adding && (
        <Section title="New planned post">
          <PlanForm initial={blank(adding)} onCancel={() => setAdding(null)} onSave={add} />
        </Section>
      )}
      {openPlan && <PlanDetail key={openPlan.id} plan={openPlan} post={postById[openPlan.postId]} candidates={candidates} onClose={() => setOpen(null)} />}

      <Section
        title={monthName(month)}
        action={(
          <div className="flex items-center gap-1">
            <button onClick={() => setMonth((m) => nextMonth(m, -1))} className="rounded-md p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white" aria-label="Previous month"><ChevronLeft size={16} /></button>
            <button onClick={() => setMonth(t.slice(0, 7))} className="rounded-md px-2 py-0.5 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white">Today</button>
            <button onClick={() => setMonth((m) => nextMonth(m, 1))} className="rounded-md p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white" aria-label="Next month"><ChevronRight size={16} /></button>
          </div>
        )}
      >
        {!ready && <div className="mb-3 text-xs text-zinc-500">Loading published posts…</div>}

        <div className="hidden sm:block">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-zinc-500">{DOW.map((d) => <div key={d}>{d}</div>)}</div>
          {weeksOf(month).map((wk) => (
            <div key={wk[0]} className="mt-1 grid grid-cols-7 gap-1">
              {wk.map((d) => {
                const cell = byDay[d]
                const other = !d.startsWith(month)
                return (
                  <div key={d} className={cx('group min-h-[6.5rem] rounded-lg border p-1.5', d === t ? 'border-white/30 bg-white/[0.05]' : 'border-white/[0.06] bg-white/[0.02]', other && 'opacity-40')}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className={cx('text-[11px] tabular-nums', d === t ? 'text-white' : 'text-zinc-500')}>{Number(d.slice(8))}</span>
                      <button onClick={() => setAdding(d)} className="text-zinc-600 opacity-0 hover:text-white group-hover:opacity-100" aria-label={`Plan a post on ${d}`}><Plus size={12} /></button>
                    </div>
                    <div className="space-y-0.5">
                      {cell?.plans.map(planChip)}
                      {cell?.posts.slice(0, 3).map(postLine)}
                      {cell?.posts.length > 3 && <div className="text-[10px] text-zinc-600">+{cell.posts.length - 3} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
            {BRANDS.map((b) => <span key={b.key} className="flex items-center gap-1.5"><span className={cx('h-2 w-2 rounded-full', DOT[b.key])} />{b.label}</span>)}
            <span>Boxes are plans (✓ = posted) · plain lines are posts published without a plan</span>
          </div>
        </div>

        <div className="space-y-3 sm:hidden">
          {monthDays.length === 0 ? <Empty>Nothing planned or posted this month.</Empty> : monthDays.map((d) => (
            <div key={d}>
              <div className={cx('mb-1 text-xs', d === t ? 'text-white' : 'text-zinc-500')}>{dayLabel(d)}</div>
              <div className="space-y-1">
                {byDay[d].plans.map(planChip)}
                {byDay[d].posts.map(postLine)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {plans.length === 0 && (
        <Empty>No posts planned yet. Pick a day in the calendar or use “Plan a post” to add an idea with a draft caption.</Empty>
      )}
    </div>
  )
}
