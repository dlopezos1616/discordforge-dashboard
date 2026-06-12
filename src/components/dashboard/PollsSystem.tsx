'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  BarChart3, Plus, Vote, CheckCircle2, X, Calendar,
  ToggleLeft, BarChartHorizontal, PieChart as PieChartIcon, TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PollData {
  id: string
  question: string
  options: string
  type: string
  allowMultiple: boolean
  isActive: boolean
  endsAt: string | null
  createdAt: string
  channelId: string | null
  votes: { id: string; userId: string; option: string; user: { username: string } }[]
}

interface PollStats {
  totalPolls: number
  activePolls: number
  totalVotes: number
}

const typeLabels: Record<string, string> = {
  yesno: 'Sí/No',
  multiple: 'Múltiples opciones',
  anonymous: 'Anónima',
  public: 'Pública',
}

const typeColors: Record<string, string> = {
  yesno: 'bg-green-500/20 text-green-400 border-green-500/30',
  multiple: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  anonymous: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  public: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const chartColors = ['#8b5cf6', '#d946ef', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1']

export function PollsSystem() {
  const { currentServer } = useAppStore()
  const [polls, setPolls] = useState<PollData[]>([])
  const [stats, setStats] = useState<PollStats>({ totalPolls: 0, activePolls: 0, totalVotes: 0 })
  const [loading, setLoading] = useState(true)

  // Create poll dialog
  const [showCreate, setShowCreate] = useState(false)
  const [question, setQuestion] = useState('')
  const [pollType, setPollType] = useState('yesno')
  const [options, setOptions] = useState<string[]>(['Sí', 'No'])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [endDate, setEndDate] = useState('')

  // Results dialog
  const [showResults, setShowResults] = useState(false)
  const [resultsPoll, setResultsPoll] = useState<PollData | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/polls?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.polls) {
        setPolls(data.polls)
        setStats(data.stats)
      }
    } catch {
      toast.error('Error al cargar encuestas')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!currentServer || !question) {
      toast.error('La pregunta es obligatoria')
      return
    }
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          serverId: currentServer.id,
          question,
          options: pollType === 'yesno' ? ['Sí', 'No'] : options,
          type: pollType,
          allowMultiple,
          endsAt: endDate || null,
        }),
      })
      const data = await res.json()
      if (data.poll) {
        toast.success('Encuesta creada exitosamente')
        setShowCreate(false)
        setQuestion('')
        setPollType('yesno')
        setOptions(['Sí', 'No'])
        setAllowMultiple(false)
        setEndDate('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al crear encuesta')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleClose = async (pollId: string) => {
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', pollId }),
      })
      const data = await res.json()
      if (data.poll) {
        toast.success('Encuesta cerrada')
        fetchData()
      }
    } catch {
      toast.error('Error al cerrar encuesta')
    }
  }

  const addOption = () => {
    setOptions([...options, `Opción ${options.length + 1}`])
  }

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      toast.error('Mínimo 2 opciones')
      return
    }
    setOptions(options.filter((_, i) => i !== idx))
  }

  const updateOption = (idx: number, value: string) => {
    setOptions(options.map((o, i) => i === idx ? value : o))
  }

  const getVoteDistribution = (poll: PollData) => {
    const parsedOptions: string[] = JSON.parse(poll.options || '[]')
    const voteCounts: Record<string, number> = {}
    parsedOptions.forEach(opt => { voteCounts[opt] = 0 })
    poll.votes.forEach(v => {
      if (voteCounts[v.option] !== undefined) {
        voteCounts[v.option]++
      } else {
        voteCounts[v.option] = 1
      }
    })
    const total = poll.votes.length || 1
    return parsedOptions.map((opt, i) => ({
      name: opt,
      votes: voteCounts[opt] || 0,
      percentage: Math.round(((voteCounts[opt] || 0) / total) * 100),
      color: chartColors[i % chartColors.length],
    }))
  }

  const getPieData = (poll: PollData) => {
    const parsedOptions: string[] = JSON.parse(poll.options || '[]')
    const voteCounts: Record<string, number> = {}
    parsedOptions.forEach(opt => { voteCounts[opt] = 0 })
    poll.votes.forEach(v => {
      if (voteCounts[v.option] !== undefined) {
        voteCounts[v.option]++
      } else {
        voteCounts[v.option] = 1
      }
    })
    return parsedOptions.map((opt, i) => ({
      name: opt,
      value: voteCounts[opt] || 0,
      color: chartColors[i % chartColors.length],
    }))
  }

  const statCards = [
    { label: 'Total Encuestas', value: stats.totalPolls, icon: BarChart3, color: 'from-violet-500/20 to-fuchsia-600/10', iconColor: 'text-violet-400' },
    { label: 'Activas', value: stats.activePolls, icon: Vote, color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
    { label: 'Total Votos', value: stats.totalVotes, icon: TrendingUp, color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
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
            Encuestas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona encuestas y votaciones del servidor
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white">
              <Plus className="w-4 h-4" />
              Crear Encuesta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-violet-400" />
                Crear Encuesta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Pregunta</Label>
                <Input
                  placeholder="¿Cuál es tu pregunta?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
                <Select value={pollType} onValueChange={setPollType}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yesno">Sí/No</SelectItem>
                    <SelectItem value="multiple">Múltiples opciones</SelectItem>
                    <SelectItem value="anonymous">Anónima</SelectItem>
                    <SelectItem value="public">Pública</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pollType !== 'yesno' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">Opciones</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addOption}
                      className="h-7 text-xs gap-1 text-violet-400 hover:text-violet-300"
                    >
                      <Plus className="w-3 h-3" />
                      Añadir
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          className="bg-background/50 h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => removeOption(idx)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Switch
                  checked={allowMultiple}
                  onCheckedChange={setAllowMultiple}
                />
                <Label className="text-sm">Permitir votos múltiples</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Fecha de fin (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!question}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                >
                  Crear Encuesta
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

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-violet-400" />
              Resultados de Encuesta
            </DialogTitle>
          </DialogHeader>
          {resultsPoll && (
            <div className="space-y-4 mt-4">
              <h3 className="font-semibold">{resultsPoll.question}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieData(resultsPoll)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {getPieData(resultsPoll).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {getPieData(resultsPoll).map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="flex-1">{entry.name}</span>
                    <span className="font-mono font-bold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Polls List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
            />
          </div>
        ) : polls.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Vote className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No hay encuestas</p>
              <p className="text-xs mt-1">Crea una con el botón de arriba</p>
            </CardContent>
          </Card>
        ) : (
          polls.map((poll, i) => {
            const distribution = getVoteDistribution(poll)
            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-violet-500/30 transition-colors">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{poll.question}</h3>
                          <Badge variant="outline" className={`text-xs ${typeColors[poll.type] || ''}`}>
                            {typeLabels[poll.type] || poll.type}
                          </Badge>
                          {poll.isActive ? (
                            <Badge variant="outline" className="text-xs bg-green-500/15 text-green-400 border-green-500/30">
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-gray-500/15 text-gray-400 border-gray-500/30">
                              Cerrada
                            </Badge>
                          )}
                          {poll.allowMultiple && (
                            <Badge variant="outline" className="text-xs bg-blue-500/15 text-blue-400 border-blue-500/30">
                              Multi-voto
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Vote className="w-3 h-3" />
                            {poll.votes.length} votos
                          </span>
                          {poll.endsAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(poll.endsAt).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-violet-400 hover:bg-violet-500/10"
                          onClick={() => {
                            setResultsPoll(poll)
                            setShowResults(true)
                          }}
                        >
                          <PieChartIcon className="w-4 h-4" />
                        </Button>
                        {poll.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleClose(poll.id)}
                          >
                            Cerrar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Vote Distribution Bars */}
                    <div className="space-y-2">
                      {distribution.map((d, j) => (
                        <div key={j} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              {d.name}
                            </span>
                            <span className="font-mono">{d.votes} ({d.percentage}%)</span>
                          </div>
                          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${d.percentage}%` }}
                              transition={{ duration: 0.8, delay: j * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: d.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
