// Marketing, one page with tabs: where traffic comes from, Instagram accounts
// (with best-time and follower trend, InstagramInsights.jsx), the pipeline's
// posts (PostsView.jsx), the content calendar (CalendarView.jsx), on-page SEO for
// every public site, Search Console rankings, PageSpeed scores (saved in the
// `vitals` doc by api/admin/_routes/vitals.js), campaigns with their spend and
// a tracked-link builder, and leads from contact forms with follow-up dates.
//
// Campaigns live on the project doc (`campaigns`, like expenses) so their
// spend lands in Money. Leads are `lead-<id>` docs in vp_sites, written by
// api/admin/_routes/lead.js or added here by hand.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, ExternalLink, Mail, MessageCircle, Plus, RefreshCw, Trash2 } from 'lucide-react'
import {
  CHANNELS, LEAD_STATUSES, api, campaignLeads, campaignMonths, checkable, leadProject, leadsFrom, money, moneyShort,
  monthKey, newId, removeDoc, saveDoc, timeAgo, today, useApi,
} from './data'
import { trafficFor } from './IntegrationSections'
import CalendarView from './CalendarView'
import { BestTime, CombinedBestTime, FollowerTrend } from './InstagramInsights'
import PostsView from './PostsView'
import LogsView from './LogsView'
import {
  Badge, Button, ConnectHint, Empty, FIELD_MAIN, Input, Progress, Section, Select, ShareBars, Sparkline, Stat, Textarea,
  cx, formRow,
} from './ui'

export const MARKETING_TABS = [
  { key: 'traffic', label: 'Traffic' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'posts', label: 'Posts' },
  { key: 'logs', label: 'Logs' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'seo', label: 'SEO' },
  { key: 'search', label: 'Search' },
  { key: 'speed', label: 'Speed' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'leads', label: 'Leads' },
]

const num = (v) => Number(String(v ?? '').replace(/[^\d.]/g, '')) || 0
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—')
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

// ── traffic ────────────────────────────────────────────

const RANGES = [7, 30, 90]

function TopList({ title, rows }) {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-zinc-600">{title}</div>
      {rows?.length ? <ShareBars rows={rows.slice(0, 6).map((r) => ({ key: r.key, label: r.key, value: r.count }))} format={(v) => compact.format(v)} />
        : <div className="text-xs text-zinc-600">—</div>}
    </div>
  )
}

/** Sum breakdown lists across several Vercel projects. */
function merge(lists) {
  const by = {}
  for (const l of lists) for (const r of l || []) by[r.key] = (by[r.key] || 0) + r.count
  return Object.entries(by).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count)
}

