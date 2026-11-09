// Everything with an expiry date: domain registrations (RDAP), SSL
// certificates (from uptime checks) and client contracts.
import { RefreshCw } from 'lucide-react'
import { RENEWAL_WARN_DAYS, SSL_WARN_DAYS, apexDomain, clientRenewals, daysUntil, money } from './data'
import { Badge, Button, Empty, Section, StatusDot } from './ui'

const dayTone = (d, warn) => (d === null ? 'zinc' : d < 0 ? 'red' : d <= warn ? 'amber' : 'green')
const dayText = (d) => (d === null ? 'unknown' : d < 0 ? `expired ${-d}d ago` : `${d}d left`)

/** Count of things needing attention, for the sidebar badge and overview. */
export function renewalAlerts(data) {
  const domains = (data.domains.data?.domains || []).filter((d) => {
    const n = daysUntil(d.expiresAt)
    return n !== null && n <= RENEWAL_WARN_DAYS
  })
  const certs = Object.values(data.checks).filter((c) => {
    const n = daysUntil(c.certValidTo)
    return n !== null && n < SSL_WARN_DAYS
  })
  const clients = clientRenewals(data.projects)
  return { domains, certs, clients, count: domains.length + certs.length + clients.length }
}

export default function RenewalsView({ data, go }) {
  const { projects, checks } = data
  const usedBy = {}
  for (const p of projects) for (const h of p.domains || []) {
    const a = apexDomain(h)
    if (a) (usedBy[a] ||= new Set()).add(p)
  }
  const domains = [...(data.domains.data?.domains || [])]
    .sort((a, b) => (daysUntil(a.expiresAt) ?? 1e9) - (daysUntil(b.expiresAt) ?? 1e9))
  const certs = Object.values(checks).filter((c) => c.certValidTo)
    .sort((a, b) => daysUntil(a.certValidTo) - daysUntil(b.certValidTo))
  const contracts = clientRenewals(projects, 3650)

  return (
    <div className="space-y-5">
      <Section
        title="Domains"
        action={<Button className="px-2 py-0.5 text-xs" onClick={data.domains.reload} disabled={data.domains.loading}><RefreshCw size={12} className={data.domains.loading ? 'animate-spin' : ''} /> Recheck</Button>}
      >
        {data.domains.error ? <Empty>{data.domains.error}</Empty> : !data.domains.data ? <div className="text-sm text-zinc-500">Looking up registrations…</div> : domains.length === 0 ? <Empty>No custom domains.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-zinc-500"><th className="pb-2 font-normal">Domain</th><th className="pb-2 font-normal">Used by</th><th className="pb-2 font-normal">Registrar</th><th className="pb-2 font-normal">Expires</th><th className="pb-2 text-right font-normal">Status</th></tr></thead>
              <tbody className="divide-y divide-white/[0.05]">
                {domains.map((d) => {
                  const n = daysUntil(d.expiresAt)
                  return (
                    <tr key={d.domain}>
                      <td className="py-2 pr-3 text-zinc-100">{d.domain}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {[...(usedBy[d.domain] || [])].map((p) => (
                            <button key={p.slug} onClick={() => go(`/p/${p.slug}`)} className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"><StatusDot status={p.status} /> {p.name}</button>
                          ))}
                          {!usedBy[d.domain] && <span className="text-xs text-zinc-600">Vercel only</span>}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-xs text-zinc-500">{d.registrar || '—'}</td>
                      <td className="py-2 pr-3 text-xs tabular-nums text-zinc-400">{d.expiresAt ? d.expiresAt.slice(0, 10) : d.error || '—'}</td>
                      <td className="py-2 text-right"><Badge tone={d.error ? 'zinc' : dayTone(n, RENEWAL_WARN_DAYS)}>{d.error ? 'lookup failed' : dayText(n)}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="SSL certificates">
          {certs.length === 0 ? <Empty>Waiting for the first uptime check…</Empty> : (
            <ul className="divide-y divide-white/[0.05]">
              {certs.map((c) => {
                const n = daysUntil(c.certValidTo)
                return (
                  <li key={c.host} className="flex items-center gap-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-zinc-200">{c.host}</span>
                    <span className="text-xs tabular-nums text-zinc-500">{c.certValidTo.slice(0, 10)}</span>
                    <Badge tone={dayTone(n, SSL_WARN_DAYS)}>{dayText(n)}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-zinc-600">Vercel and Firebase renew these automatically; a warning usually means DNS moved away.</p>
        </Section>

        <Section title="Client contracts">
          {contracts.length === 0 ? <Empty>No contract end dates. Open a client on a project page to add one.</Empty> : (
            <ul className="divide-y divide-white/[0.05]">
              {contracts.map(({ project: p, client: c, days }) => (
                <li key={`${p.slug}-${c.id}`} className="flex items-center gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-zinc-200">{c.name}</span>
                  <button onClick={() => go(`/p/${p.slug}`)} className="text-xs text-zinc-500 hover:text-white">{p.name}</button>
                  {c.monthly > 0 && <span className="text-xs tabular-nums text-zinc-500">{money(c.monthly)}/mo</span>}
                  <Badge tone={dayTone(days, RENEWAL_WARN_DAYS)}>{dayText(days)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}
