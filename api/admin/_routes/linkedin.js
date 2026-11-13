// LinkedIn outreach backend. The trackers live on the laptop
// (~/linkedin-outreach/prospects.json and targets.json, kept by the
// linkedin-followup-dms scheduled task); the laptop agent POSTs both files
// here whenever they change, authenticated with MONITOR_SECRET. Stored as
// vp_sites/linkedin (owner-only), which the LinkedIn page reads live.
// GET returns the stored copy with its age.
const { requireOwnerOrMonitor } = require('../_auth');
const { getSite, writeSite } = require('../_firestore');

const MAX_PEOPLE = 300;
const MAX_NOTES = 20;

const str = (v, n = 300) => (v === null || v === undefined || v === '' ? null : String(v).slice(0, n));
const bool = (v) => (v === true ? true : v === false ? false : null);
const url = (v) => (/^https:\/\/(www\.)?linkedin\.com\//.test(String(v || '')) ? String(v).slice(0, 300) : null);

// Keep only the expected fields — this lands in Firestore as-is.
const prospect = (p) => ({
  name: str(p.name, 120),
  profile: url(p.profile),
  headline: str(p.headline, 200),
  org: str(p.org, 120),
  role: str(p.role, 200),
  location: str(p.location, 160),
  experience: str(p.experience_asked, 80),
  stack: str(p.stack, 300),
  post: str(p.post_url, 300),
  status: str(p.status, 40) || 'requested',
  noteSent: bool(p.note_sent),
  seenOn: str(p.post_seen_on, 40),
  requestedOn: str(p.requested_on, 60),
  acceptedOn: str(p.accepted_on, 120),
  messagedOn: str(p.messaged_on, 60),
  fitLine: str(p.fit_line, 400),
  replied: str(p.replied, 600),
  awaitingReply: p.awaiting_vishal_reply === true,
  note: str(p.messaged_note || p.blocked_note || p.note_skipped_reason || p.reason, 600),
});

const target = (t) => ({
  name: str(t.name, 120),
  profile: url(t.profile),
  org: str(t.org, 120),
  role: str(t.role, 200),
  messaged: t.messaged === true,
  acceptedOn: str(t.accepted_on, 60),
  note: str(t.messaged_note || t.blocked_note, 600),
  replied: str(t.replied, 600),
  vishalReplied: str(t.vishal_replied, 400),
  awaitingReply: t.awaiting_vishal_reply === true,
});

function clean(b, at) {
  const p = b.prospects || {};
  const t = b.targets || {};
  const log = Object.entries(p.request_log || {})
    .filter(([day, n]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Number(n)))
    .sort(([a], [b2]) => (a < b2 ? -1 : 1)).slice(-60)
    .map(([day, n]) => ({ day, n: Number(n) }));
  return {
    kind: 'linkedin',
    at,
    lastChecked: str(t.last_checked, 60),
    requestLog: log,
    prospects: (p.prospects || []).slice(0, MAX_PEOPLE).map(prospect),
    targets: (t.targets || []).slice(0, MAX_PEOPLE).map(target),
    couldNotConnect: (t.could_not_connect || []).slice(0, 50).map((c) => ({ name: str(c.name, 120), role: str(c.role, 200), reason: str(c.reason, 200) })),
    runNotes: (p.run_notes || []).slice(-MAX_NOTES).map((n) => ({ at: str(n.at, 60), note: str(n.note, 800) })),
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const who = await requireOwnerOrMonitor(req, res);
  if (!who) return;
  if (req.method === 'POST') {
    if (who !== 'monitor') return res.status(403).json({ error: 'agent only' });
    const doc = clean(req.body || {}, new Date().toISOString());
    try {
      await writeSite('linkedin', doc);
      return res.status(200).json({ ok: true, prospects: doc.prospects.length, targets: doc.targets.length });
    } catch (e) {
      return res.status(e.status || 502).json({ error: String(e.message || e) });
    }
  }
  try {
    const doc = await getSite('linkedin');
    if (!doc) return res.status(200).json({ error: 'the laptop agent has not sent the trackers yet' });
    return res.status(200).json({ ...doc, ageMs: Date.now() - Date.parse(doc.at) });
  } catch (e) {
    return res.status(e.status || 502).json({ error: String(e.message || e) });
  }
};
module.exports.clean = clean;
