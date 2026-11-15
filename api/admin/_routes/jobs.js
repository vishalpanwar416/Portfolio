// Job openings from FAANGPlus (faangplus.com/browse/explore/openings), for the
// Jobs page. Their public feed has no CORS for this origin, so the dashboard
// asks here: GET pages through api.faangplus.com/api/jobs and returns every
// opening cleaned and tagged (multinational? software engineering role?).
// The page then writes them into vp_jobs itself with the owner's sign-in,
// merging so the status and notes kept there survive a re-sync.
const { requireOwner } = require('../_auth');

const FEED = 'https://api.faangplus.com/api/jobs';
const PAGE_SIZE = 50;
const MAX_PAGES = 40;

// Founded in India; everything else on the board counts as a multinational.
const INDIAN = new Set([
  'AlphaGrep', 'BrowserStack', 'CRED', 'Dream11', 'Flipkart', 'Graviton Research Capital', 'Juspay', 'Meesho',
  'Myntra', 'Paytm', 'PhonePe', 'Quadeye', 'Razorpay', 'Swiggy', 'Zepto', 'Zeta',
]);

// Software engineering (SDE) roles by title: engineers, developers, SDETs and
// MTS, not managers, architects, PMs, analysts, support or hardware.
const SDE = /software (engineer|developer|development)|\bsw engineer\b|\bsde\b|sde-|\bsdet\b|developer|programmer|member of technical staff|\bmts\b|full ?stack|backend|front ?end|principal engineer|engineer(ing)? technical leader|staff engineer\s*[-,]|ai engineer|system dev engineer|mobile engineer/i;
const NOT_SDE = /manager|architect|director|product manager|product lead|designer|analyst|scientist|support|trainer|recruit|solutions? (engineer|architect)|customer success|physical design|quant(itative)? researcher/i;
// Titles the two patterns get wrong.
const SDE_TITLES = new Set([
  'The Core Engineering-L2-Hyderabad-Analyst-Software Engineering',
  'Senior Software Engineer, AI Infrastructure Solutions',
  'Backend Developer - Director- Software Engineering',
  'Spark / Scala Application Development Lead - Vice President',
  'Senior Staff Engineer',
]);

const isMnc = (company) => !INDIAN.has(company);
const isSde = (title) => SDE_TITLES.has(title) || (SDE.test(title) && !NOT_SDE.test(title));

const str = (v, n = 300) => (v === null || v === undefined || v === '' ? null : String(v).replace(/\s+/g, ' ').trim().slice(0, n) || null);
const text = (v, n = 8000) => (v ? String(v).trim().slice(0, n) : null);
const int = (v) => (Number.isInteger(v) && v >= 0 && v <= 50 ? v : null);
const url = (v) => (/^https:\/\//.test(String(v || '')) ? String(v).slice(0, 600) : null);
const stack = (v) => [...new Set(String(v || '').split(',').map((s) => s.trim()).filter((s) => s && s !== 'Not specified'))].slice(0, 30);

// One opening as stored in vp_jobs/fp-<id>. Only these fields are written on
// sync; status, notes and appliedOn belong to the page.
function clean(j) {
  const title = str(j.title, 200) || 'Untitled';
  const company = str(j.company, 120) || 'Unknown';
  let min = int(j.minExperienceYears);
  let max = int(j.maxExperienceYears);
  if (min !== null && max !== null && max < min) max = null; // the feed has a few "6–1"s
  return {
    source: 'faangplus',
    sourceId: Number(j.id),
    company,
    title,
    location: str(j.location, 300),
    url: url(j.url),
    jobId: str(j.jobId, 80),
    employmentType: str(j.employmentType, 40),
    minYears: min,
    maxYears: max,
    experience: str(j.experience, 120),
    stack: stack(j.techStack),
    description: text(j.description),
    qualifications: text(j.qualifications, 5000),
    responsibilities: text(j.responsibilities, 5000),
    postedAt: str(j.scrapedAt, 40),
    lastSeenAt: str(j.lastSeenAt, 40),
    mnc: isMnc(company),
    sde: isSde(title),
  };
}

async function fetchAll() {
  const jobs = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const r = await fetch(`${FEED}?page=${page}&size=${PAGE_SIZE}&sort=relevance`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (admin.vishalpanwar.in)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) throw Object.assign(new Error(`FAANGPlus answered ${r.status}`), { status: 502 });
    const body = await r.json();
    jobs.push(...(body.content || []));
    if (page + 1 >= (body.totalPages || 0)) break;
  }
  return jobs;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  try {
    const raw = await fetchAll();
    const seen = new Set();
    const jobs = raw.filter((j) => Number.isInteger(j.id) && !j.archivedAt && !seen.has(j.id) && seen.add(j.id)).map(clean);
    return res.status(200).json({ at: new Date().toISOString(), jobs });
  } catch (e) {
    return res.status(e.status || 502).json({ error: String(e.message || e) });
  }
};
module.exports.clean = clean;
module.exports.isMnc = isMnc;
module.exports.isSde = isSde;
