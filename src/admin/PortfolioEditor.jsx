// Edit vishalpanwar.in: profile line, projects, tech stack, experience,
// education and certifications. Edits autosave as a draft on vp_sites/portfolio
// (`draft`); Publish copies it to `published`, which the site reads through
// api/admin/_routes/portfolio.js. Starts from the site's built-in src/data.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Award, ChevronRight, ExternalLink, Plus, RotateCcw, Star, Trash2, Trophy, X } from 'lucide-react'
import {
  certifications, education, personalInfo, projects, skillCategories, typingAnimationTexts, workExperience,
} from '../data'
import { saveDoc, timeAgo } from './data'
import { Badge, Button, Empty, Input, Label, Section, Textarea, cx } from './ui'

export const PORTFOLIO_TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'projects', label: 'Projects' },
  { key: 'skills', label: 'Tech stack' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'certifications', label: 'Certifications' },
]

const ICON_NAMES = new Map([[Award, 'award'], [Trophy, 'trophy'], [Star, 'star']])

/** The site's built-in content, in the stored shape. */
export function builtInContent() {
  return {
    profile: {
      title: personalInfo.title,
      status: personalInfo.availability.status,
      badge: personalInfo.availability.badge,
      badgeShort: personalInfo.availability.badgeShort,
      location: personalInfo.location.display,
      stack: [...personalInfo.heroStats.stack],
      typing: [...typingAnimationTexts],
    },
    projects: projects.map((p) => ({
      title: p.title, description: p.description, tech: [...(p.tech || [])], features: [...(p.features || [])],
      image: p.image || null, wideImage: !!p.wideImage, github: p.github || null, live: p.live || null,
      featured: !!p.featured, private: !!p.private, hidden: false,
    })),
    skills: skillCategories.map((c) => ({ category: c.category, skills: [...c.skills] })),
    experience: workExperience.map((e) => ({ ...e, highlights: [...e.highlights] })),
    education: education.map((e) => ({ ...e })),
    certifications: certifications.map((c) => ({ title: c.title, issuer: c.issuer, date: c.date, icon: ICON_NAMES.get(c.icon) || 'award', link: c.link || null })),
  }
}

// Firestore hands maps back with keys in its own order, so compare sorted.
const stable = (v) => (Array.isArray(v) ? v.map(stable)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])) : v ?? null)
const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b))

// ── fields ─────────────────────────────────────────────

/** Chips: Enter or comma adds, × removes. */
function Tags({ value = [], onChange, placeholder }) {
  const [text, setText] = useState('')
  const add = () => {
    const parts = text.split(',').map((s) => s.trim()).filter(Boolean).filter((s) => !value.includes(s))
    if (parts.length) onChange([...value, ...parts])
    setText('')
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 p-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-xs text-zinc-200">
          {t}
          <button onClick={() => onChange(value.filter((x) => x !== t))} className="text-zinc-500 hover:text-red-300" aria-label={`Remove ${t}`}><X size={11} /></button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
          if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={add}
        placeholder={placeholder}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none sm:text-sm"
      />
    </div>
  )
}

/** One item per line; saved when the field loses focus. */
function Lines({ value = [], onChange, placeholder, rows = 3 }) {
  const [text, setText] = useState(value.join('\n'))
  const joined = value.join('\n')
  useEffect(() => { setText(joined) }, [joined])
  return (
    <Textarea
      value={text}
      rows={rows}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(text.split('\n').map((s) => s.trim()).filter(Boolean))}
      placeholder={placeholder}
    />
  )
}

const Field = ({ label, children, className }) => <label className={cx('block', className)}><Label>{label}</Label>{children}</label>

function Toggle({ checked, onChange, children }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="accent-white" />
      {children}
    </label>
  )
}

// ── list editor ────────────────────────────────────────

