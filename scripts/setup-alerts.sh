#!/usr/bin/env bash
# One-time setup for VP Control alerts:
#  - a shared MONITOR_SECRET (Vercel + GitHub Actions + laptop agent)
#  - an ntfy topic for phone notifications (Vercel + GitHub Actions)
#  - the laptop agent timer
# Secrets are generated here and piped straight into Vercel / GitHub; only
# the ntfy topic name is printed, because you subscribe to it in the app.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=vishalpanwar416/Portfolio
export GH_TOKEN="$(gh auth token -u vishalpanwar416)"

SECRET="$(openssl rand -hex 32)"
TOPIC="vp-control-$(openssl rand -hex 8)"

mkdir -p ~/.config/vp-control
umask 077
printf '{\n  "secret": "%s"\n}\n' "$SECRET" > ~/.config/vp-control/agent.json

for kv in "MONITOR_SECRET $SECRET" "NTFY_TOPIC $TOPIC"; do
  set -- $kv
  vercel env add "$1" production --value "$2" --yes --force --sensitive >/dev/null
  gh secret set "$1" -R "$REPO" --body "$2"
done
unset SECRET

vercel redeploy admin.vishalpanwar.in --target production >/dev/null
bash scripts/install-laptop-agent.sh

echo
echo "Done. On your phone: install the ntfy app → + → subscribe to topic:"
echo "    $TOPIC"
echo "(server ntfy.sh). Then press 'Send test' on the dashboard's Alerts page."
