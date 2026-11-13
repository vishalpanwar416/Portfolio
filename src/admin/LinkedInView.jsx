// LinkedIn outreach: the two campaigns run by the linkedin-followup-dms
// scheduled task. Read-only — the trackers live on the laptop and arrive via
// the laptop agent as vp_sites/linkedin (api/admin/_routes/linkedin.js).
import { useState } from 'react'
import { ExternalLink, Linkedin, MessageSquareReply, UserPlus, Users } from 'lucide-react'
import { timeAgo } from './data'
import { Badge, ConnectHint, Empty, Section, Stat, cx } from './ui'

const DAY_CAP = 15
const WEEK_CAP = 60

const istDay = (ms) => new Date(ms + 5.5 * 3600e3).toISOString().slice(0, 10)

const STATUS = {
  requested: { label: 'Pending', tone: 'amber' },
  accepted_messaged: { label: 'Messaged', tone: 'green' },
  stale: { label: 'Stale', tone: 'zinc' },
  no_connect: { label: 'No connect', tone: 'zinc' },
  skipped: { label: 'Skipped', tone: 'zinc' },
}

/** Who has written back and is waiting on Vishal, from both campaigns. */
export const linkedinReplies = (li) => [
  ...(li?.prospects || []).filter((p) => p.awaitingReply).map((p) => ({ ...p, campaign: 'New' })),
  ...(li?.targets || []).filter((t) => t.awaitingReply).map((t) => ({ ...t, campaign: 'Old' })),
]

export function requestCounts(li, now = Date.now()) {
  const log = Object.fromEntries((li?.requestLog || []).map((d) => [d.day, d.n]))
  let week = 0
  for (let i = 0; i < 7; i++) week += log[istDay(now - i * 86400e3)] || 0
  const days = Array.from({ length: 14 }, (_, i) => istDay(now - (13 - i) * 86400e3))
  return { today: log[istDay(now)] || 0, week, days: days.map((d) => ({ day: d, n: log[d] || 0 })) }
}

