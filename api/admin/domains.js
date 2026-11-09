// Registration expiry for a list of domains, from public RDAP (the WHOIS
// replacement). GET ?domains=sanero.in,aarambh.app. No key needed.
const { requireOwner } = require('./_auth');

const MAX = 25;
const TTL_MS = 6 * 3600e3; // registries rate-limit; expiry dates rarely move
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/;
const cache = new Map();

const vcardName = (entity) =>
  entity?.vcardArray?.[1]?.find((f) => f[0] === 'fn')?.[3] || entity?.handle || null;

async function lookup(domain) {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  let value;
  try {
    const r = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: 'application/rdap+json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(r.status === 404 ? 'not found in RDAP' : `RDAP ${r.status}`);
    const d = await r.json();
    const event = (name) => d.events?.find((e) => e.eventAction === name)?.eventDate || null;
    value = {
      domain,
      expiresAt: event('expiration'),
      registeredAt: event('registration'),
      registrar: vcardName(d.entities?.find((e) => e.roles?.includes('registrar'))),
      status: d.status || [],
      nameservers: (d.nameservers || []).map((n) => String(n.ldhName || '').toLowerCase()).filter(Boolean),
    };
  } catch (e) {
    value = { domain, error: e.name === 'TimeoutError' ? 'timeout' : String(e.message || e) };
  }
  cache.set(domain, { at: Date.now(), value });
  return value;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const domains = [...new Set(String(req.query.domains || '').toLowerCase().split(','))]
    .filter((d) => DOMAIN_RE.test(d))
    .slice(0, MAX);
  res.status(200).json({ domains: await Promise.all(domains.map(lookup)) });
};