/** A reorderable list of collapsible cards. */
function ListEditor({ items, onChange, blank, title, summary, render, addLabel }) {
  const [open, setOpen] = useState(null)
  const update = (i, patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const move = (i, d) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
    if (open === i) setOpen(i + d)
  }
  const add = () => { onChange([blank(), ...items]); setOpen(0) }
  return (
    <div className="space-y-2">
      <Button variant="glass" onClick={add}><Plus size={14} /> {addLabel}</Button>
      {items.length === 0 ? <Empty>Nothing here — the site falls back to its built-in list.</Empty> : items.map((item, i) => (
        <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2 px-3 py-2">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <ChevronRight size={14} className={cx('shrink-0 text-zinc-500 transition', open === i && 'rotate-90')} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-zinc-100">{title(item) || <span className="text-zinc-600">Untitled</span>}</span>
                {summary && <span className="block truncate text-xs text-zinc-500">{summary(item)}</span>}
              </span>
            </button>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30" aria-label="Move up"><ArrowUp size={13} /></button>
            <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1 text-zinc-500 hover:text-white disabled:opacity-30" aria-label="Move down"><ArrowDown size={13} /></button>
            <button onClick={() => { onChange(items.filter((_, j) => j !== i)); setOpen(null) }} className="p-1 text-zinc-600 hover:text-red-400" aria-label="Remove"><Trash2 size={13} /></button>
          </div>
          {open === i && <div className="space-y-3 border-t border-white/[0.06] p-3">{render(item, (patch) => update(i, patch))}</div>}
        </div>
      ))}
    </div>
  )
}

// ── tabs ───────────────────────────────────────────────

function ProfileTab({ c, set }) {
  const p = c.profile || {}
  const up = (patch) => set({ profile: { ...p, ...patch } })
  return (
    <Section title="Profile">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Title (use | to split the two lines)" className="sm:col-span-2"><Input value={p.title || ''} onChange={(e) => up({ title: e.target.value })} className="w-full" /></Field>
        <Field label="Availability line"><Input value={p.status || ''} onChange={(e) => up({ status: e.target.value })} className="w-full" /></Field>
        <Field label="Location"><Input value={p.location || ''} onChange={(e) => up({ location: e.target.value })} className="w-full" /></Field>
        <Field label="Badge"><Input value={p.badge || ''} onChange={(e) => up({ badge: e.target.value })} className="w-full" /></Field>
        <Field label="Badge on phones"><Input value={p.badgeShort || ''} onChange={(e) => up({ badgeShort: e.target.value })} className="w-full" /></Field>
        <Field label="Hero stack chips (up to 6)" className="sm:col-span-2"><Tags value={p.stack} onChange={(stack) => up({ stack: stack.slice(0, 6) })} placeholder="Add a chip…" /></Field>
        <Field label="Typing animation lines" className="sm:col-span-2"><Lines value={p.typing} onChange={(typing) => up({ typing })} placeholder="One per line" rows={5} /></Field>
      </div>
    </Section>
  )
}

const blankProject = () => ({ title: '', description: '', tech: [], features: [], image: null, wideImage: false, github: null, live: null, featured: false, private: false, hidden: false })

function ProjectsTab({ c, set }) {
  return (
    <ListEditor
      items={c.projects || []}
      onChange={(projects) => set({ projects })}
      blank={blankProject}
      addLabel="Add project"
      title={(p) => p.title}
      summary={(p) => [p.featured && 'Featured', p.hidden && 'Hidden', (p.tech || []).slice(0, 4).join(', ')].filter(Boolean).join(' · ')}
      render={(p, up) => (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Title"><Input value={p.title} onChange={(e) => up({ title: e.target.value })} className="w-full" /></Field>
            <Field label="Image URL">
              <div className="flex items-center gap-2">
                <Input value={p.image || ''} onChange={(e) => up({ image: e.target.value || null })} placeholder="https://…" className="min-w-0 flex-1" />
                {p.image && <img src={p.image} alt="" className="h-8 w-8 shrink-0 rounded-md bg-white/10 object-contain" />}
              </div>
            </Field>
            <Field label="Description" className="sm:col-span-2"><Textarea value={p.description} rows={3} onChange={(e) => up({ description: e.target.value })} /></Field>
            <Field label="Tech stack" className="sm:col-span-2"><Tags value={p.tech} onChange={(tech) => up({ tech })} placeholder="React, Go…" /></Field>
            <Field label="Highlights (one per line)" className="sm:col-span-2"><Lines value={p.features} onChange={(features) => up({ features })} /></Field>
            <Field label="GitHub"><Input value={p.github || ''} onChange={(e) => up({ github: e.target.value || null })} placeholder="https://github.com/…" className="w-full" /></Field>
            <Field label="Live site"><Input value={p.live || ''} onChange={(e) => up({ live: e.target.value || null })} placeholder="https://…" className="w-full" /></Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <Toggle checked={p.featured} onChange={(featured) => up({ featured })}>Featured</Toggle>
            <Toggle checked={p.wideImage} onChange={(wideImage) => up({ wideImage })}>Wide logo</Toggle>
            <Toggle checked={p.private} onChange={(v) => up({ private: v })}>Private (NDA)</Toggle>
            <Toggle checked={p.hidden} onChange={(hidden) => up({ hidden })}>Hide from site</Toggle>
          </div>
        </>
      )}
    />
  )
}

