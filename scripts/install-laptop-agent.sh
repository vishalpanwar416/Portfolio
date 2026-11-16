#!/usr/bin/env bash
# Installs the VP Control laptop agent as a systemd user timer: every 2
# minutes while the laptop is on, and straight away after it wakes up
# (Persistent=true catches up on missed runs). Needs
# ~/.config/vp-control/agent.json — written by scripts/setup.sh.
# Also installs vp-monitor.timer: the uptime monitor every 10 minutes.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$DIR")"
NODE="$(command -v node)"
UNIT_DIR="$HOME/.config/systemd/user"
mkdir -p "$UNIT_DIR"

cat > "$UNIT_DIR/vp-agent.service" <<UNIT
[Unit]
Description=VP Control laptop agent (sends status to admin.vishalpanwar.in)
After=network-online.target

[Service]
Type=oneshot
ExecStart=$NODE $DIR/laptop-agent.mjs
TimeoutStartSec=90
UNIT

cat > "$UNIT_DIR/vp-agent.timer" <<UNIT
[Unit]
Description=Run the VP Control laptop agent every 2 minutes

[Timer]
OnCalendar=*:0/2
AccuracySec=15s
Persistent=true
OnStartupSec=30s

[Install]
WantedBy=timers.target
UNIT

# The uptime monitor: GitHub's scheduler only gets to it every few hours, so
# the laptop runs it every 10 minutes and GitHub stays as the backup.
cat > "$UNIT_DIR/vp-monitor.service" <<UNIT
[Unit]
Description=VP Control uptime monitor (sites, SSL, Supabase, morning check)
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$ROOT
Environment=MONITOR_STATE=$HOME/.config/vp-control/monitor-state.json
ExecStart=$NODE $DIR/monitor.mjs
TimeoutStartSec=300
UNIT

cat > "$UNIT_DIR/vp-monitor.timer" <<UNIT
[Unit]
Description=Run the VP Control uptime monitor every 10 minutes

[Timer]
OnCalendar=*:0/10
AccuracySec=30s
Persistent=true
OnStartupSec=60s

[Install]
WantedBy=timers.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now vp-agent.timer vp-monitor.timer
systemctl --user start vp-agent.service || true
journalctl --user -u vp-agent.service -n 2 --no-pager -o cat
