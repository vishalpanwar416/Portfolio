// Job openings from FAANGPlus (faangplus.com/browse/explore/openings), for the
// Jobs page. Their public feed has no CORS for this origin, so it's read here:
// pages through api.faangplus.com/api/jobs, cleans and tags every opening
// (multinational? software engineering role?).
//   GET  (owner)            the cleaned openings, without saving them.
//   POST (owner or monitor) syncs them into vp_jobs, merging so the status and
//        notes the Jobs page keeps survive, and marks dropped ones `gone`. The
//        daily GitHub Actions run (.github/workflows/jobs.yml) posts with the
//        monitor secret, which also sends the morning message about new roles
//        that fit; ?notify=1 does the same from the dashboard.
const { requireOwner, requireOwnerOrMonitor } = require('../_auth');
const { listDocs, mergeDocs } = require('../_firestore');
const { sendNotification } = require('./notify');

const COLLECTION = 'vp_jobs';
const DASHBOARD = 'https://admin.vishalpanwar.in/#/jobs';
// The owner's experience (2+ years, src/data/personal.js). A role fits when it
// asks for at most a year more and doesn't cap below it.
const MY_YEARS = 2;
const fits = (j) => (j.minYears === null || j.minYears <= MY_YEARS + 1) && (j.maxYears === null || j.maxYears >= MY_YEARS);

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

async function listings() {
  const raw = await fetchAll();
  const seen = new Set();
  return raw.filter((j) => Number.isInteger(j.id) && !j.archivedAt && !seen.has(j.id) && seen.add(j.id)).map(clean);
}

/** Merge today's listings into vp_jobs. `matches` are new openings worth a message. */
async function sync() {
  const at = new Date().toISOString();
  const jobs = await listings();
  const existing = await listDocs(COLLECTION, ['source', 'gone']);
  const ids = new Set();
  const writes = jobs.map((j) => {
    const id = `fp-${j.sourceId}`;
    ids.add(id);
    return { id, data: { ...j, gone: false, syncedAt: at, ...(existing[id] ? {} : { firstSeenAt: at }) } };
  });
  let gone = 0;
  for (const [id, d] of Object.entries(existing)) {
    if (d.source === 'faangplus' && !ids.has(id) && !d.gone) { writes.push({ id, data: { gone: true, goneAt: at } }); gone++; }
  }
  await mergeDocs(COLLECTION, writes);
  const added = jobs.filter((j) => !existing[`fp-${j.sourceId}`]);
  // The very first sync finds everything new; that's a backlog, not news.
  const seeded = Object.keys(existing).length === 0;
  const matches = seeded ? [] : added
    .filter((j) => j.sde && j.mnc && fits(j))
    .sort((a, b) => a.company.localeCompare(b.company) || a.title.localeCompare(b.title));
  return { at, listed: jobs.length, added: added.length, gone, seeded, matches };
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const yrs = (j) => (j.minYears === null ? 'any experience' : j.maxYears === null ? `${j.minYears}+ yrs` : j.maxYears === j.minYears ? `${j.minYears} yrs` : `${j.minYears}–${j.maxYears} yrs`);
const city = (j) => (j.location || '').split(/[;|]/)[0].split(',')[0].trim();

function emailHtml(matches) {
  const rows = matches.map((j) => `<tr>
    <td style="padding:10px 12px;border-top:1px solid #eee;vertical-align:top"><div style="font-size:12px;color:#666">${esc(j.company)}</div>
      <div style="font-weight:600;color:#111">${j.url ? `<a href="${esc(j.url)}" style="color:#111">${esc(j.title)}</a>` : esc(j.title)}</div>
      <div style="font-size:12px;color:#666">${esc(yrs(j))}${city(j) ? ` · ${esc(city(j))}` : ''}${j.stack.length ? ` · ${esc(j.stack.slice(0, 5).join(', '))}` : ''}</div></td>
    <td style="padding:10px 12px;border-top:1px solid #eee;vertical-align:top;text-align:right;white-space:nowrap">${j.url ? `<a href="${esc(j.url)}" style="color:#ea580c;font-weight:600">Apply</a>` : ''}</td></tr>`).join('');
  return `<div style="font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;color:#222">
    <h2 style="margin:0 0 4px;font-size:18px">${matches.length} new SDE ${matches.length === 1 ? 'role' : 'roles'} at multinationals</h2>
    <p style="margin:0 0 14px;color:#666">New on FAANGPlus since yesterday, asking for up to ${MY_YEARS + 1} years.</p>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <p style="margin:16px 0 0"><a href="${DASHBOARD}" style="color:#ea580c">Open the Jobs page</a> to save or mark them applied.</p></div>`;
}

/** Email (Resend, when RESEND_API_KEY and JOBS_EMAIL_TO are set) plus a WhatsApp message. */
async function announce(matches) {
  if (!matches.length) return { sent: [], errors: [] };
  const sent = [];
  const errors = [];
  const names = [...new Set(matches.map((j) => j.company))];
  const subject = `${matches.length} new SDE ${matches.length === 1 ? 'role' : 'roles'}: ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` +${names.length - 3}` : ''}`;
  const key = process.env.RESEND_API_KEY;
  const to = process.env.JOBS_EMAIL_TO;
  if (key && to) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.JOBS_EMAIL_FROM || 'Jobs <onboarding@resend.dev>', to: to.split(',').map((s) => s.trim()), subject, html: emailHtml(matches) }),
    }).catch((e) => ({ ok: false, status: e.message }));
    (r.ok ? sent : errors).push(r.ok ? 'email' : `email ${r.status}`);
  }
  const lines = matches.slice(0, 8).map((j) => `• *${j.company}* · ${j.title} (${yrs(j)})`);
  if (matches.length > 8) lines.push(`…and ${matches.length - 8} more`);
  const push = await sendNotification({
    source: 'jobs',
    kind: 'jobs',
    title: `${matches.length} new SDE ${matches.length === 1 ? 'role' : 'roles'}`,
    message: [`At ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` and ${names.length - 3} more` : ''}`, ...lines].join('\n'),
    url: DASHBOARD,
  });
  return { sent: push.queued ? [...sent, 'whatsapp'] : sent, errors: push.error ? [...errors, `whatsapp ${push.error}`] : errors };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'POST') {
    const who = await requireOwnerOrMonitor(req, res);
    if (!who) return;
    try {
      const r = await sync();
      const notified = who === 'monitor' || req.query.notify === '1' ? await announce(r.matches) : null;
      return res.status(200).json({ ...r, matches: r.matches.map((j) => ({ company: j.company, title: j.title, years: yrs(j), url: j.url })), notified });
    } catch (e) {
      return res.status(e.status || 502).json({ error: String(e.message || e) });
    }
  }
  if (!(await requireOwner(req, res))) return;
  try {
    return res.status(200).json({ at: new Date().toISOString(), jobs: await listings() });
  } catch (e) {
    return res.status(e.status || 502).json({ error: String(e.message || e) });
  }
};
module.exports.clean = clean;
module.exports.isMnc = isMnc;
module.exports.isSde = isSde;
module.exports.fits = fits;
module.exports.emailHtml = emailHtml;
