// Cloud bills for client projects: Google Cloud (from the Cloud Billing
// export in BigQuery) and AWS (Cost Explorer).
// GET ?sources=gcp:edition-tv.billing_export,aws:splink
//
// GCP needs GCP_SA_KEY with BigQuery Data Viewer on the export dataset and
// BigQuery Job User on its project. AWS needs, per account label,
// AWS_COST_<LABEL>_KEY_ID and AWS_COST_<LABEL>_SECRET for an IAM user that
// may call ce:GetCostAndUsage. Cost Explorer charges $0.01 a call, so
// results are cached for a few hours.
const crypto = require('node:crypto');
const { requireOwner } = require('./_auth');
const { serviceAccount, accessToken } = require('./_gcp');

const TTL_MS = 3 * 3600e3;
const MONTHS = 6;
const GCP_RE = /^gcp:([a-z][a-z0-9-]{4,28}[a-z0-9])\.([A-Za-z0-9_]{1,100})$/;
const AWS_RE = /^aws:([a-z0-9_]{1,30})$/;
const cache = new Map();

// ── shared shaping ─────────────────────────────────────

const ymd = (d) => d.toISOString().slice(0, 10);
function istToday() {
  return new Date(Date.now() + 5.5 * 3600e3); // fields read as UTC = IST wall clock
}
function monthKeys() {
  const t = istToday();
  const out = [];
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

function summarise({ monthly, services, daily, currency }) {
  const keys = monthKeys();
  const cur = keys.at(-1);
  const t = istToday();
  const dayOfMonth = t.getUTCDate();
  const daysInMonth = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  const months = keys.map((m) => ({ month: m, amount: round(monthly[m] || 0) }));
  const monthToDate = round(monthly[cur] || 0);
  // Today is partial, so pace on completed days only.
  const doneDays = Math.max(1, dayOfMonth - 1);
  const spentDone = daily.filter((d) => d.day < ymd(t)).reduce((s, d) => s + d.amount, 0);
  const forecast = dayOfMonth <= 1 ? null : round(spentDone / doneDays * daysInMonth);
  return {
    currency,
    months,
    monthToDate,
    lastMonth: months.at(-2)?.amount ?? 0,
    forecast,
    services: Object.entries(services).map(([name, amount]) => ({ name, amount: round(amount) }))
      .filter((s) => Math.abs(s.amount) >= 0.01).sort((a, b) => b.amount - a.amount).slice(0, 8),
    daily: daily.map((d) => ({ day: d.day, amount: round(d.amount) })),
  };
}
const round = (n) => Math.round(n * 100) / 100;

// ── Google Cloud: BigQuery billing export ──────────────

async function bq(token, project, sql) {
  const r = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${project}/queries`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, useLegacySql: false, timeoutMs: 25000 }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = body.error?.message || `BigQuery ${r.status}`;
    if (/Not found: Table|does not match any table/i.test(msg)) throw new Error('billing export not set up yet (no data in the dataset)');
    if (r.status === 403) throw new Error('service account lacks BigQuery access on this project');
    throw new Error(msg);
  }
  const cols = body.schema.fields.map((f) => f.name);
  return (body.rows || []).map((row) => Object.fromEntries(row.f.map((c, i) => [cols[i], c.v])));
}

async function gcpCosts(project, dataset) {
  let sa;
  try { sa = serviceAccount(); } catch { throw new Error('GCP_SA_KEY is not valid JSON'); }
  if (!sa) throw Object.assign(new Error('GCP_SA_KEY missing on the server'), { notConfigured: true });
  const token = await accessToken(sa, 'https://www.googleapis.com/auth/bigquery');
  const table = `\`${project}.${dataset}.gcp_billing_export_v1_*\``;
  const net = 'cost + IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)';
  const since = `TIMESTAMP(DATE_SUB(DATE_TRUNC(CURRENT_DATE('Asia/Kolkata'), MONTH), INTERVAL ${MONTHS - 1} MONTH), 'Asia/Kolkata')`;
  const [byService, byDay] = await Promise.all([
    bq(token, project, `SELECT FORMAT_DATE('%Y-%m', DATE(usage_start_time, 'Asia/Kolkata')) AS month, service.description AS service, ANY_VALUE(currency) AS currency, SUM(${net}) AS amount
      FROM ${table} WHERE usage_start_time >= ${since} GROUP BY month, service`),
    bq(token, project, `SELECT CAST(DATE(usage_start_time, 'Asia/Kolkata') AS STRING) AS day, SUM(${net}) AS amount
      FROM ${table} WHERE usage_start_time >= TIMESTAMP(DATE_TRUNC(CURRENT_DATE('Asia/Kolkata'), MONTH), 'Asia/Kolkata') GROUP BY day ORDER BY day`),
  ]);
  const cur = monthKeys().at(-1);
  const monthly = {};
  const services = {};
  for (const r of byService) {
    const a = Number(r.amount) || 0;
    monthly[r.month] = (monthly[r.month] || 0) + a;
    if (r.month === cur) services[r.service] = (services[r.service] || 0) + a;
  }
  return summarise({
    monthly, services, currency: byService[0]?.currency || null,
    daily: byDay.map((r) => ({ day: r.day, amount: Number(r.amount) || 0 })),
  });
}

// ── AWS: Cost Explorer (SigV4 by hand, no SDK) ─────────

const hmac = (key, s) => crypto.createHmac('sha256', key).update(s).digest();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function costExplorer(keyId, secret, payload) {
  const host = 'ce.us-east-1.amazonaws.com';
  const body = JSON.stringify(payload);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = amzDate.slice(0, 8);
  const target = 'AWSInsightsIndexService.GetCostAndUsage';
  const headers = { 'content-type': 'application/x-amz-json-1.1', host, 'x-amz-date': amzDate, 'x-amz-target': target };
  const signed = Object.keys(headers).sort();
  const canonical = ['POST', '/', '', ...signed.map((h) => `${h}:${headers[h]}`), '', signed.join(';'), sha256(body)].join('\n');
  const scope = `${date}/us-east-1/ce/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonical)].join('\n');
  const key = hmac(hmac(hmac(hmac(`AWS4${secret}`, date), 'us-east-1'), 'ce'), 'aws4_request');
  const signature = crypto.createHmac('sha256', key).update(toSign).digest('hex');
  const r = await fetch(`https://${host}/`, {
    method: 'POST',
    headers: { ...headers, Authorization: `AWS4-HMAC-SHA256 Credential=${keyId}/${scope}, SignedHeaders=${signed.join(';')}, Signature=${signature}` },
    body,
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`AWS ${r.status}: ${out.message || out.Message || out.__type || 'request failed'}`);
  return out;
}