function Traffic({ data, go, leads }) {
  const [days, setDays] = useState(30)
  const res = useApi(`/api/admin/marketing?days=${days}`)
  const byId = res.data?.projects || {}
  const since = Date.now() - days * 86400e3

  const rows = data.projects
    .map((p) => {
      const parts = p.vercelProjects.map((v) => byId[v.id]).filter(Boolean)
      if (!parts.length) return null
      return {
        p,
        views: parts.reduce((t, x) => t + x.views, 0),
        visitors: parts.reduce((t, x) => t + x.visitors, 0),
        paths: merge(parts.map((x) => x.paths)),
        referrers: merge(parts.map((x) => x.referrers)),
        countries: merge(parts.map((x) => x.countries)),
        devices: merge(parts.map((x) => x.devices)),
        leads: leads.filter((l) => l.createdAt >= since && leadProject(l, data.projects)?.slug === p.slug).length,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.views - a.views)

  const views = rows.reduce((t, r) => t + r.views, 0)
  const visitors = rows.reduce((t, r) => t + r.visitors, 0)
  const rangeLeads = leads.filter((l) => l.createdAt >= since).length
  const referrers = merge(rows.map((r) => r.referrers)).filter((r) => r.key !== '(direct)')
  const untracked = data.projects.filter((p) => p.status === 'live' && checkable(p.domains).length && !rows.some((r) => r.p.slug === p.slug))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-500">Vercel Web Analytics · last {days} days</div>
        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {RANGES.map((d) => (
            <button key={d} onClick={() => setDays(d)} className={cx('rounded-md px-2.5 py-1 text-xs', d === days ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-zinc-100')}>{d}d</button>
          ))}
        </div>
      </div>

      {res.notConfigured ? <ConnectHint go={go}>Traffic needs the Vercel token.</ConnectHint>
        : res.error ? <Empty>{res.error}</Empty>
          : !res.data ? <div className="text-sm text-zinc-500">Loading…</div> : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Page views" value={compact.format(views)} sub={`${rows.length} tracked site${rows.length === 1 ? '' : 's'}`} />
                <Stat label="Visitors" value={compact.format(visitors)} sub="unique, per site" />
                <Stat label="Leads" value={rangeLeads} sub={`last ${days} days`} />
                <Stat label="Visitor → lead" value={pct(rangeLeads, visitors)} sub="conversion" />
              </div>

              {referrers.length > 0 && (
                <Section title="Top referrers · all sites">
                  <ShareBars rows={referrers.slice(0, 8).map((r) => ({ key: r.key, label: r.key, value: r.count }))} format={(v) => compact.format(v)} />
                </Section>
              )}

              {rows.length === 0 ? <Empty>No page views yet. Turn on Web Analytics in a Vercel project to see it here.</Empty> : rows.map((r) => (
                <Section
                  key={r.p.slug}
                  title={<button onClick={() => go(`/p/${r.p.slug}`)} className="hover:text-white">{r.p.name}</button>}
                  action={days === 30 && <Sparkline values={trafficFor(r.p, data.traffic).daily} width={100} height={22} />}
                >
                  <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span><span className="tabular-nums text-zinc-100">{compact.format(r.views)}</span> <span className="text-zinc-500">views</span></span>
                    <span><span className="tabular-nums text-zinc-100">{compact.format(r.visitors)}</span> <span className="text-zinc-500">visitors</span></span>
                    <span><span className="tabular-nums text-zinc-100">{r.leads}</span> <span className="text-zinc-500">leads · {pct(r.leads, r.visitors)}</span></span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <TopList title="Pages" rows={r.paths} />
                    <TopList title="Referrers" rows={r.referrers} />
                    <TopList title="Countries" rows={r.countries} />
                    <TopList title="Devices" rows={r.devices} />
                  </div>
                </Section>
              ))}

              {untracked.length > 0 && (
                <div className="text-xs text-zinc-500">
                  No analytics for {untracked.map((p) => p.name).join(', ')} — enable Web Analytics on their Vercel projects, or they aren’t on Vercel.
                </div>
              )}
            </>
          )}
    </div>
  )
}

// ── Instagram ──────────────────────────────────────────

const POST_TYPES = { IMAGE: 'Post', CAROUSEL_ALBUM: 'Carousel', VIDEO: 'Video', REEL: 'Reel' }
const fmt = (v) => (v === null || v === undefined ? '—' : compact.format(v))
const avg = (posts, k) => {
  const vals = posts.map((p) => p[k]).filter((v) => typeof v === 'number')
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

function PostCard({ post }) {
  return (
    <a href={post.permalink} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] transition hover:border-white/20">
      <div className="relative aspect-square bg-white/[0.03]">
        {post.image && <img src={post.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-zinc-200 backdrop-blur">{POST_TYPES[post.type] || post.type}</span>
      </div>
      <div className="space-y-1.5 p-2.5">
        <div className="text-[11px] text-zinc-500">{post.at ? new Date(post.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</div>
        <p className="line-clamp-2 min-h-[2rem] text-xs text-zinc-300">{post.caption || <span className="text-zinc-600">No caption</span>}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
          <span><span className="tabular-nums text-zinc-100">{fmt(post.likes)}</span> likes</span>
          <span><span className="tabular-nums text-zinc-100">{fmt(post.comments)}</span> comments</span>
          {post.reach != null && <span><span className="tabular-nums text-zinc-100">{fmt(post.reach)}</span> reach</span>}
          {post.views != null && <span><span className="tabular-nums text-zinc-100">{fmt(post.views)}</span> views</span>}
          {post.saved != null && <span><span className="tabular-nums text-zinc-100">{fmt(post.saved)}</span> saves</span>}
        </div>
      </div>
    </a>
  )
}

const SHOWN_POSTS = 24

function InstagramAccount({ a, project, go, docs }) {
  const posts = a.posts || []
  const likes = avg(posts, 'likes')
  const comments = avg(posts, 'comments')
  const reach = avg(posts, 'reach')
  const engagement = a.followers && likes !== null ? ((likes + (comments || 0)) / a.followers) * 100 : null
  const best = [...posts].sort((x, y) => (y.likes || 0) + (y.comments || 0) - ((x.likes || 0) + (x.comments || 0)))[0]
  const expiresIn = a.tokenExpiresAt ? Math.floor((a.tokenExpiresAt - Date.now()) / 86400e3) : null

  return (
    <div className="space-y-5">
      <Section
        title={
          <span className="flex items-center gap-2 normal-case tracking-normal">
            {a.picture && <img src={a.picture} alt="" referrerPolicy="no-referrer" className="h-6 w-6 rounded-full" />}
            <a href={`https://instagram.com/${a.username}`} target="_blank" rel="noreferrer" className="text-sm text-zinc-100 hover:text-white">@{a.username}</a>
          </span>
        }
        action={project && <Button className="px-2 py-0.5 text-xs" onClick={() => go(`/p/${project.slug}`)}>{project.name}</Button>}
      >
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
          {[
            ['Followers', fmt(a.followers)],
            ['Following', fmt(a.follows)],
            ['Posts', fmt(a.mediaCount)],
            ['Reach · 28d', fmt(a.insights?.reach)],
            ['Profile views · 28d', fmt(a.insights?.profile_views)],
            ['Engaged · 28d', fmt(a.insights?.accounts_engaged)],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-lg font-semibold tabular-nums text-zinc-50">{value}</div>
              <div className="text-[11px] text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
        {expiresIn !== null && expiresIn < 10 && <div className="mt-3 text-xs text-amber-300">Token expires in {expiresIn} days and couldn’t be refreshed — re-issue it in the Meta dashboard.</div>}
      </Section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Avg likes" value={fmt(likes)} sub={`last ${posts.length} posts`} />
        <Stat label="Avg comments" value={fmt(comments)} />
        <Stat label="Avg reach" value={fmt(reach)} sub="recent posts" />
        <Stat label="Engagement rate" value={engagement === null ? '—' : `${engagement.toFixed(1)}%`} sub="likes + comments / followers" />
      </div>

      {best && (best.likes || best.comments) ? (
        <div className="text-xs text-zinc-500">
          Best recent post: <a href={best.permalink} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white">{(best.caption || POST_TYPES[best.type] || 'post').slice(0, 60)}</a> · {fmt(best.likes)} likes · {fmt(best.comments)} comments
        </div>
      ) : null}

      <FollowerTrend daily={docs?.[`igstats-${a.account}`]?.daily} />
      <BestTime posts={posts} />

      {posts.length === 0 ? <Empty>No posts yet.</Empty> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {posts.slice(0, SHOWN_POSTS).map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  )
}

const ALL = '*'

function Instagram({ data, go }) {
  const owners = data.projects.flatMap((p) => (p.instagram || []).map((acc) => [acc, p]))
  const key = [...new Set(owners.map(([acc]) => acc))].sort().join(',')
  const res = useApi(key ? `/api/admin/instagram?accounts=${encodeURIComponent(key)}` : null)
  const [pick, setPick] = useState(null)
  if (!owners.length) return <Empty>No Instagram accounts linked. Add an <code>instagram</code> key to a project.</Empty>
  if (res.error) return <Empty>{res.error}</Empty>
  if (!res.data) return <div className="text-sm text-zinc-500">Loading Instagram…</div>

  const owner = Object.fromEntries(owners)
  const accounts = res.data.accounts || []
  const loaded = accounts.filter((a) => a.posts?.length)
  // With two or more accounts loaded, the tab opens on the combined view.
  const combined = loaded.length > 1 && (pick === null || pick === ALL)
  const current = combined ? null : accounts.find((a) => a.account === pick) || accounts[0]
  return (
    <div className="space-y-5">
      {accounts.length > 1 && (
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {loaded.length > 1 && (
            <button onClick={() => setPick(ALL)} className={cx('shrink-0 rounded-lg px-3 py-1.5 text-sm', combined ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-zinc-100')}>All accounts</button>
          )}
          {accounts.map((a) => (
            <button key={a.account} onClick={() => setPick(a.account)} className={cx('shrink-0 rounded-lg px-3 py-1.5 text-sm', a.account === current?.account ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-zinc-100')}>
              {owner[a.account]?.name || a.account}{a.followers != null && <span className="ml-1.5 text-xs text-zinc-500">{fmt(a.followers)}</span>}
            </button>
          ))}
        </div>
      )}
      {combined ? <CombinedBestTime accounts={loaded.map((a) => ({ key: a.account, label: owner[a.account]?.name || a.account, posts: a.posts }))} />
        : !current ? null
        : current.notConfigured ? <ConnectHint>Add <code className="text-zinc-300">IG_TOKEN_{current.account.toUpperCase()}</code> (the account’s long-lived Instagram token) to the Vercel project’s environment variables.</ConnectHint>
          : current.error ? <Empty>{owner[current.account]?.name}: {current.error}</Empty>
            : <InstagramAccount a={current} project={owner[current.account]} go={go} docs={data.docs} />}
    </div>
  )
}

// ── SEO ────────────────────────────────────────────────

// App, admin and API hosts aren't meant to rank; only marketing sites are checked.
const NOT_PUBLIC = /^(admin|app|api|api\d+|owner|restaurant|creator|automation|cms|dashboard|staging|dev)\./

export function seoHosts(projects) {
  return [...new Set(projects
    .filter((p) => p.status === 'live' || p.status === 'building')
    .flatMap((p) => checkable(p.domains).filter((h) => !NOT_PUBLIC.test(h))))].sort()
}

/** Problems with one site's SEO basics, worst first. */
export function seoIssues(r) {
  if (r.error) return [{ tone: 'red', text: `Unreachable · ${r.error}` }]
  const out = []
  const bad = (text) => out.push({ tone: 'red', text })
  const meh = (text) => out.push({ tone: 'amber', text })
  if (r.status >= 400) bad(`Home page returns ${r.status}`)
  if (/noindex/i.test(r.robots || '')) bad('Home page is noindex')
  if (r.robotsBlocksAll) bad('robots.txt blocks all crawlers')
  if (!r.title) bad('No <title>')
  else if (r.title.length > 60) meh(`Title is ${r.title.length} chars (keep ≤ 60)`)
  else if (r.title.length < 15) meh('Title is very short')
  if (!r.description) bad('No meta description')
  else if (r.description.length > 160) meh(`Description is ${r.description.length} chars (keep ≤ 160)`)
  else if (r.description.length < 50) meh('Description is very short')
  if (!r.ogImage) meh('No og:image (link previews look bare)')
  if (!r.ogTitle) meh('No og:title')
  if (!r.canonical) meh('No canonical link')
  if (!r.sitemap) meh('No sitemap.xml')
  else if (!r.sitemapInRobots) meh('Sitemap not listed in robots.txt')
  if (!r.robotsTxt) meh('No robots.txt')
  if (!r.lang) meh('<html> has no lang')
  return out
}

const CHECKS = 10
const score = (issues) => Math.max(0, Math.round(((CHECKS - issues.filter((i) => i.tone === 'red').length * 2 - issues.filter((i) => i.tone === 'amber').length) / CHECKS) * 100))

function Seo({ data }) {
  const hosts = useMemo(() => seoHosts(data.projects), [data.projects])
  const key = hosts.join(',')
  const [state, setState] = useState({ results: null, error: null, loading: false })
  const run = useCallback(async () => {
    if (!key) return
    setState((s) => ({ ...s, loading: true }))
    try {
      const { results } = await api('/api/admin/seo', { method: 'POST', body: JSON.stringify({ hosts: key.split(',') }) })
      setState({ results, error: null, loading: false })
    } catch (e) {
      setState({ results: null, error: e.message, loading: false })
    }
  }, [key])
  useEffect(() => { run() }, [run])

  const owner = (host) => data.projects.find((p) => (p.domains || []).includes(host))
  const rows = (state.results || []).map((r) => ({ r, issues: seoIssues(r) })).sort((a, b) => score(a.issues) - score(b.issues))

  return (
    <Section
      title={`SEO basics · ${hosts.length} site${hosts.length === 1 ? '' : 's'}`}
      action={<Button variant="glass" onClick={run} disabled={state.loading}><RefreshCw size={13} className={state.loading ? 'animate-spin' : ''} /> Recheck</Button>}
    >
      {!hosts.length ? <Empty>No public sites on live projects.</Empty>
        : state.error ? <Empty>{state.error}</Empty>
          : !state.results ? <div className="text-sm text-zinc-500">Checking {hosts.length} sites…</div> : (
            <ul className="divide-y divide-white/[0.05]">
              {rows.map(({ r, issues }) => {
                const s = score(issues)
                return (
                  <li key={r.host} className="py-3">
                    <div className="flex items-center gap-3">
                      <span className={cx('w-10 shrink-0 text-right text-lg font-semibold tabular-nums', s >= 80 ? 'text-emerald-300' : s >= 50 ? 'text-amber-300' : 'text-red-300')}>{s}</span>
                      <div className="min-w-0 flex-1">
                        <a href={`https://${r.host}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-zinc-100 hover:text-white">{r.host} <ExternalLink size={11} className="text-zinc-600" /></a>
                        <div className="truncate text-xs text-zinc-500">{owner(r.host)?.name || '—'}{r.title ? ` · ${r.title}` : ''}</div>
                      </div>
                      {r.sitemap && <span className="hidden shrink-0 text-xs text-zinc-500 sm:block">{r.sitemapUrls} URLs in sitemap</span>}
                    </div>
                    {issues.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5 pl-[3.25rem]">{issues.map((i) => <Badge key={i.text} tone={i.tone}>{i.text}</Badge>)}</div>
                    ) : <div className="mt-1 pl-[3.25rem] text-xs text-emerald-300/80">All basics in place.</div>}
                    {r.description && <div className="mt-1.5 line-clamp-2 pl-[3.25rem] text-xs text-zinc-600">{r.description}</div>}
                  </li>
                )
              })}
            </ul>
          )}
      <div className="mt-3 text-xs text-zinc-600">Reads each home page as a crawler does, before JavaScript runs. App, admin and API subdomains are skipped.</div>
    </Section>
  )
}

// ── Search Console ─────────────────────────────────────

const pos = (v) => (v == null ? '—' : v.toFixed(1))
const ctrPct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`)

function SearchTable({ rows, label, render = (v) => v }) {
  if (!rows?.length) return <div className="text-xs text-zinc-600">No {label.toLowerCase()} yet.</div>
  return (
    <table className="w-full table-fixed text-xs">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-zinc-600">
          <th className="pb-1.5 font-normal">{label}</th>
          <th className="w-14 pb-1.5 text-right font-normal">Clicks</th>
          <th className="hidden w-16 pb-1.5 text-right font-normal sm:table-cell">Impr.</th>
          <th className="w-14 pb-1.5 text-right font-normal">Pos.</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.04]">
        {rows.slice(0, 10).map((r) => {
          const key = r.query ?? r.page
          return (
            <tr key={key}>
              <td className="truncate py-1.5 pr-2 text-zinc-300" title={key}>{render(key)}</td>
              <td className="py-1.5 text-right tabular-nums text-zinc-100">{compact.format(r.clicks)}</td>
              <td className="hidden py-1.5 text-right tabular-nums text-zinc-400 sm:table-cell">{compact.format(r.impressions)}</td>
              <td className="py-1.5 text-right tabular-nums text-zinc-400">{pos(r.position)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Search({ data, go }) {
  const [days, setDays] = useState(28)
  const res = useApi(`/api/admin/searchconsole?days=${days}`)
  const sites = (res.data?.sites || []).filter((s) => !s.error).sort((a, b) => b.clicks - a.clicks)
  const failed = (res.data?.sites || []).filter((s) => s.error)
  const clicks = sites.reduce((t, s) => t + s.clicks, 0)
  const impressions = sites.reduce((t, s) => t + s.impressions, 0)
  const position = impressions ? sites.reduce((t, s) => t + (s.position || 0) * s.impressions, 0) / impressions : null
  const covered = new Set(sites.map((s) => s.host.replace(/^www\./, '')))
  const missing = seoHosts(data.projects).filter((h) => !covered.has(h.replace(/^www\./, '')) && ![...covered].some((c) => h.endsWith(`.${c}`)))
  const owner = (host) => data.projects.find((p) => (p.domains || []).some((d) => d.replace(/^www\./, '') === host.replace(/^www\./, '')))
  const account = res.data?.account

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-500">Google Search Console{res.data ? ` · ${res.data.startDate} → ${res.data.endDate}` : ''}</div>
        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {[7, 28, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={cx('rounded-md px-2.5 py-1 text-xs', d === days ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-zinc-100')}>{d}d</button>
          ))}
        </div>
      </div>

      {res.notConfigured ? <ConnectHint go={go}>Search Console needs the Google service account (GCP_SA_KEY).</ConnectHint>
        : res.error ? <Empty>{res.error}</Empty>
          : !res.data ? <div className="text-sm text-zinc-500">Loading Search Console…</div> : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Clicks" value={compact.format(clicks)} sub={`${sites.length} site${sites.length === 1 ? '' : 's'}`} />
                <Stat label="Impressions" value={compact.format(impressions)} />
                <Stat label="CTR" value={pct(clicks, impressions)} />
                <Stat label="Avg position" value={pos(position)} sub="weighted by impressions" />
              </div>

              {sites.map((s) => (
                <Section
                  key={s.siteUrl}
                  title={<a href={`https://${s.host}`} target="_blank" rel="noreferrer" className="normal-case tracking-normal hover:text-white">{s.host}{owner(s.host) ? ` · ${owner(s.host).name}` : ''}</a>}
                  action={<Sparkline values={s.daily.map((d) => d.clicks)} width={100} height={22} />}
                >
                  <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span><span className="tabular-nums text-zinc-100">{compact.format(s.clicks)}</span> <span className="text-zinc-500">clicks</span></span>
                    <span><span className="tabular-nums text-zinc-100">{compact.format(s.impressions)}</span> <span className="text-zinc-500">impressions</span></span>
                    <span><span className="tabular-nums text-zinc-100">{ctrPct(s.ctr)}</span> <span className="text-zinc-500">CTR</span></span>
                    <span><span className="tabular-nums text-zinc-100">{pos(s.position)}</span> <span className="text-zinc-500">avg position</span></span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <SearchTable rows={s.queries} label="Queries" />
                    <SearchTable rows={s.pages} label="Pages" render={(u) => u.replace(/^https?:\/\/[^/]+/, '') || '/'} />
                  </div>
                </Section>
              ))}

              {failed.map((s) => <Empty key={s.siteUrl}>{s.host}: {s.error}</Empty>)}

              {(missing.length > 0 || sites.length === 0) && (
                <ConnectHint>
                  {sites.length === 0 ? 'No Search Console sites shared with the dashboard yet. ' : `Not in Search Console: ${missing.join(', ')}. `}
                  In Search Console open each property → Settings → Users and permissions → Add user, and add
                  {account ? <code className="mx-1 break-all text-zinc-300">{account}</code> : ' the GCP_SA_KEY service account '}
                  with Restricted access.
                </ConnectHint>
              )}
            </>
          )}
    </div>
  )
}

// ── PageSpeed ──────────────────────────────────────────

const scoreTone = (s) => (s == null ? 'text-zinc-500' : s >= 90 ? 'text-emerald-300' : s >= 50 ? 'text-amber-300' : 'text-red-300')
const secs = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`)
const FIELD_TONE = { FAST: 'green', AVERAGE: 'amber', SLOW: 'red' }

function Vitals({ data }) {
  const hosts = useMemo(() => seoHosts(data.projects), [data.projects])
  const saved = data.docs?.vitals?.sites || []
  const [state, setState] = useState({ running: false, error: null })
  const run = async () => {
    setState({ running: true, error: null })
    try {
      const r = await api('/api/admin/vitals', { method: 'POST', body: JSON.stringify({ hosts }) })
      const failed = (r.results || []).filter((x) => x.run.error)
      // When every site fails it's the same quota or setup problem; say it once.
      setState({ running: false, error: r.saveError || (failed.length && failed.length === r.results.length ? failed[0].run.error : null) })
    } catch (e) {
      setState({ running: false, error: e.message })
    }
  }

  const rows = hosts.map((host) => {
    const runs = saved.find((s) => s.host === host)?.runs || []
    const ok = runs.filter((r) => r.performance != null)
    return { host, runs, last: runs[runs.length - 1], good: ok[ok.length - 1], prev: ok[ok.length - 2], trend: ok.map((r) => r.performance) }
  }).sort((a, b) => (a.good?.performance ?? 101) - (b.good?.performance ?? 101))
  const lastAt = Math.max(0, ...saved.flatMap((s) => (s.runs || []).map((r) => r.at)))

  return (
    <Section
      title={`PageSpeed · mobile · ${hosts.length} site${hosts.length === 1 ? '' : 's'}`}
      action={<Button variant="glass" onClick={run} disabled={state.running || !hosts.length}><RefreshCw size={13} className={state.running ? 'animate-spin' : ''} /> {state.running ? 'Running…' : 'Run now'}</Button>}
    >
      {state.error && <div className="mb-3 text-xs text-red-300">{state.error}</div>}
      {!hosts.length ? <Empty>No public sites on live projects.</Empty>
        : !saved.length && !state.running ? <Empty>No runs yet. Run now, or wait for the daily check at 9am.</Empty> : (
          <ul className="divide-y divide-white/[0.05]">
            {rows.map(({ host, last, good, prev, trend }) => {
              const delta = good && prev ? good.performance - prev.performance : null
              return (
                <li key={host} className="py-3">
                  <div className="flex items-center gap-3">
                    <span className={cx('w-10 shrink-0 text-right text-lg font-semibold tabular-nums', scoreTone(good?.performance))}>{good?.performance ?? '—'}</span>
                    <div className="min-w-0 flex-1">
                      <a href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(`https://${host}/`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-zinc-100 hover:text-white">{host} <ExternalLink size={11} className="text-zinc-600" /></a>
                      <div className="text-xs text-zinc-500">
                        {delta ? <span className={delta < 0 ? 'text-red-300' : 'text-emerald-300'}>{delta > 0 ? '+' : ''}{delta} · </span> : null}
                        {good ? `checked ${timeAgo(good.at)}` : 'not checked yet'}
                        {last?.error && <span className="text-red-300" title={last.error}> · last run failed{state.error === last.error ? '' : `: ${last.error}`}</span>}
                      </div>
                    </div>
                    {trend.length > 1 && <Sparkline values={trend} width={80} height={22} className="hidden shrink-0 sm:block" />}
                  </div>
                  {good && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-[3.25rem] text-xs text-zinc-500">
                      {[['SEO', good.seo], ['Accessibility', good.accessibility], ['Best practices', good.bestPractices]].map(([k, v]) => (
                        <span key={k}>{k} <span className={cx('tabular-nums', scoreTone(v))}>{v ?? '—'}</span></span>
                      ))}
                      <span>LCP <span className="tabular-nums text-zinc-300">{secs(good.lcp)}</span></span>
                      <span>CLS <span className="tabular-nums text-zinc-300">{good.cls == null ? '—' : good.cls.toFixed(2)}</span></span>
                      <span>TBT <span className="tabular-nums text-zinc-300">{good.tbt == null ? '—' : `${Math.round(good.tbt)}ms`}</span></span>
                      {good.field && <Badge tone={FIELD_TONE[good.field.overall] || 'zinc'}>Real users · {good.field.overall.toLowerCase()}</Badge>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      <div className="mt-3 text-xs text-zinc-600">
        Lab scores from Lighthouse on a simulated phone{lastAt ? `, last run ${timeAgo(lastAt)}` : ''}. Runs every morning and alerts you when a site loses {10}+ points.
      </div>
    </Section>
  )
}

// ── campaigns ──────────────────────────────────────────

const blankCampaign = () => ({ project: '', name: '', channel: CHANNELS[0], start: today(), end: '', budget: '', spent: '', utm: '' })

// Source/medium a link gets when it's built for a campaign on this channel.
const CHANNEL_UTM = {
  'Google Ads': ['google', 'cpc'], 'Meta Ads': ['facebook', 'paid-social'], Instagram: ['instagram', 'social'],
  LinkedIn: ['linkedin', 'social'], YouTube: ['youtube', 'video'], Email: ['newsletter', 'email'],
  WhatsApp: ['whatsapp', 'messaging'], 'SEO / content': ['blog', 'content'], Referral: ['partner', 'referral'],
  Offline: ['qr', 'offline'], Other: ['other', 'other'],
}
const slug = (v) => String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** utm-tagged URL for a site; empty values are left out. */
export function utmUrl({ host, path, source, medium, campaign, content }) {
  if (!host) return ''
  const url = new URL(`https://${host}${path && !path.startsWith('/') ? '/' : ''}${path || '/'}`)
  for (const [k, v] of [['source', source], ['medium', medium], ['campaign', campaign], ['content', content]]) {
    if (v && v.trim()) url.searchParams.set(`utm_${k}`, slug(v))
  }
  return url.toString()
}

function LinkBuilder({ data, campaigns, onCampaignUtm }) {
  const hosts = useMemo(() => [...new Set(data.projects.filter((p) => p.status !== 'decommissioned').flatMap((p) => checkable(p.domains)))].sort(), [data.projects])
  const [row, setRow] = useState({ host: '', path: '/', source: '', medium: '', campaign: '', content: '', pick: '' })
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const host = row.host || hosts[0] || ''
  const url = utmUrl({ ...row, host })

  const choose = (id) => {
    const c = campaigns.find((x) => x.id === id)
    if (!c) return setRow({ ...row, pick: '' })
    const [source, medium] = CHANNEL_UTM[c.channel] || ['', '']
    const site = checkable(c.p.domains).find((h) => !NOT_PUBLIC.test(h))
    setRow({ ...row, pick: id, campaign: c.utm || slug(c.name), source, medium, host: site || row.host })
  }
  const copy = async () => {
    const c = campaigns.find((x) => x.id === row.pick)
    // Leads are credited by utm_campaign, so a campaign without one takes this link's.
    if (c && !c.utm && row.campaign) onCampaignUtm(c, slug(row.campaign))
    try { await navigator.clipboard.writeText(url); setCopied(true); timer.current = setTimeout(() => setCopied(false), 2000) } catch { /* no clipboard */ }
  }

  return (
    <Section title="Tracked link">
      <div className="space-y-2">
        <div className={formRow}>
          <Select value={row.pick} onChange={(e) => choose(e.target.value)} className="col-span-2 min-w-0 sm:w-56" aria-label="Campaign">
            <option value="">For a campaign…</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.p.name}</option>)}
          </Select>
          <Select value={host} onChange={(e) => setRow({ ...row, host: e.target.value })} className="min-w-0" aria-label="Site">
            {hosts.map((h) => <option key={h}>{h}</option>)}
          </Select>
          <Input value={row.path} onChange={(e) => setRow({ ...row, path: e.target.value })} placeholder="/page" className="min-w-0 sm:w-32" aria-label="Path" />
        </div>
        <div className={formRow}>
          <Input value={row.source} onChange={(e) => setRow({ ...row, source: e.target.value })} placeholder="Source (instagram)" className="min-w-0 sm:w-36" aria-label="utm_source" />
          <Input value={row.medium} onChange={(e) => setRow({ ...row, medium: e.target.value })} placeholder="Medium (social)" className="min-w-0 sm:w-36" aria-label="utm_medium" />
          <Input value={row.campaign} onChange={(e) => setRow({ ...row, campaign: e.target.value })} placeholder="Campaign (diwali-offer)" className="min-w-0 sm:w-44" aria-label="utm_campaign" />
          <Input value={row.content} onChange={(e) => setRow({ ...row, content: e.target.value })} placeholder="Content (bio-link)" className="min-w-0 sm:w-36" aria-label="utm_content" />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2">
          <code className="min-w-0 flex-1 break-all text-[11px] text-zinc-300">{url || 'Pick a site'}</code>
          <Button variant="glass" onClick={copy} disabled={!url}><Copy size={13} /> {copied ? 'Copied' : 'Copy'}</Button>
        </div>
        <div className="text-xs text-zinc-600">Leads that arrive through this link carry its utm_campaign and are credited to the matching campaign.</div>
      </div>
    </Section>
  )
}

function Campaigns({ data, go, leads }) {
  const [row, setRow] = useState(blankCampaign)
  const projects = data.projects.filter((p) => p.status !== 'decommissioned')
  const all = data.projects.flatMap((p) => (p.campaigns || []).map((c) => ({ ...c, p })))
    .sort((a, b) => (b.start || '').localeCompare(a.start || ''))
  const thisMonth = monthKey()
  const saveFor = (p, campaigns) => saveDoc(p.id, { kind: 'project', campaigns })

  const add = () => {
    const p = projects.find((x) => x.slug === row.project)
    if (!p || !row.name.trim()) return
    const c = {
      id: newId(), name: row.name.trim(), channel: row.channel, start: row.start, end: row.end || null,
      budget: num(row.budget), spent: num(row.spent), utm: row.utm.trim().toLowerCase(),
    }
    saveFor(p, [...(p.campaigns || []), c])
    setRow({ ...blankCampaign(), project: row.project, channel: row.channel })
  }
  const update = (c, patch) => saveFor(c.p, (c.p.campaigns || []).map((x) => (x.id === c.id ? { ...x, ...patch } : x)))
  const remove = (c) => saveFor(c.p, (c.p.campaigns || []).filter((x) => x.id !== c.id))

  const live = (c) => !c.end || c.end >= today()
  const spendThisMonth = all.reduce((t, c) => {
    const months = campaignMonths(c)
    return months.includes(thisMonth) ? t + num(c.spent) / months.length : t
  }, 0)
  const totalSpent = all.reduce((t, c) => t + num(c.spent), 0)
  const credited = new Set(all.flatMap((c) => campaignLeads(c, leads).map((l) => l.id)))
  const won = leads.filter((l) => credited.has(l.id) && l.status === 'won').length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Spend this month" value={moneyShort(spendThisMonth)} sub="counted in Money" />
        <Stat label="Running" value={all.filter(live).length} sub={`${all.length} all time`} />
        <Stat label="Leads from campaigns" value={credited.size} sub={`${won} won`} />
        <Stat label="Cost per lead" value={credited.size ? moneyShort(totalSpent / credited.size) : '—'} sub={`${moneyShort(totalSpent)} spent in all`} />
      </div>

      <Section title="New campaign">
        <div className={formRow}>
          <Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Diwali offer, launch post…" className={FIELD_MAIN} />
          <Select value={row.project} onChange={(e) => setRow({ ...row, project: e.target.value })} className="min-w-0" aria-label="Project">
            <option value="">Project…</option>
            {projects.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </Select>
          <Select value={row.channel} onChange={(e) => setRow({ ...row, channel: e.target.value })} className="min-w-0" aria-label="Channel">
            {CHANNELS.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input type="date" value={row.start} onChange={(e) => setRow({ ...row, start: e.target.value })} className="min-w-0 sm:w-36" title="Starts" />
          <Input type="date" value={row.end} onChange={(e) => setRow({ ...row, end: e.target.value })} className="min-w-0 sm:w-36" title="Ends (optional)" />
          <Input value={row.budget} onChange={(e) => setRow({ ...row, budget: e.target.value })} placeholder="Budget ₹" inputMode="numeric" className="min-w-0 sm:w-24" />
          <Input value={row.spent} onChange={(e) => setRow({ ...row, spent: e.target.value })} placeholder="Spent ₹" inputMode="numeric" className="min-w-0 sm:w-24" />
          <Input value={row.utm} onChange={(e) => setRow({ ...row, utm: e.target.value })} placeholder="utm_campaign" className="min-w-0 sm:w-32" title="Leads arriving with this utm_campaign are credited to the campaign" />
          <Button variant="glass" onClick={add} disabled={!row.project || !row.name.trim()}><Plus size={14} /> Add</Button>
        </div>
      </Section>

      <LinkBuilder data={data} campaigns={all} onCampaignUtm={(c, utm) => update(c, { utm })} />

      <Section title="Campaigns">
        {all.length === 0 ? <Empty>No campaigns yet. Log ads, posts and offers to see what they cost and what they bring in.</Empty> : (
          <ul className="divide-y divide-white/[0.05]">
            {all.map((c) => {
              const got = campaignLeads(c, leads)
              const spent = num(c.spent)
              return (
                <li key={c.id} className={cx('group py-3', !live(c) && 'opacity-60')}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-100">{c.name}</span>
                    {live(c) ? <Badge tone="green">Running</Badge> : <Badge>Ended</Badge>}
                    <button onClick={() => remove(c)} className="text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100 [@media(hover:none)]:opacity-100" aria-label="Remove campaign"><Trash2 size={13} /></button>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    <button onClick={() => go(`/p/${c.p.slug}`)} className="hover:text-zinc-200">{c.p.name}</button>
                    {' · '}{c.channel} · {c.start || '—'}{c.end ? ` → ${c.end}` : ' → ongoing'}{c.utm && ` · utm ${c.utm}`}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                    <label className="text-xs text-zinc-500">
                      Spent
                      <Input defaultValue={c.spent || ''} key={c.spent} onBlur={(e) => num(e.target.value) !== spent && update(c, { spent: num(e.target.value) })} inputMode="numeric" className="mt-0.5 w-full py-1" />
                    </label>
                    <div className="text-xs text-zinc-500">
                      Budget · {c.budget ? money(c.budget) : '—'}
                      {c.budget > 0 && <Progress value={spent} max={c.budget} className="mt-2" />}
                    </div>
                    <div className="text-xs text-zinc-500">Leads<div className="mt-1 text-sm tabular-nums text-zinc-100">{got.length} <span className="text-xs text-zinc-500">· {got.filter((l) => l.status === 'won').length} won</span></div></div>
                    <div className="text-xs text-zinc-500">Cost per lead<div className="mt-1 text-sm tabular-nums text-zinc-100">{got.length ? money(spent / got.length) : '—'}</div></div>
                  </div>
                  {live(c) && (
                    <button onClick={() => update(c, { end: today() })} className="mt-2 text-xs text-zinc-500 hover:text-zinc-200">End today</button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </div>
  )
}

// ── leads ──────────────────────────────────────────────

const STATUS_DOT = { new: 'bg-sky-400', contacted: 'bg-amber-400', won: 'bg-emerald-400', lost: 'bg-zinc-600' }
const ENDPOINT = 'https://admin.vishalpanwar.in/api/admin/lead'
const SNIPPET = `fetch('${ENDPOINT}', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({
    name, email, phone, message,
    site: location.hostname, page: location.pathname, referrer: document.referrer,
    utm: Object.fromEntries(['source', 'medium', 'campaign']
      .map((k) => [k, new URLSearchParams(location.search).get('utm_' + k) || ''])),
  }),
})`

const waLink = (phone, text) => {
  const d = String(phone).replace(/\D/g, '')
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

const openLead = (l) => l.status === 'new' || l.status === 'contacted'
/** An open lead whose follow-up date is today or earlier. */
export const followUpDue = (l, day = today()) => openLead(l) && !!l.followUp && l.followUp <= day
const inDays = (n) => new Date(Date.parse(today()) + n * 86400e3).toISOString().slice(0, 10)

export function replyText(l, p) {
  const first = String(l.name || '').trim().split(/\s+/)[0]
  return `Hi${first ? ` ${first}` : ''}, thanks for getting in touch${p ? ` about ${p.name}` : ''}. When would be a good time for a quick call?`
}

function FollowUp({ l, p, set }) {
  const [text, setText] = useState(() => replyText(l, p))
  // Replying marks a new lead contacted and, unless a later date is set, asks again in 3 days.
  const sent = () => set(l, {
    status: l.status === 'new' ? 'contacted' : l.status,
    lastContactAt: Date.now(),
    followUp: l.followUp && l.followUp > today() ? l.followUp : inDays(3),
  })
  const subject = `Re: your enquiry${p ? ` · ${p.name}` : ''}`
  return (
    <div className="space-y-2 border-t border-white/[0.06] pt-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>Follow up on</span>
        <Input type="date" value={l.followUp || ''} onChange={(e) => set(l, { followUp: e.target.value || null })} className="w-36 py-1 text-xs sm:text-xs" aria-label="Follow up on" />
        {[['Tomorrow', 1], ['3 days', 3], ['1 week', 7]].map(([label, n]) => (
          <button key={label} onClick={() => set(l, { followUp: inDays(n) })} className="rounded-md px-2 py-1 hover:bg-white/[0.06] hover:text-zinc-200">{label}</button>
        ))}
        {l.followUp && <button onClick={() => set(l, { followUp: null })} className="rounded-md px-2 py-1 hover:bg-white/[0.06] hover:text-zinc-200">Clear</button>}
        {l.lastContactAt && <span className="ml-auto">Last reply {timeAgo(l.lastContactAt)}</span>}
      </div>
      {(l.phone || l.email) && (
        <>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} aria-label="Reply" />
          <div className="flex flex-wrap gap-2">
            {l.phone && <a href={waLink(l.phone, text)} target="_blank" rel="noreferrer" onClick={sent} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-200 hover:bg-white/[0.08]"><MessageCircle size={12} /> Reply on WhatsApp</a>}
            {l.email && <a href={`mailto:${l.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`} onClick={sent} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-200 hover:bg-white/[0.08]"><Mail size={12} /> Reply by email</a>}
          </div>
        </>
      )}
    </div>
  )
}

function AddLead({ projects, onDone }) {
  const [row, setRow] = useState({ name: '', contact: '', project: '', source: '', message: '' })
  const add = async () => {
    if (!row.name.trim() && !row.contact.trim()) return
    const isEmail = row.contact.includes('@')
    await saveDoc(`lead-${newId()}`, {
      kind: 'lead', status: 'new', name: row.name.trim(), email: isEmail ? row.contact.trim().toLowerCase() : '',
      phone: isEmail ? '' : row.contact.trim(), message: row.message.trim(), project: row.project || null,
      site: '', utm: { source: row.source.trim(), medium: 'manual', campaign: '' }, createdAt: Date.now(),
    })
    onDone()
  }
  return (
    <div className="space-y-2">
      <div className={formRow}>
        <Input autoFocus value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} placeholder="Name" className={FIELD_MAIN} />
        <Input value={row.contact} onChange={(e) => setRow({ ...row, contact: e.target.value })} placeholder="Email or phone" className="min-w-0 sm:w-48" />
        <Select value={row.project} onChange={(e) => setRow({ ...row, project: e.target.value })} className="min-w-0" aria-label="Project">
          <option value="">Project…</option>
          {projects.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </Select>
        <Input value={row.source} onChange={(e) => setRow({ ...row, source: e.target.value })} placeholder="Source (referral, call…)" className="min-w-0 sm:w-40" />
      </div>
      <Textarea value={row.message} onChange={(e) => setRow({ ...row, message: e.target.value })} placeholder="What they want" rows={2} />
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancel</Button>
        <Button variant="primary" onClick={add}>Save lead</Button>
      </div>
    </div>
  )
}

function Leads({ data, go, leads }) {
  const [filter, setFilter] = useState('open')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(null)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(null)
  useEffect(() => () => clearTimeout(copyTimer.current), [])
  const projects = data.projects.filter((p) => p.status !== 'decommissioned')
  const campaigns = data.projects.flatMap((p) => (p.campaigns || []).map((c) => ({ ...c, p })))

  const day = today()
  const due = leads.filter((l) => followUpDue(l, day))
  const shown = filter === 'due' ? due : leads.filter((l) => (filter === 'open' ? openLead(l) : filter === 'all' || l.status === filter))
  const count = (s) => leads.filter((l) => l.status === s).length
  const closed = count('won') + count('lost')
  const set = (l, patch) => saveDoc(l.id, patch)
  const copy = async () => {
    try { await navigator.clipboard.writeText(SNIPPET); setCopied(true); copyTimer.current = setTimeout(() => setCopied(false), 2000) } catch { /* no clipboard */ }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="New" value={count('new')} sub="waiting on you" tone={count('new') ? 'text-sky-300' : 'text-zinc-50'} />
        <Stat label="Contacted" value={count('contacted')} sub={due.length ? `${due.length} follow-up${due.length === 1 ? '' : 's'} due` : 'no follow-ups due'} tone={due.length ? 'text-amber-300' : 'text-zinc-50'} />
        <Stat label="Won" value={count('won')} sub={`${count('lost')} lost`} />
        <Stat label="Win rate" value={pct(count('won'), closed)} sub="of closed leads" />
      </div>

      <Section
        title="Leads"
        action={!adding && <Button variant="glass" onClick={() => setAdding(true)}><Plus size={14} /> Add</Button>}
      >
        {adding && <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3"><AddLead projects={projects} onDone={() => setAdding(false)} /></div>}
        <div className="mb-3 flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {['open', 'due', ...LEAD_STATUSES, 'all'].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cx('shrink-0 rounded-md px-2.5 py-1 text-xs capitalize', filter === s ? 'bg-white/[0.1] text-white' : 'text-zinc-500 hover:text-zinc-200')}>
              {s === 'due' ? 'Follow up' : s}{s === 'due' ? ` · ${due.length}` : s !== 'open' && s !== 'all' ? ` · ${count(s)}` : ''}
            </button>
          ))}
        </div>
        {shown.length === 0 ? <Empty>{leads.length ? 'Nothing here.' : 'No leads yet. Point your contact forms at the endpoint below, or add one by hand.'}</Empty> : (
          <ul className="divide-y divide-white/[0.05]">
            {shown.map((l) => {
              const p = leadProject(l, data.projects)
              const source = l.utm?.source || l.referrer?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || l.site || 'direct'
              return (
                <li key={l.id} className="group py-3">
                  <div className="flex items-center gap-3">
                    <span className={cx('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[l.status] || 'bg-zinc-600')} />
                    <button onClick={() => setOpen(open === l.id ? null : l.id)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm text-zinc-100">{l.name || l.email || l.phone}</div>
                      <div className="truncate text-xs text-zinc-500">{p?.name || l.site || '—'} · {source} · {timeAgo(l.createdAt)}</div>
                    </button>
                    {openLead(l) && l.followUp && (followUpDue(l, day)
                      ? <Badge tone="amber">{l.followUp < day ? `Follow up · ${l.followUp}` : 'Follow up today'}</Badge>
                      : <span className="hidden shrink-0 text-xs text-zinc-600 sm:block">follow up {l.followUp}</span>)}
                    {l.email && <a href={`mailto:${l.email}`} className="text-zinc-500 hover:text-white" aria-label="Email"><Mail size={15} /></a>}
                    {l.phone && <a href={waLink(l.phone)} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white" aria-label="WhatsApp"><MessageCircle size={15} /></a>}
                    <Select value={l.status || 'new'} onChange={(e) => set(l, { status: e.target.value })} className="w-28 py-1 text-xs sm:text-xs" aria-label="Status">
                      {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                  {open === l.id && (
                    <div className="mt-3 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                      {l.message && <p className="whitespace-pre-wrap text-zinc-300">{l.message}</p>}
                      <div className="grid grid-cols-1 gap-1 text-xs text-zinc-500 sm:grid-cols-2">
                        {l.email && <span>Email · <span className="text-zinc-300">{l.email}</span></span>}
                        {l.phone && <span>Phone · <span className="text-zinc-300">{l.phone}</span></span>}
                        {l.page && <span>Page · <span className="text-zinc-300">{l.site}{l.page}</span></span>}
                        {l.referrer && <span className="truncate">Referrer · <span className="text-zinc-300">{l.referrer}</span></span>}
                        {(l.utm?.source || l.utm?.campaign) && <span>UTM · <span className="text-zinc-300">{[l.utm.source, l.utm.medium, l.utm.campaign].filter(Boolean).join(' / ')}</span></span>}
                        <span>Received · <span className="text-zinc-300">{l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN') : '—'}</span></span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={p?.slug || ''} onChange={(e) => set(l, { project: e.target.value || null })} className="min-w-0 py-1 text-xs sm:text-xs" aria-label="Project">
                          <option value="">No project</option>
                          {projects.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}
                        </Select>
                        <Select value={l.campaign || ''} onChange={(e) => set(l, { campaign: e.target.value || null })} className="min-w-0 py-1 text-xs sm:text-xs" aria-label="Campaign">
                          <option value="">No campaign</option>
                          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.p.name}</option>)}
                        </Select>
                        {p && <Button className="px-2 py-1 text-xs" onClick={() => go(`/p/${p.slug}`)}>Open project</Button>}
                        <Button variant="danger" className="ml-auto px-2 py-1 text-xs" onClick={() => removeDoc(l.id)}><Trash2 size={12} /> Delete</Button>
                      </div>
                      {openLead(l) && <FollowUp l={l} p={p} set={set} />}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section title="Collect leads from any site" action={<Button variant="glass" onClick={copy}><Copy size={13} /> {copied ? 'Copied' : 'Copy'}</Button>}>
        <p className="mb-3 text-sm text-zinc-400">
          Send a contact form here and it lands in this list and pings your phone. Works from any of your domains; add a hidden <code className="text-zinc-300">website</code> field to catch bots.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-300">{SNIPPET}</pre>
      </Section>
    </div>
  )
}

// ── page ───────────────────────────────────────────────

export default function MarketingView({ data, go, tab }) {
  const current = MARKETING_TABS.some((t) => t.key === tab) ? tab : 'traffic'
  const leads = useMemo(() => leadsFrom(data.docs), [data.docs])
  const fresh = leads.filter((l) => l.status === 'new' || followUpDue(l)).length
  const active = useRef(null)
  useEffect(() => { active.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }) }, [current])
  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl [scrollbar-width:none]">
        {MARKETING_TABS.map((t) => (
          <button
            key={t.key}
            ref={current === t.key ? active : null}
            onClick={() => go(`/marketing/${t.key}`)}
            className={cx('shrink-0 rounded-lg px-3.5 py-1.5 text-sm transition', current === t.key ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-zinc-400 hover:text-zinc-100')}
          >
            {t.label}{t.key === 'leads' && fresh > 0 && <span className="ml-1.5 rounded-full bg-sky-400/15 px-1.5 text-[10px] tabular-nums text-sky-300">{fresh}</span>}
          </button>
        ))}
      </div>
      {current === 'traffic' && <Traffic data={data} go={go} leads={leads} />}
      {current === 'instagram' && <Instagram data={data} go={go} />}
      {current === 'posts' && <PostsView />}
      {current === 'logs' && <LogsView />}
      {current === 'calendar' && <CalendarView docs={data.docs} />}
      {current === 'seo' && <Seo data={data} />}
      {current === 'search' && <Search data={data} go={go} />}
      {current === 'speed' && <Vitals data={data} />}
      {current === 'campaigns' && <Campaigns data={data} go={go} leads={leads} />}
      {current === 'leads' && <Leads data={data} go={go} leads={leads} />}
    </div>
  )
}
