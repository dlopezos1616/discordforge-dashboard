'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Bot, MessageSquare, Zap, Link, Ban, AtSign, Shield,
  Plus, Trash2, Pencil, ChevronDown, ChevronUp, X,
  ToggleLeft, ToggleRight, AlertTriangle, Sparkles,
  ShieldAlert, Swords
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { ChannelSelector } from '@/components/shared/ChannelSelector'

interface AutoModRule {
  id: string
  name: string
  type: string
  enabled: boolean
  threshold: number
  action: string
  duration: string | null
  words: string
  exemptions: string
  createdAt: string
  updatedAt: string
}

const ruleTypes = [
  { type: 'spam', label: 'Anti-Spam', icon: MessageSquare, color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
  { type: 'flood', label: 'Anti-Flood', icon: Zap, color: 'from-yellow-500/20 to-yellow-600/10', iconColor: 'text-yellow-400' },
  { type: 'links', label: 'Anti-Links', icon: Link, color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
  { type: 'invites', label: 'Anti-Invitaciones', icon: Ban, color: 'from-red-500/20 to-red-600/10', iconColor: 'text-red-400' },
  { type: 'words', label: 'Anti-Palabras', icon: ShieldAlert, color: 'from-orange-500/20 to-orange-600/10', iconColor: 'text-orange-400' },
  { type: 'mentions', label: 'Anti-Menciones', icon: AtSign, color: 'from-purple-500/20 to-purple-600/10', iconColor: 'text-purple-400' },
  { type: 'raid', label: 'Anti-Raid', icon: Swords, color: 'from-rose-500/20 to-rose-600/10', iconColor: 'text-rose-400' },
]

const actionLabels: Record<string, string> = {
  warn: 'Advertencia',
  delete: 'Eliminar',
  mute: 'Silenciar',
  kick: 'Expulsar',
  ban: 'Banear',
}

export function AutoModConfig() {
  const { currentServer } = useAppStore()
  const [rules, setRules] = useState<AutoModRule[]>([])
  const [loading, setLoading] = useState(true)
  const [masterEnabled, setMasterEnabled] = useState(true)
  const [logChannelId, setLogChannelId] = useState<string | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [showNewRule, setShowNewRule] = useState(false)

  // New rule form
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('spam')
  const [newEnabled, setNewEnabled] = useState(true)
  const [newThreshold, setNewThreshold] = useState(3)
  const [newAction, setNewAction] = useState('warn')
  const [newDuration, setNewDuration] = useState('')
  const [newWords, setNewWords] = useState<string[]>([])
  const [newExemptions, setNewExemptions] = useState<string[]>([])
  const [wordInput, setWordInput] = useState('')
  const [exemptInput, setExemptInput] = useState('')

  // Edit state
  const [editingRule, setEditingRule] = useState<AutoModRule | null>(null)
  const [editWords, setEditWords] = useState<string[]>([])
  const [editExemptions, setEditExemptions] = useState<string[]>([])
  const [editWordInput, setEditWordInput] = useState('')
  const [editExemptInput, setEditExemptInput] = useState('')
  const [editThreshold, setEditThreshold] = useState(3)
  const [editAction, setEditAction] = useState('warn')
  const [editDuration, setEditDuration] = useState('')
  const [editEnabled, setEditEnabled] = useState(true)

  const fetchRules = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/automod?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.rules) {
        setRules(data.rules)
      }
    } catch {
      toast.error('Error al cargar reglas')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleCreateRule = async () => {
    if (!currentServer || !newName) {
      toast.error('Ingresa un nombre para la regla')
      return
    }
    try {
      const res = await fetch('/api/automod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          name: newName,
          type: newType,
          enabled: newEnabled,
          threshold: newThreshold,
          action: newAction,
          duration: newDuration || null,
          words: JSON.stringify(newWords),
          exemptions: JSON.stringify(newExemptions),
          logChannelId,
        }),
      })
      const data = await res.json()
      if (data.rule) {
        toast.success('Regla creada')
        setShowNewRule(false)
        setNewName('')
        setNewWords([])
        setNewExemptions([])
        setNewThreshold(3)
        setNewAction('warn')
        setNewDuration('')
        fetchRules()
      } else {
        toast.error(data.error || 'Error al crear regla')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleToggleRule = async (rule: AutoModRule) => {
    try {
      await fetch('/api/automod', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id, enabled: !rule.enabled }),
      })
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      toast.success(rule.enabled ? 'Regla desactivada' : 'Regla activada')
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await fetch(`/api/automod?ruleId=${ruleId}`, { method: 'DELETE' })
      setRules(prev => prev.filter(r => r.id !== ruleId))
      toast.success('Regla eliminada')
    } catch {
      toast.error('Error al eliminar regla')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingRule) return
    try {
      await fetch('/api/automod', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: editingRule.id,
          enabled: editEnabled,
          threshold: editThreshold,
          action: editAction,
          duration: editDuration || null,
          words: JSON.stringify(editWords),
          exemptions: JSON.stringify(editExemptions),
          logChannelId,
        }),
      })
      toast.success('Regla actualizada')
      setEditingRule(null)
      fetchRules()
    } catch {
      toast.error('Error al actualizar regla')
    }
  }

  const openEdit = (rule: AutoModRule) => {
    setEditingRule(rule)
    setEditEnabled(rule.enabled)
    setEditThreshold(rule.threshold)
    setEditAction(rule.action)
    setEditDuration(rule.duration || '')
    try {
      setEditWords(JSON.parse(rule.words || '[]'))
      setEditExemptions(JSON.parse(rule.exemptions || '[]'))
    } catch {
      setEditWords([])
      setEditExemptions([])
    }
    setEditWordInput('')
    setEditExemptInput('')
  }

  const addWord = (word: string, target: 'new' | 'edit') => {
    if (!word.trim()) return
    if (target === 'new') {
      setNewWords(prev => [...prev, word.trim()])
      setWordInput('')
    } else {
      setEditWords(prev => [...prev, word.trim()])
      setEditWordInput('')
    }
  }

  const removeWord = (index: number, target: 'new' | 'edit') => {
    if (target === 'new') {
      setNewWords(prev => prev.filter((_, i) => i !== index))
    } else {
      setEditWords(prev => prev.filter((_, i) => i !== index))
    }
  }

  const addExempt = (exempt: string, target: 'new' | 'edit') => {
    if (!exempt.trim()) return
    if (target === 'new') {
      setNewExemptions(prev => [...prev, exempt.trim()])
      setExemptInput('')
    } else {
      setEditExemptions(prev => [...prev, exempt.trim()])
      setEditExemptInput('')
    }
  }

  const removeExempt = (index: number, target: 'new' | 'edit') => {
    if (target === 'new') {
      setNewExemptions(prev => prev.filter((_, i) => i !== index))
    } else {
      setEditExemptions(prev => prev.filter((_, i) => i !== index))
    }
  }

  const getRuleTypeInfo = (type: string) => ruleTypes.find(r => r.type === type) || ruleTypes[0]

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
            Auto Moderación
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configura reglas automáticas de moderación
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {masterEnabled ? 'Activado' : 'Desactivado'}
            </span>
            <Switch
              checked={masterEnabled}
              onCheckedChange={setMasterEnabled}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF3A2F] data-[state=checked]:to-[#FF6B00]"
            />
          </div>
          <Button
            onClick={() => setShowNewRule(true)}
            size="sm"
            className="gap-2 bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white"
          >
            <Plus className="w-4 h-4" />
            Nueva Regla
          </Button>
        </div>
      </motion.div>

      {/* Master Toggle Indicator */}
      <AnimatePresence>
        {!masterEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                <p className="text-sm text-yellow-300">
                  El sistema de Auto Moderación está desactivado. Ninguna regla será ejecutada.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Channel Selector */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF3A2F]/20 to-fuchsia-600/10">
              <ShieldAlert className="w-4 h-4 text-[#FF3A2F]" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Canal de logs de AutoMod</CardTitle>
              <CardDescription className="text-xs">Selecciona el canal donde se enviarán las alertas de moderación automática</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChannelSelector
            value={logChannelId}
            onValueChange={setLogChannelId}
            placeholder="Seleccionar canal de logs..."
          />
        </CardContent>
      </Card>

      {/* Rules Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-8 h-8 border-2 border-[#FF3A2F] border-t-transparent rounded-full"
          />
        </div>
      ) : rules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        >
          <Bot className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No hay reglas configuradas</p>
          <p className="text-xs mt-1">Crea una regla para empezar a proteger tu servidor</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {rules.map((rule, i) => {
              const typeInfo = getRuleTypeInfo(rule.type)
              const TypeIcon = typeInfo.icon
              const isExpanded = expandedRule === rule.id
              const parsedWords = (() => { try { return JSON.parse(rule.words || '[]') as string[] } catch { return [] } })()
              const parsedExemptions = (() => { try { return JSON.parse(rule.exemptions || '[]') as string[] } catch { return [] } })()

              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <Card className={`bg-card/80 backdrop-blur-sm border-border/50 transition-all duration-300 ${!rule.enabled ? 'opacity-60' : ''} ${isExpanded ? 'md:col-span-2' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${typeInfo.color}`}>
                            <TypeIcon className={`w-4 h-4 ${typeInfo.iconColor}`} />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">{rule.name}</CardTitle>
                            <CardDescription className="text-xs">{typeInfo.label}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleRule(rule)}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF3A2F] data-[state=checked]:to-[#FF6B00]"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Compact view */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Umbral:</span>
                          <Badge variant="outline" className="text-xs bg-[#FF3A2F]/10 text-[#FF3A2F] border-[#FF3A2F]/30">
                            {rule.threshold}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Acción:</span>
                          <Badge variant="outline" className="text-xs">
                            {actionLabels[rule.action] || rule.action}
                          </Badge>
                        </div>
                        {rule.duration && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Duración:</span>
                            <span className="text-xs">{rule.duration}</span>
                          </div>
                        )}
                      </div>

                      {/* Expanded view */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 border-t border-border/50 space-y-4">
                              {/* Bad words */}
                              {rule.type === 'words' && (
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-muted-foreground">Palabras Prohibidas</Label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {parsedWords.length === 0 ? (
                                      <span className="text-xs text-muted-foreground italic">Sin palabras configuradas</span>
                                    ) : (
                                      parsedWords.map((w, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30 gap-1">
                                          {w}
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Exempt roles/channels */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Exenciones</Label>
                                <div className="flex flex-wrap gap-1.5">
                                  {parsedExemptions.length === 0 ? (
                                    <span className="text-xs text-muted-foreground italic">Sin exenciones</span>
                                  ) : (
                                    parsedExemptions.map((e, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30 gap-1">
                                        {e}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-xs"
                                  onClick={() => openEdit(rule)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-xs text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10"
                                  onClick={() => handleDeleteRule(rule.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New Rule Dialog */}
      <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF3A2F]" />
              Nueva Regla de Auto Moderación
            </DialogTitle>
            <DialogDescription>
              Configura una nueva regla para proteger tu servidor automáticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nombre</Label>
              <Input
                placeholder="Nombre de la regla"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                {ruleTypes.map(rt => (
                  <motion.button
                    key={rt.type}
                    onClick={() => setNewType(rt.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left ${
                      newType === rt.type
                        ? 'border-[#FF3A2F]/50 bg-[#FF3A2F]/10'
                        : 'border-border/50 bg-card/50 hover:bg-accent/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <rt.icon className={`w-4 h-4 ${rt.iconColor}`} />
                    <span className="text-xs font-medium">{rt.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Umbral: {newThreshold}</Label>
              <Slider
                value={[newThreshold]}
                onValueChange={(v) => setNewThreshold(v[0])}
                min={1}
                max={20}
                step={1}
                className="py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Acción</Label>
                <Select value={newAction} onValueChange={setNewAction}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(actionLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Duración</Label>
                <Input
                  placeholder="ej: 1h, 30m"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            {newType === 'words' && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Palabras Prohibidas</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar palabra..."
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addWord(wordInput, 'new')
                      }
                    }}
                    className="bg-background/50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addWord(wordInput, 'new')}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {newWords.map((w, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30 gap-1">
                      {w}
                      <button onClick={() => removeWord(i, 'new')}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-medium">Exenciones (Roles/Canales)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar exención..."
                  value={exemptInput}
                  onChange={(e) => setExemptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addExempt(exemptInput, 'new')
                    }
                  }}
                  className="bg-background/50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addExempt(exemptInput, 'new')}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {newExemptions.map((e, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30 gap-1">
                    {e}
                    <button onClick={() => removeExempt(i, 'new')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newEnabled}
                onCheckedChange={setNewEnabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF3A2F] data-[state=checked]:to-[#FF6B00]"
              />
              <Label className="text-xs">Activar regla inmediatamente</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewRule(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateRule}
              className="bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white"
            >
              Crear Regla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => { if (!open) setEditingRule(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#FF3A2F]" />
              Editar Regla
            </DialogTitle>
            <DialogDescription>
              {editingRule?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Umbral: {editThreshold}</Label>
              <Slider
                value={[editThreshold]}
                onValueChange={(v) => setEditThreshold(v[0])}
                min={1}
                max={20}
                step={1}
                className="py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Acción</Label>
                <Select value={editAction} onValueChange={setEditAction}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(actionLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Duración</Label>
                <Input
                  placeholder="ej: 1h, 30m"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            {editingRule?.type === 'words' && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Palabras Prohibidas</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar palabra..."
                    value={editWordInput}
                    onChange={(e) => setEditWordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addWord(editWordInput, 'edit')
                      }
                    }}
                    className="bg-background/50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addWord(editWordInput, 'edit')}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editWords.map((w, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30 gap-1">
                      {w}
                      <button onClick={() => removeWord(i, 'edit')}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-medium">Exenciones (Roles/Canales)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar exención..."
                  value={editExemptInput}
                  onChange={(e) => setEditExemptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addExempt(editExemptInput, 'edit')
                    }
                  }}
                  className="bg-background/50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addExempt(editExemptInput, 'edit')}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editExemptions.map((e, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30 gap-1">
                    {e}
                    <button onClick={() => removeExempt(i, 'edit')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editEnabled}
                onCheckedChange={setEditEnabled}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF3A2F] data-[state=checked]:to-[#FF6B00]"
              />
              <Label className="text-xs">Regla activada</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingRule(null)}>Cancelar</Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
