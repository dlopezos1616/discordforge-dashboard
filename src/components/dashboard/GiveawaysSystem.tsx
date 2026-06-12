'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Gift, Plus, Users, Clock, Trophy, RefreshCw,
  Calendar, Star, PartyPopper
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface GiveawayData {
  id: string
  prize: string
  description: string | null
  winnerCount: number
  requiredRoleIds: string
  isActive: boolean
  endsAt: string | null
  createdAt: string
  channelId: string | null
  entries: { id: string; userId: string; user: { username: string; avatar: string | null; discordId: string } }[]
}

interface GiveawayStats {
  activeGiveaways: number
  totalParticipants: number
  totalPrizesGiven: number
}

function CountdownTimer({ endsAt }: { endsAt: string | null }) {
  const computeTimeLeft = useCallback(() => {
    if (!endsAt) return 'Sin límite'
    const now = new Date().getTime()
    const end = new Date(endsAt).getTime()
    const diff = end - now
    if (diff <= 0) return 'Finalizado'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    return `${minutes}m ${seconds}s`
  }, [endsAt])

  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft())

  useEffect(() => {
    if (!endsAt) return
    const update = () => {
      setTimeLeft(computeTimeLeft())
    }
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [endsAt, computeTimeLeft])

  return <span>{timeLeft}</span>
}

export function GiveawaysSystem() {
  const { currentServer } = useAppStore()
  const [giveaways, setGiveaways] = useState<GiveawayData[]>([])
  const [stats, setStats] = useState<GiveawayStats>({ activeGiveaways: 0, totalParticipants: 0, totalPrizesGiven: 0 })
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [showCreate, setShowCreate] = useState(false)
  const [prize, setPrize] = useState('')
  const [description, setDescription] = useState('')
  const [winnerCount, setWinnerCount] = useState('1')
  const [requiredRoles, setRequiredRoles] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchData = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/giveaways?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.giveaways) {
        setGiveaways(data.giveaways)
        setStats(data.stats)
      }
    } catch {
      toast.error('Error al cargar sorteos')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!currentServer || !prize) {
      toast.error('El premio es obligatorio')
      return
    }
    try {
      const res = await fetch('/api/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          serverId: currentServer.id,
          prize,
          description,
          winnerCount: parseInt(winnerCount) || 1,
          requiredRoleIds: requiredRoles ? requiredRoles.split(',').map(r => r.trim()) : [],
          endsAt: endDate || null,
        }),
      })
      const data = await res.json()
      if (data.giveaway) {
        toast.success('Sorteo creado exitosamente')
        setShowCreate(false)
        setPrize('')
        setDescription('')
        setWinnerCount('1')
        setRequiredRoles('')
        setEndDate('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al crear sorteo')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleEnd = async (giveawayId: string) => {
    try {
      const res = await fetch('/api/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', giveawayId }),
      })
      const data = await res.json()
      if (data.giveaway) {
        toast.success('Sorteo finalizado')
        fetchData()
      }
    } catch {
      toast.error('Error al finalizar sorteo')
    }
  }

  const handleReroll = async (giveawayId: string) => {
    try {
      const res = await fetch('/api/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reroll', giveawayId }),
      })
      const data = await res.json()
      if (data.winner) {
        toast.success(`Nuevo ganador: ${data.winner.username}`)
        fetchData()
      } else {
        toast.error(data.error || 'No hay participantes para reroll')
      }
    } catch {
      toast.error('Error al rerollear')
    }
  }

  const activeGiveaways = giveaways.filter(g => g.isActive)
  const completedGiveaways = giveaways.filter(g => !g.isActive)

  const statCards = [
    { label: 'Sorteos Activos', value: stats.activeGiveaways, icon: Gift, color: 'from-violet-500/20 to-fuchsia-600/10', iconColor: 'text-violet-400' },
    { label: 'Participantes', value: stats.totalParticipants, icon: Users, color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
    { label: 'Premios Entregados', value: stats.totalPrizesGiven, icon: Trophy, color: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400' },
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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Sorteos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona sorteos y regalos del servidor
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white">
              <Plus className="w-4 h-4" />
              Crear Sorteo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-violet-400" />
                Crear Sorteo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Premio</Label>
                <Input
                  placeholder="Ej: Nitro, juego Steam..."
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Descripción</Label>
                <Textarea
                  placeholder="Describe el sorteo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background/50 resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Ganadores</Label>
                  <Input
                    type="number"
                    min="1"
                    value={winnerCount}
                    onChange={(e) => setWinnerCount(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Fecha de fin</Label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Roles requeridos (separados por coma)</Label>
                <Input
                  placeholder="role_id_1, role_id_2"
                  value={requiredRoles}
                  onChange={(e) => setRequiredRoles(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!prize}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                >
                  Crear Sorteo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* Active Giveaways */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-violet-400" />
          Sorteos Activos
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
            />
          </div>
        ) : activeGiveaways.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Gift className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No hay sorteos activos</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeGiveaways.map((giveaway, i) => (
              <motion.div
                key={giveaway.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-violet-500/30 transition-colors overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Gift className="w-4 h-4 text-fuchsia-400" />
                          {giveaway.prize}
                        </h4>
                        {giveaway.description && (
                          <p className="text-xs text-muted-foreground mt-1">{giveaway.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs bg-green-500/15 text-green-400 border-green-500/30 shrink-0">
                        Activo
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {giveaway.winnerCount} ganador{giveaway.winnerCount > 1 ? 'es' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {giveaway.entries.length} participantes
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <CountdownTimer endsAt={giveaway.endsAt} />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-7"
                        onClick={() => handleEnd(giveaway.id)}
                      >
                        Finalizar Sorteo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Giveaways */}
      {completedGiveaways.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-amber-400" />
            Sorteos Finalizados
          </h3>
          <div className="space-y-3">
            {completedGiveaways.map((giveaway, i) => (
              <motion.div
                key={giveaway.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Gift className="w-4 h-4 text-muted-foreground" />
                          {giveaway.prize}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{giveaway.entries.length} participantes</span>
                          <span>{giveaway.winnerCount} ganador{giveaway.winnerCount > 1 ? 'es' : ''}</span>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(giveaway.createdAt).toLocaleDateString('es-ES')}</span>
                        </div>
                        {giveaway.entries.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs">
                              Ganadores:{' '}
                              {giveaway.entries.slice(0, giveaway.winnerCount).map(e => e.user.username).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1 text-violet-400 hover:bg-violet-500/10"
                          onClick={() => handleReroll(giveaway.id)}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reroll
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
