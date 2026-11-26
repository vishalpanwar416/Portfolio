// Docs: run docs.vishalpanwar.in from here — who can open what, documents'
// visibility, workspace and share lists, workspaces and their members, and
// everyone with access. Reads and writes go through /api/admin/docs (the
// docs site's own Firestore collections in sanero-media). Writing the
// documents themselves stays in the docs site's dashboard.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, ExternalLink, FileText, Globe, Lock, Plus, RefreshCw, Search, Trash2, Users, X } from 'lucide-react'
import { api, timeAgo } from './data'
import { Badge, Button, Empty, Input, Section, Select, Stat, cx } from './ui'

export const DOCS_TABS = [
  { key: 'documents', label: 'Documents' },
  { key: 'workspaces', label: 'Workspaces' },
  { key: 'people', label: 'People' },
]

const size = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n || 0} B`)
const splitList = (text) => text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)

function useDocs() {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try { setState({ data: await api('/api/admin/docs'), error: null, loading: false }) } catch (e) { setState({ data: null, error: e.message, loading: false }) }
  }, [])
  useEffect(() => { load() }, [load])
  const act = useCallback(async (body) => {
    const r = await api('/api/admin/docs', { method: 'POST', body: JSON.stringify(body) })
    await load()
    return r
  }, [load])
  return { ...state, reload: load, act }
}

/** Chips for emails and @domains, with an input to add more. */
function People({ value, onAdd, onRemove, placeholder = 'email or @company.com', busy }) {
  const [text, setText] = useState('')
  const add = () => { const list = splitList(text); if (list.length) { onAdd(list); setText('') } }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((who) => (
        <span key={who} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-xs text-zinc-200">
          {who.startsWith('@') ? <Users size={11} className="text-zinc-500" /> : null}{who}
          <button onClick={() => onRemove(who)} disabled={busy} className="text-zinc-500 hover:text-red-300" aria-label={`Remove ${who}`}><X size={11} /></button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
        disabled={busy}
        placeholder={placeholder}
        className="min-w-[12rem] flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none sm:text-xs"
      />
    </div>
  )
}

function DocRow({ d, workspaces, act, site }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(d.title)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const run = async (body, done) => {
    setBusy(true); setMsg(null)
    try { await act({ slug: d.slug, ...body }); if (done) setMsg(done) } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!window.confirm(`Delete "${d.title}" for good? Its ${d.photos} photo(s) and ${d.files} file(s) go too, and its link stops working.`)) return
    setBusy(true)
    try { await act({ action: 'deleteDoc', slug: d.slug }) } catch (e) { setMsg(e.message); setBusy(false) }
  }
  const ws = workspaces.find((w) => w.id === d.workspace)
  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <button onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <FileText size={15} className="shrink-0 text-zinc-500" />
          <span className="min-w-0">
            <span className="block truncate text-sm text-zinc-100">{d.title}</span>
            <span className="block truncate font-mono text-[11px] text-zinc-600">/{d.slug}{(d.photos || d.files) ? ` · ${d.photos} photos · ${d.files} files${d.bytes ? ` (${size(d.bytes)})` : ''}` : ''}</span>
          </span>
        </button>
        <button
          onClick={() => run({ action: 'updateDoc', visibility: d.visibility === 'public' ? 'protected' : 'public' })}
          disabled={busy}
          title={d.visibility === 'public' ? 'Anyone with the link can open it — click to protect' : 'Only its workspace and share list — click to make public'}
        >
          {d.visibility === 'public' ? <Badge tone="amber"><Globe size={11} className="mr-1" /> Public</Badge> : <Badge><Lock size={11} className="mr-1" /> Protected</Badge>}
        </button>
        <Select value={d.workspace} onChange={(e) => run({ action: 'updateDoc', workspace: e.target.value })} disabled={busy} className="w-40 text-xs" aria-label="Workspace">
          <option value="">No workspace</option>
          {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
        <span className="w-24 shrink-0 text-right text-[11px] text-zinc-600">{timeAgo(d.updatedAt)}</span>
        <a href={d.url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white" title="Open"><ExternalLink size={14} /></a>
      </div>
      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-white/[0.06] bg-black/30 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[14rem] flex-1"><span className="mb-1 block text-xs text-zinc-500">Title</span><Input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" /></label>
            <Button onClick={() => run({ action: 'updateDoc', title }, 'Title saved')} disabled={busy || !title.trim() || title === d.title}>Save title</Button>
          </div>
          <div>
            <span className="mb-1 block text-xs text-zinc-500">Shared with (on top of {ws ? <>the <b className="text-zinc-300">{ws.name}</b> workspace</> : 'its workspace'})</span>
            <People
              value={d.sharedWith}
              busy={busy}
              onAdd={(list) => run({ action: 'updateDoc', sharedWith: [...d.sharedWith, ...list] }, 'Shared')}
              onRemove={(who) => run({ action: 'updateDoc', sharedWith: d.sharedWith.filter((x) => x !== who) })}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
            <span className="text-xs text-zinc-500">Created {timeAgo(d.createdAt)} · write and edit the text in the <a className="underline hover:text-zinc-300" href={`${site}/dashboard`} target="_blank" rel="noreferrer">docs dashboard</a></span>
            <Button variant="danger" onClick={remove} disabled={busy}><Trash2 size={13} /> Delete</Button>
          </div>
        </div>
      )}
      {msg && <p className="mt-1 text-xs text-zinc-400">{msg}</p>}
    </li>
  )
}

function Documents({ data, act }) {
  const [q, setQ] = useState('')
  const [ws, setWs] = useState('all')
  const [vis, setVis] = useState('all')
  const shown = data.docs.filter((d) =>
    (ws === 'all' || d.workspace === ws || (ws === 'none' && !d.workspace)) &&
    (vis === 'all' || d.visibility === vis) &&
    (!q || `${d.title} ${d.slug} ${d.sharedWith.join(' ')}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <Section
      title={`Documents · ${shown.length}`}
      action={<a href={`${data.site}/dashboard`} target="_blank" rel="noreferrer"><Button variant="glass"><Plus size={13} /> New in docs dashboard</Button></a>}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="relative min-w-[12rem] flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, address or person" className="w-full pl-8" />
        </span>
        <Select value={ws} onChange={(e) => setWs(e.target.value)} aria-label="Workspace filter">
          <option value="all">All workspaces</option>
          <option value="none">No workspace</option>
          {data.workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
        <Select value={vis} onChange={(e) => setVis(e.target.value)} aria-label="Visibility filter">
          <option value="all">Public and protected</option>
          <option value="public">Public</option>
          <option value="protected">Protected</option>
        </Select>
      </div>
      {shown.length === 0 ? <Empty>No documents match.</Empty> : (
        <ul className="divide-y divide-white/[0.05]">
          {shown.map((d) => <DocRow key={d.slug} d={d} workspaces={data.workspaces} act={act} site={data.site} />)}
        </ul>
      )}
    </Section>
  )
}

