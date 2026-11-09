// Ctrl/⌘+K: jump to any page, project or client.
import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Search } from 'lucide-react'
import { STATUSES } from './data'
import { StatusDot, cx } from './ui'

export function useHotkey(onOpen) {
  useEffect(() => {
    const on = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onOpen() }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onOpen])
}

export default function CommandPalette({ open, onClose, pages, projects, go, actions }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => inputRef.current?.focus(), 0) } }, [open])

  const items = useMemo(() => {
    const all = [
      ...pages.map((p) => ({ key: `page-${p.to}`, label: p.label, hint: 'Page', icon: p.icon, run: () => go(p.to) })),
      ...projects.map((p) => ({ key: `p-${p.slug}`, label: p.name, hint: STATUSES[p.status]?.label, status: p.status, terms: `${p.category} ${(p.domains || []).join(' ')}`, run: () => go(`/p/${p.slug}`) })),
      ...projects.flatMap((p) => (p.clients || []).map((c) => ({ key: `c-${p.slug}-${c.id}`, label: c.name, hint: `Client · ${p.name}`, terms: `${c.company || ''} ${c.email || ''}`, run: () => go(`/p/${p.slug}`) }))),
      ...actions.map((a) => ({ key: `a-${a.label}`, label: a.label, hint: 'Action', icon: a.icon, run: a.run })),
    ]
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return all.slice(0, 40)
    return all
      .map((it) => {
        const hay = `${it.label} ${it.hint || ''} ${it.terms || ''}`.toLowerCase()
        if (!words.every((w) => hay.includes(w))) return null
        return { it, score: it.label.toLowerCase().startsWith(words[0]) ? 0 : 1 }
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.it)
      .slice(0, 40)
  }, [q, pages, projects, actions, go])

  if (!open) return null

  const choose = (it) => { if (!it) return; onClose(); it.run() }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((n) => Math.min(items.length - 1, n + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((n) => Math.max(0, n - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(items[i]) }
    else if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/85 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4">
          <Search size={15} className="text-zinc-500" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setI(0) }}
            onKeyDown={onKey}
            placeholder="Jump to a project, client or page…"
            className="h-12 flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 px-1.5 text-[10px] text-zinc-500">esc</kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-1.5">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-zinc-500">No matches</li>}
          {items.map((it, n) => {
            const Icon = it.icon
            return (
              <li key={it.key}>
                <button
                  onMouseEnter={() => setI(n)}
                  onClick={() => choose(it)}
                  className={cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm', n === i ? 'bg-white/[0.08] text-white' : 'text-zinc-300')}
                >
                  {it.status ? <StatusDot status={it.status} /> : Icon ? <Icon size={14} className="text-zinc-500" /> : <span className="h-2 w-2" />}
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{it.hint}</span>
                  {n === i && <CornerDownLeft size={12} className="text-zinc-500" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
