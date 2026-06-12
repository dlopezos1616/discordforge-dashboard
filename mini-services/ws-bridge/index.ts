// ============================================
// DiscordForge - WebSocket Bridge
// ============================================
// Este servicio actúa como puente entre:
//   - El Dashboard (Next.js, puerto 3000)
//   - El Bot de Discord (discord.js, puerto 3003)
//
// ARQUITECTURA COMPLETA:
//
//  ┌──────────────┐                    ┌──────────────┐
//  │  Dashboard   │  Socket.io Client  │  WS Bridge   │
//  │  (Next.js)   │ ◄───────────────► │  (Port 3003) │
//  │  Puerto 3000 │   via XTransform   │              │
//  └──────────────┘     Port=3003      └──────┬───────┘
//                                             │
//                                      Socket.io Server
//                                             │
//                                    ┌────────┴────────┐
//                                    │  Discord Bot     │
//                                    │  (discord.js)    │
//                                    │  Socket.io Client│
//                                    └──────────────────┘
//
// FLUJO DE DATOS:
//
// 1. Dashboard → WS Bridge → Bot: Comandos (enviar embed, moderar, etc.)
// 2. Bot → WS Bridge → Dashboard: Eventos (nuevo miembro, ticket, etc.)
// 3. WS Bridge → Ambos: Estado del sistema, heartbeat
//
// EVENTOS PRINCIPALES:
//
// Bot → Dashboard:
//   bot:ready           - Bot conectado
//   bot:status          - Estado actual (ping, guilds, etc.)
//   bot:guildJoined     - Bot añadido a un servidor
//   bot:guildLeft       - Bot eliminado de un servidor
//   bot:memberJoined    - Nuevo miembro
//   bot:memberLeft      - Miembro salió
//   bot:messageDeleted  - Mensaje eliminado
//   bot:messageEdited   - Mensaje editado
//   bot:ticketCreated   - Ticket abierto
//   bot:ticketClaimed   - Ticket reclamado
//   bot:ticketClosed    - Ticket cerrado
//   bot:userVerified    - Usuario verificado
//   bot:autoModTriggered- Auto-mod activado
//   bot:modAction       - Acción de moderación
//
// Dashboard → Bot:
//   dashboard:getStatus       - Pedir estado del bot
//   dashboard:updateConfig    - Actualizar configuración
//   dashboard:sendEmbed       - Enviar embed a canal
//   dashboard:moderate        - Ejecutar moderación
//   dashboard:createTicketPanel - Crear panel de tickets
//   dashboard:createReactionRole - Crear reaction role
//   dashboard:createPoll      - Crear encuesta
//   dashboard:createGiveaway  - Crear sorteo
//   dashboard:createVerification - Crear verificación

import { Server as SocketIOServer } from 'socket.io'

// Prevent crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('🔴 Uncaught Exception:', err.message)
})

process.on('unhandledRejection', (err) => {
  console.error('🔴 Unhandled Rejection:', err)
})

const PORT = 3003