function SkillsTab({ c, set }) {
  return (
    <ListEditor
      items={c.skills || []}
      onChange={(skills) => set({ skills })}
      blank={() => ({ category: '', skills: [] })}
      addLabel="Add category"
      title={(s) => s.category}
      summary={(s) => `${(s.skills || []).length} skills · ${(s.skills || []).slice(0, 5).join(', ')}`}
      render={(s, up) => (
        <>
          <Field label="Category"><Input value={s.category} onChange={(e) => up({ category: e.target.value })} className="w-full" /></Field>
          <Field label="Skills"><Tags value={s.skills} onChange={(skills) => up({ skills })} placeholder="Add a skill…" /></Field>
        </>
      )}
    />
  )
}

function ExperienceTab({ c, set }) {
  return (
    <ListEditor
      items={c.experience || []}
      onChange={(experience) => set({ experience })}
      blank={() => ({ position: '', company: '', duration: '', highlights: [] })}
      addLabel="Add role"
      title={(e) => [e.position, e.company].filter(Boolean).join(' · ')}
      summary={(e) => e.duration}
      render={(e, up) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Position"><Input value={e.position} onChange={(x) => up({ position: x.target.value })} className="w-full" /></Field>
          <Field label="Company"><Input value={e.company} onChange={(x) => up({ company: x.target.value })} className="w-full" /></Field>
          <Field label="Duration · place" className="sm:col-span-2"><Input value={e.duration} onChange={(x) => up({ duration: x.target.value })} placeholder="Mar 2026 – Present · Remote, India" className="w-full" /></Field>
          <Field label="Highlights (one per line)" className="sm:col-span-2"><Lines value={e.highlights} onChange={(highlights) => up({ highlights })} /></Field>
        </div>
      )}
    />
  )
}

function EducationTab({ c, set }) {
  return (
    <ListEditor
      items={c.education || []}
      onChange={(education) => set({ education })}
      blank={() => ({ degree: '', institution: '', year: '' })}
      addLabel="Add education"
      title={(e) => e.degree}
      summary={(e) => [e.institution, e.year].filter(Boolean).join(' · ')}
      render={(e, up) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Degree"><Input value={e.degree} onChange={(x) => up({ degree: x.target.value })} className="w-full" /></Field>
          <Field label="Institution"><Input value={e.institution} onChange={(x) => up({ institution: x.target.value })} className="w-full" /></Field>
          <Field label="Year"><Input value={e.year} onChange={(x) => up({ year: x.target.value })} className="w-full" /></Field>
        </div>
      )}
    />
  )
}

