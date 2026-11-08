// Every Vercel project and hand-added site with uptime, SSL and the latest
// deploy — the original dashboard, now one page of the shell.
import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, GitBranch, Github, Plus, Trash2 } from 'lucide-react'
import { SSL_WARN_DAYS, VERCEL_TEAM_SLUG, daysUntil, removeDoc, saveDoc, timeAgo } from './data'
import { Button, Glass, Input, Tag, Textarea, UpDot, cx } from './ui'

function SiteCard({ site, checks, onSave, onDelete }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(site.meta.notes || '')
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const links = site.meta.links || []

  useEffect(() => setNotes(site.meta.notes || ''), [site.meta.notes])

  const prod = site.project?.production
  const latest = site.project?.latest
  const previewNewer = latest && prod && latest.id !== prod.id

  const addLink = () => {
    const url = newLink.url.trim()
    if (!url) return
    onSave({ links: [...links, { label: newLink.label.trim() || url, url: /^https?:\/\//.test(url) ? url : `https://${url}` }] })
    setNewLink({ label: '', url: '' })
  }

  return (
    <Glass className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-100">{site.name}</div>
          {site.project?.repo && (
            <a href={`https://github.com/${site.project.repo}`} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200">
              <Github size={12} /> {site.project.repo}
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {site.project && (
            <a href={`https://vercel.com/${VERCEL_TEAM_SLUG}/${site.project.name}`} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-zinc-200" title="Open in Vercel">▲</a>
          )}
          {prod?.state && <Tag>{prod.state.toLowerCase()}</Tag>}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {site.hosts.length === 0 && <li className="text-xs text-zinc-600">No domain</li>}
        {site.hosts.map((h) => {
          const c = checks[h]
          const sslDays = daysUntil(c?.certValidTo)
          return (
            <li key={h} className="flex items-center gap-2 text-sm">
              <UpDot check={h.startsWith('www.') ? null : c} />
              <a href={`https://${h}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-zinc-200 hover:underline">{h}</a>
              {c && (
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                  {c.status ?? c.error} · {c.ms}ms
                  {sslDays !== null && <span className={sslDays < SSL_WARN_DAYS ? ' text-amber-300' : ''}> · SSL {sslDays}d</span>}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {prod && (
        <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} /> {prod.branch || '—'} {prod.sha && <code className="text-zinc-600">{prod.sha}</code>}
            <span className="ml-auto">{timeAgo(prod.createdAt)}</span>
          </div>
          {prod.commit && <div className="mt-1 truncate text-zinc-300">{prod.commit}</div>}
          {previewNewer && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span>Newer {latest.target}:</span>
              <Tag>{latest.state?.toLowerCase()}</Tag>
              <span className="truncate">{latest.branch}</span>
              <span className="ml-auto shrink-0">{timeAgo(latest.createdAt)}</span>
            </div>
          )}
        </div>
      )}

      {!open && (site.meta.notes || links.length > 0) && (
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          {site.meta.notes && <p className="line-clamp-2 whitespace-pre-line text-xs text-zinc-300">{site.meta.notes}</p>}
          {links.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-zinc-300 underline decoration-white/20 hover:text-white">
                  {l.label} <ExternalLink size={10} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-3 border-t border-white/[0.06] pt-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (site.meta.notes || '') && onSave({ notes })}
            rows={4}
            placeholder="Notes, todos, status…"
          />
          <ul className="space-y-1">
            {links.map((l, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-zinc-300 hover:underline">{l.label}</a>
                <button onClick={() => onSave({ links: links.filter((_, j) => j !== i) })} className="text-zinc-600 hover:text-red-400" aria-label="Remove link">
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-1.5">
            <Input value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })} placeholder="Label" className="w-24 text-xs" />
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              placeholder="https://…"
              className="min-w-0 flex-1 text-xs"
            />
            <Button variant="glass" onClick={addLink} aria-label="Add link"><Plus size={14} /></Button>
          </div>
          <div className="flex justify-between text-xs">
            <button onClick={() => onSave({ hidden: !site.meta.hidden })} className="text-zinc-500 hover:text-zinc-200">
              {site.meta.hidden ? 'Unhide' : 'Hide from this page'}
            </button>
            {site.manual && <button onClick={onDelete} className="text-red-300/80 hover:text-red-300">Delete site</button>}
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} className="mt-3 self-start text-xs text-zinc-500 hover:text-zinc-300">
        {open ? 'Done' : 'Notes & links'}
      </button>
    </Glass>
  )
}

export default function SitesView({ data }) {
  const { vercel, docs, checks } = data
  const [showAll, setShowAll] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [newSite, setNewSite] = useState('')

  // Vercel projects plus hand-added sites, each merged with its notes doc.
  const sites = useMemo(() => {
    const fromVercel = vercel.map((p) => ({
      id: p.name, name: p.name, project: p,
      hosts: p.domains.length ? p.domains : p.vercelUrl ? [p.vercelUrl] : [],
      custom: p.domains.length > 0, manual: false, meta: docs[p.name] || {},
    }))
    const manual = Object.entries(docs)
      .filter(([, m]) => m.manual)
      .map(([id, m]) => ({ id, name: m.name || m.hosts?.[0] || id, project: null, hosts: m.hosts || [], custom: true, manual: true, meta: m }))
    return [...manual, ...fromVercel]
  }, [vercel, docs])

  const visible = sites
    .filter((s) => showAll || s.custom)
    .filter((s) => showHidden || !s.meta.hidden)
    .sort((a, b) => Number(b.custom) - Number(a.custom) || (b.project?.production?.createdAt || 0) - (a.project?.production?.createdAt || 0))

  const addSite = () => {
    const host = newSite.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!host) return
    saveDoc(`manual-${host.replace(/[^a-z0-9]+/g, '-')}`, { manual: true, name: host, hosts: [host] })
    setNewSite('')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" className="accent-white" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Include projects without a domain
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" className="accent-white" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} /> Show hidden
        </label>
        <div className="flex gap-1.5 sm:ml-auto">
          <Input value={newSite} onChange={(e) => setNewSite(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSite()} placeholder="Add a site not on Vercel…" className="w-56" />
          <Button variant="glass" onClick={addSite} aria-label="Add site"><Plus size={14} /></Button>
        </div>
      </div>
      <div className={cx('grid gap-3 sm:grid-cols-2 xl:grid-cols-3')}>
        {visible.map((s) => (
          <SiteCard key={s.id} site={s} checks={checks} onSave={(patch) => saveDoc(s.id, patch)} onDelete={() => removeDoc(s.id)} />
        ))}
      </div>
    </div>
  )
}