async function awsCosts(label) {
  const keyId = process.env[`AWS_COST_${label.toUpperCase()}_KEY_ID`];
  const secret = process.env[`AWS_COST_${label.toUpperCase()}_SECRET`];
  if (!keyId || !secret) throw Object.assign(new Error(`AWS_COST_${label.toUpperCase()}_KEY_ID / _SECRET missing on the server`), { notConfigured: true });
  const keys = monthKeys();
  const now = new Date();
  const tomorrow = ymd(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)));
  const monthStart = `${now.toISOString().slice(0, 7)}-01`;
  const metric = 'UnblendedCost';
  const [m, d] = await Promise.all([
    costExplorer(keyId, secret, {
      TimePeriod: { Start: `${keys[0]}-01`, End: tomorrow }, Granularity: 'MONTHLY', Metrics: [metric],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    }),
    costExplorer(keyId, secret, { TimePeriod: { Start: monthStart, End: tomorrow }, Granularity: 'DAILY', Metrics: [metric] }),
  ]);
  const monthly = {};
  const services = {};
  let currency = null;
  for (const period of m.ResultsByTime || []) {
    const month = period.TimePeriod.Start.slice(0, 7);
    for (const g of period.Groups || []) {
      const amt = Number(g.Metrics[metric].Amount) || 0;
      currency ||= g.Metrics[metric].Unit;
      monthly[month] = (monthly[month] || 0) + amt;
      if (month === keys.at(-1)) services[g.Keys[0]] = (services[g.Keys[0]] || 0) + amt;
    }
  }
  const daily = (d.ResultsByTime || []).map((p) => ({ day: p.TimePeriod.Start, amount: Number(p.Total?.[metric]?.Amount) || 0 }));
  return summarise({ monthly, services, daily, currency: currency || 'USD' });
}

// ── handler ────────────────────────────────────────────

async function load(source) {
  const hit = cache.get(source);
  if (hit && Date.now() - hit.at < TTL_MS) return { ...hit.value, cachedAt: new Date(hit.at).toISOString() };
  let value;
  try {
    const g = source.match(GCP_RE);
    const a = source.match(AWS_RE);
    const data = g ? await gcpCosts(g[1], g[2]) : await awsCosts(a[1]);
    value = { source, provider: g ? 'gcp' : 'aws', account: g ? g[1] : a[1], ...data };
    cache.set(source, { at: Date.now(), value });
  } catch (e) {
    // Errors aren't cached, so fixing setup shows up on the next load.
    return { source, provider: source.split(':')[0], account: source.split(':')[1], error: String(e.message || e), notConfigured: !!e.notConfigured };
  }
  return { ...value, cachedAt: new Date().toISOString() };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!(await requireOwner(req, res))) return;
  const sources = [...new Set(String(req.query.sources || '').split(','))]
    .filter((s) => GCP_RE.test(s) || AWS_RE.test(s))
    .slice(0, 6);
  if (req.query.fresh === '1') sources.forEach((s) => cache.delete(s));
  res.status(200).json({ sources: await Promise.all(sources.map(load)) });
};
