// ============================================
// DiscordForge - Custom Next.js Server + WS Bridge
// ============================================
// This custom server runs both the Next.js app
// and the Socket.IO WS Bridge in the same process,
// solving the issue of running separate services.

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// ============================================
// WS BRIDGE STATE
// ============================================

const systemState = {
  botStatus: {
    online: false,
    guilds: 0,
    users: 0,
    uptime: 0,
    ping: 0,
    lastReady: null,
  },
  connectedClients: 0,
  recentEvents: [],
  startTime: new Date().toISOString(),
}

function addEvent(event, data) {
  systemState.recentEvents.unshift({
    timestamp: new Date().toISOString(),
    event,
    data,
  })
  if (systemState.recentEvents.length > 100) {
    systemState.recentEvents = systemState.recentEvents.slice(0, 100)
  }
}

let botSocket = null
const dashboardClients = new Set()

// ============================================
// START SERVER
// ============================================

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // ============================================
  // SOCKET.IO SERVER (on same port as Next.js)
  // ============================================
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    path: '/ws-socket.io',  // Different path to avoid conflict with Next.js
  })

  io.on('connection', (socket) => {
    systemState.connectedClients = io.sockets.sockets.size
    console.log(`🔌 Nuevo cliente conectado: ${socket.id} (Total: ${systemState.connectedClients})`)

    // IDENTIFY
    socket.on('identify', (type) => {
      if (type === 'bot') {
        botSocket = socket
        socket.join('bot')
        console.log('🤖 Bot de Discord identificado')
      } else {
        dashboardClients.add(socket)
        socket.join('dashboards')
        console.log('📊 Dashboard identificado')
        socket.emit('system:state', systemState)
      }
      socket.data = { type }
    })

    // BOT → DASHBOARD events
    const botToDashboardEvents = [
      'bot:ready', 'bot:status', 'bot:guildJoined', 'bot:guildLeft', 'bot:guildSync',
      'bot:memberJoined', 'bot:memberLeft', 'bot:messageDeleted', 'bot:messageEdited',
      'bot:ticketCreated', 'bot:ticketClaimed', 'bot:ticketClosed', 'bot:userVerified',
      'bot:autoModTriggered', 'bot:modAction', 'bot:moderationDone', 'bot:configUpdated',
      'bot:embedSent', 'bot:ticketPanelCreated', 'bot:reactionRoleCreated', 'bot:pollCreated',
      'bot:giveawayCreated', 'bot:verificationCreated', 'bot:memberBanned', 'bot:memberUnbanned',
    ]

    for (const event of botToDashboardEvents) {
      socket.on(event, (data) => {
        addEvent(event, data)
        if (event === 'bot:status' || event === 'bot:ready') {
          Object.assign(systemState.botStatus, data)
        }
        socket.to('dashboards').emit(event, data)
        console.log(`📡 ${event}:`, JSON.stringify(data ?? {}).substring(0, 100))
      })
    }

    // DASHBOARD → BOT events
    const dashboardToBotEvents = [
      'dashboard:getStatus', 'dashboard:updateConfig', 'dashboard:sendEmbed',
      'dashboard:moderate', 'dashboard:createTicketPanel', 'dashboard:createReactionRole',
      'dashboard:createPoll', 'dashboard:createGiveaway', 'dashboard:createVerification',
    ]

    for (const event of dashboardToBotEvents) {
      socket.on(event, (data) => {
        addEvent(event, data)
        if (botSocket) {
          botSocket.emit(event, data)
          console.log(`📤 ${event}:`, JSON.stringify(data ?? {}).substring(0, 100))
        } else {
          socket.emit('error:noBot', { message: 'Bot no conectado', event })
          console.log(`⚠️ ${event}: Bot no conectado`)
        }
      })
    }

    // QUERIES
    socket.on('dashboard:getSystemState', () => {
      socket.emit('system:state', systemState)
    })

    socket.on('dashboard:getRecentEvents', (limit) => {
      socket.emit('system:recentEvents', systemState.recentEvents.slice(0, limit || 50))
    })

    // DISCONNECT
    socket.on('disconnect', () => {
      if (socket.data?.type === 'bot') {
        botSocket = null
        systemState.botStatus.online = false
        socket.to('dashboards').emit('bot:status', systemState.botStatus)
        console.log('🤖 Bot de Discord desconectado')
      } else {
        dashboardClients.delete(socket)
      }
      systemState.connectedClients = io.sockets.sockets.size
      console.log(`🔌 Cliente desconectado: ${socket.id} (Total: ${systemState.connectedClients})`)
    })
  })

  // HEARTBEAT
  setInterval(() => {
    io.to('dashboards').emit('system:heartbeat', {
      timestamp: new Date().toISOString(),
      botOnline: systemState.botStatus.online,
      connectedClients: systemState.connectedClients,
      uptime: Date.now() - new Date(systemState.startTime).getTime(),
    })
  }, 30000)

  server.listen(port, hostname, () => {
    console.log(`\n🚀 DiscordForge Server`)
    console.log(`═══════════════════════════════════════`)
    console.log(`🌐 Next.js: http://localhost:${port}`)
    console.log(`🔌 WS Bridge: ws://localhost:${port}/ws-socket.io`)
    console.log(`📡 Both running in the same process!`)
    console.log(``)
  })
})
