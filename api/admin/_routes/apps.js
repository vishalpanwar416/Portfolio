// Store listings for the mobile apps: rating, reviews, downloads, version.
// GET ?apps=play:com.reignactive.aarambh,ios:Com.Aarambh.Fitness
//
// Public data needs no keys (Play Store page, iTunes lookup API). With
// GCP_SA_KEY and that service account added as a user in Play Console
// (View app information), Android crash and ANR rates come from the Play
// Developer Reporting API too.
const { requireOwnerOrMonitor } = require('../_auth');
const { serviceAccount, accessToken } = require('../_gcp');

const TTL_MS = 3600e3;
const PLAY_RE = /^play:([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+)$/;
const IOS_RE = /^ios:([A-Za-z0-9.-]{3,155})$/;
const cache = new Map();

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

async function playListing(pkg) {
  const url = `https://play.google.com/store/apps/details?id=${pkg}&hl=en_IN&gl=IN`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-IN' }, signal: AbortSignal.timeout(12000) });
  if (r.status === 404) return { platform: 'android', id: pkg, published: false, url };
  if (!r.ok) throw new Error(`Play Store ${r.status}`);
  const html = await r.text();
  const pick = (re) => html.match(re)?.[1] ?? null;
  const rating = pick(/aria-label="Rated ([0-9.]+) stars/);
  const reviews = pick(/>([0-9.,KMB]+) reviews</);
  return {
    platform: 'android',
    id: pkg,
    published: true,
    url,
    name: decode(pick(/<h1[^>]*><span[^>]*>([^<]+)<\/span>/) || pick(/<title[^>]*>([^<]+?) - Apps on Google Play/) || pkg),
    icon: pick(/<img[^>]+src="(https:\/\/play-lh\.googleusercontent\.com\/[^"=]+)=[^"]*"[^>]+alt="Icon image"/),
    rating: rating ? Number(rating) : null,
    reviews: reviews || '0',
    downloads: pick(/>([0-9.,KMB]+\+)<\/div><div[^>]*>Downloads/),
    updated: pick(/Updated on<\/div><div[^>]*>([^<]+)</),
  };
}

async function iosListing(bundleId) {
  const r = await fetch(`https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}&country=in`, { signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`App Store ${r.status}`);
  const a = (await r.json()).results?.[0];
  if (!a) return { platform: 'ios', id: bundleId, published: false };
  return {
    platform: 'ios',
    id: bundleId,
    published: true,
    url: a.trackViewUrl,
    name: a.trackName,
    icon: a.artworkUrl100,
    rating: a.averageUserRating ?? null,
    reviews: String(a.userRatingCount ?? 0),
    version: a.version,
    updated: a.currentVersionReleaseDate?.slice(0, 10) || null,
    minOs: a.minimumOsVersion,
  };
}

// Crash and ANR rate, last 7 days, from Play Developer Reporting.
async function playVitals(pkg) {
  let sa;
  try { sa = serviceAccount(); } catch { return null; }
  if (!sa) return null;
  try {
    const token = await accessToken(sa, 'https://www.googleapis.com/auth/playdeveloperreporting');
    const end = new Date(Date.now() - 2 * 86400e3); // reporting lags ~2 days
    const start = new Date(end.getTime() - 7 * 86400e3);
    const day = (d) => ({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
    const query = async (set, metric) => {
      const r = await fetch(`https://playdeveloperreporting.googleapis.com/v1beta1/apps/${pkg}/${set}:query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timelineSpec: { aggregationPeriod: 'DAILY', startTime: day(start), endTime: day(end) },
          metrics: [metric],
        }),
      });
      if (r.status === 403) throw new Error('add the service account in Play Console to see crash rates');
      if (!r.ok) throw new Error(`Play reporting ${r.status}`);
      const rows = (await r.json()).rows || [];
      const vals = rows.map((row) => Number(row.metrics?.[0]?.decimalValue?.value)).filter((v) => !Number.isNaN(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const [crashRate, anrRate] = await Promise.all([
      query('crashRateMetricSet', 'userPerceivedCrashRate'),
      query('anrRateMetricSet', 'userPerceivedAnrRate'),
    ]);
    return { crashRate, anrRate };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

async function loadApp(spec) {
  const hit = cache.get(spec);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  let value;
  try {
    const p = spec.match(PLAY_RE);
    if (p) {
      const [listing, vitals] = await Promise.all([playListing(p[1]), playVitals(p[1])]);
      value = { spec, ...listing, vitals };
    } else {
      value = { spec, ...(await iosListing(spec.match(IOS_RE)[1])) };
    }
    cache.set(spec, { at: Date.now(), value });
  } catch (e) {
    value = { spec, platform: spec.startsWith('play:') ? 'android' : 'ios', id: spec.split(':')[1], error: String(e.message || e) };
  }
  return value;
}

const parse = (q) => [...new Set(String(q || '').split(','))].filter((s) => PLAY_RE.test(s) || IOS_RE.test(s)).slice(0, 20);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwnerOrMonitor(req, res))) return;
  res.status(200).json({ apps: await Promise.all(parse(req.query.apps).map(loadApp)) });
};
module.exports.loadApp = loadApp;