const io = new SocketIOServer(PORT, {
  cors: {
    origin: '*', // En producción: ['https://tudominio.com']
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})

// ============================================
// ESTADO DEL SISTEMA
// ============================================

interface BotStatus {
  online: boolean
  guilds: number
  users: number
  uptime: number
  ping: number
  lastReady: string | null
}

interface SystemState {
  botStatus: BotStatus
  connectedClients: number
  recentEvents: Array<{ timestamp: string; event: string; data: any }>
  startTime: string
}

const systemState: SystemState = {
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

function addEvent(event: string, data: any) {
  systemState.recentEvents.unshift({
    timestamp: new Date().toISOString(),
    event,
    data,
  })
  // Mantener solo los últimos 100 eventos
  if (systemState.recentEvents.length > 100) {
    systemState.recentEvents = systemState.recentEvents.slice(0, 100)
  }
}

// ============================================
// CONEXIONES
// ============================================

let botSocket: any = null
const dashboardClients = new Set<any>()

io.on('connection', (socket) => {
  systemState.connectedClients = io.sockets.sockets.size
  console.log(`🔌 Nuevo cliente conectado: ${socket.id} (Total: ${systemState.connectedClients})`)

  // ============================================
  // IDENTIFICACIÓN DEL CLIENTE
  // ============================================

  socket.on('identify', (type: 'bot' | 'dashboard') => {
    if (type === 'bot') {
      botSocket = socket
      console.log('🤖 Bot de Discord identificado')
      socket.join('bot')
    } else {
      dashboardClients.add(socket)
      console.log('📊 Dashboard identificado')
      socket.join('dashboards')

      // Enviar estado actual al dashboard recién conectado
      socket.emit('system:state', systemState)
    }

    socket.data.type = type
  })

  // ============================================
  // BOT → DASHBOARD
  // El bot envía eventos, se retransmiten a todos los dashboards
  // ============================================

  const botToDashboardEvents = [
    'bot:ready',
    'bot:status',
    'bot:guildJoined',
    'bot:guildLeft',
    'bot:guildSync',
    'bot:memberJoined',
    'bot:memberLeft',
    'bot:messageDeleted',
    'bot:messageEdited',
    'bot:ticketCreated',
    'bot:ticketClaimed',
    'bot:ticketClosed',
    'bot:userVerified',
    'bot:autoModTriggered',
    'bot:modAction',
    'bot:moderationDone',
    'bot:configUpdated',
    'bot:embedSent',
    'bot:ticketPanelCreated',
    'bot:reactionRoleCreated',
    'bot:pollCreated',
    'bot:giveawayCreated',
    'bot:verificationCreated',
    'bot:memberBanned',
    'bot:memberUnbanned',
  ]

  for (const event of botToDashboardEvents) {
    socket.on(event, (data: any) => {
      try {
        addEvent(event, data)

        // Actualizar estado del bot si es un evento de status
        if (event === 'bot:status' || event === 'bot:ready') {
          Object.assign(systemState.botStatus, data)
        }

        // Retransmitir a todos los dashboards
        socket.to('dashboards').emit(event, data)
        const logData = data ? (typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : String(data)) : '{}'
        console.log(`📡 ${event}:`, logData)
      } catch (err) {
        console.error(`❌ Error processing ${event}:`, err)
      }
    })
  }

  // ============================================
  // DASHBOARD → BOT
  // El dashboard envía comandos, se retransmiten al bot
  // ============================================

  const dashboardToBotEvents = [
    'dashboard:getStatus',
    'dashboard:updateConfig',
    'dashboard:sendEmbed',
    'dashboard:moderate',
    'dashboard:createTicketPanel',
    'dashboard:createReactionRole',
    'dashboard:createPoll',
    'dashboard:createGiveaway',
    'dashboard:createVerification',
  ]

  for (const event of dashboardToBotEvents) {
    socket.on(event, (data: any) => {
      try {
        addEvent(event, data)

        // Retransmitir al bot
        if (botSocket) {
          botSocket.emit(event, data)
          const logData = data ? (typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : String(data)) : '{}'
          console.log(`📤 ${event}:`, logData)
        } else {
          // Si no hay bot conectado, responder con error
          socket.emit('error:noBot', { message: 'Bot no conectado', event })
          console.log(`⚠️ ${event}: Bot no conectado`)
        }
      } catch (err) {
        console.error(`❌ Error processing ${event}:`, err)
      }
    })
  }

  // ============================================
  // CONSULTAS DEL DASHBOARD
  // ============================================

  socket.on('dashboard:getSystemState', () => {
    socket.emit('system:state', systemState)
  })

  socket.on('dashboard:getRecentEvents', (limit: number = 50) => {
    socket.emit('system:recentEvents', systemState.recentEvents.slice(0, limit))
  })

  // ============================================
  // DESCONEXIÓN
  // ============================================

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

// ============================================
// HEARTBEAT - Enviar estado cada 30 segundos
// ============================================

setInterval(() => {
  io.to('dashboards').emit('system:heartbeat', {
    timestamp: new Date().toISOString(),
    botOnline: systemState.botStatus.online,
    connectedClients: systemState.connectedClients,
    uptime: Date.now() - new Date(systemState.startTime).getTime(),
  })
}, 30000)

// ============================================
// INICIAR
// ============================================

console.log('\n🔌 DiscordForge - WebSocket Bridge')
console.log('═══════════════════════════════════════')
console.log(`🌐 Puerto: ${PORT}`)
console.log(`📡 Transportes: WebSocket, Polling`)
console.log(`🔗 CORS: Abierto (cambiar en producción)`)
console.log(`\n⏳ Esperando conexiones...`)
console.log('   - Bot de Discord se conectará como cliente')
console.log('   - Dashboard se conectará desde el navegador')
console.log('')
