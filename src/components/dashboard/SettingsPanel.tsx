'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Settings, Save, Hash, Globe, Shield, MessageSquare,
  Ticket, Moon, AlertTriangle, Trash2, Bot, Server
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChannelSelector } from '@/components/shared/ChannelSelector'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface ServerConfigData {
  id: string
  serverId: string
  prefix: string
  language: string
  logChannelId: string | null
  modLogChannelId: string | null
  welcomeChannelId: string | null
  ticketLogChannelId: string | null
  autoModEnabled: boolean
  raidProtectionEnabled: boolean
  darkModeDefault: boolean
  maxTicketsPerUser: number
}

export function SettingsPanel() {
  const { currentServer } = useAppStore()
  const [config, setConfig] = useState<ServerConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [prefix, setPrefix] = useState('!')
  const [language, setLanguage] = useState('es')
  const [logChannelId, setLogChannelId] = useState('')
  const [modLogChannelId, setModLogChannelId] = useState('')
  const [welcomeChannelId, setWelcomeChannelId] = useState('')
  const [ticketLogChannelId, setTicketLogChannelId] = useState('')
  const [autoModEnabled, setAutoModEnabled] = useState(true)
  const [raidProtection, setRaidProtection] = useState(false)
  const [darkModeDefault, setDarkModeDefault] = useState(true)
  const [maxTickets, setMaxTickets] = useState('3')

  const fetchData = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/settings?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
        setPrefix(data.config.prefix)
        setLanguage(data.config.language)
        setLogChannelId(data.config.logChannelId || '')
        setModLogChannelId(data.config.modLogChannelId || '')
        setWelcomeChannelId(data.config.welcomeChannelId || '')
        setTicketLogChannelId(data.config.ticketLogChannelId || '')
        setAutoModEnabled(data.config.autoModEnabled)
        setRaidProtection(data.config.raidProtectionEnabled)
        setDarkModeDefault(data.config.darkModeDefault)
        setMaxTickets(String(data.config.maxTicketsPerUser))
      }
    } catch {
      toast.error('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!currentServer) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          prefix,
          language,
          logChannelId: logChannelId || null,
          modLogChannelId: modLogChannelId || null,
          welcomeChannelId: welcomeChannelId || null,
          ticketLogChannelId: ticketLogChannelId || null,
          autoModEnabled,
          raidProtectionEnabled: raidProtection,
          darkModeDefault,
          maxTicketsPerUser: parseInt(maxTickets) || 3,
        }),
      })
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
        toast.success('Configuración guardada exitosamente')
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!currentServer) return
    try {
      await fetch(`/api/settings?serverId=${currentServer.id}`, { method: 'DELETE' })
      toast.success('Configuración reiniciada')
      fetchData()
    } catch {
      toast.error('Error al reiniciar configuración')
    }
  }

  const handleRemoveBot = () => {
    toast.success('Bot eliminado del servidor (simulado)')
  }

  const hasChanges = config && (
    prefix !== config.prefix ||
    language !== config.language ||
    (logChannelId || null) !== config.logChannelId ||
    (modLogChannelId || null) !== config.modLogChannelId ||
    (welcomeChannelId || null) !== config.welcomeChannelId ||
    (ticketLogChannelId || null) !== config.ticketLogChannelId ||
    autoModEnabled !== config.autoModEnabled ||
    raidProtection !== config.raidProtectionEnabled ||
    darkModeDefault !== config.darkModeDefault ||
    parseInt(maxTickets) !== config.maxTicketsPerUser
  )

  if (loading) {
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Configuración
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ajustes del servidor {currentServer?.name}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Cambios
        </Button>
      </motion.div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
            Hay cambios sin guardar
          </Badge>
        </motion.div>
      )}

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-violet-400" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Nombre del Servidor</Label>
                <Input
                  value={currentServer?.name || ''}
                  disabled
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Prefijo del Bot</Label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="bg-background/50"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-background/50">
                    <Globe className="w-3.5 h-3.5 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Channel Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="w-5 h-5 text-violet-400" />
              Canales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Canal de Logs
                </Label>
                <ChannelSelector
                  value={logChannelId || null}
                  onValueChange={setLogChannelId}
                  placeholder="Seleccionar canal de logs..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Canal de Mod Logs
                </Label>
                <ChannelSelector
                  value={modLogChannelId || null}
                  onValueChange={setModLogChannelId}
                  placeholder="Seleccionar canal de mod logs..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Canal de Bienvenida
                </Label>
                <ChannelSelector
                  value={welcomeChannelId || null}
                  onValueChange={setWelcomeChannelId}
                  placeholder="Seleccionar canal de bienvenida..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Ticket className="w-3 h-3" />
                  Canal de Ticket Logs
                </Label>
                <ChannelSelector
                  value={ticketLogChannelId || null}
                  onValueChange={setTicketLogChannelId}
                  placeholder="Seleccionar canal de ticket logs..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Toggle Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" />
              Ajustes de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-Moderación</Label>
                <p className="text-xs text-muted-foreground">Activar el sistema de auto-moderación</p>
              </div>
              <Switch checked={autoModEnabled} onCheckedChange={setAutoModEnabled} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Protección Anti-Raid</Label>
                <p className="text-xs text-muted-foreground">Detectar y prevenir raids al servidor</p>
              </div>
              <Switch checked={raidProtection} onCheckedChange={setRaidProtection} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Modo Oscuro por Defecto</Label>
                <p className="text-xs text-muted-foreground">Establecer modo oscuro como tema predeterminado</p>
              </div>
              <Switch checked={darkModeDefault} onCheckedChange={setDarkModeDefault} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Máximo de Tickets por Usuario</Label>
                <p className="text-xs text-muted-foreground">Límite de tickets abiertos simultáneamente</p>
              </div>
              <Input
                type="number"
                min="1"
                max="20"
                value={maxTickets}
                onChange={(e) => setMaxTickets(e.target.value)}
                className="bg-background/50 w-20 text-center"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-card/80 backdrop-blur-sm border-red-500/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Zona de Peligro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Reiniciar Configuración</Label>
                <p className="text-xs text-muted-foreground">Restaurar todos los ajustes a sus valores por defecto</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                    Reiniciar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción reiniciará toda la configuración del servidor a sus valores por defecto. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                      Reiniciar Configuración
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Eliminar Bot del Servidor</Label>
                <p className="text-xs text-muted-foreground">Remover completamente el bot del servidor</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Bot className="w-3.5 h-3.5" />
                    Eliminar Bot
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar bot del servidor?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El bot será removido del servidor y toda la configuración se perderá. Esta acción es irreversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveBot} className="bg-red-600 hover:bg-red-700">
                      Eliminar Bot
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
