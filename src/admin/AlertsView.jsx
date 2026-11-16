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
      await api('/api/admin/notify', { method: 'POST', body: JSON.stringify({ title: 'VP Control test', message: 'WhatsApp alerts work. Critical ones arrive like this.' }) })
      setTest('Queued: the laptop sends it to the ops group within 2 minutes')
    } catch (e) {
      setTest(e.message)
    }
  }
  const counts = Object.fromEntries(Object.keys(SEVERITY).map((k) => [k, alerts.filter((a) => a.severity === k).length]))
  const mon = st.monitor
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
      </div>

      <div className="space-y-5 xl:col-span-2">
        <Section title="Phone notifications" action={<BellRing size={14} className="text-zinc-500" />}>
          <ul className="divide-y divide-white/[0.05]">
            <Channel name="Scheduled monitor" ok={!!st.monitorSecret && mon?.conclusion === 'success'}>
              GitHub Actions checks everything every 10 minutes, even when this page and your laptop are closed.
              {mon && <> Last run {timeAgo(mon.at)} — <a className="underline" href={mon.url} target="_blank" rel="noreferrer">{mon.conclusion || mon.status}</a>.</>}
            </Channel>
            <Channel name="WhatsApp · ops group" ok={!!wa?.deliveredAt && !st.whatsappWaiting}>
              Sent by the laptop agent through hermes, to the group Media-man reports to, so messages go out while the laptop is on and wait otherwise.
              {wa?.deliveredAt && <> Last delivered {timeAgo(wa.deliveredAt)}.</>}
              {st.whatsappWaiting > 0 && <span className="text-amber-300"> {st.whatsappWaiting} waiting.</span>}
            </Channel>
          </ul>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="glass" onClick={sendTest} disabled={test === 'sending' || !st.monitorSecret}><Send size={13} /> Send test</Button>
            {test && test !== 'sending' && <span className="text-xs text-zinc-400">{test}</span>}
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
