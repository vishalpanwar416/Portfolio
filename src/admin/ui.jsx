// Glass building blocks: black base, translucent white panels, grey text,
// colour only for status.
import { STATUSES } from './data'

export const cx = (...c) => c.filter(Boolean).join(' ')

export function Glass({ className, children, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={cx(
        'rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_40px_-12px_rgba(0,0,0,0.7)]',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function Section({ title, action, children, className }) {
  return (
    <Glass className={cx('p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-zinc-400">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </Glass>
  )
}

export function Stat({ label, value, sub, tone = 'text-zinc-50', icon: Icon }) {
  return (
    <Glass className="p-4">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{label}</span>
        {Icon && <Icon size={14} className="text-zinc-600" />}
      </div>
      <div className={cx('mt-2 text-2xl font-semibold tabular-nums tracking-tight', tone)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </Glass>
  )
}

export function StatusDot({ status, className }) {
  return <span className={cx('inline-block h-2 w-2 shrink-0 rounded-full', STATUSES[status]?.dot || 'bg-zinc-600', className)} />
}

export function StatusPill({ status }) {
  const s = STATUSES[status] || STATUSES.paused
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-zinc-200">
      <StatusDot status={status} /> {s.label}
    </span>
  )
}

export function UpDot({ check }) {
  const color = !check ? 'bg-zinc-600' : check.up ? 'bg-emerald-400' : 'bg-red-500'
  return <span className={cx('inline-block h-1.5 w-1.5 shrink-0 rounded-full', color)} />
}

export function Tag({ children }) {
  return <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-zinc-400">{children}</span>
}

export function Button({ variant = 'ghost', className, ...rest }) {
  const styles = {
    primary: 'bg-white text-black hover:bg-zinc-200',
    glass: 'border border-white/10 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1]',
    ghost: 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100',
    danger: 'text-red-300/80 hover:bg-red-500/10 hover:text-red-300',
  }
  return (
    <button
      className={cx('inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition disabled:opacity-40', styles[variant], className)}
      {...rest}
    />
  )
}

const field = 'rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-white/25 focus:outline-none'

export const Input = ({ className, ...rest }) => <input className={cx(field, className)} {...rest} />
export const Textarea = ({ className, ...rest }) => <textarea className={cx(field, 'w-full', className)} {...rest} />
export const Select = ({ className, children, ...rest }) => (
  <select className={cx(field, 'bg-zinc-950', className)} {...rest}>{children}</select>
)

export function Empty({ children }) {
  return <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">{children}</div>
}

/** Monochrome bar chart; the current month is the brightest bar. */
export function BarChart({ data, format, height = 140 }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const last = i === data.length - 1
        return (
          <div key={d.label + i} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className={cx(
                'w-full rounded-t-md transition-colors',
                last ? 'bg-white/70' : 'bg-white/[0.14] group-hover:bg-white/30',
                d.value === 0 && 'bg-white/[0.05]'
              )}
              style={{ height: `${Math.max(d.value ? 4 : 2, (d.value / max) * 100)}%` }}
            />
            <div className="mt-1.5 text-center text-[10px] text-zinc-500">{d.label}</div>
            <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/80 px-2 py-0.5 text-[11px] text-zinc-100 group-hover:block">
              {format ? format(d.value) : d.value}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Horizontal share bars, e.g. revenue per project. */
export function ShareBars({ rows, format }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <button onClick={r.onClick} className="truncate text-zinc-300 hover:text-white">{r.label}</button>
            <span className="tabular-nums text-zinc-400">{format ? format(r.value) : r.value}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05]">
            <div className="h-1.5 rounded-full bg-white/50" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Thin progress bar; turns bright once the goal is reached. */
export function Progress({ value, max, className }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-white/[0.06]', className)}>
      <div className={cx('h-full rounded-full transition-all', pct >= 100 ? 'bg-emerald-400/80' : 'bg-white/60')} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Tiny inline trend line for a list of numbers. */
export function Sparkline({ values, width = 120, height = 28, className }) {
  if (!values?.length) return null
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? width / (values.length - 1) : width
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - (v / max) * (height - 4)).toFixed(1)}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** Shown in place of a section's content when its server key isn't set. */
export function ConnectHint({ children, go }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-zinc-500">
      {children}
      {go && <button onClick={() => go('/settings')} className="ml-1 text-zinc-300 underline decoration-white/20 hover:text-white">Set it up in Settings →</button>}
    </div>
  )
}

export const Label = ({ children }) => <span className="mb-1 block text-xs text-zinc-500">{children}</span>

/** Small coloured pill for invoice / CI / renewal states. */
export function Badge({ tone = 'zinc', children }) {
  const tones = {
    zinc: 'border-white/10 bg-white/[0.04] text-zinc-300',
    green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    red: 'border-red-400/20 bg-red-500/10 text-red-300',
    sky: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
  }
  return <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]', tones[tone])}>{children}</span>
}
