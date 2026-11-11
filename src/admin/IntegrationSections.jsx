// Per-project sections fed by outside services: Stacky tasks, traffic and
// Firebase usage, GitHub activity. Each shows a "connect" hint when its
// server key isn't configured.
import { ExternalLink, GitPullRequest } from 'lucide-react'
import { timeAgo, useApi } from './data'
import { Badge, ConnectHint, Empty, Section, Sparkline, cx } from './ui'

// ── Stacky ─────────────────────────────────────────────

const TASK_ORDER = ['in_progress', 'blocked', 'planned', 'backlog']
const TASK_LABEL = { in_progress: 'In progress', blocked: 'Blocked', planned: 'Planned', backlog: 'Backlog' }
const PRIORITY_TONE = { P0: 'red', P1: 'amber', P2: 'zinc', P3: 'zinc' }

/** Stacky projects that belong to a dashboard project, matched by name. */
export function stackyProjectIds(p, stackyData) {
  const names = (p.stacky?.length ? p.stacky : [p.name]).map((n) => n.toLowerCase().trim())
  return new Set((stackyData?.projects || []).filter((sp) => names.includes(String(sp.name).toLowerCase().trim())).map((sp) => sp.id))
}

export function StackyTasks({ p, stacky, go }) {
  if (stacky.notConfigured) {
    return <Section title="Tasks"><ConnectHint go={go}>Connect Stacky to see this project’s open tasks.</ConnectHint></Section>
  }
  if (stacky.error) return <Section title="Tasks"><Empty>Stacky: {stacky.error}</Empty></Section>
  if (!stacky.data) return <Section title="Tasks"><div className="text-sm text-zinc-500">Loading…</div></Section>

  const ids = stackyProjectIds(p, stacky.data)
  const tasks = stacky.data.tasks.filter((t) => ids.has(t.projectId))
  const groups = TASK_ORDER.map((st) => ({ st, items: tasks.filter((t) => t.status === st) })).filter((g) => g.items.length)

  return (
    <Section
      title={`Tasks${tasks.length ? ` · ${tasks.length} open` : ''}`}
      action={<a href={stacky.data.appUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200">Stacky <ExternalLink size={11} /></a>}
    >
      {ids.size === 0 ? (
        <Empty>No Stacky project named “{(p.stacky?.length ? p.stacky : [p.name]).join(', ')}”. Create one in Stacky or set the name under Edit.</Empty>
      ) : groups.length === 0 ? (
        <Empty>Nothing open. 🎉</Empty>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.st}>
              <div className={cx('mb-1.5 text-xs', g.st === 'blocked' ? 'text-red-300' : 'text-zinc-500')}>{TASK_LABEL[g.st]} · {g.items.length}</div>
              <ul className="space-y-1">
                {g.items.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <Badge tone={PRIORITY_TONE[t.priority] || 'zinc'}>{t.priority || '—'}</Badge>
                    <span className="min-w-0 flex-1 truncate text-zinc-200">{t.title}</span>
                    {t.dueDate && <span className={cx('shrink-0 text-xs', String(t.dueDate) < new Date().toISOString().slice(0, 10) ? 'text-red-300' : 'text-zinc-500')}>{String(t.dueDate).slice(5, 10)}</span>}
                  </li>
                ))}
                {g.items.length > 8 && <li className="text-xs text-zinc-600">+{g.items.length - 8} more</li>}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ── traffic + Firebase usage ───────────────────────────

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

/** Last-30-day daily page views for a project's Vercel projects, oldest first. */
export function trafficFor(p, traffic) {
  const byId = traffic?.data?.projects || {}
  const days = []
  const d = new Date()
  for (let i = 29; i >= 0; i--) days.push(new Date(d.getTime() - i * 86400e3).toISOString().slice(0, 10))
  const daily = days.map((day) => p.vercelProjects.reduce((t, v) => t + (byId[v.id]?.daily?.[day] || 0), 0))
  return { total: daily.reduce((a, b) => a + b, 0), daily, tracked: p.vercelProjects.some((v) => byId[v.id]) }
}

export function FirestoreUsage({ ids }) {
  const res = useApi(ids.length ? `/api/admin/firebase?projects=${encodeURIComponent(ids.join(','))}` : null)
  if (!ids.length) return null
  if (res.notConfigured) return <div className="text-xs text-zinc-500">Firestore usage needs GCP_SA_KEY — see Settings.</div>
  if (res.error) return <div className="text-xs text-zinc-500">Firestore usage: {res.error}</div>
  if (!res.data) return <div className="text-xs text-zinc-500">Loading Firestore usage…</div>
  return (
    <div className="space-y-3">
      {res.data.projects.map((u) => (
        <div key={u.project}>
          <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
            <span>Firestore · {u.project}</span>
            <a href={`https://console.firebase.google.com/project/${u.project}/usage`} target="_blank" rel="noreferrer" className="hover:text-zinc-200"><ExternalLink size={11} /></a>
          </div>
          {u.error ? <div className="text-xs text-zinc-500">{u.error}</div> : (
            <div className="grid grid-cols-3 gap-2">
              {['reads', 'writes', 'deletes'].map((k) => {
                const m = u[k]
                const pct = m.free ? Math.round((m.peak / m.free) * 100) : 0
                return (
                  <div key={k} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                    <div className="text-[11px] capitalize text-zinc-500">{k} / day</div>
                    <div className={cx('text-sm tabular-nums', pct >= 100 ? 'text-red-300' : pct >= 70 ? 'text-amber-300' : 'text-zinc-100')}>{compact.format(m.latest)}</div>
                    <div className="text-[10px] text-zinc-600">peak {compact.format(m.peak)} · {pct}% of free</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function Usage({ p, traffic, go }) {
  const t = trafficFor(p, traffic)
  const hasFirebase = (p.firebase || []).length > 0
  return (
    <Section title="Traffic & usage">
      <div className="space-y-5">
        <div>
          <div className="mb-1.5 text-xs text-zinc-500">Page views · last 30 days</div>
          {traffic.notConfigured ? <ConnectHint go={go}>Needs the Vercel token.</ConnectHint>
            : traffic.error ? <div className="text-xs text-zinc-500">{traffic.error}</div>
              : !p.vercelProjects.length ? <div className="text-sm text-zinc-600">Not on Vercel — no analytics.</div>
                : !t.tracked ? <div className="text-sm text-zinc-600">No page views recorded. Turn on Web Analytics for {p.vercelProjects.map((v) => v.name).join(', ')} in Vercel.</div>
                  : (
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-2xl font-semibold tabular-nums text-zinc-50">{compact.format(t.total)}</div>
                        <div className="text-xs text-zinc-500">{compact.format(t.daily.slice(-7).reduce((a, b) => a + b, 0))} this week</div>
                      </div>
                      <Sparkline values={t.daily} width={180} height={40} />
                    </div>
                  )}
        </div>
        {hasFirebase && <FirestoreUsage ids={p.firebase} />}
      </div>
    </Section>
  )
}

// ── GitHub ─────────────────────────────────────────────

function ciBadge(ci) {
  if (!ci) return null
  if (ci.status !== 'completed') return <Badge tone="sky">CI running</Badge>
  if (ci.conclusion === 'success') return <Badge tone="green">CI passing</Badge>
  if (['failure', 'timed_out', 'startup_failure'].includes(ci.conclusion)) return <Badge tone="red">CI failing</Badge>
  return <Badge>{ci.conclusion || ci.status}</Badge>
}

export function GitHubActivity({ p }) {
  const repos = (p.repos || []).slice(0, 10)
  const res = useApi(repos.length ? `/api/admin/github?repos=${encodeURIComponent(repos.join(','))}` : null)
  if (!repos.length) return null
  return (
    <Section title="GitHub" action={res.data && !res.data.authenticated && <span className="text-[11px] text-zinc-600">public repos only — add GITHUB_TOKEN</span>}>
      {res.error ? <Empty>GitHub: {res.error}</Empty> : !res.data ? <div className="text-sm text-zinc-500">Loading…</div> : (
        <ul className="divide-y divide-white/[0.05]">
          {[...res.data.repos].sort((a, b) => String(b.lastCommit?.at || '').localeCompare(String(a.lastCommit?.at || ''))).map((r) => (
            <li key={r.repo} className="py-2.5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <a href={r.url || `https://github.com/${r.repo}`} target="_blank" rel="noreferrer" className="text-zinc-200 hover:underline">{r.repo}</a>
                {r.private && <Badge>private</Badge>}
                {ciBadge(r.ci)}
                {r.openPrs?.length > 0 && (
                  <a href={`https://github.com/${r.repo}/pulls`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                    <GitPullRequest size={12} /> {r.openPrs.length} open
                  </a>
                )}
                <span className="ml-auto text-xs text-zinc-500">{r.lastCommit ? timeAgo(r.lastCommit.at) : ''}</span>
              </div>
              {r.error ? <div className="mt-0.5 text-xs text-zinc-600">{r.error}</div> : r.lastCommit && (
                <a href={r.lastCommit.url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs text-zinc-500 hover:text-zinc-300">
                  <code className="text-zinc-600">{r.lastCommit.sha}</code> {r.lastCommit.message}{r.lastCommit.author ? ` — ${r.lastCommit.author}` : ''}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

// ── cloud bills (GCP billing export, AWS Cost Explorer) ─

const PROVIDER = { gcp: 'Google Cloud', aws: 'AWS', azure: 'Azure' }
export const providerName = (p) => PROVIDER[p] || p

export function cloudMoney(amount, currency) {
  if (amount === null || amount === undefined) return '—'
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: Math.abs(amount) < 100 ? 2 : 0 }).format(amount)
  } catch {
    return `${amount} ${currency || ''}`
  }
}

function CloudCard({ s, go }) {
  const fmt = (n) => cloudMoney(n, s.currency)
  const title = `${PROVIDER[s.provider] || s.provider} · ${s.account}`
  if (s.error) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="text-xs text-zinc-500">{title}</div>
        <div className="mt-2 text-sm text-zinc-400">{s.error}</div>
        {go && <button onClick={() => go('/settings')} className="mt-2 text-xs text-zinc-300 underline decoration-white/20 hover:text-white">Setup steps in Settings →</button>}
      </div>
    )
  }
  const up = s.lastMonth > 0 && s.forecast !== null ? Math.round(((s.forecast - s.lastMonth) / s.lastMonth) * 100) : null
  const maxSvc = Math.max(1e-9, ...s.services.map((x) => x.amount))
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{title}</span>
        <span>{s.cachedAt ? `as of ${timeAgo(s.cachedAt)}` : ''}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-3">
        <div>
          <div className="text-xl font-semibold tabular-nums text-zinc-50">{fmt(s.monthToDate)}</div>
          <div className="text-[11px] text-zinc-500">this month so far</div>
        </div>
        <div>
          <div className={cx('text-xl font-semibold tabular-nums', up !== null && up > 20 ? 'text-amber-300' : 'text-zinc-200')}>{fmt(s.forecast)}</div>
          <div className="text-[11px] text-zinc-500">forecast{up !== null ? ` · ${up >= 0 ? '+' : ''}${up}% vs last` : ''}</div>
        </div>
        <div>
          <div className="text-xl font-semibold tabular-nums text-zinc-400">{fmt(s.lastMonth)}</div>
          <div className="text-[11px] text-zinc-500">last month</div>
        </div>
      </div>
      <div className="mt-4 flex items-end gap-1.5" style={{ height: 56 }}>
        {s.months.map((m, i) => {
          const max = Math.max(1e-9, ...s.months.map((x) => x.amount))
          return (
            <div key={m.month} className="group relative flex h-full flex-1 flex-col justify-end" title={`${m.month}: ${fmt(m.amount)}`}>
              <div className={cx('w-full rounded-t', i === s.months.length - 1 ? 'bg-white/60' : 'bg-white/[0.14]')} style={{ height: `${Math.max(3, (m.amount / max) * 100)}%` }} />
              <div className="mt-1 text-center text-[9px] text-zinc-600">{new Date(`${m.month}-01`).toLocaleString('en-IN', { month: 'short' })}</div>
            </div>
          )
        })}
      </div>
      {s.services.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {s.services.map((x) => (
            <li key={x.name} className="text-xs">
              <div className="flex justify-between gap-2"><span className="truncate text-zinc-400">{x.name}</span><span className="tabular-nums text-zinc-300">{fmt(x.amount)}</span></div>
              <div className="mt-0.5 h-1 rounded-full bg-white/[0.05]"><div className="h-1 rounded-full bg-white/40" style={{ width: `${Math.max(0, (x.amount / maxSvc) * 100)}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function useCloud(sources) {
  return useApi(sources.length ? `/api/admin/cloud?sources=${encodeURIComponent(sources.join(','))}` : null)
}

export function CloudCosts({ sources, go }) {
  const res = useCloud(sources)
  return (
    <Section title="Cloud bill">
      {res.error ? <Empty>{res.error}</Empty> : !res.data ? <div className="text-sm text-zinc-500">Loading costs…</div> : (
        <div className={cx('grid gap-4', res.data.sources.length > 1 && 'lg:grid-cols-2')}>
          {res.data.sources.map((s) => <CloudCard key={s.source} s={s} go={go} />)}
        </div>
      )}
    </Section>
  )
}
