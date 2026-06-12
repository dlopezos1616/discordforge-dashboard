'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  SmilePlus, Plus, Pencil, Trash2, MousePointer,
  List, ToggleLeft, Eye, X, Sparkles, Hash,
  Shield, Users, ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface ReactionRole {
  id: string
  type: string
  emoji: string | null
  label: string | null
  roleIds: string
  mode: string
  exclusive: boolean
  autoRemove: boolean
  channelId: string | null
  messageId: string | null
  createdAt: string
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; iconColor: string }> = {
  reaction: { label: 'Reacción', icon: SmilePlus, color: 'bg-violet-500/15 text-violet-400 border-violet-500/30', iconColor: 'text-violet-400' },
  button: { label: 'Botón', icon: MousePointer, color: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30', iconColor: 'text-fuchsia-400' },
  select: { label: 'Select Menu', icon: List, color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', iconColor: 'text-cyan-400' },
}

const modeConfig: Record<string, { label: string; color: string }> = {
  single: { label: 'Simple', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  multiple: { label: 'Múltiple', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  toggle: { label: 'Toggle', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
}

export function ReactionRoles() {
  const { currentServer } = useAppStore()
  const [reactionRoles, setReactionRoles] = useState<ReactionRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Create form
  const [formType, setFormType] = useState('reaction')
  const [formEmoji, setFormEmoji] = useState('✅')
  const [formLabel, setFormLabel] = useState('')
  const [formRoleIds, setFormRoleIds] = useState('')
  const [formMode, setFormMode] = useState('single')
  const [formAutoRemove, setFormAutoRemove] = useState(false)
  const [formExclusive, setFormExclusive] = useState(false)

  // Edit form
  const [editEmoji, setEditEmoji] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [editRoleIds, setEditRoleIds] = useState('')
  const [editMode, setEditMode] = useState('single')
  const [editAutoRemove, setEditAutoRemove] = useState(false)
  const [editExclusive, setEditExclusive] = useState(false)
  const [editType, setEditType] = useState('reaction')

  const fetchReactionRoles = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reaction-roles?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.reactionRoles) {
        setReactionRoles(data.reactionRoles)
      }
    } catch {
      toast.error('Error al cargar reaction roles')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchReactionRoles()
  }, [fetchReactionRoles])

  const resetForm = () => {
    setFormType('reaction')
    setFormEmoji('✅')
    setFormLabel('')
    setFormRoleIds('')
    setFormMode('single')
    setFormAutoRemove(false)
    setFormExclusive(false)
  }

  const handleCreate = async () => {
    if (!currentServer) return
    try {
      const roleIdsArr = formRoleIds.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('/api/reaction-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          type: formType,
          emoji: formEmoji || null,
          label: formLabel || null,
          roleIds: JSON.stringify(roleIdsArr),
          mode: formMode,
          exclusive: formExclusive,
          autoRemove: formAutoRemove,
        }),
      })
      const data = await res.json()
      if (data.reactionRole) {
        toast.success('Reaction role creado')
        setShowCreate(false)
        resetForm()
        fetchReactionRoles()
      } else {
        toast.error(data.error || 'Error al crear')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reaction-roles?id=${id}`, { method: 'DELETE' })
      setReactionRoles(prev => prev.filter(r => r.id !== id))
      toast.success('Reaction role eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const openEdit = (rr: ReactionRole) => {
    setEditingId(rr.id)
    setEditType(rr.type)
    setEditEmoji(rr.emoji || '')
    setEditLabel(rr.label || '')
    try {
      const parsed = JSON.parse(rr.roleIds || '[]') as string[]
      setEditRoleIds(parsed.join(', '))
    } catch {
      setEditRoleIds('')
    }
    setEditMode(rr.mode)
    setEditAutoRemove(rr.autoRemove)
    setEditExclusive(rr.exclusive)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    try {
      const roleIdsArr = editRoleIds.split(',').map(s => s.trim()).filter(Boolean)
      await fetch('/api/reaction-roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          type: editType,
          emoji: editEmoji || null,
          label: editLabel || null,
          roleIds: JSON.stringify(roleIdsArr),
          mode: editMode,
          autoRemove: editAutoRemove,
          exclusive: editExclusive,
        }),
      })
      toast.success('Reaction role actualizado')
      setEditingId(null)
      fetchReactionRoles()
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const getPreview = (rr: ReactionRole) => {
    const parsedRoles = (() => { try { return JSON.parse(rr.roleIds || '[]') as string[] } catch { return [] } })()

    switch (rr.type) {
      case 'reaction':
        return (
          <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] font-bold text-white">
                B
              </div>
              <span className="text-xs font-semibold text-violet-400">Bot</span>
            </div>
            <p className="text-sm text-gray-200">Reacciona para obtener tu rol</p>
            <div className="flex items-center gap-2 pt-1 border-t border-gray-600/50">
              <span className="text-lg">{rr.emoji || '✅'}</span>
              <span className="text-xs text-gray-400">
                {parsedRoles.length > 0 ? `Rol: ${parsedRoles[0]}` : 'Sin rol configurado'}
              </span>
            </div>
          </div>
        )
      case 'button':
        return (
          <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] font-bold text-white">
                B
              </div>
              <span className="text-xs font-semibold text-violet-400">Bot</span>
            </div>
            <p className="text-sm text-gray-200">{rr.label || 'Selecciona tu rol'}</p>
            <button className="px-3 py-1 rounded bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium">
              {rr.emoji || '🎯'} {rr.label || 'Obtener Rol'}
            </button>
          </div>
        )
      case 'select':
        return (
          <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] font-bold text-white">
                B
              </div>
              <span className="text-xs font-semibold text-violet-400">Bot</span>
            </div>
            <p className="text-sm text-gray-200">{rr.label || 'Selecciona tu rol'}</p>
            <div className="bg-[#1e1f22] rounded px-3 py-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-400">Elige un rol...</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
            {parsedRoles.length > 0 && (
              <div className="space-y-0.5">
                {parsedRoles.slice(0, 3).map((r, i) => (
                  <div key={i} className="bg-[#1e1f22] rounded px-3 py-1 text-xs text-gray-300">
                    {rr.emoji || '🎯'} {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

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
            Reaction Roles
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona roles por reacción, botón y menú select
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowCreate(true) }}
          size="sm"
          className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
        >
          <Plus className="w-4 h-4" />
          Crear Reaction Role
        </Button>
      </motion.div>

      {/* Grid of existing reaction roles */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
          />
        </div>
      ) : reactionRoles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        >
          <SmilePlus className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No hay reaction roles configurados</p>
          <p className="text-xs mt-1">Crea uno para empezar</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {reactionRoles.map((rr, i) => {
              const tc = typeConfig[rr.type] || typeConfig.reaction
              const mc = modeConfig[rr.mode] || modeConfig.single
              const TypeIcon = tc.icon
              const parsedRoles = (() => { try { return JSON.parse(rr.roleIds || '[]') as string[] } catch { return [] } })()
              const isPreviewOpen = previewId === rr.id

              return (
                <motion.div
                  key={rr.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-violet-500/30 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{rr.emoji || '🎯'}</span>
                          <div>
                            <CardTitle className="text-sm font-semibold">
                              {rr.label || 'Sin nombre'}
                            </CardTitle>
                            <CardDescription className="text-[10px]">
                              {new Date(rr.createdAt).toLocaleDateString('es-ES')}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className={`text-[10px] ${tc.color}`}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {tc.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Mode & Auto-remove badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${mc.color}`}>
                          {mc.label}
                        </Badge>
                        {rr.autoRemove && (
                          <Badge variant="outline" className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30">
                            Auto-remove
                          </Badge>
                        )}
                        {rr.exclusive && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30">
                            Exclusivo
                          </Badge>
                        )}
                      </div>

                      {/* Role list */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium">Roles:</span>
                        <div className="flex flex-wrap gap-1">
                          {parsedRoles.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">Sin roles</span>
                          ) : (
                            parsedRoles.map((r, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px]">
                                {r}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setPreviewId(isPreviewOpen ? null : rr.id)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isPreviewOpen ? 'Ocultar' : 'Preview'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => openEdit(rr)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(rr.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Preview */}
                      <AnimatePresence>
                        {isPreviewOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-[#313338] rounded-lg p-3 mt-1">
                              {getPreview(rr)}
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Crear Reaction Role
            </DialogTitle>
            <DialogDescription>
              Configura un nuevo sistema de roles por interacción
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tipo</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(typeConfig).map(([key, tc]) => (
                  <motion.button
                    key={key}
                    onClick={() => setFormType(key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      formType === key
                        ? 'border-violet-500/50 bg-violet-500/10'
                        : 'border-border/50 bg-card/50 hover:bg-accent/30'
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <tc.icon className={`w-4 h-4 ${tc.iconColor}`} />
                    <span className="text-xs font-medium">{tc.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Emoji & Label */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Emoji</Label>
                <Input
                  placeholder="✅"
                  value={formEmoji}
                  onChange={(e) => setFormEmoji(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Etiqueta</Label>
                <Input
                  placeholder="Nombre del reaction role"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Role IDs */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">IDs de Roles (separados por coma)</Label>
              <Input
                placeholder="role1, role2, role3"
                value={formRoleIds}
                onChange={(e) => setFormRoleIds(e.target.value)}
                className="bg-background/50"
              />
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Modo</Label>
              <RadioGroup value={formMode} onValueChange={setFormMode} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="mode-single" />
                  <Label htmlFor="mode-single" className="text-xs font-normal">Simple</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="mode-multiple" />
                  <Label htmlFor="mode-multiple" className="text-xs font-normal">Múltiple</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="toggle" id="mode-toggle" />
                  <Label htmlFor="mode-toggle" className="text-xs font-normal">Toggle</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formAutoRemove}
                  onCheckedChange={setFormAutoRemove}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-fuchsia-500"
                />
                <Label className="text-xs">Auto-remove</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formExclusive}
                  onCheckedChange={setFormExclusive}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-fuchsia-500"
                />
                <Label className="text-xs">Exclusivo</Label>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Vista Previa</Label>
              <div className="bg-[#313338] rounded-lg p-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={formType}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {formType === 'reaction' && (
                      <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] font-bold text-white">B</div>
                          <span className="text-xs font-semibold text-violet-400">Bot</span>
                        </div>
                        <p className="text-sm text-gray-200">Reacciona para obtener tu rol</p>
                        <div className="flex items-center gap-2 pt-1 border-t border-gray-600/50">
                          <span className="text-lg">{formEmoji || '✅'}</span>
                          <span className="text-xs text-gray-400">
                            {formLabel || 'Reaction Role'}
                          </span>
                        </div>
                      </div>
                    )}
                    {formType === 'button' && (
                      <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] font-bold text-white">B</div>
                          <span className="text-xs font-semibold text-violet-400">Bot</span>
                        </div>
                        <p className="text-sm text-gray-200">{formLabel || 'Selecciona tu rol'}</p>
                        <button className="px-3 py-1 rounded bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium">
                          {formEmoji || '🎯'} {formLabel || 'Obtener Rol'}
                        </button>
                      </div>
                    )}
                    {formType === 'select' && (
                      <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[8px] font-bold text-white">B</div>
                          <span className="text-xs font-semibold text-violet-400">Bot</span>
                        </div>
                        <p className="text-sm text-gray-200">{formLabel || 'Selecciona tu rol'}</p>
                        <div className="bg-[#1e1f22] rounded px-3 py-1.5 flex items-center justify-between">
                          <span className="text-xs text-gray-400">Elige un rol...</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => { if (!open) setEditingId(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-violet-400" />
              Editar Reaction Role
            </DialogTitle>
            <DialogDescription>
              Modifica la configuración del reaction role
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tipo</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(typeConfig).map(([key, tc]) => (
                  <motion.button
                    key={key}
                    onClick={() => setEditType(key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                      editType === key
                        ? 'border-violet-500/50 bg-violet-500/10'
                        : 'border-border/50 bg-card/50 hover:bg-accent/30'
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <tc.icon className={`w-4 h-4 ${tc.iconColor}`} />
                    <span className="text-xs font-medium">{tc.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Emoji</Label>
                <Input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Etiqueta</Label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">IDs de Roles (separados por coma)</Label>
              <Input
                value={editRoleIds}
                onChange={(e) => setEditRoleIds(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Modo</Label>
              <RadioGroup value={editMode} onValueChange={setEditMode} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="edit-single" />
                  <Label htmlFor="edit-single" className="text-xs font-normal">Simple</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="edit-multiple" />
                  <Label htmlFor="edit-multiple" className="text-xs font-normal">Múltiple</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="toggle" id="edit-toggle" />
                  <Label htmlFor="edit-toggle" className="text-xs font-normal">Toggle</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editAutoRemove}
                  onCheckedChange={setEditAutoRemove}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-fuchsia-500"
                />
                <Label className="text-xs">Auto-remove</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editExclusive}
                  onCheckedChange={setEditExclusive}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-fuchsia-500"
                />
                <Label className="text-xs">Exclusivo</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
