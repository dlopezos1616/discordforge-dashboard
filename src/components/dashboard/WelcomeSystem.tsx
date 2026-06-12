'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  HandMetal, Eye, Palette, Type, Image as ImageIcon, FileText, MessageSquare,
  Hash, Users, ChevronDown, Sparkles, Info, Copy, RotateCcw,
  Check, X, Wand2, Settings2
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

const defaultConfig = {
  enabled: true,
  type: 'embed' as 'image' | 'gif' | 'embed' | 'simple',
  title: '¡Bienvenido/a a {server}!',
  description: '¡Hola {user}! Eres el miembro #{membercount}.',
  footer: '{server} • {date}',
  color: '#5865F2',
  useAvatar: true,
  bannerUrl: '',
  autoRoleIds: [] as string[],
}

const variables = [
  { key: '{user}', value: 'AdminDemo', description: 'Nombre del usuario' },
  { key: '{server}', value: 'Server Name', description: 'Nombre del servidor' },
  { key: '{membercount}', value: '15,420', description: 'Número de miembros' },
  { key: '{date}', value: new Date().toLocaleDateString('es-ES'), description: 'Fecha actual' },
  { key: '{user.mention}', value: '@AdminDemo', description: 'Mención del usuario' },
  { key: '{user.avatar}', value: 'Avatar URL', description: 'Avatar del usuario' },
  { key: '{server.icon}', value: 'Server Icon', description: 'Icono del servidor' },
]

const mockRoles = [
  { id: 'rol_1', name: 'Miembro', color: '#5865F2' },
  { id: 'rol_2', name: 'Verificado', color: '#10B981' },
  { id: 'rol_3', name: 'VIP', color: '#F59E0B' },
  { id: 'rol_4', name: 'Staff', color: '#EF4444' },
  { id: 'rol_5', name: 'Streamer', color: '#8B5CF6' },
]

