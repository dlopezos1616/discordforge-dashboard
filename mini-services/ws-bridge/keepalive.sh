#!/bin/bash
# Keep-alive wrapper for WS Bridge
# Restarts the service if it dies

LOG="/tmp/ws-bridge.log"

while true; do
  echo "[$(date)] Starting WS Bridge..." >> "$LOG"
  cd /home/z/my-project/mini-services/ws-bridge
  bun index.ts >> "$LOG" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] WS Bridge exited with code $EXIT_CODE, restarting in 3s..." >> "$LOG"
  sleep 3
done
