// Everything that's wrong right now, and how it reaches your phone.
import { useEffect, useMemo, useState } from 'react'
import { BellRing, Check, ChevronRight, History, RefreshCw, Search, Send } from 'lucide-react'
import { SEVERITY, computeAlerts } from './alerts'
import { api, timeAgo } from './data'
import { Badge, Button, Empty, Input, Section, Select, cx } from './ui'
import { AlertRouting, JobHealth, SenderKeys, groupsFrom } from './AlertRouting'

const KIND = { site: 'Site', ssl: 'SSL', domain: 'Domain', database: 'Database', laptop: 'Laptop', deploy: 'Deploy', money: 'Money', client: 'Client', app: 'App' }

function Channel({ name, ok, children }) {
  return (
    <li className="flex items-start gap-3 py-2.5 text-sm">
      <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full', ok ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.06] text-zinc-600')}>{ok ? <Check size={12} /> : '·'}</span>
      <div className="min-w-0 flex-1">
        <div className="text-zinc-100">{name}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-zinc-500">{children}</div>
      </div>
    </li>
  )
}

const HISTORY_KINDS = {
  critical: { label: 'Critical', tone: 'red' },
  resolved: { label: 'Resolved', tone: 'green' },
  digest: { label: 'Morning check', tone: 'sky' },
  lead: { label: 'New lead', tone: 'amber' },
  jobs: { label: 'Jobs', tone: 'zinc' },
  info: { label: 'Info', tone: 'zinc' },
  test: { label: 'Test', tone: 'zinc' },
}
const when = (ms) => new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const mins = (ms) => (ms < 60e3 ? 'under a minute' : ms < 3600e3 ? `${Math.round(ms / 60e3)}m` : `${(ms / 3600e3).toFixed(1)}h`)

