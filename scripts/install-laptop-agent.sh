#!/usr/bin/env bash
# Installs the VP Control laptop agent as a systemd user timer (every 5 min).
# Needs ~/.config/vp-control/agent.json with the monitor secret — written by
# scripts/setup-alerts.sh.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="$(command -v node)"
UNIT_DIR="$HOME/.config/systemd/user"
mkdir -p "$UNIT_DIR"

cat > "$UNIT_DIR/vp-agent.service" <<UNIT
[Unit]
Description=VP Control laptop heartbeat
After=network-online.target

[Service]
Type=oneshot
ExecStart=$NODE $DIR/laptop-agent.mjs
UNIT

cat > "$UNIT_DIR/vp-agent.timer" <<UNIT
[Unit]
Description=Run the VP Control laptop heartbeat every 5 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now vp-agent.timer
systemctl --user start vp-agent.service || true
journalctl --user -u vp-agent.service -n 3 --no-pager -o cat
