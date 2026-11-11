// Everything that's wrong right now, and how it reaches your phone.
import { useState } from 'react'
import { BellRing, Check, ChevronRight, Send } from 'lucide-react'
import { SEVERITY, computeAlerts } from './alerts'
import { api, timeAgo } from './data'
import { Badge, Button, Empty, Section, cx } from './ui'

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

export default function AlertsView({ data, go }) {
  const alerts = computeAlerts(data)
  const st = data.integrations.data || {}
  const [test, setTest] = useState(null)
  const sendTest = async () => {
    setTest('sending')
    try {
      const r = await api('/api/admin/notify', { method: 'POST', body: JSON.stringify({ title: 'VP Control test', message: 'Notifications work. Critical alerts arrive like this, loud.', priority: 'critical' }) })
      setTest(r.sent.length ? `Sent via ${r.sent.join(' + ')}` : `Failed: ${r.errors.join(', ')}`)
    } catch (e) {
      setTest(e.message)
    }
  }
  const counts = Object.fromEntries(Object.keys(SEVERITY).map((k) => [k, alerts.filter((a) => a.severity === k).length]))
  const mon = st.monitor

  return (
    <div className="grid gap-5 xl:grid-cols-5">
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
      </div>

      <div className="space-y-5 xl:col-span-2">
        <Section title="Phone notifications" action={<BellRing size={14} className="text-zinc-500" />}>
          <ul className="divide-y divide-white/[0.05]">
            <Channel name="Scheduled monitor" ok={!!st.monitorSecret && mon?.conclusion === 'success'}>
              GitHub Actions checks everything every 10 minutes, even when this page and your laptop are closed.
              {mon && <> Last run {timeAgo(mon.at)} — <a className="underline" href={mon.url} target="_blank" rel="noreferrer">{mon.conclusion || mon.status}</a>.</>}
            </Channel>
            <Channel name="ntfy push (recommended)" ok={st.ntfy}>
              Real phone notifications; critical ones are “urgent” and ring through Do Not Disturb if you allow it in the ntfy app.
            </Channel>
            <Channel name="Telegram" ok={st.telegram}>Optional second channel.</Channel>
          </ul>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="glass" onClick={sendTest} disabled={test === 'sending' || !(st.ntfy || st.telegram)}><Send size={13} /> Send test</Button>
            {test && test !== 'sending' && <span className="text-xs text-zinc-400">{test}</span>}
          </div>
          {!(st.ntfy && st.monitorSecret) && (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/30 p-3 text-xs leading-relaxed text-zinc-400">
              <b className="text-zinc-200">Set up once (2 minutes):</b>
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                <li>Run in a terminal (or in Claude Code with <code>!</code>):
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-black/50 px-2 py-1.5 font-mono text-[11px] text-zinc-300">bash ~/Development/Projects/Portfolio/scripts/setup.sh</pre>
                  It sets up the backend’s service account, the shared secret and a private ntfy topic, and starts the laptop agent (reports every 2 minutes while the laptop is on).</li>
                <li>Install <b>ntfy</b> on your phone (Play Store / App Store), tap +, and subscribe to the topic the script printed.</li>
                <li>Come back here and press <b>Send test</b>.</li>
              </ol>
            </div>
          )}
        </Section>

        <Section title="What wakes you up">
          <ul className="space-y-2 text-xs text-zinc-400">
            <li><Badge tone="red">critical</Badge> a live project’s site down · Supabase paused or unhealthy · SSL or domain expiring within 7 days</li>
            <li><Badge tone="amber">warning</Badge> other sites down · laptop service failing · disk nearly full · failed deploy · overdue invoice · rating under 4</li>
            <li><Badge>digest</Badge> 9am: renewals within 30 days, contracts ending, overdue invoices</li>
            <li className="text-zinc-600">You get one message when something breaks and one when it’s fixed; critical ones repeat every 6 hours until resolved.</li>
          </ul>
        </Section>
      </div>
    </div>
  )
}
