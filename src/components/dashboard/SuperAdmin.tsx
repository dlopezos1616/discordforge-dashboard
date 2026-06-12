'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Crown, Server as ServerIcon, Users, Ticket, ScrollText,
  Search, Database, Activity, Cpu, Zap, CreditCard, Lock,
  RotateCcw, Trash2, RefreshCw, Eye, Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface GlobalStats {
  totalServers: number
  totalUsers: number
  totalTickets: number
  totalLogs: number
}

interface ServerInfo {
  id: string
  discordId: string
  name: string
  icon: string | null
  memberCount: number
  isActive: boolean
  _count: { tickets: number }
}

interface UserInfo {
  id: string
  discordId: string
  username: string
  avatar: string | null
  isAdmin: boolean
  email: string | null
}

export function SuperAdmin() {
  const { user } = useAppStore()
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ totalServers: 0, totalUsers: 0, totalTickets: 0, totalLogs: 0 })
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [loading, setLoading] = useState(true)

  // User search
  const [userSearch, setUserSearch] = useState('')
  const [foundUsers, setFoundUsers] = useState<UserInfo[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, serversRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/servers'),
      ])
      const statsData = await statsRes.json()
      const serversData = await serversRes.json()

      if (statsData.totalServers !== undefined) {
        setGlobalStats({
          totalServers: statsData.totalServers,
          totalUsers: statsData.totalUsers,
          totalTickets: statsData.totalTickets,
          totalLogs: statsData.totalLogs,
        })
      }

      if (serversData.servers) {
        setServers(serversData.servers)
      }
    } catch {
      toast.error('Error al cargar datos globales')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearchUsers = async () => {
    if (!userSearch) return
    try {
      const res = await fetch(`/api/auth/login?search=${userSearch}`)
      const data = await res.json()
      if (data.users) {
        setFoundUsers(data.users)
      } else {
        setFoundUsers([])
        toast.info('No se encontraron usuarios')
      }
    } catch {
      toast.error('Error al buscar usuarios')
    }
  }

  const handleSeedDatabase = () => {
    toast.success('Base de datos seed ejecutado (simulado)')
  }

  const handleClearCache = () => {
    toast.success('Caché limpiado exitosamente (simulado)')
  }

  const handleRestartBot = () => {
    toast.success('Bot reiniciado exitosamente (simulado)')
  }

  // Only visible to super admin (bot owner)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const res = await fetch('/api/auth/superadmin')
        const data = await res.json()
        setIsSuperAdmin(data.isSuperAdmin)
      } catch {
        setIsSuperAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }
    checkSuperAdmin()
  }, [])

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Acceso restringido exclusivamente al propietario del bot</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Servidores', value: globalStats.totalServers, icon: ServerIcon, color: 'from-violet-500/20 to-fuchsia-600/10', iconColor: 'text-violet-400' },
    { label: 'Total Usuarios', value: globalStats.totalUsers, icon: Users, color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
    { label: 'Total Tickets', value: globalStats.totalTickets, icon: Ticket, color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
    { label: 'Total Logs', value: globalStats.totalLogs, icon: ScrollText, color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400' },
  ]

  // Mock system health values
  const dbSize = 42.3
  const apiUptime = 99.7
  const memoryUsage = 67

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Super Admin
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Panel de administración global
          </p>
        </div>
      </motion.div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`bg-gradient-to-br ${stat.color} border-0`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-black/20 ${stat.iconColor}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Server List Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ServerIcon className="w-5 h-5 text-violet-400" />
              Servidores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
                />
              </div>
            ) : servers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ServerIcon className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No hay servidores</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="text-xs font-semibold">Nombre</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Miembros</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Tickets</TableHead>
                      <TableHead className="text-xs font-semibold">Estado</TableHead>
                      <TableHead className="text-xs font-semibold w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.map((server, i) => (
                      <motion.tr
                        key={server.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center text-xs font-bold">
                              {server.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{server.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {server.memberCount}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {server._count?.tickets ?? 0}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={server.isActive
                              ? 'bg-green-500/15 text-green-400 border-green-500/30 text-xs'
                              : 'bg-red-500/15 text-red-400 border-red-500/30 text-xs'
                            }
                          >
                            {server.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-violet-400 hover:bg-violet-500/10">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* User Management & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                    className="pl-9 bg-background/50 h-9 text-sm"
                  />
                </div>
                <Button
                  onClick={handleSearchUsers}
                  variant="outline"
                  size="sm"
                  className="h-9 border-violet-500/30 hover:bg-violet-500/10"
                >
                  Buscar
                </Button>
              </div>

              {foundUsers.length > 0 ? (
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {foundUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/20">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center text-xs font-bold">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.username}</p>
                          <p className="text-xs text-muted-foreground">{u.email || 'Sin email'}</p>
                        </div>
                        {u.isAdmin && (
                          <Badge variant="outline" className="text-xs bg-amber-500/15 text-amber-400 border-amber-500/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Busca un usuario por nombre o ID
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                Salud del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Database className="w-4 h-4" />
                    Base de Datos
                  </span>
                  <span className="font-mono">{dbSize} MB</span>
                </div>
                <Progress value={dbSize} max={100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    API Uptime
                  </span>
                  <span className="font-mono text-green-400">{apiUptime}%</span>
                </div>
                <Progress value={apiUptime} max={100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Cpu className="w-4 h-4" />
                    Uso de Memoria
                  </span>
                  <span className={`font-mono ${memoryUsage > 80 ? 'text-red-400' : memoryUsage > 60 ? 'text-amber-400' : 'text-green-400'}`}>
                    {memoryUsage}%
                  </span>
                </div>
                <Progress value={memoryUsage} max={100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Billing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-400" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={handleSeedDatabase}
                  className="h-auto py-4 flex-col gap-2 border-violet-500/30 hover:bg-violet-500/10"
                >
                  <Database className="w-5 h-5 text-violet-400" />
                  <span className="text-xs">Seed Database</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearCache}
                  className="h-auto py-4 flex-col gap-2 border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  <Trash2 className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs">Clear Cache</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRestartBot}
                  className="h-auto py-4 flex-col gap-2 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <span className="text-xs">Restart Bot</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-fuchsia-400" />
                Facturación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-background/30 border border-violet-500/20">
                <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Próximamente</h3>
                  <p className="text-xs text-muted-foreground">Sistema de facturación en desarrollo</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Suscripciones mensuales</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pasarela de pagos integrada</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ServerIcon className="w-3.5 h-3.5" />
                  <span>Planes por número de servidores</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Facturas automáticas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
