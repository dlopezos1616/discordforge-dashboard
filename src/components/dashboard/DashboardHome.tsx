'use client'

import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import {
  Users, Ticket, Shield, BarChart3, Activity, Clock,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  XCircle, Eye, RefreshCw, Zap, Crown, MessageSquare,
  ShieldCheck, ShieldAlert, Hash, UserPlus, UserMinus, Ban,
  Trash2, Pin, Bot, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

interface ServerStats {
  openTickets: number
  closedTickets: number
  totalMembers: number
  onlineMembers?: number
  moderationCount: number
  activePolls: number
  activeGiveaways: number
  whitelistPending: number
  logsToday: number
  totalLogs?: number
  chartData: { date: string; joins: number; leaves: number; tickets: number }[]
  ticketsByCategory: { name: string; emoji: string; _count: { tickets: number } }[]
  recentLogs: { type: string; description: string; createdAt: string; user?: { username: string } }[]
  modActions: { type: string; reason: string | null; createdAt: string; moderator: { username: string }; target: { username: string } }[]
  healthMetrics?: {
    automod: number
    activity: number
    security: number
    engagement: number
  }
  discordData?: {
    approximate_member_count: number
    approximate_presence_count: number
    boost_count: number
    boost_tier: number
    emoji_count: number
    role_count: number
    description: string | null
    banner: string | null
  } | null
  serverInfo?: {
    name: string
    icon: string | null
    boostCount: number
    boostTier: number
    emojiCount: number
    roleCount: number
    automodRules: number
    totalAutomodRules: number
    hasVerification: boolean
    raidProtectionEnabled: boolean
  }
}

interface DiscordActivity {
  activity: {
    id: string
    type: string
    description: string
    timestamp: string
    channelName?: string
    author?: string
    authorAvatar?: string | null
    reason?: string | null
  }[]
  chartData: {
    date: string
    joins: number
    leaves: number
    messages: number
    modActions: number
  }[]
  summary: {
    totalAuditEntries: number
    memberJoins: number
    memberLeaves: number
    modEvents: number
    messageCount: number
    hasAuditAccess: boolean
    hasChannelAccess: boolean
  }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const COLORS = ['#FF6600', '#FFD700', '#DC2626', '#FF8C00', '#00B4D8', '#EC4899', '#10B981', '#F97316', '#6366F1', '#14B8A6']

const activityTypeColors: Record<string, string> = {
  message: 'bg-blue-500/20 text-blue-400',
  join: 'bg-emerald-500/20 text-emerald-400',
  leave: 'bg-red-500/20 text-red-400',
  ban: 'bg-red-500/20 text-red-400',
  unban: 'bg-emerald-500/20 text-emerald-400',
  kick: 'bg-orange-500/20 text-orange-400',
  role_update: 'bg-blue-500/20 text-blue-400',
  channel_create: 'bg-cyan-500/20 text-cyan-400',
  channel_update: 'bg-cyan-500/20 text-cyan-400',
  channel_delete: 'bg-red-500/20 text-red-400',
  message_delete: 'bg-yellow-500/20 text-yellow-400',
  message_pin: 'bg-purple-500/20 text-purple-400',
  message_unpin: 'bg-purple-500/20 text-purple-400',
  invite_create: 'bg-teal-500/20 text-teal-400',
  role_create: 'bg-green-500/20 text-green-400',
  role_delete: 'bg-red-500/20 text-red-400',
  bot_add: 'bg-indigo-500/20 text-indigo-400',
  emoji_create: 'bg-pink-500/20 text-pink-400',
  automod_block: 'bg-amber-500/20 text-amber-400',
  automod_timeout: 'bg-amber-500/20 text-amber-400',
  server_update: 'bg-slate-500/20 text-slate-400',
  member_update: 'bg-blue-500/20 text-blue-400',
}

const activityTypeIcons: Record<string, any> = {
  message: MessageSquare,
  join: UserPlus,
  leave: UserMinus,
  ban: Ban,
  unban: CheckCircle2,
  kick: Shield,
  role_update: Shield,
  channel_create: Hash,
  channel_update: Hash,
  channel_delete: Hash,
  message_delete: Trash2,
  message_pin: Pin,
  message_unpin: Pin,
  invite_create: ChevronRight,
  bot_add: Bot,
  automod_block: ShieldAlert,
  automod_timeout: ShieldAlert,
}

const modTypeColors: Record<string, string> = {
  ban: 'bg-red-500/20 text-red-400 border-red-500/30',
  kick: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  timeout: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  warn: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  softban: 'bg-red-500/20 text-red-400 border-red-500/30',
  unban: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

function formatTimeAgo(dateStr: string): string {
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

function getActivityLabel(type: string): string {
  const labels: Record<string, string> = {
    message: 'Mensaje',
    join: 'Nuevo miembro',
    leave: 'Miembro salió',
    ban: 'Ban',
    unban: 'Unban',
    kick: 'Kick',
    role_update: 'Rol actualizado',
    channel_create: 'Canal creado',
    channel_update: 'Canal editado',
    channel_delete: 'Canal eliminado',
    message_delete: 'Mensaje eliminado',
    message_pin: 'Mensaje fijado',
    message_unpin: 'Mensaje desfijado',
    invite_create: 'Invitación creada',
    invite_delete: 'Invitación eliminada',
    role_create: 'Rol creado',
    role_delete: 'Rol eliminado',
    bot_add: 'Bot añadido',
    emoji_create: 'Emoji creado',
    automod_block: 'AutoMod bloqueó',
    automod_timeout: 'AutoMod timeout',
    server_update: 'Servidor actualizado',
    member_update: 'Miembro actualizado',
    webhook_create: 'Webhook creado',
    webhook_delete: 'Webhook eliminado',
  }
  return labels[type] || type
}

export function DashboardHome() {
  const { currentServer, setCurrentServer } = useAppStore()
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [discordActivity, setDiscordActivity] = useState<DiscordActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    if (!currentServer) return
    try {
      const res = await fetch(`/api/stats?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data && !data.error) {
        setStats(data)
        if (data.totalMembers && data.totalMembers !== currentServer.memberCount) {
          setCurrentServer({ ...currentServer, memberCount: data.totalMembers })
        }
      } else if (!stats) {
        let liveMemberCount = currentServer?.memberCount || 0
        try {
          const guildsRes = await fetch('/api/discord/guilds')
          const guildsData = await guildsRes.json()
          if (guildsData.guilds) {
            const matchingGuild = guildsData.guilds.find((g: any) => g.id === currentServer?.discordId)
            if (matchingGuild?.approximate_member_count) {
              liveMemberCount = matchingGuild.approximate_member_count
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  discordId: currentServer?.discordId,
                  name: currentServer?.name,
                  icon: currentServer?.icon,
                  memberCount: liveMemberCount,
                  ownerId: 'unknown',
                }),
              })
              setCurrentServer({ ...currentServer, memberCount: liveMemberCount })
            }
          }
        } catch {
          // Ignore
        }
        setStats({
          openTickets: 0, closedTickets: 0, totalMembers: liveMemberCount,
          moderationCount: 0, activePolls: 0, activeGiveaways: 0,
          whitelistPending: 0, logsToday: 0, chartData: [],
          ticketsByCategory: [], recentLogs: [], modActions: [],
          healthMetrics: { automod: 0, activity: 0, security: 0, engagement: 0 },
          discordData: null,
          serverInfo: {
            name: currentServer?.name || '', icon: currentServer?.icon || null,
            boostCount: 0, boostTier: 0, emojiCount: 0, roleCount: 0,
            automodRules: 0, totalAutomodRules: 0,
            hasVerification: false, raidProtectionEnabled: false,
          },
        })
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      if (!stats) {
        setStats({
          openTickets: 0, closedTickets: 0, totalMembers: currentServer?.memberCount || 0,
          moderationCount: 0, activePolls: 0, activeGiveaways: 0,
          whitelistPending: 0, logsToday: 0, chartData: [],
          ticketsByCategory: [], recentLogs: [], modActions: [],
          healthMetrics: { automod: 0, activity: 0, security: 0, engagement: 0 },
          discordData: null,
          serverInfo: {
            name: currentServer?.name || '', icon: currentServer?.icon || null,
            boostCount: 0, boostTier: 0, emojiCount: 0, roleCount: 0,
            automodRules: 0, totalAutomodRules: 0,
            hasVerification: false, raidProtectionEnabled: false,
          },
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentServer, stats, setCurrentServer])

  const fetchDiscordActivity = useCallback(async () => {
    if (!currentServer?.discordId) return
    try {
      const res = await fetch(`/api/discord/activity?guildId=${currentServer.discordId}`)
      const data = await res.json()
      if (data && !data.error) {
        setDiscordActivity(data)
      }
    } catch (err) {
      console.error('Failed to fetch Discord activity:', err)
    }
  }, [currentServer?.discordId])

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await fetch('/api/servers/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: currentServer?.id }),
      })
    } catch {
      // ignore
    }
    await Promise.all([fetchStats(), fetchDiscordActivity()])
  }

  useEffect(() => {
    if (!currentServer) return
    setLoading(true)
    Promise.all([fetchStats(), fetchDiscordActivity()])
  }, [currentServer])

  if (!currentServer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona un servidor para ver estadísticas</p>
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-card/50 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 rounded-xl bg-card/50 animate-pulse" />
          <div className="h-64 rounded-xl bg-card/50 animate-pulse" />
        </div>
      </div>
    )
  }

  const healthMetrics = stats.healthMetrics || { automod: 0, activity: 0, security: 0, engagement: 0 }
  const serverInfo = stats.serverInfo
  const discordData = stats.discordData
  const onlineMembers = stats.onlineMembers || discordData?.approximate_presence_count || 0

  // Use Discord activity data for chart if available, otherwise fall back to DB data
  const activityChartData = discordActivity?.chartData?.length
    ? discordActivity.chartData.map(d => ({
        date: d.date,
        joins: d.joins,
        leaves: d.leaves,
        tickets: d.modActions || 0,
      }))
    : stats.chartData

  const hasDiscordChartData = activityChartData.some(d => d.joins > 0 || d.leaves > 0 || d.tickets > 0)

  const statCards = [
    {
      label: 'Miembros',
      value: stats.totalMembers.toLocaleString(),
      subValue: onlineMembers > 0 ? `${onlineMembers.toLocaleString()} en línea` : undefined,
      icon: Users,
      color: 'from-[#FF6600] to-[#DC2626]',
      change: stats.totalMembers > 0 ? 'Activos' : 'Sin datos',
      up: stats.totalMembers > 0,
    },
    {
      label: 'Tickets Abiertos',
      value: stats.openTickets.toString(),
      subValue: stats.closedTickets > 0 ? `${stats.closedTickets} cerrados` : undefined,
      icon: Ticket,
      color: 'from-[#FFD700] to-[#FF6600]',
      change: `${stats.closedTickets} cerrados`,
      up: true,
    },
    {
      label: 'Moderaciones',
      value: stats.moderationCount.toString(),
      icon: Shield,
      color: 'from-[#DC2626] to-[#FF8C00]',
      change: `${stats.logsToday} logs hoy`,
      up: false,
    },
    {
      label: 'Whitelist Pendiente',
      value: stats.whitelistPending.toString(),
      icon: AlertCircle,
      color: 'from-[#00B4D8] to-[#FF6600]',
      change: `${stats.activePolls} encuestas`,
      up: true,
    },
  ]

  const pieData = (stats.ticketsByCategory || []).map(cat => ({ name: cat.name, value: cat._count?.tickets || 0 }))

  const boostTierLabels = ['Sin Boost', 'Nivel 1', 'Nivel 2', 'Nivel 3']

  // Combine activity: Discord activity + DB logs
  const discordActivityItems = discordActivity?.activity || []
  const dbLogs = stats.recentLogs || []
  const hasActivity = discordActivityItems.length > 0 || dbLogs.length > 0

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6">
      {/* Welcome banner with server info */}
      <motion.div variants={item}>
        <Card className="border-0 overflow-hidden relative forge-card-premium" style={{ background: 'linear-gradient(135deg, rgba(255,102,0,0.08) 0%, rgba(255,58,47,0.04) 50%, transparent 100%)' }}>
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="absolute -right-10 -top-10 w-40 h-40 opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 70% at 50% 60%, #FF6600 0%, #DC2626 30%, #FF8C00 60%, transparent 100%)', clipPath: 'polygon(50% 0%, 75% 25%, 90% 50%, 85% 75%, 70% 90%, 50% 100%, 30% 90%, 15% 75%, 10% 50%, 25% 25%)' }} />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  ¡Bienvenido a <span className="animate-gradient-text">{currentServer.name}</span>!
                </CardTitle>
                <CardDescription>Resumen de la actividad del servidor</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-[#888] hover:text-[#FF6600] hover:bg-[#FF6600]/10 gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
            {/* Server quick info bar */}
            {serverInfo && (
              <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/5">
                {discordData && discordData.boost_count > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-[#FF6600]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{discordData.boost_count} boosts</span>
                    <span className="text-[#888]">({boostTierLabels[discordData.boost_tier] || 'Nivel 0'})</span>
                  </div>
                )}
                {serverInfo.emojiCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-[#888]">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{serverInfo.emojiCount} emojis</span>
                  </div>
                )}
                {serverInfo.roleCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-[#888]">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{serverInfo.roleCount} roles</span>
                  </div>
                )}
                {serverInfo.automodRules > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{serverInfo.automodRules} reglas AutoMod</span>
                  </div>
                )}
                {serverInfo.raidProtectionEnabled && (
                  <div className="flex items-center gap-1.5 text-xs text-[#00B4D8]">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>AntiRaid activo</span>
                  </div>
                )}
                {serverInfo.hasVerification && (
                  <div className="flex items-center gap-1.5 text-xs text-[#FFD700]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verificación activa</span>
                  </div>
                )}
                {discordActivity?.summary && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Activity className="w-3.5 h-3.5" />
                    <span>{discordActivity.summary.messageCount} mensajes recientes</span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
        </Card>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden forge-card-premium">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    {stat.subValue && (
                      <p className="text-[11px] text-[#00B4D8] mt-0.5">{stat.subValue}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {stat.up ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-[#FF6600]" />
                      )}
                      <span className="text-[11px] text-muted-foreground">{stat.change}</span>
                    </div>
                  </div>
                  <motion.div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all shadow-[0_0_12px_rgba(255,102,0,0.15)] group-hover:shadow-[0_0_16px_rgba(255,102,0,0.25)]`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF6600]" />
                Actividad del Servidor
                {discordActivity?.summary?.hasAuditAccess && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400">En vivo</Badge>
                )}
              </CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              {hasDiscordChartData ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={activityChartData}>
                    <defs>
                      <linearGradient id="colorJoins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6600" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00B4D8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="joins" stroke="#FF6600" fill="url(#colorJoins)" strokeWidth={2} name="Entradas" />
                    <Area type="monotone" dataKey="leaves" stroke="#EF4444" fill="url(#colorLeaves)" strokeWidth={2} name="Salidas" />
                    {discordActivity?.chartData?.length && (
                      <Area type="monotone" dataKey="tickets" stroke="#00B4D8" fill="url(#colorMessages)" strokeWidth={2} name="Acciones Mod" />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                  <Activity className="w-10 h-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Sin datos de actividad aún</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Los datos aparecerán conforme haya actividad en el servidor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tickets by category */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Ticket className="w-4 h-4 text-fuchsia-400" />
                Tickets por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 && pieData.some(d => d.value > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {(stats.ticketsByCategory || []).slice(0, 6).map((cat, i) => (
                      <div key={`cat-${i}-${cat.name}`} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground truncate">{cat.emoji} {cat.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <Ticket className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Sin categorías de tickets</p>
                  <p className="text-[10px] text-muted-foreground/60">Crea categorías desde la sección de Tickets</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent activity from Discord */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Actividad Reciente
                {discordActivity?.activity?.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400">
                    {discordActivity.activity.length} eventos
                  </Badge>
                )}
                {discordActivity?.summary?.hasAuditAccess && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-[#FF6600]/10 text-[#FF6600]">
                    Discord Live
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {hasActivity ? (
                  <div className="space-y-1.5">
                    {/* Discord activity items first */}
                    {discordActivityItems.slice(0, 15).map((act, i) => {
                      const IconComponent = activityTypeIcons[act.type] || Activity
                      const colorClass = activityTypeColors[act.type] || 'bg-muted text-muted-foreground'
                      const isMessage = act.type === 'message'

                      return (
                        <motion.div
                          key={act.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          {/* Avatar or icon */}
                          {isMessage && act.authorAvatar ? (
                            <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                              <AvatarImage src={act.authorAvatar} alt={act.author || ''} />
                              <AvatarFallback className="text-[8px]">{act.author?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                              <IconComponent className="w-3 h-3" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className={`text-[8px] px-1 py-0 ${colorClass}`}>
                                {getActivityLabel(act.type)}
                              </Badge>
                              {act.channelName && (
                                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                  <Hash className="w-2.5 h-2.5" />
                                  {act.channelName}
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5 truncate">
                              {isMessage && act.author && (
                                <span className="font-medium text-[#00B4D8]">{act.author}: </span>
                              )}
                              <span className="text-muted-foreground">{act.description}</span>
                            </p>
                            {act.reason && (
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Razón: {act.reason}</p>
                            )}
                          </div>

                          <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-1">
                            {formatTimeAgo(act.timestamp)}
                          </span>
                        </motion.div>
                      )
                    })}

                    {/* Then DB logs if any */}
                    {dbLogs.filter(log => !discordActivityItems.some(a => a.type === log.type)).slice(0, 5).map((log, i) => (
                      <motion.div
                        key={`db-log-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (discordActivityItems.length + i) * 0.03 }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors"
                      >
                        <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${activityTypeColors[log.type] || 'bg-muted text-muted-foreground'}`}>
                          {log.type}
                        </Badge>
                        <p className="text-xs flex-1 truncate">{log.description}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Sin actividad reciente</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      La actividad se obtiene directamente de Discord en tiempo real
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent moderation from Discord audit log + DB */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-400" />
                Acciones de Moderación
                {discordActivity?.summary?.modEvents > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-[#FF6600]/10 text-[#FF6600]">
                    {discordActivity.summary.modEvents} eventos
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {/* Discord audit log mod actions */}
                {(() => {
                  const discordModActions = discordActivityItems.filter(a =>
                    ['ban', 'kick', 'unban', 'automod_block', 'automod_timeout', 'timeout', 'message_delete', 'message_bulk_delete'].includes(a.type)
                  )
                  const dbModActions = stats.modActions || []

                  if (discordModActions.length > 0 || dbModActions.length > 0) {
                    return (
                      <div className="space-y-2">
                        {discordModActions.slice(0, 8).map((action, i) => {
                          const colorClass = modTypeColors[action.type] || activityTypeColors[action.type] || 'bg-muted text-muted-foreground'
                          return (
                            <motion.div
                              key={action.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 border ${colorClass}`}>
                                  {getActivityLabel(action.type).toUpperCase()}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatTimeAgo(action.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                              {action.reason && (
                                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Razón: {action.reason}</p>
                              )}
                            </motion.div>
                          )
                        })}
                        {dbModActions.slice(0, 5).map((action, i) => (
                          <motion.div
                            key={`db-mod-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (discordModActions.length + i) * 0.05 }}
                            className="p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 border ${modTypeColors[action.type] || 'bg-muted text-muted-foreground'}`}>
                                {action.type.toUpperCase()}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(action.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <p className="text-xs">{action.moderator?.username || 'Desconocido'} → {action.target?.username || 'Desconocido'}</p>
                            {action.reason && <p className="text-[11px] text-muted-foreground mt-0.5">Razón: {action.reason}</p>}
                          </motion.div>
                        ))}
                      </div>
                    )
                  }

                  return (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <Shield className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">Sin acciones de moderación</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Las acciones se obtienen del registro de auditoría de Discord</p>
                    </div>
                  )
                })()}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Server health - now with real computed metrics */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Salud del Servidor
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-[#FF6600]/10 text-[#FF6600]">En tiempo real</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Auto-Mod', value: healthMetrics.automod, color: 'bg-[#FF6600]', icon: ShieldCheck, desc: activeAutomodDesc(healthMetrics.automod) },
                { label: 'Actividad', value: healthMetrics.activity, color: 'bg-[#FFD700]', icon: Activity, desc: activityDesc(healthMetrics.activity) },
                { label: 'Seguridad', value: healthMetrics.security, color: 'bg-[#00B4D8]', icon: ShieldAlert, desc: securityDesc(healthMetrics.security) },
                { label: 'Engagement', value: healthMetrics.engagement, color: 'bg-[#DC2626]', icon: Zap, desc: engagementDesc(healthMetrics.engagement) },
              ].map(metric => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <metric.icon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{metric.label}</span>
                    </div>
                    <span className="text-xs font-semibold">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                  <p className="text-[9px] text-muted-foreground/60">{metric.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function activeAutomodDesc(value: number): string {
  if (value >= 80) return 'AutoMod y AntiRaid activos'
  if (value >= 50) return 'Protección parcial activa'
  if (value > 0) return 'Protección básica'
  return 'Sin protección AutoMod'
}

function activityDesc(value: number): string {
  if (value >= 70) return 'Servidor muy activo'
  if (value >= 40) return 'Actividad moderada'
  if (value > 0) return 'Baja actividad'
  return 'Sin actividad registrada'
}

function securityDesc(value: number): string {
  if (value >= 75) return 'Seguridad completa'
  if (value >= 50) return 'Buena seguridad'
  if (value > 0) return 'Seguridad parcial'
  return 'Sin medidas de seguridad'
}

function engagementDesc(value: number): string {
  if (value >= 70) return 'Alta participación'
  if (value >= 40) return 'Participación moderada'
  if (value > 0) return 'Baja participación'
  return 'Sin engagement registrado'
}
