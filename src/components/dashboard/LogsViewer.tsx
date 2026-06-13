'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  ScrollText, Search, Filter, Download, ChevronDown, ChevronUp,
  Activity, UserPlus, UserMinus, Ban, Shield, Ticket, FileCheck,
  MessageSquare, ThumbsUp, CircleDot, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface LogData {
  id: string
  userId: string | null
  type: string
  description: string
  metadata: string
  createdAt: string
  user: { username: string; avatar: string | null; discordId: string } | null
}

interface LogStats {
  totalLogs: number
  logsToday: number
  mostActiveType: string
  typeCounts: { type: string; _count: { type: number } }[]
}

const logTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  join: { label: 'Join', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: UserPlus },
  leave: { label: 'Leave', color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: UserMinus },
  ban: { label: 'Ban', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: Ban },
  unban: { label: 'Unban', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: Shield },
  role_add: { label: 'Roles', color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: Shield },
  role_remove: { label: 'Roles', color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: Shield },
  ticket_create: { label: 'Tickets', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: Ticket },
  ticket_close: { label: 'Tickets', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: Ticket },
  whitelist_apply: { label: 'Whitelist', color: 'text-[#FF3A2F]', bgColor: 'bg-[#FF3A2F]/20', icon: FileCheck },
  message_delete: { label: 'Messages', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: MessageSquare },
  message_edit: { label: 'Messages', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: MessageSquare },
  reaction_add: { label: 'Reactions', color: 'text-pink-400', bgColor: 'bg-pink-500/20', icon: ThumbsUp },
}

const quickFilterTypes = [
  { type: 'join', label: 'Join' },
  { type: 'leave', label: 'Leave' },
  { type: 'ban', label: 'Ban' },
  { type: 'role_add', label: 'Roles' },
  { type: 'ticket_create', label: 'Tickets' },
  { type: 'whitelist_apply', label: 'Whitelist' },
  { type: 'message_delete', label: 'Messages' },
  { type: 'reaction_add', label: 'Reactions' },
]

export function LogsViewer() {
  const { currentServer } = useAppStore()
  const [logs, setLogs] = useState<LogData[]>([])
  const [stats, setStats] = useState<LogStats>({ totalLogs: 0, logsToday: 0, mostActiveType: '—', typeCounts: [] })
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [rangeFilter, setRangeFilter] = useState('7d')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState<string | null>(null)

  // Expanded
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        serverId: currentServer.id,
        type: quickFilter || typeFilter,
        range: rangeFilter,
        search: searchQuery,
        page: page.toString(),
        limit: '30',
      })
      const res = await fetch(`/api/logs?${params}`)
      const data = await res.json()
      if (data.logs) {
        setLogs(data.logs)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setStats(data.stats)
      }
    } catch {
      toast.error('Error al cargar logs')
    } finally {
      setLoading(false)
    }
  }, [currentServer, typeFilter, rangeFilter, searchQuery, page, quickFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleQuickFilter = (type: string) => {
    if (quickFilter === type) {
      setQuickFilter(null)
      setTypeFilter('all')
    } else {
      setQuickFilter(type)
      setTypeFilter(type)
    }
    setPage(1)
  }

  const handleExport = () => {
    const csv = [
      'Fecha,Tipo,Usuario,Descripción,Metadatos',
      ...logs.map(l =>
        `${new Date(l.createdAt).toLocaleString('es-ES')},${l.type},${l.user?.username || 'Sistema'},${l.description.replace(/,/g, ';')},${l.metadata.replace(/,/g, ';')}`
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs-${currentServer?.name || 'export'}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Exportación completada')
  }

  const getTypeConfig = (type: string) => {
    return logTypeConfig[type] || { label: type, color: 'text-gray-400', bgColor: 'bg-gray-500/20', icon: CircleDot }
  }

  const statCards = [
    { label: 'Total Logs', value: stats.totalLogs, icon: ScrollText, color: 'from-[#FF3A2F]/20 to-fuchsia-600/10', iconColor: 'text-[#FF3A2F]' },
    { label: 'Logs Hoy', value: stats.logsToday, icon: Activity, color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
    { label: 'Tipo Más Activo', value: stats.mostActiveType === '—' ? '—' : (logTypeConfig[stats.mostActiveType]?.label || stats.mostActiveType), icon: Zap, color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] bg-clip-text text-transparent">
              Logs del Servidor
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Registro completo de actividad
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-4">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
            <span className="text-xs text-green-400 font-medium">En vivo</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 border-[#FF3A2F]/30 hover:bg-[#FF3A2F]/10"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en logs..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                  className="pl-9 bg-background/50 h-9 text-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setQuickFilter(null); setPage(1) }}>
                <SelectTrigger className="bg-background/50 h-9 text-sm w-44">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Object.entries(logTypeConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label} ({key})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={rangeFilter} onValueChange={(v) => { setRangeFilter(v); setPage(1) }}>
                <SelectTrigger className="bg-background/50 h-9 text-sm w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="7d">7 días</SelectItem>
                  <SelectItem value="30d">30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {quickFilterTypes.map(qf => {
                const cfg = logTypeConfig[qf.type]
                const isActive = quickFilter === qf.type
                return (
                  <button
                    key={qf.type}
                    onClick={() => handleQuickFilter(qf.type)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? `${cfg.bgColor} ${cfg.color} ring-1 ring-current/30`
                        : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <cfg.icon className="w-3 h-3" />
                    {qf.label}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Logs List */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#FF3A2F]" />
            Registro de Actividad
            <span className="text-xs text-muted-foreground font-normal ml-2">
              {total} registros
            </span>
          </CardTitle>
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
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ScrollText className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No se encontraron logs</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="divide-y divide-border/30">
                <AnimatePresence>
                  {logs.map((log, i) => {
                    const cfg = getTypeConfig(log.type)
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="p-3 hover:bg-accent/20 transition-colors cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-md ${cfg.bgColor} ${cfg.color} mt-0.5`}>
                            <cfg.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString('es-ES', {
                                  day: '2-digit', month: 'short',
                                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                                })}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${cfg.bgColor} ${cfg.color} border-0`}
                              >
                                {cfg.label}
                              </Badge>
                              {log.user && (
                                <span className="text-xs font-medium">{log.user.username}</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {log.description}
                            </p>
                          </div>
                          <div className="text-muted-foreground shrink-0">
                            {expandedLog === log.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Metadata */}
                        <AnimatePresence>
                          {expandedLog === log.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 ml-9"
                            >
                              <div className="p-3 rounded-lg bg-background/50 border border-border/20 text-xs">
                                <p className="text-muted-foreground mb-1">Metadatos:</p>
                                <pre className="text-foreground whitespace-pre-wrap font-mono text-xs">
                                  {JSON.stringify(JSON.parse(log.metadata || '{}'), null, 2)}
                                </pre>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="h-8 text-xs"
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-8 text-xs"
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
