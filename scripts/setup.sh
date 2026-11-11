#!/usr/bin/env bash
# One-time (and safe to re-run) setup for the VP Control backend:
#   1. the vp-control Google service account → Vercel GCP_SA_KEY
#      (Firestore storage for laptop data, monitor, Firestore/billing reads)
#   2. MONITOR_SECRET shared by Vercel, GitHub Actions and the laptop agent
#   3. a private ntfy topic for phone notifications
#   4. the laptop agent timer
# Secrets go straight into Vercel / GitHub and ~/.config/vp-control (mode
# 600); only the ntfy topic is printed, because you subscribe to it.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=vishalpanwar416/Portfolio
OWNER=vishalpanwar416@gmail.com
SA=vp-control@sanero-media.iam.gserviceaccount.com
CFG=~/.config/vp-control
export GH_TOKEN="$(gh auth token -u vishalpanwar416)"
mkdir -p "$CFG" && chmod 700 "$CFG"
umask 077
changed=0
have_env() { vercel env ls production 2>/dev/null | grep -qE "^\s*$1\s"; }
set_both() { vercel env add "$1" production --value "$2" --yes --force --sensitive >/dev/null; gh secret set "$1" -R "$REPO" --body "$2"; }

echo "1/4 service account"
if ! gcloud iam service-accounts describe "$SA" --project sanero-media --account "$OWNER" >/dev/null 2>&1; then
  gcloud iam service-accounts create vp-control --project sanero-media --account "$OWNER" --display-name "VP Control dashboard"
fi
gcloud projects add-iam-policy-binding sanero-media --account "$OWNER" --member "serviceAccount:$SA" --role roles/datastore.user --condition=None >/dev/null
for pair in "$OWNER sanero-media" "$OWNER stacky-f7f42" "developer@aarambh.app aarambh-20a47" "vishalpanwar416a@gmail.com certificate-automation-fb39e" "$OWNER sarai-crm"; do
  set -- $pair
  gcloud projects add-iam-policy-binding "$2" --account "$1" --member "serviceAccount:$SA" --role roles/monitoring.viewer --condition=None >/dev/null 2>&1 \
    || echo "   (skipped monitoring access on $2 — log in as $1 with 'gcloud auth login' and re-run)"
done
if ! have_env GCP_SA_KEY; then
  KEY="$(mktemp)"
  gcloud iam service-accounts keys create "$KEY" --iam-account "$SA" --account "$OWNER" >/dev/null
  vercel env add GCP_SA_KEY production --value "$(base64 -w0 "$KEY")" --yes --force --sensitive >/dev/null
  shred -u "$KEY" 2>/dev/null || rm -f "$KEY"
  changed=1
fi

echo "2/4 monitor secret"
if [ ! -s "$CFG/agent.json" ] || ! have_env MONITOR_SECRET; then
  SECRET="$(openssl rand -hex 32)"
  printf '{\n  "secret": "%s"\n}\n' "$SECRET" > "$CFG/agent.json"
  set_both MONITOR_SECRET "$SECRET"
  unset SECRET
  changed=1
fi

echo "3/4 phone notifications"
if [ ! -s "$CFG/ntfy-topic" ] || ! have_env NTFY_TOPIC; then
  echo "vp-control-$(openssl rand -hex 8)" > "$CFG/ntfy-topic"
  set_both NTFY_TOPIC "$(cat "$CFG/ntfy-topic")"
  changed=1
fi

if [ "$changed" = 1 ]; then
  echo "   redeploying so the new settings take effect…"
  vercel redeploy admin.vishalpanwar.in --target production >/dev/null
fi

echo "4/4 laptop agent"
bash scripts/install-laptop-agent.sh

echo
echo "All set. Phone: install ntfy → + → subscribe to:  $(cat "$CFG/ntfy-topic")"
echo "Then open admin.vishalpanwar.in → Alerts → Send test."