function WorkspaceCard({ w, docs, act }) {
  const [name, setName] = useState(w.name)
  const [desc, setDesc] = useState(w.description)
  const [busy, setBusy] = useState(false)
  const [invite, setInvite] = useState(null)
  const [msg, setMsg] = useState(null)
  const run = async (body) => {
    setBusy(true); setMsg(null)
    try { const r = await act({ id: w.id, ...body }); if (r?.invite) setInvite(r.invite) } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!window.confirm(`Delete the "${w.name}" workspace? Its ${w.docs.length} document(s) stay but leave it, so its ${w.members.length} member(s) lose access to them.`)) return
    run({ action: 'deleteWorkspace' })
  }
  const changed = name !== w.name || desc !== w.description
  return (
    <Section title={w.name} action={<span className="font-mono text-[11px] text-zinc-600">{w.id}</span>}>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What it's for (members see this)" aria-label="Description" />
        </div>
        {changed && <Button onClick={() => run({ action: 'updateWorkspace', name, description: desc })} disabled={busy || !name.trim()}>Save</Button>}
        <div>
          <span className="mb-1 block text-xs text-zinc-500">Members · see every document in this workspace after signing in with Google</span>
          <People
            value={w.members}
            busy={busy}
            onAdd={(list) => run({ action: 'updateWorkspace', addMembers: list })}
            onRemove={(who) => run({ action: 'updateWorkspace', removeMembers: [who] })}
          />
        </div>
        {invite && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-2.5 text-xs text-emerald-200">
            <span className="flex-1">{invite}</span>
            <button onClick={() => navigator.clipboard?.writeText(invite)} className="shrink-0 text-emerald-300 hover:text-white" title="Copy invite"><Copy size={13} /></button>
          </div>
        )}
        <div>
          <span className="mb-1 block text-xs text-zinc-500">Documents · {w.docs.length}</span>
          {w.docs.length === 0 ? <p className="text-xs text-zinc-600">None yet — pick this workspace on a document.</p> : (
            <div className="flex flex-wrap gap-1.5">
              {w.docs.map((slug) => { const d = docs.find((x) => x.slug === slug); return <a key={slug} href={d?.url} target="_blank" rel="noreferrer" className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-zinc-300 hover:border-white/25 hover:text-white">{d?.title || slug}</a> })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-zinc-600">
          <span>Updated {timeAgo(w.updatedAt)}</span>
          <Button variant="danger" onClick={remove} disabled={busy}><Trash2 size={13} /> Delete workspace</Button>
        </div>
        {msg && <p className="text-xs text-red-300">{msg}</p>}
      </div>
    </Section>
  )
}

function NewWorkspace({ act }) {
  const [f, setF] = useState({ name: '', description: '', members: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const create = async () => {
    setBusy(true); setMsg(null)
    try { await act({ action: 'createWorkspace', name: f.name, description: f.description, members: splitList(f.members) }); setF({ name: '', description: '', members: '' }) } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  return (
    <Section title="New workspace">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name, e.g. Splink Pro team" />
        <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What it's for" />
        <Input value={f.members} onChange={(e) => setF({ ...f, members: e.target.value })} placeholder="Members: emails or @company.com" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="primary" onClick={create} disabled={busy || !f.name.trim()}><Plus size={13} /> Create</Button>
        {msg && <span className="text-xs text-red-300">{msg}</span>}
      </div>
    </Section>
  )
}

function PeopleTab({ data, act }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(null)
  const wsName = (id) => data.workspaces.find((w) => w.id === id)?.name || id
  const docTitle = (slug) => data.docs.find((d) => d.slug === slug)?.title || slug
  const revoke = async (p) => {
    const what = [p.workspaces.length && `${p.workspaces.length} workspace(s)`, p.docs.length && `${p.docs.length} document share(s)`].filter(Boolean).join(' and ')
    if (!window.confirm(`Remove ${p.who} from ${what}? They lose access straight away (public documents stay open to anyone).`)) return
    setBusy(p.who)
    try { await act({ action: 'revoke', who: p.who }) } finally { setBusy(null) }
  }
  const shown = data.people.filter((p) => !q || p.who.includes(q.toLowerCase()))
  return (
    <Section title={`People with access · ${data.people.length}`}>
      <p className="mb-3 text-xs text-zinc-500">Everyone who can open protected documents: workspace members and people a document is shared with directly. @domain means everyone signing in with that company's Google account.</p>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="mb-3 w-full sm:w-64" />
      {shown.length === 0 ? <Empty>No one yet. Add members to a workspace or share a document.</Empty> : (
        <ul className="divide-y divide-white/[0.05]">
          {shown.map((p) => (
            <li key={p.who} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
              <span className="flex min-w-[14rem] flex-1 items-center gap-2 text-sm text-zinc-100">
                {p.kind === 'domain' ? <Users size={14} className="text-zinc-500" /> : <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] font-semibold">{p.who[0].toUpperCase()}</span>}
                {p.who}
                {p.kind === 'domain' && <Badge tone="sky">whole company</Badge>}
              </span>
              <span className="flex min-w-0 flex-[2] flex-wrap gap-1">
                {p.workspaces.map((id) => <Badge key={id}>{wsName(id)}</Badge>)}
                {p.docs.map((slug) => <Badge key={slug} tone="amber">{docTitle(slug)}</Badge>)}
              </span>
              <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => revoke(p)} disabled={busy === p.who}>Remove access</Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export default function DocsView({ go, tab }) {
  const current = DOCS_TABS.some((t) => t.key === tab) ? tab : 'documents'
  const { data, error, loading, reload, act } = useDocs()
  const stats = useMemo(() => data && ({
    pub: data.docs.filter((d) => d.visibility === 'public').length,
    members: data.people.filter((p) => p.kind === 'person').length,
    domains: data.people.filter((p) => p.kind === 'domain').length,
  }), [data])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl [scrollbar-width:none]">
          {DOCS_TABS.map((t) => (
            <button key={t.key} onClick={() => go(`/docs/${t.key}`)}
              className={cx('shrink-0 rounded-lg px-3.5 py-1.5 text-sm transition', current === t.key ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-zinc-400 hover:text-zinc-100')}>
              {t.label}
            </button>
          ))}
        </div>
        <Button variant="glass" onClick={reload} disabled={loading}><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh</Button>
        <a href="https://docs.vishalpanwar.in" target="_blank" rel="noreferrer"><Button variant="glass"><ExternalLink size={13} /> Open docs</Button></a>
      </div>

      {error ? <Empty>Couldn't load docs: {error}</Empty> : !data ? <div className="text-sm text-zinc-500">Loading docs…</div> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Documents" value={data.docs.length} sub={`${stats.pub} public · ${data.docs.length - stats.pub} protected`} icon={FileText} />
            <Stat label="Workspaces" value={data.workspaces.length} sub={`${data.docs.filter((d) => !d.workspace).length} docs outside any`} icon={Users} />
            <Stat label="People with access" value={data.people.length} sub={`${stats.members} people · ${stats.domains} companies`} icon={Users} />
            <Stat label="Stored" value={size(data.storage.fileBytes)} sub={`${data.storage.photos} photos · ${data.storage.files} files`} icon={FileText} />
          </div>
          {current === 'documents' && <Documents data={data} act={act} />}
          {current === 'workspaces' && (
            <div className="space-y-5">
              <NewWorkspace act={act} />
              {data.workspaces.length === 0 ? <Empty>No workspaces yet.</Empty> : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {data.workspaces.map((w) => <WorkspaceCard key={w.id} w={w} docs={data.docs} act={act} />)}
                </div>
              )}
            </div>
          )}
          {current === 'people' && <PeopleTab data={data} act={act} />}
        </>
      )}
    </div>
  )
}
