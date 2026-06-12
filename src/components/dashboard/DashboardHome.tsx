'use client'

import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import {
  Users, Ticket, Shield, BarChart3, Activity, Clock,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  XCircle, Eye
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

interface ServerStats {
  openTickets: number
  closedTickets: number
  totalMembers: number
  moderationCount: number
  activePolls: number
  activeGiveaways: number
  whitelistPending: number
  logsToday: number
  chartData: { date: string; joins: number; leaves: number; tickets: number }[]
  ticketsByCategory: { name: string; emoji: string; _count: { tickets: number } }[]
  recentLogs: { type: string; description: string; createdAt: string; user?: { username: string } }[]
  modActions: { type: string; reason: string | null; createdAt: string; moderator: { username: string }; target: { username: string } }[]
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#6366F1', '#14B8A6', '#F97316', '#6B7280']

const logTypeColors: Record<string, string> = {
  join: 'bg-emerald-500/20 text-emerald-400',
  leave: 'bg-red-500/20 text-red-400',
  ban: 'bg-red-500/20 text-red-400',
  unban: 'bg-emerald-500/20 text-emerald-400',
  role_add: 'bg-blue-500/20 text-blue-400',
  role_remove: 'bg-orange-500/20 text-orange-400',
  ticket_create: 'bg-violet-500/20 text-violet-400',
  ticket_close: 'bg-fuchsia-500/20 text-fuchsia-400',
  message_delete: 'bg-yellow-500/20 text-yellow-400',
  message_edit: 'bg-cyan-500/20 text-cyan-400',
  whitelist_apply: 'bg-teal-500/20 text-teal-400',
  reaction_add: 'bg-pink-500/20 text-pink-400',
}

const modTypeColors: Record<string, string> = {
  ban: 'bg-red-500/20 text-red-400 border-red-500/30',
  kick: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  timeout: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  warn: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  softban: 'bg-red-500/20 text-red-400 border-red-500/30',
  unban: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

export function DashboardHome() {
  const { currentServer } = useAppStore()
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentServer) return
    let cancelled = false
    fetch(`/api/stats?serverId=${currentServer.id}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setStats(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
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

  const statCards = [
    { label: 'Miembros', value: stats.totalMembers.toLocaleString(), icon: Users, color: 'from-violet-500 to-fuchsia-500', change: '+12%', up: true },
    { label: 'Tickets Abiertos', value: stats.openTickets.toString(), icon: Ticket, color: 'from-emerald-500 to-teal-500', change: `${stats.closedTickets} cerrados`, up: true },
    { label: 'Moderaciones', value: stats.moderationCount.toString(), icon: Shield, color: 'from-orange-500 to-red-500', change: 'Hoy', up: false },
    { label: 'Whitelist Pendiente', value: stats.whitelistPending.toString(), icon: AlertCircle, color: 'from-blue-500 to-cyan-500', change: `${stats.activePolls} encuestas`, up: true },
  ]

  const pieData = stats.ticketsByCategory.map(cat => ({ name: cat.name, value: cat._count.tickets }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6">
      {/* Welcome banner */}
      <motion.div variants={item}>
        <Card className="border-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
          <CardHeader className="relative">
            <CardTitle className="text-xl">
              ¡Bienvenido a <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{currentServer.name}</span>!
            </CardTitle>
            <CardDescription>Resumen de la actividad del servidor</CardDescription>
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
            <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.up ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-[11px] text-muted-foreground">{stat.change}</span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
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
                <Activity className="w-4 h-4 text-violet-400" />
                Actividad del Servidor
              </CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorJoins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="joins" stroke="#8B5CF6" fill="url(#colorJoins)" strokeWidth={2} name="Entradas" />
                  <Area type="monotone" dataKey="leaves" stroke="#EF4444" fill="url(#colorLeaves)" strokeWidth={2} name="Salidas" />
                </AreaChart>
              </ResponsiveContainer>
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
                {stats.ticketsByCategory.slice(0, 6).map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-muted-foreground truncate">{cat.emoji} {cat.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent logs */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {stats.recentLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/30 transition-colors"
                    >
                      <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${logTypeColors[log.type] || 'bg-muted text-muted-foreground'}`}>
                        {log.type}
                      </Badge>
                      <p className="text-xs flex-1 truncate">{log.description}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent moderation */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-400" />
                Acciones de Moderación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {stats.modActions.map((action, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
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
                      <p className="text-xs">{action.moderator.username} → {action.target.username}</p>
                      {action.reason && <p className="text-[11px] text-muted-foreground mt-0.5">Razón: {action.reason}</p>}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Server health */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Salud del Servidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Auto-Mod', value: 85, color: 'bg-violet-500' },
                { label: 'Actividad', value: 72, color: 'bg-emerald-500' },
                { label: 'Seguridad', value: 94, color: 'bg-cyan-500' },
                { label: 'Engagement', value: 68, color: 'bg-fuchsia-500' },
              ].map(metric => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                    <span className="text-xs font-semibold">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