const mockChannels = [
  { id: 'ch_1', name: 'bienvenidas' },
  { id: 'ch_2', name: 'general' },
  { id: 'ch_3', name: 'anuncios' },
  { id: 'ch_4', name: 'presentaciones' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function WelcomeSystem() {
  const { currentServer } = useAppStore()
  const [config, setConfig] = useState(defaultConfig)
  const [welcomeChannel, setWelcomeChannel] = useState('ch_1')
  const [activeType, setActiveType] = useState<string>('embed')

  const processText = (text: string) => {
    let result = text
    variables.forEach(v => {
      result = result.replace(new RegExp(v.key.replace(/[{}]/g, '\\$&'), 'g'), v.value)
    })
    if (currentServer) {
      result = result.replace(/\{server\}/g, currentServer.name)
    }
    return result
  }

  const processedTitle = processText(config.title)
  const processedDescription = processText(config.description)
  const processedFooter = processText(config.footer)

  const toggleRole = (roleId: string) => {
    setConfig(prev => ({
      ...prev,
      autoRoleIds: prev.autoRoleIds.includes(roleId)
        ? prev.autoRoleIds.filter(id => id !== roleId)
        : [...prev.autoRoleIds, roleId],
    }))
  }

  const handleSave = () => {
    toast.success('Configuración de bienvenida guardada')
  }

  const handleReset = () => {
    setConfig(defaultConfig)
    setActiveType('embed')
    setWelcomeChannel('ch_1')
    toast.info('Configuración restablecida')
  }

  const typeOptions = [
    { value: 'image', label: 'Imagen', icon: ImageIcon },
    { value: 'gif', label: 'GIF', icon: FileText },
    { value: 'embed', label: 'Embed', icon: Palette },
    { value: 'simple', label: 'Mensaje Simple', icon: MessageSquare },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HandMetal className="w-5 h-5 text-violet-400" />
            Sistema de Bienvenidas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configura mensajes de bienvenida automáticos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card/50 border border-border rounded-lg px-3 py-1.5">
            <Label className="text-xs text-muted-foreground">Sistema</Label>
            <Switch
              checked={config.enabled}
              onCheckedChange={v => setConfig(c => ({ ...c, enabled: v }))}
            />
            <Badge variant="secondary" className={`text-[9px] ${config.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'}`}>
              {config.enabled ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          {/* Type Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-violet-400" />
                Tipo de Mensaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {typeOptions.map(option => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveType(option.value)
                      setConfig(c => ({ ...c, type: option.value as typeof c.type }))
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      activeType === option.value
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-border/50 bg-card/30 text-muted-foreground hover:border-border hover:bg-card/50'
                    }`}
                  >
                    <option.icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Embed Configuration (visible for embed type) */}
          {(activeType === 'embed' || activeType === 'simple') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Type className="w-4 h-4 text-fuchsia-400" />
                    Contenido del Mensaje
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Usa variables como {'{user}'}, {'{server}'}, {'{membercount}'}, {'{date}'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs mb-1.5 block">Título</Label>
                    <Input
                      value={config.title}
                      onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
                      placeholder="¡Bienvenido/a a {server}!"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Descripción</Label>
                    <Textarea
                      value={config.description}
                      onChange={e => setConfig(c => ({ ...c, description: e.target.value }))}
                      placeholder="¡Hola {user}! Eres el miembro #{membercount}."
                      className="min-h-[80px] text-xs resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Footer</Label>
                    <Input
                      value={config.footer}
                      onChange={e => setConfig(c => ({ ...c, footer: e.target.value }))}
                      placeholder="{server} • {date}"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs mb-1.5 block">Color del Embed</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.color}
                          onChange={e => setConfig(c => ({ ...c, color: e.target.value }))}
                          className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                        />
                        <Input
                          value={config.color}
                          onChange={e => setConfig(c => ({ ...c, color: e.target.value }))}
                          className="h-9 font-mono text-xs"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Canal de Bienvenida</Label>
                      <Select value={welcomeChannel} onValueChange={setWelcomeChannel}>
                        <SelectTrigger className="h-9">
                          <Hash className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                          <SelectValue />
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
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs mb-1.5 block">Banner URL</Label>
                    <Input
                      value={config.bannerUrl}
                      onChange={e => setConfig(c => ({ ...c, bannerUrl: e.target.value }))}
                      placeholder="https://ejemplo.com/banner.png"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.useAvatar}
                        onCheckedChange={v => setConfig(c => ({ ...c, useAvatar: v }))}
                      />
                      <Label className="text-xs">Mostrar Avatar del Usuario</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Image/GIF Configuration */}
          {(activeType === 'image' || activeType === 'gif') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    {activeType === 'image' ? 'Imagen de Bienvenida' : 'GIF de Bienvenida'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configura la imagen/GIF que se enviará al canal de bienvenidas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs mb-1.5 block">URL de la Imagen/GIF</Label>
                    <Input
                      value={config.bannerUrl}
                      onChange={e => setConfig(c => ({ ...c, bannerUrl: e.target.value }))}
                      placeholder="https://ejemplo.com/welcome.gif"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Texto Alternativo</Label>
                    <Input
                      value={config.title}
                      onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
                      placeholder="¡Bienvenido/a {user}!"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Canal de Bienvenida</Label>
                    <Select value={welcomeChannel} onValueChange={setWelcomeChannel}>
                      <SelectTrigger className="h-9">
                        <Hash className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                        <SelectValue />
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
            </motion.div>
          )}

          {/* Auto-Role */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Auto-Rol al Unirse
              </CardTitle>
              <CardDescription className="text-xs">
                Roles que se asignarán automáticamente a los nuevos miembros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mockRoles.map(role => {
                  const isSelected = config.autoRoleIds.includes(role.id)
                  return (
                    <motion.button
                      key={role.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleRole(role.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                          : 'border-border/50 bg-card/30 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isSelected ? role.color : undefined, border: isSelected ? 'none' : '1px solid hsl(var(--muted-foreground))' }}
                      />
                      {role.name}
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </motion.button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0 gap-1.5"
            >
              <Check className="w-4 h-4" /> Guardar Configuración
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="w-4 h-4" /> Restablecer
            </Button>
          </div>
        </motion.div>

        {/* Right: Preview + Variables */}
        <motion.div variants={item} className="space-y-4">
          {/* Live Preview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                Vista Previa
              </CardTitle>
              <CardDescription className="text-[10px]">
                Así se verá el mensaje en Discord
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-[#313338] rounded-lg overflow-hidden">
                {/* Channel header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#3F4147]">
                  <Hash className="w-4 h-4 text-[#80848E]" />
                  <span className="text-xs font-semibold text-white">bienvenidas</span>
                </div>

                {/* Message area */}
                <div className="p-3 space-y-3">
                  {/* Bot message */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-white">DiscordForge Bot</span>
                        <span className="text-[9px] bg-[#5865F2] text-white px-1 py-0.5 rounded font-medium">BOT</span>
                        <span className="text-[9px] text-[#949BA4]">Hoy a las {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Embed preview */}
                      {activeType === 'embed' && (
                        <motion.div
                          key={`${config.title}-${config.color}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="max-w-[320px]"
                        >
                          <div className="bg-[#2B2D31] rounded-l-lg flex overflow-hidden">
                            {/* Color bar */}
                            <div
                              className="w-1 shrink-0"
                              style={{ backgroundColor: config.color }}
                            />
                            <div className="p-2.5 flex-1 min-w-0">
                              {config.useAvatar && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-[7px] font-bold text-white">
                                    A
                                  </div>
                                  <span className="text-[10px] text-white font-medium">AdminDemo</span>
                                </div>
                              )}
                              {processedTitle && (
                                <p className="text-[11px] font-semibold text-white mb-1">{processedTitle}</p>
                              )}
                              {processedDescription && (
                                <p className="text-[10px] text-[#DBDEE1] mb-2 whitespace-pre-wrap">{processedDescription}</p>
                              )}
                              {config.bannerUrl && (
                                <div className="rounded overflow-hidden mb-2">
                                  <div className="h-20 bg-[#1E1F22] flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-[#949BA4]" />
                                  </div>
                                </div>
                              )}
                              {processedFooter && (
                                <p className="text-[9px] text-[#949BA4] mt-1">{processedFooter}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Simple message preview */}
                      {activeType === 'simple' && (
                        <motion.div
                          key={config.description}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-[11px] text-[#DBDEE1]">{processedDescription}</p>
                        </motion.div>
                      )}

                      {/* Image/GIF preview */}
                      {(activeType === 'image' || activeType === 'gif') && (
                        <motion.div
                          key={config.bannerUrl}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="rounded-lg overflow-hidden border border-[#3F4147]">
                            <div className="h-32 bg-[#1E1F22] flex flex-col items-center justify-center gap-2">
                              {config.bannerUrl ? (
                                <ImageIcon className="w-8 h-8 text-[#949BA4]" />
                              ) : (
                                <>
                                  <ImageIcon className="w-8 h-8 text-[#949BA4]/30" />
                                  <p className="text-[9px] text-[#949BA4]/50">Sin imagen configurada</p>
                                </>
                              )}
                            </div>
                          </div>
                          {config.title && (
                            <p className="text-[11px] text-[#DBDEE1] mt-1.5">{processText(config.title)}</p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variables Reference */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Variables Disponibles
              </CardTitle>
              <CardDescription className="text-[10px]">
                Haz clic para copiar una variable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-1.5">
                  {variables.map(v => (
                    <TooltipProvider key={v.key}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              navigator.clipboard.writeText(v.key)
                              toast.success(`Variable ${v.key} copiada`)
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <code className="text-[10px] font-mono bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded">
                                {v.key}
                              </code>
                              <span className="text-[10px] text-muted-foreground">{v.description}</span>
                            </div>
                            <Copy className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-[10px]">
                          <p>Resultado: <strong>{v.value}</strong></p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Preview Values */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-fuchsia-400" />
                Vista de Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {variables.map(v => (
                  <div key={v.key} className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{v.key}</span>
                    <span className="font-medium text-foreground">{v.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