/** Every alert sent, kept 120 days (api/admin/notify?history=1). */
function AlertHistory({ docs }) {
  const groupName = (id) => groupsFrom(docs).find((g) => g.id === id)?.name
  const [state, setState] = useState({ items: null, error: null, loading: true })
  const [kind, setKind] = useState('all')
  const [site, setSite] = useState('all')
  const [source, setSource] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const load = async () => {
    setState((s) => ({ ...s, loading: true }))
    try { const r = await api('/api/admin/notify?history=1'); setState({ items: r.items, keep: r.keepDays, error: null, loading: false }) } catch (e) { setState((s) => ({ ...s, error: e.message, loading: false })) }
  }
  useEffect(() => { load() }, [])
  const items = useMemo(() => state.items || [], [state.items])
  const sites = useMemo(() => [...new Set(items.map((i) => i.site).filter(Boolean))].sort(), [items])
  const sources = useMemo(() => [...new Set(items.map((i) => i.source).filter(Boolean))].sort(), [items])
  // Sites that went down most in the last 30 days.
  const flappy = useMemo(() => {
    const since = Date.now() - 30 * 86400e3
    const n = {}
    for (const i of items) if (i.severity === 'critical' && i.site && i.at >= since) n[i.site] = (n[i.site] || 0) + 1
    return Object.entries(n).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [items])
  const shown = items.filter((i) => (kind === 'all' || i.severity === kind) && (site === 'all' || i.site === site) && (source === 'all' || i.source === source)
    && (!q || `${i.title} ${i.message}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <Section title={`History · ${items.length}`} action={<Button variant="glass" onClick={load} disabled={state.loading}><RefreshCw size={13} className={state.loading ? 'animate-spin' : ''} /></Button>}>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-zinc-500"><History size={12} /> Every alert sent to WhatsApp, kept {state.keep || 120} days, with when it was delivered.</p>
      {flappy.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
          <span className="text-zinc-500">Went down most (30 days):</span>
          {flappy.map(([h, c]) => <button key={h} onClick={() => setSite(h)}><Badge tone="amber">{h} · {c}×</Badge></button>)}
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="relative min-w-[10rem] flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alerts" className="w-full pl-8" />
        </span>
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind">
          <option value="all">All kinds</option>
          {Object.entries(HISTORY_KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <Select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Source">
          <option value="all">All senders</option>
          {sources.map((x) => <option key={x} value={x}>{x}</option>)}
        </Select>
        <Select value={site} onChange={(e) => setSite(e.target.value)} aria-label="Site">
          <option value="all">All sites</option>
          {sites.map((h) => <option key={h} value={h}>{h}</option>)}
        </Select>
      </div>
      {state.error ? <Empty>Couldn't load history: {state.error}</Empty> : !state.items ? <div className="text-sm text-zinc-500">Loading…</div>
        : shown.length === 0 ? <Empty>{items.length ? 'No alerts match.' : 'Nothing logged yet. Alerts are recorded from now on.'}</Empty> : (
          <ul className="divide-y divide-white/[0.05]">
            {shown.slice(0, 300).map((i) => (
              <li key={i.id} className="py-2">
                <button onClick={() => setOpen(open === i.id ? null : i.id)} className="flex w-full items-start gap-3 text-left">
                  <span className="w-28 shrink-0 pt-0.5 text-[11px] tabular-nums text-zinc-500">{when(i.at)}</span>
                  <span className="w-28 shrink-0"><Badge tone={HISTORY_KINDS[i.severity]?.tone}>{HISTORY_KINDS[i.severity]?.label || i.severity}</Badge></span>
                  <span className="min-w-0 flex-1">
                    <span className={cx('block text-sm text-zinc-100', open !== i.id && 'truncate')}>{i.message || i.title}</span>
                    <span className="block text-[11px] text-zinc-600">
                      {i.source ? `${i.source} · ` : ''}{i.chatId ? `${groupName(i.chatId) || 'WhatsApp'} · ` : ''}
                      {i.status === 'delivered' && i.deliveredAt ? `delivered ${mins(i.deliveredAt - i.at)} later` : i.status === 'discarded' ? 'discarded unsent'
                        : i.status === 'merged' ? 'merged: same alert sent in the last 10 minutes' : i.status === 'held' ? `held for quiet hours until ${new Date(i.holdUntil).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : 'waiting for the laptop'}
                      {i.emailedAt ? ' · also emailed' : i.emailError ? ` · email failed (${i.emailError})` : ''}
                    </span>
                  </span>
                </button>
                {open === i.id && i.message && i.message.includes('\n') && <pre className="ml-[15rem] mt-1 whitespace-pre-wrap text-xs text-zinc-400">{i.message}</pre>}
              </li>
            ))}
          </ul>
        )}
    </Section>
  )
}

