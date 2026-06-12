'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Bot, Wifi, WifiOff, Activity, Server, Users, Clock,
  Zap, AlertCircle, CheckCircle2, RefreshCw, Copy,
  Terminal, ArrowRight, Shield, Settings2, ExternalLink,
  ChevronDown, ChevronUp, Code2, FileCode, Play
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface BotStatusData {
  online: boolean
  guilds: number
  users: number
  uptime: number
  ping: number
  lastReady: string | null
}

interface LogEvent {
  timestamp: string
  event: string
  data: any
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function BotStatusPanel() {
  const { currentServer } = useAppStore()
  const [botStatus, setBotStatus] = useState<BotStatusData>({
    online: false,
    guilds: 0,
    users: 0,
    uptime: 0,
    ping: 0,
    lastReady: null,
  })
  const [recentEvents, setRecentEvents] = useState<LogEvent[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [showSetup, setShowSetup] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>('architecture')

  // ============================================
  // CONEXIÓN WEBSOCKET CON EL WS BRIDGE
  // ============================================
  useEffect(() => {
    let socket: any = null

    const connectWS = () => {
      try {
        // Dynamic import to avoid SSR issues
        import('socket.io-client').then(({ io }) => {
          // Connect to the WS Bridge on the same origin (custom server)
          const wsUrl = window.location.origin
          socket = io(wsUrl, {
            path: '/ws-socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 20,
          })

          socket.on('connect', () => {
            console.log('🔌 Dashboard conectado al WS Bridge')
            setWsConnected(true)
            // Identify as dashboard
            socket.emit('identify', 'dashboard')
            // Request current state
            socket.emit('dashboard:getSystemState')
            socket.emit('dashboard:getStatus')
          })

          socket.on('disconnect', () => {
            console.log('⚠️ Dashboard desconectado del WS Bridge')
            setWsConnected(false)
          })

          socket.on('connect_error', (err: any) => {
            console.error('❌ Error conectando al WS Bridge:', err.message)
            setWsConnected(false)
          })

          // Listen for bot status updates
          socket.on('bot:status', (data: BotStatusData) => {
            setBotStatus(data)
          })

          socket.on('bot:ready', (data: BotStatusData) => {
            setBotStatus(data)
          })

          socket.on('system:state', (data: any) => {
            if (data.botStatus) {
              setBotStatus(data.botStatus)
            }
          })

          socket.on('system:heartbeat', (data: any) => {
            // Update bot online status from heartbeat
            setBotStatus(prev => ({
              ...prev,
              online: data.botOnline,
            }))
          })

          // Listen for all bot events for the event log
          const botEvents = [
            'bot:ready', 'bot:status', 'bot:guildJoined', 'bot:guildLeft',
            'bot:guildSync', 'bot:memberJoined', 'bot:memberLeft',
            'bot:ticketCreated', 'bot:ticketClaimed', 'bot:ticketClosed',
            'bot:userVerified', 'bot:autoModTriggered', 'bot:modAction',
            'bot:moderationDone', 'bot:configUpdated', 'bot:embedSent',
          ]

          for (const event of botEvents) {
            socket.on(event, (data: any) => {
              setRecentEvents(prev => [{
                timestamp: new Date().toISOString(),
                event,
                data,
              }, ...prev].slice(0, 100))
            })
          }

          // Listen for recent events
          socket.on('system:recentEvents', (events: LogEvent[]) => {
            setRecentEvents(events)
          })
        })
      } catch (err) {
        console.error('Failed to connect to WS Bridge:', err)
      }
    }

    connectWS()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const formatUptime = (ms: number) => {
    if (!ms) return '0s'
    const d = Math.floor(ms / 86400000)
    const h = Math.floor((ms % 86400000) / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const eventColors: Record<string, string> = {
    'bot:ready': 'bg-emerald-500/20 text-emerald-400',
    'bot:status': 'bg-blue-500/20 text-blue-400',
    'bot:memberJoined': 'bg-emerald-500/20 text-emerald-400',
    'bot:memberLeft': 'bg-red-500/20 text-red-400',
    'bot:ticketCreated': 'bg-violet-500/20 text-violet-400',
    'bot:ticketClosed': 'bg-fuchsia-500/20 text-fuchsia-400',
    'bot:autoModTriggered': 'bg-orange-500/20 text-orange-400',
    'bot:modAction': 'bg-red-500/20 text-red-400',
    'dashboard:sendEmbed': 'bg-cyan-500/20 text-cyan-400',
    'dashboard:moderate': 'bg-yellow-500/20 text-yellow-400',
    'error:noBot': 'bg-red-500/20 text-red-400',
  }

  const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1514983732761854113&scope=bot%20applications.commands&permissions=8'

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6">
      {/* Header */}
      <motion.div variants={item}>
        <Card className="border-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bot className="w-6 h-6 text-violet-400" />
                  Discord Bot — Estado y Configuración
                </CardTitle>
                <CardDescription className="mt-1">
                  Gestiona la conexión del bot con Discord y el dashboard
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={botStatus.online ? 'default' : 'secondary'} className={`gap-1.5 ${botStatus.online ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                  {botStatus.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {botStatus.online ? 'En línea' : 'Desconectado'}
                </Badge>
                <Badge variant="secondary" className={`gap-1.5 ${wsConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  WS: {wsConnected ? 'Conectado' : 'Sin conexión'}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

      {/* ALERT: Bot no está en ningún servidor */}
      {botStatus.online && botStatus.guilds === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Card className="border-orange-500/50 bg-gradient-to-r from-orange-500/10 via-red-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="text-sm font-semibold text-orange-400">Bot conectado pero no está en ningún servidor</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      El bot <strong>disbotForge#7927</strong> está conectado a Discord pero no se encuentra en ningún servidor. 
                      Necesitas invitarlo a tu servidor para que funcione.
                    </p>
                  </div>
                  
                  <div className="bg-[#1a1b26] rounded-lg p-3 text-xs font-mono">
                    <p className="text-[#565f89]"># URL de invitación directa:</p>
                    <p className="text-[#7aa2f7] break-all">{INVITE_URL}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-2 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                      onClick={() => {
                        window.open(INVITE_URL, '_blank')
                        toast.success('Abriendo invitación del bot...')
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Invitar Bot a mi Servidor
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(INVITE_URL)
                        toast.success('URL de invitación copiada al portapapeles')
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar URL
                    </Button>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs text-yellow-400 flex items-center gap-2 font-semibold">
                      <Shield className="w-4 h-4 shrink-0" />
                      IMPORTANTE: Intents Privilegiados
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Para que el bot funcione correctamente, debes activar estos intents en el 
                      <a href="https://discord.com/developers/applications/1514983732761854113/bot" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">Discord Developer Portal</a>:
                    </p>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs"><strong>PRESENCE INTENT</strong> — Para ver estados de usuarios</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs"><strong>SERVER MEMBERS INTENT</strong> — Para eventos de miembros (bienvenida, etc.)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs"><strong>MESSAGE CONTENT INTENT</strong> — Para leer contenido de mensajes (auto-mod)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Servidores', value: botStatus.guilds.toString(), icon: Server, color: 'from-violet-500 to-fuchsia-500' },
          { label: 'Usuarios', value: botStatus.users.toLocaleString(), icon: Users, color: 'from-emerald-500 to-teal-500' },
          { label: 'Uptime', value: formatUptime(botStatus.uptime), icon: Clock, color: 'from-orange-500 to-red-500' },
          { label: 'Ping', value: `${botStatus.ping}ms`, icon: Zap, color: 'from-blue-500 to-cyan-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <Tabs defaultValue="architecture" className="space-y-4">
        <TabsList className="bg-card/50 border border-border">
          <TabsTrigger value="architecture" className="text-xs gap-1.5">
            <Settings2 className="w-3.5 h-3.5" /> Arquitectura
          </TabsTrigger>
          <TabsTrigger value="setup" className="text-xs gap-1.5">
            <Play className="w-3.5 h-3.5" /> Configuración
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Eventos en Vivo
          </TabsTrigger>
          <TabsTrigger value="commands" className="text-xs gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> Comandos
          </TabsTrigger>
        </TabsList>

        {/* ============================================
            TAB: ARQUITECTURA
            ============================================ */}
        <TabsContent value="architecture">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Architecture diagram */}
            <motion.div variants={item}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-violet-400" />
                    Arquitectura del Sistema
                  </CardTitle>
                  <CardDescription className="text-xs">Cómo se comunican todos los componentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#1a1b26] rounded-xl p-4 font-mono text-[11px] space-y-3 text-[#a9b1d6]">
                    {/* Diagram */}
                    <div className="text-center space-y-1">
                      <div className="inline-block bg-violet-500/20 border border-violet-500/30 rounded-lg px-4 py-2 text-violet-300">
                        🖥️ Dashboard (Next.js :3000)
                      </div>
                      <div className="text-violet-400">↕ Socket.io via XTransformPort=3003</div>
                      <div className="inline-block bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-lg px-4 py-2 text-fuchsia-300">
                        🔌 WS Bridge (:3003)
                      </div>
                      <div className="text-fuchsia-400">↕ Socket.io</div>
                      <div className="inline-block bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-4 py-2 text-emerald-300">
                        🤖 Discord Bot (discord.js)
                      </div>
                      <div className="text-emerald-400">↕ Discord Gateway (WebSocket)</div>
                      <div className="inline-block bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-300">
                        💬 Discord API
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-2">
                      <p className="text-[#bb9af7] font-semibold">Flujo de Datos:</p>
                      <div className="space-y-1">
                        <p>1️⃣ Admin configura algo en el Dashboard</p>
                        <p>2️⃣ Dashboard → API REST → Base de Datos (guardar)</p>
                        <p>3️⃣ Dashboard → WebSocket → Bot (ejecutar)</p>
                        <p>4️⃣ Bot lee config de la DB y ejecuta en Discord</p>
                        <p>5️⃣ Bot → WebSocket → Dashboard (confirmar)</p>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-2">
                      <p className="text-[#bb9af7] font-semibold">Ejemplo: Sistema de Tickets</p>
                      <div className="space-y-1">
                        <p>📌 Dashboard: Crear categoría → API → DB</p>
                        <p>📌 Dashboard: Enviar panel → WS → Bot</p>
                        <p>📌 Bot: Crea botones en el canal de Discord</p>
                        <p>📌 Usuario: Hace clic en botón en Discord</p>
                        <p>📌 Bot: Crea canal + permisos → DB</p>
                        <p>📌 Bot: WS → Dashboard actualiza lista</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* File structure */}
            <motion.div variants={item}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    Estructura del Proyecto
                  </CardTitle>
                  <CardDescription className="text-xs">Archivos del bot y su función</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[420px]">
                    <div className="space-y-1 font-mono text-[11px]">
                      {[
                        { path: 'mini-services/', type: 'folder', desc: 'Servicios independientes' },
                        { path: '├── discord-bot/', type: 'folder', desc: 'Bot de Discord' },
                        { path: '│   ├── src/', type: 'folder', desc: '' },
                        { path: '│   │   ├── index.ts', type: 'file', desc: '🤖 Entry point - Eventos de Discord, WebSocket' },
                        { path: '│   │   └── commands/', type: 'folder', desc: '' },
                        { path: '│   │       └── slashHandler.ts', type: 'file', desc: '⚡ Comandos slash (/ban, /kick, etc.)' },
                        { path: '│   └── package.json', type: 'file', desc: '📦 Dependencias del bot' },
                        { path: '├── ws-bridge/', type: 'folder', desc: 'Puente WebSocket' },
                        { path: '│   ├── index.ts', type: 'file', desc: '🔌 Servidor Socket.io (puerto 3003)' },
                        { path: '│   └── package.json', type: 'file', desc: '📦 Dependencias del bridge' },
                        { path: 'src/', type: 'folder', desc: 'Dashboard web (Next.js)' },
                        { path: '├── app/', type: 'folder', desc: '' },
                        { path: '│   ├── page.tsx', type: 'file', desc: '🖥️ Dashboard principal' },
                        { path: '│   └── api/', type: 'folder', desc: '' },
                        { path: '│       ├── auth/login/', type: 'folder', desc: '🔐 Discord OAuth2' },
                        { path: '│       ├── seed/', type: 'folder', desc: '🌱 Datos demo' },
                        { path: '│       ├── servers/', type: 'folder', desc: '🏛️ CRUD servidores' },
                        { path: '│       ├── stats/', type: 'folder', desc: '📊 Estadísticas' },
                        { path: '│       ├── tickets/', type: 'folder', desc: '🎫 CRUD tickets' },
                        { path: '│       ├── moderation/', type: 'folder', desc: '🛡️ Moderación' },
                        { path: '│       ├── automod/', type: 'folder', desc: '🤖 Auto-mod' },
                        { path: '│       ├── embeds/', type: 'folder', desc: '📝 Embeds' },
                        { path: '│       ├── reaction-roles/', type: 'folder', desc: '😀 Reaction roles' },
                        { path: '│       ├── whitelist/', type: 'folder', desc: '📋 Whitelist' },
                        { path: '│       ├── polls/', type: 'folder', desc: '📊 Encuestas' },
                        { path: '│       ├── giveaways/', type: 'folder', desc: '🎁 Sorteos' },
                        { path: '│       ├── logs/', type: 'folder', desc: '📄 Logs' },
                        { path: '│       └── settings/', type: 'folder', desc: '⚙️ Configuración' },
                        { path: '├── components/dashboard/', type: 'folder', desc: '' },
                        { path: '│   ├── Sidebar.tsx', type: 'file', desc: '📐 Sidebar animada' },
                        { path: '│   ├── Header.tsx', type: 'file', desc: '🔝 Cabecera' },
                        { path: '│   ├── LoginScreen.tsx', type: 'file', desc: '🔐 Pantalla login' },
                        { path: '│   ├── DashboardHome.tsx', type: 'file', desc: '🏠 Dashboard principal' },
                        { path: '│   ├── TicketSystem.tsx', type: 'file', desc: '🎫 Sistema tickets' },
                        { path: '│   ├── WelcomeSystem.tsx', type: 'file', desc: '👋 Bienvenidas' },
                        { path: '│   ├── EmbedBuilder.tsx', type: 'file', desc: '📝 Constructor embeds' },
                        { path: '│   ├── ModerationPanel.tsx', type: 'file', desc: '🛡️ Panel moderación' },
                        { path: '│   ├── AutoModConfig.tsx', type: 'file', desc: '🤖 Auto-mod config' },
                        { path: '│   ├── VerificationSystem.tsx', type: 'file', desc: '✅ Verificación' },
                        { path: '│   ├── ReactionRoles.tsx', type: 'file', desc: '😀 Reaction roles' },
                        { path: '│   ├── WhitelistSystem.tsx', type: 'file', desc: '📋 Whitelist FiveM' },
                        { path: '│   ├── PollsSystem.tsx', type: 'file', desc: '📊 Encuestas' },
                        { path: '│   ├── GiveawaysSystem.tsx', type: 'file', desc: '🎁 Sorteos' },
                        { path: '│   ├── LogsViewer.tsx', type: 'file', desc: '📄 Visor logs' },
                        { path: '│   ├── SettingsPanel.tsx', type: 'file', desc: '⚙️ Ajustes' },
                        { path: '│   ├── SuperAdmin.tsx', type: 'file', desc: '👑 Super admin' },
                        { path: '│   └── BotStatusPanel.tsx', type: 'file', desc: '🤖 Estado del bot' },
                        { path: '└── lib/', type: 'folder', desc: '' },
                        { path: '    ├── store.ts', type: 'file', desc: '📦 Zustand state' },
                        { path: '    └── db.ts', type: 'file', desc: '💾 Prisma client' },
                        { path: 'prisma/', type: 'folder', desc: '' },
                        { path: '└── schema.prisma', type: 'file', desc: '🗂️ 20+ modelos de datos' },
                      ].map((file, i) => (
                        <div key={i} className="flex items-start gap-2 py-0.5">
                          <span className={file.type === 'folder' ? 'text-[#bb9af7]' : 'text-[#9ece6a]'}>{file.path}</span>
                          {file.desc && <span className="text-muted-foreground shrink-0 ml-1">{file.desc}</span>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ============================================
            TAB: CONFIGURACIÓN
            ============================================ */}
        <TabsContent value="setup">
          <div className="space-y-4">
            {/* Step 1 */}
            <motion.div variants={item}>
              <Card className="border-l-4 border-l-violet-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div>
                      <CardTitle className="text-sm">Crear Aplicación en Discord</CardTitle>
                      <CardDescription className="text-xs">Registra tu bot en el Portal de Desarrolladores</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-[#1a1b26] rounded-lg p-4 text-xs space-y-2 font-mono">
                    <p className="text-[#9ece6a]"># Pasos para crear tu bot:</p>
                    <p className="text-[#a9b1d6]">1. Ve a <span className="text-[#7aa2f7] underline">https://discord.com/developers/applications</span></p>
                    <p className="text-[#a9b1d6]">2. Haz clic en &quot;New Application&quot;</p>
                    <p className="text-[#a9b1d6]">3. Dale un nombre (ej: DiscordForge)</p>
                    <p className="text-[#a9b1d6]">4. Ve a la pestaña &quot;Bot&quot;</p>
                    <p className="text-[#a9b1d6]">5. Haz clic en &quot;Add Bot&quot;</p>
                    <p className="text-[#a9b1d6]">6. Copia el <span className="text-[#bb9af7]">TOKEN</span></p>
                    <p className="text-[#a9b1d6]">7. Copia el <span className="text-[#bb9af7]">APPLICATION ID</span></p>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs text-yellow-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <strong>Intents requeridos:</strong> Activa PRESENCE INTENT, SERVER MEMBERS INTENT y MESSAGE CONTENT INTENT en la pestaña Bot.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => {
                      window.open('https://discord.com/developers/applications', '_blank')
                      toast.success('Abriendo Discord Developer Portal...')
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Discord Developer Portal
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={item}>
              <Card className="border-l-4 border-l-fuchsia-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div>
                      <CardTitle className="text-sm">Configurar Variables de Entorno</CardTitle>
                      <CardDescription className="text-xs">Establece las credenciales del bot</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-[#1a1b26] rounded-lg p-4 text-xs font-mono space-y-1">
                    <p className="text-[#565f89]"># Archivo: mini-services/discord-bot/.env</p>
                    <p><span className="text-[#bb9af7]">DISCORD_BOT_TOKEN</span>=<span className="text-[#9ece6a]">tu_token_aqui</span></p>
                    <p><span className="text-[#bb9af7]">DISCORD_CLIENT_ID</span>=<span className="text-[#9ece6a]">tu_client_id_aqui</span></p>
                    <p><span className="text-[#bb9af7]">DASHBOARD_WS_URL</span>=<span className="text-[#9ece6a]">http://localhost:3003</span></p>
                    <p><span className="text-[#bb9af7]">DATABASE_URL</span>=<span className="text-[#9ece6a]">file:../../db/custom.db</span></p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={() => {
                      const envContent = `DISCORD_BOT_TOKEN=tu_token_aqui\nDISCORD_CLIENT_ID=tu_client_id_aqui\nDASHBOARD_WS_URL=http://localhost:3003\nDATABASE_URL=file:../../db/custom.db`
                      navigator.clipboard.writeText(envContent)
                      toast.success('Contenido del .env copiado al portapapeles')
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar template .env
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={item}>
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">3</div>
                    <div>
                      <CardTitle className="text-sm">Invitar el Bot a tu Servidor</CardTitle>
                      <CardDescription className="text-xs">Genera la URL de invitación con permisos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-[#1a1b26] rounded-lg p-4 text-xs font-mono space-y-2">
                    <p className="text-[#565f89]"># URL de invitación directa:</p>
                    <p className="text-[#7aa2f7] break-all">
                      https://discord.com/oauth2/authorize?client_id=1514983732761854113&scope=bot%20applications.commands&permissions=8
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold">Permisos necesarios (Administrator = 8):</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        'Manage Channels', 'Manage Roles', 'Kick Members', 'Ban Members',
                        'Timeout Members', 'Manage Messages', 'Send Messages', 'Embed Links',
                        'Read Messages', 'Add Reactions', 'Use Slash Commands', 'View Audit Log',
                      ].map(perm => (
                        <div key={perm} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-[11px] text-muted-foreground">{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-2 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                      onClick={() => {
                        window.open('https://discord.com/oauth2/authorize?client_id=1514983732761854113&scope=bot%20applications.commands&permissions=8', '_blank')
                        toast.success('Abriendo invitación del bot...')
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Invitar Bot
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText('https://discord.com/oauth2/authorize?client_id=1514983732761854113&scope=bot%20applications.commands&permissions=8')
                        toast.success('URL de invitación copiada al portapapeles')
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={item}>
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-bold">4</div>
                    <div>
                      <CardTitle className="text-sm">Iniciar los Servicios</CardTitle>
                      <CardDescription className="text-xs">Ejecuta el WebSocket Bridge y el Bot</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-[#1a1b26] rounded-lg p-4 text-xs font-mono space-y-3">
                    <div>
                      <p className="text-[#565f89]"># Terminal 1: WebSocket Bridge</p>
                      <p className="text-[#a9b1d6]">$ <span className="text-[#9ece6a]">cd</span> mini-services/ws-bridge</p>
                      <p className="text-[#a9b1d6]">$ <span className="text-[#9ece6a]">bun</span> install</p>
                      <p className="text-[#a9b1d6]">$ <span className="text-[#9ece6a]">bun</span> run dev</p>
                    </div>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-[#565f89]"># Terminal 2: Discord Bot</p>
                      <p className="text-[#a9b1d6]">$ <span className="text-[#9ece6a]">cd</span> mini-services/discord-bot</p>
                      <p className="text-[#a9b1d6]">$ <span className="text-[#9ece6a]">bun</span> install</p>
                      <p className="text-[#a9b1d6]">$ <span className="text-[#9ece6a]">bun</span> run dev</p>
                    </div>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-[#565f89]"># Terminal 3: Dashboard (ya está corriendo)</p>
                      <p className="text-[#a9b1d6]">$ <span className="text-[#9ece6a]">bun</span> run dev  <span className="text-[#565f89]"># Puerto 3000</span></p>
                    </div>
                    <Separator className="bg-white/10" />
                    <div>
                      <p className="text-[#565f89]"># Registrar Slash Commands (una sola vez):</p>
                      <p className="text-[#a9b1d6]">$ <span className="text-[#9ece6a]">bun</span> run register  <span className="text-[#565f89]"># Opcional, registrar /ban, /kick, etc.</span></p>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-xs text-emerald-400">
                      ✅ Una vez que los 3 servicios estén corriendo, el dashboard se conectará automáticamente al bot via WebSocket.
                      Los cambios en el dashboard se reflejarán en Discord en tiempo real.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ============================================
            TAB: EVENTOS EN VIVO
            ============================================ */}
        <TabsContent value="events">
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Eventos en Tiempo Real
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-medium">En vivo</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRecentEvents([])}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentEvents.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">No hay eventos aún</p>
                    <p className="text-xs text-muted-foreground/60">
                      Los eventos aparecerán aquí cuando el bot esté conectado y el dashboard envíe comandos.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {recentEvents.map((event, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${eventColors[event.event] || 'bg-muted text-muted-foreground'}`}>
                            {event.event.replace('bot:', '🤖 ').replace('dashboard:', '📊 ')}
                          </Badge>
                          <p className="text-xs flex-1 truncate text-muted-foreground">
                            {JSON.stringify(event.data).substring(0, 80)}
                          </p>
                          <span className="text-[10px] text-muted-foreground/50 shrink-0">
                            {new Date(event.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ============================================
            TAB: COMANDOS
            ============================================ */}
        <TabsContent value="commands">
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Comandos del Bot
                </CardTitle>
                <CardDescription className="text-xs">Comandos slash disponibles en Discord</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {[
                      {
                        category: '🛡️ Moderación',
                        commands: [
                          { cmd: '/ban @usuario razón', desc: 'Banear permanentemente', perms: 'BanMembers' },
                          { cmd: '/kick @usuario razón', desc: 'Expulsar del servidor', perms: 'KickMembers' },
                          { cmd: '/timeout @usuario duración razón', desc: 'Aislar temporalmente', perms: 'ModerateMembers' },
                          { cmd: '/warn @usuario razón', desc: 'Advertir (se registra)', perms: 'ModerateMembers' },
                          { cmd: '/softban @usuario razón', desc: 'Ban+Unban (limpiar mensajes)', perms: 'BanMembers' },
                          { cmd: '/unban usuario_id', desc: 'Desbanear', perms: 'BanMembers' },
                        ],
                      },
                      {
                        category: '🎫 Tickets',
                        commands: [
                          { cmd: '/ticket', desc: 'Abrir un ticket', perms: 'Everyone' },
                          { cmd: '/ticket-close', desc: 'Cerrar ticket actual', perms: 'Staff' },
                        ],
                      },
                      {
                        category: '📊 Utilidades',
                        commands: [
                          { cmd: '/help', desc: 'Lista de comandos', perms: 'Everyone' },
                          { cmd: '/userinfo @usuario', desc: 'Info de usuario', perms: 'Everyone' },
                          { cmd: '/serverinfo', desc: 'Info del servidor', perms: 'Everyone' },
                          { cmd: '/poll pregunta opciones', desc: 'Crear encuesta', perms: 'ManageChannels' },
                          { cmd: '/giveaway premio duración', desc: 'Crear sorteo', perms: 'ManageChannels' },
                          { cmd: '/embed', desc: 'Constructor de embed', perms: 'ManageChannels' },
                        ],
                      },
                    ].map((cat, i) => (
                      <div key={i}>
                        <h3 className="text-xs font-semibold mb-2">{cat.category}</h3>
                        <div className="space-y-1.5">
                          {cat.commands.map((cmd, j) => (
                            <div key={j} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                              <code className="text-[11px] font-mono text-violet-400 min-w-[200px]">{cmd.cmd}</code>
                              <span className="text-[11px] text-muted-foreground flex-1">{cmd.desc}</span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-blue-500/20 text-blue-400">
                                {cmd.perms}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {i < 2 && <Separator className="mt-3 opacity-30" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
