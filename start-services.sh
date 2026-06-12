#!/bin/bash
# Script to start all DiscordForge services

echo "🚀 Starting DiscordForge Services..."
echo "═══════════════════════════════════════"

# Kill any existing processes
pkill -f "ws-bridge/index.ts" 2>/dev/null
pkill -f "discord-bot/src/index.ts" 2>/dev/null
sleep 2

# Free port 3003
fuser -k 3003/tcp 2>/dev/null || true
sleep 1

# Start WS Bridge
echo ""
echo "1️⃣ Starting WS Bridge on port 3003..."
cd /home/z/my-project/mini-services/ws-bridge
bun index.ts > /tmp/ws-bridge.log 2>&1 &
WS_PID=$!
echo "   PID: $WS_PID"

sleep 3

if ps -p $WS_PID > /dev/null 2>&1; then
  echo "   ✅ WS Bridge running"
else
  echo "   ❌ WS Bridge failed"
  cat /tmp/ws-bridge.log
  exit 1
fi

# Start Discord Bot
echo ""
echo "2️⃣ Starting Discord Bot..."
cd /home/z/my-project/mini-services/discord-bot
bun src/index.ts > /tmp/discord-bot.log 2>&1 &
BOT_PID=$!
echo "   PID: $BOT_PID"

sleep 8

if ps -p $BOT_PID > /dev/null 2>&1; then
  echo "   ✅ Bot running"
else
  echo "   ❌ Bot failed"
  cat /tmp/discord-bot.log
  exit 1
fi

echo ""
echo "═══════════════════════════════════════"
echo "✅ All services started!"
echo "   - WS Bridge: port 3003 (PID: $WS_PID)"
echo "   - Discord Bot: connected (PID: $BOT_PID)"
echo "   - Dashboard: port 3000 (already running)"
echo ""
echo "📋 Logs: tail -f /tmp/ws-bridge.log /tmp/discord-bot.log"
