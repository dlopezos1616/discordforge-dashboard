'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Shield, Gavel, Clock, AlertTriangle, Ban, UserX,
  Search, Download, Filter, ChevronDown, Play,
  CircleOff, ShieldAlert, ArrowUpDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChannelSelector } from '@/components/shared/ChannelSelector'
import { toast } from 'sonner'

interface ModAction {
  id: string
  userId: string
  moderatorId: string
  type: string
  reason: string | null
  duration: string | null
  isActive: boolean
  createdAt: string
  moderator: { id: string; username: string; discordId: string }
  target: { id: string; username: string; discordId: string }
}

interface ModStats {
  bans: number
  kicks: number
  timeouts: number
  warns: number
  softbans: number
  unbans: number
}

const typeColors: Record<string, string> = {
  ban: 'bg-red-500/20 text-red-400 border-red-500/30',
  kick: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  timeout: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  warn: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  softban: 'bg-red-500/20 text-red-400 border-red-500/30',
  unban: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const typeLabels: Record<string, string> = {
  ban: 'Ban',
  kick: 'Kick',
  timeout: 'Timeout',
  warn: 'Warn',
  softban: 'Softban',
  unban: 'Unban',
}

const actionTypes = ['ban', 'kick', 'timeout', 'warn', 'softban', 'unban']

export function ModerationPanel() {
  const { currentServer } = useAppStore()
  const [actions, setActions] = useState<ModAction[]>([])
  const [stats, setStats] = useState<ModStats>({ bans: 0, kicks: 0, timeouts: 0, warns: 0, softbans: 0, unbans: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Action form state
  const [formUser, setFormUser] = useState('')
  const [formType, setFormType] = useState('warn')
  const [formReason, setFormReason] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [logChannelId, setLogChannelId] = useState<string | null>(null)

  const fetchModeration = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/moderation?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.actions) {
        setActions(data.actions)
        setStats(data.stats)
      }
    } catch {
      toast.error('Error al cargar acciones de moderación')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchModeration()
  }, [fetchModeration])

  const handleExecute = async () => {
    if (!currentServer || !formUser) {
      toast.error('Ingresa un usuario')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          userId: formUser,
          moderatorId: 'system',
          type: formType,
          reason: formReason,
          duration: formType === 'timeout' ? formDuration : null,
          logChannelId,
        }),
      })
      const data = await res.json()
      if (data.action) {
        toast.success(`Acción ${typeLabels[formType]} ejecutada`)
        setFormUser('')
        setFormReason('')
        setFormDuration('')
        fetchModeration()
      } else {
        toast.error(data.error || 'Error al ejecutar acción')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = () => {
    const csv = [
      'Fecha,Usuario,Moderador,Tipo,Razón,Duración,Estado',
      ...filteredActions.map(a =>
        `${new Date(a.createdAt).toLocaleDateString()},${a.target?.username || 'Desconocido'},${a.moderator?.username || 'Desconocido'},${a.type},${a.reason || '-'},${a.duration || '-'},${a.isActive ? 'Activo' : 'Inactivo'}`
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `moderation-${currentServer?.name || 'export'}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Exportación completada')
  }

  const filteredActions = actions
    .filter(a => {
      if (filterType !== 'all' && a.type !== filterType) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          a.target?.username?.toLowerCase().includes(s) ||
          a.moderator?.username?.toLowerCase().includes(s) ||
          (a.reason && a.reason.toLowerCase().includes(s))
        )
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  const statCards = [
    { label: 'Total Bans', value: stats.bans, icon: Ban, color: 'from-red-500/20 to-red-600/10', iconColor: 'text-red-400' },
    { label: 'Kicks', value: stats.kicks, icon: UserX, color: 'from-orange-500/20 to-orange-600/10', iconColor: 'text-orange-400' },
    { label: 'Timeouts', value: stats.timeouts, icon: Clock, color: 'from-yellow-500/20 to-yellow-600/10', iconColor: 'text-yellow-400' },
    { label: 'Warns', value: stats.warns, icon: AlertTriangle, color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] bg-clip-text text-transparent">
            Moderación
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona acciones de moderación del servidor
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="gap-2 border-[#FF3A2F]/30 hover:bg-[#FF3A2F]/10"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </motion.div>

      {/* Stats Row */}
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
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gavel className="w-5 h-5 text-[#FF3A2F]" />
              Ejecutar Acción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Usuario</Label>
                <Input
                  placeholder="ID o nombre del usuario"
                  value={formUser}
                  onChange={(e) => setFormUser(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Tipo de Acción</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(t => (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            t === 'ban' || t === 'softban' ? 'bg-red-400' :
                            t === 'kick' ? 'bg-orange-400' :
                            t === 'timeout' ? 'bg-yellow-400' :
                            t === 'warn' ? 'bg-amber-400' :
                            'bg-green-400'
                          }`} />
                          {typeLabels[t]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formType === 'timeout' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Duración</Label>
                  <Input
                    placeholder="ej: 1h, 30m, 1d"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              )}
              <div className="flex items-end">
                <Button
                  onClick={handleExecute}
                  disabled={submitting || !formUser}
                  className="w-full bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white gap-2"
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Play className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Gavel className="w-4 h-4" />
                  )}
                  Ejecutar Acción
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Razón</Label>
              <Textarea
                placeholder="Razón de la acción de moderación..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="bg-background/50 resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Canal de logs de moderación</Label>
              <ChannelSelector
                value={logChannelId}
                onValueChange={setLogChannelId}
                placeholder="Canal donde enviar logs..."
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FF3A2F]" />
                Historial de Acciones
              </CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-background/50 h-9 text-sm w-full sm:w-48"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-background/50 h-9 text-sm w-32">
                    <Filter className="w-3.5 h-3.5 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {actionTypes.map(t => (
                      <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-[#FF3A2F] border-t-transparent rounded-full"
                />
              </div>
            ) : filteredActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CircleOff className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No se encontraron acciones</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="text-xs font-semibold">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold">Usuario</TableHead>
                      <TableHead className="text-xs font-semibold">Moderador</TableHead>
                      <TableHead className="text-xs font-semibold">Tipo</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Razón</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Duración</TableHead>
                      <TableHead className="text-xs font-semibold">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredActions.map((action, i) => (
                        <motion.tr
                          key={action.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                        >
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(action.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{action.target?.username || 'Desconocido'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{action.moderator?.username || 'Desconocido'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${typeColors[action.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                            >
                              {typeLabels[action.type] || action.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[200px] truncate text-xs text-muted-foreground">
                            {action.reason || '—'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {action.duration || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                action.isActive
                                  ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                  : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                              }`}
                            >
                              {action.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
