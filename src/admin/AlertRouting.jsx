// Alert gateway settings on the Alerts page: which WhatsApp group each
// sender's alerts go to (vp_sites/alert_routes, read by
// api/admin/_routes/notify.js), and the keys apps and jobs use to send.
import { useEffect, useState } from 'react'
import { ArrowRight, Copy, KeyRound, Plus, Route, Trash2 } from 'lucide-react'
import { api, saveDoc, timeAgo } from './data'
import { Badge, Button, Empty, Input, Section, Select, cx } from './ui'

// Until the laptop agent reports the bridge's groups (hourly), these are known.
const KNOWN_GROUPS = [
  { id: '120363411809952493@g.us', name: 'Admin Updates' },
  { id: '120363430707253081@g.us', name: 'SocialMedia' },
  { id: '120363037239807748@g.us', name: 'Daily' },
  { id: '120363430500442627@g.us', name: 'Stackyy Updates' },
]
const FALLBACK_CHAT = '120363411809952493@g.us'
const KIND_OPTIONS = ['critical', 'resolved', 'digest', 'lead', 'jobs', 'test', 'info']
// Sources the admin itself sends as; apps with keys add theirs.
const BUILTIN_SOURCES = ['monitor', 'leads', 'jobs', 'admin']

export const groupsFrom = (docs) => {
  const reported = docs?.whatsapp_groups?.groups || []
  const all = [...reported]
  for (const g of KNOWN_GROUPS) if (!all.some((x) => x.id === g.id)) all.push(g)
  return all
}