function CertificationsTab({ c, set }) {
  return (
    <ListEditor
      items={c.certifications || []}
      onChange={(certs) => set({ certifications: certs })}
      blank={() => ({ title: '', issuer: '', date: '', icon: 'award', link: null })}
      addLabel="Add certification"
      title={(x) => x.title}
      summary={(x) => [x.issuer, x.date].filter(Boolean).join(' · ')}
      render={(x, up) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2"><Input value={x.title} onChange={(e) => up({ title: e.target.value })} className="w-full" /></Field>
          <Field label="Issuer"><Input value={x.issuer} onChange={(e) => up({ issuer: e.target.value })} className="w-full" /></Field>
          <Field label="Year"><Input value={x.date} onChange={(e) => up({ date: e.target.value })} className="w-full" /></Field>
          <Field label="Icon">
            <div className="flex gap-1">
              {[['award', Award], ['trophy', Trophy], ['star', Star]].map(([k, Icon]) => (
                <button key={k} onClick={() => up({ icon: k })} className={cx('rounded-lg border px-2.5 py-1.5', x.icon === k ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-zinc-500 hover:text-zinc-200')} aria-label={k}><Icon size={14} /></button>
              ))}
            </div>
          </Field>
          <Field label="Credential link"><Input value={x.link || ''} onChange={(e) => up({ link: e.target.value || null })} placeholder="https://…" className="w-full" /></Field>
        </div>
      )}
    />
  )
}

// ── page ───────────────────────────────────────────────

const TAB_VIEWS = { profile: ProfileTab, projects: ProjectsTab, skills: SkillsTab, experience: ExperienceTab, education: EducationTab, certifications: CertificationsTab }

export default function PortfolioEditor({ data, go, tab }) {
  const current = TAB_VIEWS[tab] ? tab : 'profile'
  const doc = data.docs.portfolio
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const timer = useRef(null)

  // Load once; after that the local draft is the source of truth while editing.
  useEffect(() => {
    if (draft || !data.docsReady || data.docsError) return
    setDraft(doc?.draft || doc?.published || builtInContent())
  }, [data.docsReady, data.docsError, doc, draft])

  const flush = useCallback((next) => {
    clearTimeout(timer.current)
    setSaving(true)
    return saveDoc('portfolio', { kind: 'portfolio', draft: next }).finally(() => setSaving(false))
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const set = (patch) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => flush(next), 800)
  }

  if (data.docsError) return <Empty>The editor can't load or save until the dashboard can read its saved data — see the message above.</Empty>
  if (!draft) return <div className="text-sm text-zinc-500">Loading…</div>

  const published = doc?.published
  const dirty = !same(draft, published)
  const publish = async () => {
    await flush(draft)
    await saveDoc('portfolio', { kind: 'portfolio', published: draft, publishedAt: Date.now() })
  }
  const revert = () => { if (published) { setDraft(published); flush(published) } }
  const reset = () => {
    if (!window.confirm('Replace the draft with the site’s built-in content?')) return
    const next = builtInContent()
    setDraft(next)
    flush(next)
  }
  const View = TAB_VIEWS[current]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0 flex-1 text-sm">
          {!published ? <Badge tone="amber">Not published yet — the site shows its built-in content</Badge>
            : dirty ? <Badge tone="sky">Unpublished changes</Badge>
              : <Badge tone="green">Live</Badge>}
          <span className="ml-2 text-xs text-zinc-500">
            {saving ? 'Saving draft…' : 'Draft saved'}{doc?.publishedAt ? ` · published ${timeAgo(doc.publishedAt)}` : ''}
          </span>
        </div>
        <a href="https://vishalpanwar.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">View site <ExternalLink size={11} /></a>
        {published && dirty && <Button onClick={revert}><RotateCcw size={13} /> Discard</Button>}
        <Button variant="primary" onClick={publish} disabled={published && !dirty}>Publish</Button>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl [scrollbar-width:none]">
        {PORTFOLIO_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => go(`/portfolio/${t.key}`)}
            className={cx('shrink-0 rounded-lg px-3.5 py-1.5 text-sm transition', current === t.key ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-zinc-400 hover:text-zinc-100')}
          >
            {t.label}{Array.isArray(draft[t.key]) && <span className="ml-1.5 text-xs text-zinc-500">{draft[t.key].length}</span>}
          </button>
        ))}
      </div>

      <View c={draft} set={set} />

      <div className="flex justify-end">
        <Button variant="danger" className="text-xs" onClick={reset}>Reset draft to built-in content</Button>
      </div>
    </div>
  )
}
