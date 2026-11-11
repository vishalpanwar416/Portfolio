// One set of alert rules for the whole dashboard: the sidebar badge, the
// Alerts page and the Overview's "Needs attention" list all read this.
// scripts/monitor.mjs applies the same thresholds for phone notifications.
import { apexDomain, clientRenewals, daysUntil, invoiceState, money } from './data'

export const SEVERITY = {
  critical: { label: 'Critical', tone: 'red', rank: 0 },
  warning: { label: 'Warning', tone: 'amber', rank: 1 },
  info: { label: 'Info', tone: 'zinc', rank: 2 },
}

export const LAPTOP_STALE_MS = 20 * 60e3

export function laptopStatus(docs) {
  const l = docs?.laptop
  if (!l?.at) return null
  const ageMs = Date.now() - Date.parse(l.at)
  return { ...l, ageMs, online: ageMs < LAPTOP_STALE_MS }
}

/** Every current problem, most severe first. */
export function computeAlerts(data) {
  const out = []
  const add = (severity, kind, title, detail, to) => out.push({ key: `${kind}:${title}`, severity, kind, title, detail, to })
  const { projects, checks } = data

  // Sites: down on a live project is critical.
  const hostOwner = {}
  for (const p of projects) for (const h of p.domains || []) hostOwner[h] = p
  for (const c of Object.values(checks)) {
    if (c.up) continue
    const p = hostOwner[c.host]
    if (p?.status === 'decommissioned') continue
    add(p?.status === 'live' ? 'critical' : 'warning', 'site', `${c.host} is down`, `${p ? `${p.name} · ` : ''}${c.status ?? c.error}`, p ? `/p/${p.slug}` : '/infra/uptime')
  }

  // Certificates and domain registrations.
  for (const c of Object.values(checks)) {
    const d = daysUntil(c.certValidTo)
    if (d !== null && d < 14) add(d < 7 ? 'critical' : 'warning', 'ssl', `SSL for ${c.host} ends in ${d}d`, c.certValidTo.slice(0, 10), '/infra/renewals')
  }
  for (const dom of data.domains.data?.domains || []) {
    const d = daysUntil(dom.expiresAt)
    if (d !== null && d < 30) add(d < 7 ? 'critical' : 'warning', 'domain', `${dom.domain} expires in ${d}d`, `Renew at ${dom.registrar || 'the registrar'}`, '/infra/renewals')
  }

  // Supabase.
  for (const s of data.supabase.data?.projects || []) {
    if (s.error) continue
    if (s.status === 'INACTIVE' || s.status === 'PAUSED') add('critical', 'database', `Supabase ${s.name} is paused`, 'Restore it from the Supabase dashboard', '/infra/data')
    else if (s.status === 'ACTIVE_UNHEALTHY' || (s.health || []).some((h) => !h.healthy)) {
      add('critical', 'database', `Supabase ${s.name} is unhealthy`, (s.health || []).filter((h) => !h.healthy).map((h) => h.name).join(', '), '/infra/data')
    }
    if (s.dbBytes && s.dbBytes / s.free.dbBytes > 0.8) add('warning', 'database', `Supabase ${s.name} database ${Math.round((s.dbBytes / s.free.dbBytes) * 100)}% full`, 'of the 500 MB free plan', '/infra/data')
  }

  // Laptop.
  const laptop = laptopStatus(data.docs)
  if (laptop) {
    if (laptop.online) {
      for (const s of laptop.services || []) {
        if (!s.ok && !s.missing) add('warning', 'laptop', `${s.unit} is ${s.state}`, s.result && s.result !== 'success' ? `last result: ${s.result}` : 'on the laptop', '/infra/laptop')
      }
      if (laptop.disk?.total && laptop.disk.free / laptop.disk.total < 0.1) add('warning', 'laptop', 'Laptop disk almost full', `${Math.round(laptop.disk.free / 1e9)} GB free`, '/infra/laptop')
    } else if (laptop.ageMs > 86400e3) {
      add('info', 'laptop', 'Laptop has not checked in for a day', 'Asleep or off — services are not being watched', '/infra/laptop')
    }
  }

  // Deploys.
  for (const p of projects) {
    for (const v of p.vercelProjects || []) {
      if (v.production?.state === 'ERROR') add('warning', 'deploy', `${v.name} production deploy failed`, v.production.commit || '', `/p/${p.slug}`)
    }
  }

  // Money.
  for (const p of projects) {
    for (const i of p.invoices || []) {
      if (invoiceState(i) === 'overdue') add('warning', 'money', `Invoice ${i.number} overdue`, `${p.name} · ${i.client || '—'} · ${money(i.amount)} · due ${i.due}`, '/money')
    }
  }
  for (const { project: p, client: c, days } of clientRenewals(projects, 14)) {
    add(days < 0 ? 'warning' : 'info', 'client', `${c.name} contract ${days < 0 ? 'ended' : `ends in ${days}d`}`, p.name, `/p/${p.slug}`)
  }

  // Store ratings.
  for (const a of data.apps.data?.apps || []) {
    if (a.published && a.rating && a.rating < 4) add('warning', 'app', `${a.name} rated ${a.rating} on ${a.platform === 'ios' ? 'App Store' : 'Play'}`, `${a.reviews} reviews`, '/apps')
    if (a.vitals?.crashRate > 0.0109) add('warning', 'app', `${a.name} crash rate ${(a.vitals.crashRate * 100).toFixed(2)}%`, 'above Play’s 1.09% bad-behaviour line', '/apps')
  }

  return out.sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank)
}

/** Registrable domains of a project — used by the project page. */
export const projectApexes = (p) => [...new Set((p.domains || []).map(apexDomain).filter(Boolean))]
