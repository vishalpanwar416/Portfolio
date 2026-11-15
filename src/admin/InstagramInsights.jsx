// Instagram → per-account analysis drawn from data the tab already loads:
// best day and time to post and which formats do best (from the account's
// last 100 posts), and the follower trend (from the daily snapshots that
// api/admin/_routes/instagram.js keeps in vp_sites igstats-<key>).
import { useState } from 'react'
import { Empty, Section, cx } from './ui'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// Three-hour blocks: 100 posts spread over 168 single hours is mostly empty cells.
const BLOCKS = [0, 3, 6, 9, 12, 15, 18, 21]
const TYPES = { IMAGE: 'Post', CAROUSEL_ALBUM: 'Carousel', VIDEO: 'Video', REEL: 'Reel' }
const IST = 5.5 * 3600e3

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
const fmt = (v) => (v === null || v === undefined ? '—' : compact.format(v))
const hour = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`
export const blockLabel = (b) => `${hour(b)}–${hour((b + 3) % 24)}`

/** Likes + comments: the two counts every post has, whatever its age or type. */
export const engagement = (p) => (p.likes || 0) + (p.comments || 0)

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/** IST weekday (0 = Monday) and 3-hour block of a post. */
export function slotOf(at) {
  const d = new Date(Date.parse(at) + IST)
  return { day: (d.getUTCDay() + 6) % 7, block: Math.floor(d.getUTCHours() / 3) * 3 }
}

/**
 * Average engagement by weekday × time block, plus the best day, block and
 * slot. A best pick needs at least two posts so one viral post can't decide it.
 */
export function bestTimes(posts) {
  const dated = posts.filter((p) => p.at)
  const cells = {}
  const byDay = {}
  const byBlock = {}
  for (const p of dated) {
    const { day, block } = slotOf(p.at)
    const e = engagement(p)
    ;(cells[`${day}-${block}`] ||= []).push(e)
    ;(byDay[day] ||= []).push(e)
    ;(byBlock[block] ||= []).push(e)
  }
  const top = (groups) => Object.entries(groups)
    .filter(([, xs]) => xs.length >= 2)
    .map(([k, xs]) => ({ key: k, avg: mean(xs), n: xs.length }))
    .sort((a, b) => b.avg - a.avg)[0] || null
  const grid = Object.fromEntries(Object.entries(cells).map(([k, xs]) => [k, { avg: mean(xs), n: xs.length }]))
  return { posts: dated.length, grid, bestDay: top(byDay), bestBlock: top(byBlock), bestSlot: top(cells) }
}

/** Per-format averages, best average engagement first. */
export function formatStats(posts) {
  const by = {}
  for (const p of posts) (by[p.type] ||= []).push(p)
  const avgOf = (list, k) => mean(list.map((p) => p[k]).filter((v) => typeof v === 'number'))
  return Object.entries(by)
    .map(([type, list]) => ({
      type, label: TYPES[type] || type, n: list.length,
      engagement: mean(list.map(engagement)), likes: avgOf(list, 'likes'), comments: avgOf(list, 'comments'),
      reach: avgOf(list, 'reach'), saved: avgOf(list, 'saved'),
    }))
    .sort((a, b) => b.engagement - a.engagement)
}

/** Follower snapshots as [{ day, n }] oldest first, and the change over `days`. */
export function followerSeries(daily, days) {
  const all = Object.entries(daily || {})
    .filter(([, n]) => typeof n === 'number')
    .map(([day, n]) => ({ day, n }))
    .sort((a, b) => a.day.localeCompare(b.day))
  const from = new Date(Date.now() + IST - days * 86400e3).toISOString().slice(0, 10)
  const points = all.filter((p) => p.day >= from)
  const change = points.length > 1 ? points.at(-1).n - points[0].n : null
  return { all, points, change }
}

export function BestTime({ posts }) {
  const t = bestTimes(posts)
  const formats = formatStats(posts)
  if (t.posts < 4) return null
  const max = Math.max(1, ...Object.values(t.grid).map((c) => c.avg))
  const slot = t.bestSlot && t.bestSlot.key.split('-').map(Number)
  return (
    <Section title={`Best time to post · last ${t.posts} posts`}>
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {slot && <span><span className="text-zinc-500">Best slot</span> <span className="text-zinc-100">{DAYS[slot[0]]} {blockLabel(slot[1])}</span> <span className="text-xs text-zinc-500">· {fmt(t.bestSlot.avg)} avg · {t.bestSlot.n} posts</span></span>}
        {t.bestDay && <span><span className="text-zinc-500">Best day</span> <span className="text-zinc-100">{DAYS[t.bestDay.key]}</span> <span className="text-xs text-zinc-500">· {fmt(t.bestDay.avg)} avg</span></span>}
        {t.bestBlock && <span><span className="text-zinc-500">Best time</span> <span className="text-zinc-100">{blockLabel(Number(t.bestBlock.key))}</span> <span className="text-xs text-zinc-500">· {fmt(t.bestBlock.avg)} avg</span></span>}
      </div>

      <div className="overflow-x-auto [scrollbar-width:none]">
        <table className="w-full min-w-[30rem] border-separate border-spacing-1 text-[10px]">
          <thead>
            <tr><th />{BLOCKS.map((b) => <th key={b} className="font-normal text-zinc-500">{blockLabel(b)}</th>)}</tr>
          </thead>
          <tbody>
            {DAYS.map((d, di) => (
              <tr key={d}>
                <th className="w-8 pr-1 text-right font-normal text-zinc-500">{d}</th>
                {BLOCKS.map((b) => {
                  const c = t.grid[`${di}-${b}`]
                  const best = slot && slot[0] === di && slot[1] === b
                  return (
                    <td
                      key={b}
                      title={c ? `${d} ${blockLabel(b)} · ${fmt(c.avg)} avg engagement · ${c.n} post${c.n === 1 ? '' : 's'}` : `${d} ${blockLabel(b)} · no posts`}
                      className={cx('h-7 rounded-md text-center tabular-nums', best && 'ring-1 ring-emerald-300/70', c ? 'text-zinc-100' : 'text-zinc-700')}
                      style={{ background: c ? `rgba(52, 211, 153, ${0.08 + 0.6 * (c.avg / max)})` : 'rgba(255,255,255,0.02)' }}
                    >
                      {c ? c.n : '·'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-zinc-600">Times in IST. Shade is average likes + comments per post; the number is how many posts went out in that slot.</div>

      {formats.length > 0 && (
        <div className="mt-5 overflow-x-auto [scrollbar-width:none]">
          <table className="w-full min-w-[26rem] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>{['Format', 'Posts', 'Avg likes', 'Avg comments', 'Avg reach', 'Avg saves'].map((h) => <th key={h} className="pb-2 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] tabular-nums text-zinc-300">
              {formats.map((f, i) => (
                <tr key={f.type}>
                  <td className="py-1.5 text-zinc-100">{f.label}{i === 0 && formats.length > 1 && <span className="ml-1.5 text-[10px] text-emerald-300">best</span>}</td>
                  <td>{f.n}</td><td>{fmt(f.likes)}</td><td>{fmt(f.comments)}</td><td>{fmt(f.reach)}</td><td>{fmt(f.saved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-zinc-600">Reach and saves come from the 12 newest posts only (one API call each).</div>
        </div>
      )}
    </Section>
  )
}

const RANGES = [30, 90]

export function FollowerTrend({ daily }) {
  const [days, setDays] = useState(30)
  const { all, points, change } = followerSeries(daily, days)
  const W = 600
  const H = 90
  const lo = Math.min(...points.map((p) => p.n))
  const hi = Math.max(...points.map((p) => p.n))
  const span = Math.max(1, hi - lo)
  const t0 = points.length ? Date.parse(points[0].day) : 0
  const t1 = points.length ? Date.parse(points.at(-1).day) : 1
  const x = (p) => ((Date.parse(p.day) - t0) / Math.max(1, t1 - t0)) * W
  const y = (p) => H - 6 - ((p.n - lo) / span) * (H - 12)
  const line = points.map((p) => `${x(p).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
  const sign = (n) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : '±0')

  return (
    <Section
      title="Followers"
      action={(
        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {RANGES.map((d) => (
            <button key={d} onClick={() => setDays(d)} className={cx('rounded-md px-2.5 py-1 text-xs', d === days ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-zinc-100')}>{d}d</button>
          ))}
        </div>
      )}
    >
      {points.length < 2 ? (
        <Empty>
          {all.length ? `Tracking since ${all[0].day}. The chart fills in from one count a day.` : 'No snapshots yet. One is saved each day (and whenever this page loads).'}
        </Empty>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-4 text-sm">
            <span className="tabular-nums text-zinc-100">{fmt(points.at(-1).n)}</span>
            <span className={cx('tabular-nums', change > 0 ? 'text-emerald-300' : change < 0 ? 'text-red-300' : 'text-zinc-400')}>{sign(change)}</span>
            <span className="text-xs text-zinc-500">since {points[0].day}{points.length < days / 2 && ` · ${points.length} days tracked`}</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[90px] w-full rounded-lg bg-white/[0.02]" role="img" aria-label={`Followers from ${fmt(points[0].n)} to ${fmt(points.at(-1).n)}`}>
            <polygon points={`0,${H} ${line} ${W},${H}`} fill="rgba(255,255,255,0.06)" />
            <polyline points={line} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          <div className="mt-1 text-[10px] tabular-nums text-zinc-600">Low {fmt(lo)} · high {fmt(hi)}</div>
        </>
      )}
    </Section>
  )
}
