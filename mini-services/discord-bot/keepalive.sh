#!/bin/bash
# Keep-alive wrapper for Discord Bot
# Restarts the service if it dies

LOG="/tmp/discord-bot.log"

while true; do
  echo "[$(date)] Starting Discord Bot..." >> "$LOG"
  cd /home/z/my-project/mini-services/discord-bot
  bun src/index.ts >> "$LOG" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Bot exited with code $EXIT_CODE, restarting in 5s..." >> "$LOG"
  sleep 5
done