export function AlertRouting({ docs, sources = [] }) {
  const saved = docs?.alert_routes || {}
  const groups = groupsFrom(docs)
  const [defaultChat, setDefault] = useState(saved.defaultChat || FALLBACK_CHAT)
  const [rules, setRules] = useState(saved.rules || [])
  const [quiet, setQuiet] = useState(saved.quiet || { enabled: false, start: '23:00', end: '07:00' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  // Pick up changes saved elsewhere until the form is edited.
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    if (dirty) return
    setDefault(saved.defaultChat || FALLBACK_CHAT)
    setRules(saved.rules || [])
    setQuiet(saved.quiet || { enabled: false, start: '23:00', end: '07:00' })
  }, [saved.defaultChat, saved.rules, saved.quiet, dirty])

  const name = (id) => groups.find((g) => g.id === id)?.name || id
  const edit = (i, patch) => { setDirty(true); setRules(rules.map((r, j) => (j === i ? { ...r, ...patch } : r))) }
  const move = (i, d) => { const next = [...rules]; [next[i], next[i + d]] = [next[i + d], next[i]]; setDirty(true); setRules(next) }
  const save = async () => {
    setBusy(true); setMsg(null)
    try {
      const clean = rules.map((r) => ({ source: (r.source || '').trim().toLowerCase(), kind: r.kind || '', chatId: r.chatId })).filter((r) => r.chatId)
      await saveDoc('alert_routes', { kind: 'alert_routes', defaultChat, rules: clean, quiet })
      setDirty(false); setMsg('Saved. New alerts follow these routes within a minute.')
    } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  const allSources = [...new Set([...BUILTIN_SOURCES, ...sources, 'media-man', 'hermes:*'])]

  return (
    <Section title="Routing" action={<Route size={14} className="text-zinc-500" />}>
      <p className="mb-3 text-xs text-zinc-500">Which WhatsApp group each sender's alerts go to. The first matching rule wins; a source ending in * matches everything starting with it (hermes:* is every hermes job).</p>
      <datalist id="alert-sources">{allSources.map((s) => <option key={s} value={s} />)}</datalist>
      <ul className="space-y-2">
        {rules.map((r, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 p-2">
            <Input list="alert-sources" value={r.source || ''} onChange={(e) => edit(i, { source: e.target.value })} placeholder="source, e.g. media-man" className="w-40 text-xs" aria-label="Source" />
            <Select value={r.kind || ''} onChange={(e) => edit(i, { kind: e.target.value })} className="w-32 text-xs" aria-label="Kind">
              <option value="">any kind</option>
              {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
            </Select>
            <ArrowRight size={13} className="text-zinc-600" />
            <Select value={r.chatId || ''} onChange={(e) => edit(i, { chatId: e.target.value })} className="min-w-[10rem] flex-1 text-xs" aria-label="Group">
              <option value="">choose a group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
            <span className="flex gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-xs text-zinc-500 hover:text-white disabled:opacity-30" aria-label="Move up">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === rules.length - 1} className="px-1 text-xs text-zinc-500 hover:text-white disabled:opacity-30" aria-label="Move down">↓</button>
              <button onClick={() => { setDirty(true); setRules(rules.filter((_, j) => j !== i)) }} className="px-1 text-zinc-600 hover:text-red-300" aria-label="Remove rule"><Trash2 size={13} /></button>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <Button className="px-2 py-1 text-xs" onClick={() => { setDirty(true); setRules([...rules, { source: '', kind: '', chatId: '' }]) }}><Plus size={12} /> Add rule</Button>
        <span className="ml-auto flex items-center gap-2">Everything else goes to
          <Select value={defaultChat} onChange={(e) => { setDirty(true); setDefault(e.target.value) }} className="text-xs" aria-label="Default group">
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 p-2 text-xs text-zinc-400">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={!!quiet.enabled} onChange={(e) => { setDirty(true); setQuiet({ ...quiet, enabled: e.target.checked }) }} className="accent-white" />
          Quiet hours
        </label>
        <Input type="time" value={quiet.start} onChange={(e) => { setDirty(true); setQuiet({ ...quiet, start: e.target.value }) }} className="w-28 text-xs" aria-label="Quiet from" />
        <span>to</span>
        <Input type="time" value={quiet.end} onChange={(e) => { setDirty(true); setQuiet({ ...quiet, end: e.target.value }) }} className="w-28 text-xs" aria-label="Quiet until" />
        <span className="text-zinc-500">IST · everything but critical waits until they end</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="primary" onClick={save} disabled={busy || !dirty}>Save routes</Button>
        {msg && <span className="text-xs text-zinc-400">{msg}</span>}
      </div>
      {!dirty && rules.length > 0 && (
        <p className="mt-3 text-[11px] text-zinc-600">{rules.map((r) => `${r.source || 'any'}${r.kind ? ` (${r.kind})` : ''} → ${name(r.chatId)}`).join(' · ')} · else → {name(defaultChat)}{quiet.enabled ? ` · quiet ${quiet.start}–${quiet.end}` : ''}</p>
      )}
    </Section>
  )
}

export function SenderKeys() {
  const [keys, setKeys] = useState(null)
  const [error, setError] = useState(null)
  const [f, setF] = useState({ source: '', label: '' })
  const [made, setMade] = useState(null)
  const [busy, setBusy] = useState(false)
  const load = async () => { try { setKeys((await api('/api/admin/notify?keys=1')).keys); setError(null) } catch (e) { setError(e.message) } }
  useEffect(() => { load() }, [])
  const create = async () => {
    setBusy(true); setError(null)
    try { setMade(await api('/api/admin/notify', { method: 'POST', body: JSON.stringify({ action: 'createKey', ...f }) })); setF({ source: '', label: '' }); await load() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const revoke = async (k) => {
    if (!window.confirm(`Revoke the ${k.source} key? Anything still using it stops being able to send alerts.`)) return
    await api('/api/admin/notify', { method: 'POST', body: JSON.stringify({ action: 'revokeKey', id: k.id }) }).catch((e) => setError(e.message))
    load()
  }
  const example = made && `curl -X POST https://admin.vishalpanwar.in/api/admin/notify \\
  -H "Authorization: Bearer ${made.key}" -H "Content-Type: application/json" \\
  -d '{"kind":"info","title":"Backup finished","lines":["42 files","took 3m"]}'`
  return (
    <Section title="Sender keys" action={<KeyRound size={14} className="text-zinc-500" />}>
      <p className="mb-3 text-xs text-zinc-500">Each app or job sends with its own key, which also names it as the source for routing. Revoke one without touching the others.</p>
      <div className="flex flex-wrap gap-2">
        <Input value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} placeholder="source, e.g. media-man" className="w-44" aria-label="Source" />
        <Input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="what uses it (optional)" className="min-w-[10rem] flex-1" aria-label="Label" />
        <Button variant="glass" onClick={create} disabled={busy || !f.source.trim()}><Plus size={13} /> Create key</Button>
      </div>
      {made && (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs text-amber-100">
          <div className="flex items-center gap-2"><b>Copy this key now: it won't be shown again.</b>
            <button onClick={() => navigator.clipboard?.writeText(made.key)} className="ml-auto text-amber-300 hover:text-white" title="Copy key"><Copy size={13} /></button></div>
          <code className="block break-all rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-zinc-200">{made.key}</code>
          <pre className="overflow-x-auto rounded bg-black/40 px-2 py-1.5 font-mono text-[11px] text-zinc-300">{example}</pre>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {!keys ? <p className="mt-3 text-xs text-zinc-500">Loading…</p> : keys.length === 0 ? <div className="mt-3"><Empty>No keys yet. The admin's own alerts don't need one.</Empty></div> : (
        <ul className="mt-3 divide-y divide-white/[0.05]">
          {keys.map((k) => (
            <li key={k.id} className={cx('flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm', k.revoked && 'opacity-50')}>
              <span className="font-mono text-xs text-zinc-200">{k.source}</span>
              {k.label && <span className="text-xs text-zinc-500">{k.label}</span>}
              {k.revoked && <Badge tone="red">revoked</Badge>}
              <span className="ml-auto text-[11px] text-zinc-600">made {timeAgo(k.createdAt)} · {k.lastUsedAt ? `last used ${timeAgo(k.lastUsedAt)}` : 'never used'}</span>
              {!k.revoked && <Button variant="danger" className="px-2 py-0.5 text-xs" onClick={() => revoke(k)}>Revoke</Button>}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

const niceJob = (n) => String(n).replace(/[_@]/g, ' ').replace(/\.service$/, '').replace(/\s+/g, ' ').trim()
const when = (ms) => (ms ? new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—')

/** Every scheduled job on the laptop (hermes cron + systemd timers), from the laptop agent. */
export function JobHealth({ laptop }) {
  const [filter, setFilter] = useState('problems')
  const jobs = laptop?.jobs || []
  const now = Date.now()
  const state = (j) => (!j.enabled ? 'off' : !j.ok ? 'failed' : j.kind === 'hermes' && j.nextRun && now - j.nextRun > 30 * 60e3 ? 'late' : 'ok')
  const rank = { failed: 0, late: 1, ok: 2, off: 3 }
  const all = jobs.map((j) => ({ ...j, state: state(j) })).sort((a, b) => rank[a.state] - rank[b.state] || (b.lastRun || 0) - (a.lastRun || 0))
  const bad = all.filter((j) => j.state === 'failed' || j.state === 'late')
  const shown = filter === 'problems' ? bad : filter === 'all' ? all : all.filter((j) => j.kind === filter)
  const tone = { failed: 'red', late: 'amber', ok: 'green', off: 'zinc' }
  return (
    <Section title={`Jobs · ${jobs.length}`} action={<span className="text-xs text-zinc-500">{bad.length ? `${bad.length} need attention` : 'all healthy'}</span>}>
      <p className="mb-3 text-xs text-zinc-500">Every scheduled job on the laptop: hermes cron jobs and systemd timers. A job that fails or (hermes) misses its run by 30 minutes sends one alert, repeated daily at most.{laptop?.at ? ` Updated ${when(Date.parse(laptop.at))}.` : ''}</p>
      <div className="mb-3 flex flex-wrap gap-1">
        {[['problems', `Needs attention (${bad.length})`], ['all', 'All'], ['hermes', 'Hermes'], ['systemd', 'Timers']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={cx('rounded-lg px-2.5 py-1 text-xs', filter === k ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-white')}>{l}</button>
        ))}
      </div>
      {!jobs.length ? <Empty>No job data yet: the laptop agent reports it every 2 minutes.</Empty> : shown.length === 0 ? <Empty>Nothing needs attention.</Empty> : (
        <ul className="divide-y divide-white/[0.05]">
          {shown.slice(0, 80).map((j) => (
            <li key={j.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 text-sm">
              <span className="w-16 shrink-0"><Badge tone={tone[j.state]}>{j.state}</Badge></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-zinc-100">{niceJob(j.name)} <span className="text-[11px] text-zinc-600">{j.kind === 'hermes' ? 'hermes' : 'timer'}{j.deliver?.startsWith('vpalerts:') ? ` · ${j.deliver.slice(9)}` : ''}</span></span>
                {j.error && j.state === 'failed' && <span className="block truncate text-[11px] text-red-300/80">{j.error}</span>}
              </span>
              <span className="text-[11px] tabular-nums text-zinc-500">last {when(j.lastRun)} · next {when(j.nextRun)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