export default function AlertsView({ data, go }) {
  const alerts = computeAlerts(data)
  const st = data.integrations.data || {}
  const [test, setTest] = useState(null)
  const sendTest = async () => {
    setTest('sending')
    try {
      await api('/api/admin/notify', { method: 'POST', body: JSON.stringify({ kind: 'test', title: 'Admin test', message: 'WhatsApp alerts work.\nCritical ones arrive in this same shape.' }) })
      setTest('Queued: the laptop sends it to the ops group within 2 minutes')
    } catch (e) {
      setTest(e.message)
    }
  }
  const counts = Object.fromEntries(Object.keys(SEVERITY).map((k) => [k, alerts.filter((a) => a.severity === k).length]))
  const mon = st.monitor
  const lap = data.docs?.laptop?.monitor
  const wa = data.docs?.whatsapp

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <div className="space-y-5 xl:col-span-3">
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(SEVERITY).map(([k, s]) => (
            <div key={k} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-xl">
              <div className="text-xs text-zinc-500">{s.label}</div>
              <div className={cx('mt-1 text-3xl font-semibold tabular-nums', counts[k] ? (k === 'critical' ? 'text-red-400' : k === 'warning' ? 'text-amber-300' : 'text-zinc-200') : 'text-zinc-600')}>{counts[k]}</div>
            </div>
          ))}
        </div>
        <Section title="Open now">
          {alerts.length === 0 ? <Empty>All clear — every site up, nothing expiring, nothing overdue.</Empty> : (
            <ul className="divide-y divide-white/[0.05]">
              {alerts.map((a) => (
                <li key={a.key}>
                  <button onClick={() => go(a.to)} className="group flex w-full items-center gap-3 py-2.5 text-left">
                    <span className={cx('h-2 w-2 shrink-0 rounded-full', a.severity === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]' : a.severity === 'warning' ? 'bg-amber-400' : 'bg-zinc-500')} />
                    <span className="w-16 shrink-0"><Badge tone={SEVERITY[a.severity].tone}>{KIND[a.kind] || a.kind}</Badge></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-zinc-100">{a.title}</span>
                      {a.detail && <span className="block truncate text-xs text-zinc-500">{a.detail}</span>}
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-zinc-700 group-hover:text-zinc-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <JobHealth laptop={data.docs?.laptop} />
        <AlertHistory docs={data.docs} />
      </div>

      <div className="space-y-5 xl:col-span-2">
        <Section title="Phone notifications" action={<BellRing size={14} className="text-zinc-500" />}>
          <ul className="divide-y divide-white/[0.05]">
            <Channel name="Uptime monitor" ok={!!st.monitorSecret && (lap ? Date.now() - Date.parse(lap.at) < 30 * 60e3 : mon?.conclusion === 'success')}>
              The laptop checks every site, certificate and Supabase project every 10 minutes while it’s on. GitHub Actions is the backup for when it’s off, but only runs every few hours.
              {lap && <> Laptop last checked {timeAgo(lap.at)}: {lap.hosts} sites, {lap.down} down.</>}
              {mon && <> GitHub last ran {timeAgo(mon.at)} (<a className="underline" href={mon.url} target="_blank" rel="noreferrer">{mon.conclusion || mon.status}</a>).</>}
            </Channel>
            <Channel name="WhatsApp · ops group" ok={!!wa?.deliveredAt && !st.whatsappWaiting}>
              Every app sends alerts to this dashboard's gateway; the laptop agent delivers each one through hermes to the group its routing rule picks. Messages go out while the laptop is on and wait otherwise.
              {wa?.deliveredAt && <> Last delivered {timeAgo(wa.deliveredAt)}.</>}
              {st.whatsappWaiting > 0 && <span className="text-amber-300"> {st.whatsappWaiting} waiting.</span>}
            </Channel>
          </ul>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="glass" onClick={sendTest} disabled={test === 'sending' || !st.monitorSecret}><Send size={13} /> Send test</Button>
            {test && test !== 'sending' && <span className="text-xs text-zinc-400">{test}</span>}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {st.alertEmail ? 'Email fallback is on: critical alerts are also emailed when the laptop is offline.'
              : <>Email fallback is off. To get critical alerts by email while the laptop is offline, add <code>RESEND_API_KEY</code> and <code>ALERT_EMAIL_TO</code> on Vercel.</>}
          </div>
          {!st.monitorSecret && (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/30 p-3 text-xs leading-relaxed text-zinc-400">
              <b className="text-zinc-200">Set up once (2 minutes):</b>
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                <li>Run in a terminal (or in Claude Code with <code>!</code>):
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-black/50 px-2 py-1.5 font-mono text-[11px] text-zinc-300">bash ~/Development/Projects/Portfolio/scripts/setup.sh</pre>
                  It sets up the backend’s service account and the shared secret, and starts the laptop agent (reports every 2 minutes while the laptop is on and delivers WhatsApp alerts through hermes).</li>
                <li>Come back here and press <b>Send test</b>.</li>
              </ol>
            </div>
          )}
        </Section>

        <AlertRouting docs={data.docs} />
        <SenderKeys />
        <Section title="What wakes you up">
          <ul className="space-y-2 text-xs text-zinc-400">
            <li><Badge tone="red">critical</Badge> its own message: a live project’s site down · Supabase paused or unhealthy · SSL or domain expiring within 7 days</li>
            <li><Badge>also</Badge> new leads from contact forms · new SDE roles each morning</li>
            <li><Badge>digest</Badge> 9am: open warnings (other sites down, laptop services, disk) · renewals · contracts · overdue invoices · low ratings · lead follow-ups · PageSpeed drops</li>
            <li className="text-zinc-600">Critical problems get one message when they start and one when they’re fixed, repeated every 6 hours while open. Everything else waits for the dashboard or the morning check.</li>
          </ul>
        </Section>
      </div>
    </div>
  )
}
