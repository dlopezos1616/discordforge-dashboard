'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Code2, Plus, Trash2, Eye, Save, Send, Bookmark, ChevronDown,
  GripVertical, Image as ImageIcon, Palette, Type, Hash, User, MessageSquare,
  Sparkles, Copy, RotateCcw, Grid2X2, LayoutGrid
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface EmbedField {
  id: string
  name: string
  value: string
  inline: boolean
}

interface EmbedPreset {
  id: string
  name: string
  title: string | null
  description: string | null
  author: string | null
  authorIcon: string | null
  footer: string | null
  footerIcon: string | null
  thumbnail: string | null
  image: string | null
  color: string
  fields: string // JSON
  channelId: string | null
}

const defaultEmbed = {
  title: '',
  description: '',
  author: '',
  authorIcon: '',
  footer: '',
  footerIcon: '',
  thumbnail: '',
  image: '',
  color: '#5865F2',
  fields: [] as EmbedField[],
  channelId: '',
}

const mockChannels = [
  { id: 'ch_1', name: 'anuncios' },
  { id: 'ch_2', name: 'general' },
  { id: 'ch_3', name: 'normas' },
  { id: 'ch_4', name: 'informacion' },
  { id: 'ch_5', name: 'bienvenidas' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

let fieldIdCounter = 0
const generateFieldId = () => `field_${++fieldIdCounter}`

export function EmbedBuilder() {
  const { currentServer } = useAppStore()
  const [embed, setEmbed] = useState(defaultEmbed)
  const [presets, setPresets] = useState<EmbedPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const fetchPresets = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/embeds?serverId=${currentServer.id}`)
      const data = await res.json()
      setPresets(data.presets || [])
    } catch (err) {
      console.error('Failed to fetch embed presets:', err)
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  const addField = () => {
    setEmbed(prev => ({
      ...prev,
      fields: [...prev.fields, { id: generateFieldId(), name: '', value: '', inline: false }],
    }))
  }

  const updateField = (id: string, key: keyof EmbedField, val: string | boolean) => {
    setEmbed(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, [key]: val } : f),
    }))
  }

  const removeField = (id: string) => {
    setEmbed(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id),
    }))
  }

  const loadPreset = (preset: EmbedPreset) => {
    let parsedFields: EmbedField[] = []
    try {
      const raw = JSON.parse(preset.fields)
      parsedFields = raw.map((f: { name: string; value: string; inline?: boolean }) => ({
        id: generateFieldId(),
        name: f.name || '',
        value: f.value || '',
        inline: f.inline || false,
      }))
    } catch {}

    setEmbed({
      title: preset.title || '',
      description: preset.description || '',
      author: preset.author || '',
      authorIcon: preset.authorIcon || '',
      footer: preset.footer || '',
      footerIcon: preset.footerIcon || '',
      thumbnail: preset.thumbnail || '',
      image: preset.image || '',
      color: preset.color || '#5865F2',
      fields: parsedFields,
      channelId: preset.channelId || '',
    })
    toast.success(`Plantilla "${preset.name}" cargada`)
  }

  const handleSavePreset = async () => {
    if (!currentServer || !presetName) return
    try {
      const res = await fetch('/api/embeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          name: presetName,
          title: embed.title || null,
          description: embed.description || null,
          author: embed.author || null,
          authorIcon: embed.authorIcon || null,
          footer: embed.footer || null,
          footerIcon: embed.footerIcon || null,
          thumbnail: embed.thumbnail || null,
          image: embed.image || null,
          color: embed.color,
          fields: JSON.stringify(embed.fields.map(f => ({ name: f.name, value: f.value, inline: f.inline }))),
          channelId: embed.channelId || null,
        }),
      })
      if (res.ok) {
        toast.success('Plantilla guardada exitosamente')
        setSaveDialogOpen(false)
        setPresetName('')
        fetchPresets()
      }
    } catch {
      toast.error('Error al guardar plantilla')
    }
  }

  const handleDeletePreset = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/embeds?presetId=${deleteTarget}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Plantilla eliminada')
        fetchPresets()
      }
    } catch {
      toast.error('Error al eliminar plantilla')
    }
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const handleSendEmbed = () => {
    toast.success('Embed enviado al canal #' + (mockChannels.find(c => c.id === embed.channelId)?.name || 'no seleccionado'))
  }

  const handleReset = () => {
    setEmbed(defaultEmbed)
    toast.info('Embed restablecido')
  }

  const hasContent = embed.title || embed.description || embed.author || embed.footer || embed.fields.length > 0 || embed.image || embed.thumbnail

  // Loading skeleton
  if (loading && !presets.length) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 rounded-lg bg-card/50 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 rounded-xl bg-card/50 animate-pulse" />
          <div className="h-96 rounded-xl bg-card/50 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#FF3A2F]" />
            Constructor de Embeds
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Crea y envía embeds personalizados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Limpiar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setPresetName('')
              setSaveDialogOpen(true)
            }}
            className="gap-1.5 bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white border-0"
          >
            <Bookmark className="w-3.5 h-3.5" /> Guardar como Plantilla
          </Button>
          <Button
            size="sm"
            onClick={handleSendEmbed}
            disabled={!hasContent}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-3.5 h-3.5" /> Enviar Embed
          </Button>
        </div>
      </motion.div>

      {/* Saved Presets */}
      {presets.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-fuchsia-400" />
                Plantillas Guardadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {presets.map(preset => (
                    <motion.div
                      key={preset.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1.5"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadPreset(preset)}
                        className="gap-1.5 text-xs h-8"
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} />
                        {preset.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setDeleteTarget(preset.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content: Form + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <motion.div variants={item} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#FF3A2F]" />
                Propiedades del Embed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Author */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <User className="w-3 h-3 text-muted-foreground" /> Autor
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={embed.authorIcon}
                    onChange={e => setEmbed(prev => ({ ...prev, authorIcon: e.target.value }))}
                    placeholder="URL del icono"
                    className="h-8 text-[11px] w-1/3"
                  />
                  <Input
                    value={embed.author}
                    onChange={e => setEmbed(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Nombre del autor"
                    className="h-8 text-[11px] flex-1"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-muted-foreground" /> Título
                </Label>
                <Input
                  value={embed.title}
                  onChange={e => setEmbed(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título del embed"
                  className="h-8 text-[11px]"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-muted-foreground" /> Descripción
                </Label>
                <Textarea
                  value={embed.description}
                  onChange={e => setEmbed(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del embed..."
                  className="min-h-[100px] text-[11px] resize-none"
                />
              </div>

              {/* Color */}
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-muted-foreground" /> Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={embed.color}
                    onChange={e => setEmbed(prev => ({ ...prev, color: e.target.value }))}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={embed.color}
                    onChange={e => setEmbed(prev => ({ ...prev, color: e.target.value }))}
                    className="h-9 font-mono text-xs w-28"
                    maxLength={7}
                  />
                  <div className="flex gap-1">
                    {['#5865F2', '#57F287', '#FEE75C', '#ED4245', '#EB459E', '#2F3136'].map(c => (
                      <motion.button
                        key={c}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-5 h-5 rounded-md border border-white/10"
                        style={{ backgroundColor: c }}
                        onClick={() => setEmbed(prev => ({ ...prev, color: c }))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Thumbnail & Image */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3 text-muted-foreground" /> Thumbnail URL
                  </Label>
                  <Input
                    value={embed.thumbnail}
                    onChange={e => setEmbed(prev => ({ ...prev, thumbnail: e.target.value }))}
                    placeholder="URL de miniatura"
                    className="h-8 text-[11px]"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3 text-muted-foreground" /> Imagen URL
                  </Label>
                  <Input
                    value={embed.image}
                    onChange={e => setEmbed(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="URL de imagen"
                    className="h-8 text-[11px]"
                  />
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-muted-foreground" /> Footer
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={embed.footerIcon}
                    onChange={e => setEmbed(prev => ({ ...prev, footerIcon: e.target.value }))}
                    placeholder="URL del icono"
                    className="h-8 text-[11px] w-1/3"
                  />
                  <Input
                    value={embed.footer}
                    onChange={e => setEmbed(prev => ({ ...prev, footer: e.target.value }))}
                    placeholder="Texto del footer"
                    className="h-8 text-[11px] flex-1"
                  />
                </div>
              </div>

              {/* Channel */}
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-muted-foreground" /> Canal de Envío
                </Label>
                <Select value={embed.channelId} onValueChange={v => setEmbed(prev => ({ ...prev, channelId: v }))}>
                  <SelectTrigger className="h-8 text-[11px]">
                    <SelectValue placeholder="Seleccionar canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockChannels.map(ch => (
                      <SelectItem key={ch.id} value={ch.id}>
                        #{ch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fields Editor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Grid2X2 className="w-4 h-4 text-cyan-400" />
                  Campos Personalizados
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addField} className="gap-1 text-xs h-7">
                  <Plus className="w-3 h-3" /> Agregar Campo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {embed.fields.length === 0 ? (
                <div className="text-center py-6">
                  <Grid2X2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No hay campos agregados</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">Los campos permiten mostrar información estructurada</p>
                </div>
              ) : (
                <ScrollArea className="max-h-72">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {embed.fields.map((field, i) => (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="p-3 rounded-lg border border-border/50 bg-card/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-medium">Campo #{i + 1}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={field.inline}
                                  onCheckedChange={v => updateField(field.id, 'inline', v)}
                                  className="scale-75"
                                />
                                <Label className="text-[10px] text-muted-foreground">Inline</Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => removeField(field.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <Input
                            value={field.name}
                            onChange={e => updateField(field.id, 'name', e.target.value)}
                            placeholder="Nombre del campo"
                            className="h-7 text-[11px]"
                          />
                          <Textarea
                            value={field.value}
                            onChange={e => updateField(field.id, 'value', e.target.value)}
                            placeholder="Valor del campo"
                            className="min-h-[40px] text-[11px] resize-none"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Preview */}
        <motion.div variants={item} className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                Vista Previa en Discord
              </CardTitle>
              <CardDescription className="text-[10px]">
                Así se verá tu embed en Discord
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#313338] rounded-lg overflow-hidden">
                {/* Channel header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#3F4147]">
                  <Hash className="w-4 h-4 text-[#80848E]" />
                  <span className="text-xs font-semibold text-white">
                    {mockChannels.find(c => c.id === embed.channelId)?.name || 'canal'}
                  </span>
                </div>

                {/* Message area */}
                <div className="p-3">
                  <div className="flex items-start gap-2.5">
                    {/* Bot avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF3A2F] to-[#FF6B00] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-white">DiscordForge Bot</span>
                        <span className="text-[9px] bg-[#5865F2] text-white px-1 py-0.5 rounded font-medium">BOT</span>
                        <span className="text-[9px] text-[#949BA4]">Hoy a las {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Embed */}
                      {hasContent ? (
                        <motion.div
                          key={`${embed.title}-${embed.color}-${embed.fields.length}`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="max-w-[360px]"
                        >
                          <div className="bg-[#2B2D31] rounded-l-lg flex overflow-hidden">
                            {/* Color bar */}
                            <div
                              className="w-1 shrink-0"
                              style={{ backgroundColor: embed.color }}
                            />
                            <div className="p-3 flex-1 min-w-0">
                              {/* Author */}
                              {embed.author && (
                                <div className="flex items-center gap-2 mb-2">
                                  {embed.authorIcon ? (
                                    <div className="w-5 h-5 rounded-full bg-[#1E1F22] flex items-center justify-center shrink-0 overflow-hidden">
                                      <ImageIcon className="w-3 h-3 text-[#949BA4]" />
                                    </div>
                                  ) : null}
                                  <span className="text-[10px] text-white font-medium">{embed.author}</span>
                                </div>
                              )}

                              {/* Title */}
                              {embed.title && (
                                <p className="text-[11px] font-bold text-white mb-1">{embed.title}</p>
                              )}

                              {/* Description */}
                              {embed.description && (
                                <p className="text-[10px] text-[#DBDEE1] mb-2 whitespace-pre-wrap">{embed.description}</p>
                              )}

                              {/* Thumbnail */}
                              {embed.thumbnail && (
                                <div className="float-right ml-3 mb-2 w-16 h-16 rounded bg-[#1E1F22] flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-[#949BA4]" />
                                </div>
                              )}

                              {/* Fields */}
                              {embed.fields.length > 0 && (
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 clear-right">
                                  {embed.fields.map(field => (
                                    <div
                                      key={field.id}
                                      className={field.inline ? 'w-[calc(50%-8px)]' : 'w-full'}
                                    >
                                      <p className="text-[10px] font-bold text-white">{field.name || '\u00A0'}</p>
                                      <p className="text-[9px] text-[#DBDEE1]">{field.value || '\u00A0'}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Image */}
                              {embed.image && (
                                <div className="rounded overflow-hidden mb-2 clear-right">
                                  <div className="h-28 bg-[#1E1F22] flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-[#949BA4]" />
                                  </div>
                                </div>
                              )}

                              {/* Footer */}
                              {embed.footer && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  {embed.footerIcon && (
                                    <div className="w-4 h-4 rounded-full bg-[#1E1F22] flex items-center justify-center shrink-0 overflow-hidden">
                                      <ImageIcon className="w-2.5 h-2.5 text-[#949BA4]" />
                                    </div>
                                  )}
                                  <span className="text-[9px] text-[#949BA4]">{embed.footer}</span>
                                  <span className="text-[9px] text-[#949BA4]">•</span>
                                  <span className="text-[9px] text-[#949BA4]">Hoy</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-[#2B2D31] rounded-lg p-8 max-w-[360px] flex flex-col items-center justify-center">
                          <Code2 className="w-8 h-8 text-[#949BA4]/30 mb-2" />
                          <p className="text-[10px] text-[#949BA4]/50 text-center">
                            Empieza a editar para ver la vista previa
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Embed Info */}
              <div className="mt-4 flex flex-wrap gap-2">
                {embed.title && (
                  <Badge variant="secondary" className="text-[9px] gap-1">
                    <Type className="w-2.5 h-2.5" /> Título
                  </Badge>
                )}
                {embed.description && (
                  <Badge variant="secondary" className="text-[9px] gap-1">
                    <MessageSquare className="w-2.5 h-2.5" /> Descripción
                  </Badge>
                )}
                {embed.fields.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] gap-1">
                    <Grid2X2 className="w-2.5 h-2.5" /> {embed.fields.length} campo{embed.fields.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {embed.image && (
                  <Badge variant="secondary" className="text-[9px] gap-1">
                    <ImageIcon className="w-2.5 h-2.5" /> Imagen
                  </Badge>
                )}
                {embed.footer && (
                  <Badge variant="secondary" className="text-[9px] gap-1">
                    <Hash className="w-2.5 h-2.5" /> Footer
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[9px] gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: embed.color }} />
                  {embed.color}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#FF3A2F]" /> Guardar como Plantilla
            </DialogTitle>
            <DialogDescription>
              Guarda este embed como plantilla para reutilizarlo más tarde
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1.5 block">Nombre de la Plantilla</Label>
            <Input
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder="Ej: Normas del Servidor"
              className="h-9"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSavePreset}
              disabled={!presetName}
              className="bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white border-0"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" /> Eliminar Plantilla
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeletePreset}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