// Tracker dates are IST strings like "2026-11-13T12:04+05:30" or
// "2026-11-13 (seen on re-run)"; the day is all a row needs.
const shortDate = (s) => {
  const t = Date.parse(`${String(s || '').slice(0, 10)}T00:00:00`)
  return Number.isNaN(t) ? null : new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function Person({ p, children, right }) {
  return (
    <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {p.profile ? (
              <a href={p.profile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-zinc-100 hover:text-white">
                {p.name} <ExternalLink size={11} className="text-zinc-600" />
              </a>
            ) : <span className="font-medium text-zinc-100">{p.name}</span>}
            {right}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">{[p.role, p.org].filter(Boolean).join(' · ')}</div>
          {children}
        </div>
      </div>
    </li>
  )
}

const Meta = ({ items }) => {
  const list = items.filter(Boolean)
  return list.length ? <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">{list.map((x) => <span key={x}>{x}</span>)}</div> : null
}

const Quote = ({ children, tone = 'text-zinc-300' }) => (
  <p className={cx('mt-2 whitespace-pre-line rounded-lg border border-white/[0.05] bg-black/30 px-3 py-2 text-xs leading-relaxed', tone)}>{children}</p>
)

function DayBars({ days }) {
  const max = Math.max(DAY_CAP / 3, ...days.map((d) => d.n))
  return (
    <div className="flex h-16 items-end gap-1">
      {days.map((d, i) => (
        <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d.n}`}>
          <div className={cx('w-full rounded-t', i === days.length - 1 ? 'bg-white/70' : d.n ? 'bg-white/25' : 'bg-white/[0.05]')} style={{ height: `${Math.max(d.n ? 8 : 3, (d.n / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  )
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'requested', label: 'Pending' },
  { key: 'accepted_messaged', label: 'Messaged' },
  { key: 'other', label: 'Other' },
]

export default function LinkedInView({ data }) {
  const li = data.docs?.linkedin
  const [filter, setFilter] = useState('all')

  if (!li) {
    return data.docsReady
      ? <ConnectHint>No LinkedIn data yet. The laptop agent sends ~/linkedin-outreach/prospects.json and targets.json here whenever they change; it needs the laptop on and the latest scripts/laptop-agent.mjs.</ConnectHint>
      : <div className="text-sm text-zinc-500">Loading…</div>
  }

  const prospects = li.prospects || []
  const targets = li.targets || []
  const replies = linkedinReplies(li)
  const counts = requestCounts(li)
  const pending = prospects.filter((p) => p.status === 'requested')
  const oldPending = targets.filter((t) => !t.messaged)
  const oldWaiting = targets.filter((t) => t.messaged && !t.awaitingReply)
  const shown = prospects
    .filter((p) => filter === 'all' || (filter === 'other' ? !['requested', 'accepted_messaged'].includes(p.status) : p.status === filter))
    .slice().reverse()

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Needs your reply" value={replies.length} tone={replies.length ? 'text-sky-300' : 'text-zinc-50'} icon={MessageSquareReply} sub="from both campaigns" />
        <Stat label="Requests today" value={`${counts.today} / ${DAY_CAP}`} icon={UserPlus} sub={`${counts.week} / ${WEEK_CAP} in 7 days`} tone={counts.today >= DAY_CAP ? 'text-amber-300' : 'text-zinc-50'} />
        <Stat label="Pending invites" value={pending.length} icon={Users} sub={`new campaign · ${prospects.length} total`} />
        <Stat label="Old campaign" value={`${targets.length - oldPending.length} / ${targets.length}`} icon={Linkedin} sub={`accepted · ${oldPending.length} still pending`} />
      </div>

      <Section title={`Needs your reply · ${replies.length}`}>
        {replies.length === 0 ? <Empty>No one is waiting on you.</Empty> : (
          <ul className="space-y-2.5">
            {replies.map((p) => (
              <Person key={`${p.campaign}-${p.name}`} p={p} right={<Badge tone="sky">{p.campaign} campaign</Badge>}>
                {p.replied && <Quote tone="text-sky-100/90">{p.replied}</Quote>}
                {p.note && <Meta items={[p.note]} />}
              </Person>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={`New campaign · ${prospects.length}`}
        action={
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={cx('rounded-md px-2 py-0.5 text-xs', filter === f.key ? 'bg-white/[0.1] text-white' : 'text-zinc-500 hover:text-zinc-200')}>{f.label}</button>
            ))}
          </div>
        }
      >
        {shown.length === 0 ? <Empty>Nothing here.</Empty> : (
          <ul className="space-y-2.5">
            {shown.map((p) => {
              const st = STATUS[p.status] || { label: p.status, tone: 'zinc' }
              return (
                <Person key={p.profile || p.name} p={p} right={<><Badge tone={st.tone}>{st.label}</Badge>{p.awaitingReply && <Badge tone="sky">Replied</Badge>}</>}>
                  <Meta items={[
                    p.location,
                    p.experience && `${p.experience} asked`,
                    p.requestedOn && `requested ${shortDate(p.requestedOn)}`,
                    p.acceptedOn && `accepted ${shortDate(p.acceptedOn)}`,
                    p.messagedOn && `messaged ${shortDate(p.messagedOn)}`,
                    p.noteSent === false && 'no invite note',
                  ]} />
                  {p.stack && <div className="mt-1.5 text-[11px] text-zinc-600">{p.stack}</div>}
                  {p.fitLine && <Quote>{p.fitLine}</Quote>}
                  {p.note && !p.fitLine && <div className="mt-1.5 text-[11px] text-zinc-500">{p.note}</div>}
                </Person>
              )
            })}
          </ul>
        )}
      </Section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title={`Old campaign · waiting on them · ${oldWaiting.length}`}>
          {oldWaiting.length === 0 ? <Empty>No open threads.</Empty> : (
            <ul className="space-y-2.5">
              {oldWaiting.map((t) => (
                <Person key={t.profile || t.name} p={t} right={<Badge tone="green">Messaged</Badge>}>
                  <Meta items={[t.acceptedOn && `accepted ${shortDate(t.acceptedOn)}`]} />
                  {t.replied && <Quote>{t.replied}</Quote>}
                  {t.vishalReplied && <div className="mt-1.5 text-[11px] text-zinc-500">You: {t.vishalReplied}</div>}
                </Person>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Old campaign · not accepted · ${oldPending.length}`}>
          {oldPending.length === 0 ? <Empty>Everyone accepted.</Empty> : (
            <ul className="space-y-2.5">{oldPending.map((t) => <Person key={t.profile || t.name} p={t} right={<Badge tone="amber">Pending</Badge>} />)}</ul>
          )}
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Requests · last 14 days">
          <DayBars days={counts.days} />
          <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
            <span>{shortDate(counts.days[0].day)}</span><span>today</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500">Caps: 5 per run, {DAY_CAP} per day, {WEEK_CAP} per rolling 7 days.</p>
        </Section>

        <Section title="Run log">
          {(li.runNotes || []).length === 0 ? <Empty>No runs logged.</Empty> : (
            <ul className="space-y-3">
              {li.runNotes.slice().reverse().slice(0, 8).map((n, i) => (
                <li key={i} className="text-xs">
                  <div className="text-zinc-500">{n.at?.replace('T', ' ').slice(0, 16)}</div>
                  <div className="mt-0.5 leading-relaxed text-zinc-300">{n.note}</div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <p className="text-xs text-zinc-600">
        Synced from the laptop {timeAgo(li.at)}{li.lastChecked && ` · inbox last checked ${li.lastChecked.replace('T', ' ').slice(0, 16)} IST`}. Read-only: the scheduled task does the sending.
      </p>
    </div>
  )
}
