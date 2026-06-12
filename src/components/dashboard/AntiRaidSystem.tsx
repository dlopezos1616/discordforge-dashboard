'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Shield, ShieldAlert, ShieldCheck, Lock, Unlock, AlertTriangle,
  Users, UserPlus, Bot, Fingerprint, Clock, Eye, CheckCircle2,
  XCircle, Activity, Zap, Swords, Loader2, Save, RotateCcw,
  Hash, UserX, ScanEye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ChannelSelector } from '@/components/shared/ChannelSelector'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AntiRaidConfig {
  id: string
  serverId: string
  enabled: boolean
  joinRateThreshold: number
  accountAgeHours: number
  requireAvatar: boolean
  similarUsernameCheck: boolean
  raidAction: string
  autoLockdown: boolean
  alertChannelId: string | null
  quarantineRoleId: string | null
  staffRoleId: string | null
  isLockedDown: boolean
  lockdownAt: string | null
  totalRaidsDetected: number
  lastRaidAt: string | null
  createdAt: string
  updatedAt: string
}

interface RaidEvent {
  id: string
  serverId: string
  type: string
  joinsDetected: number
  action: string
  isResolved: boolean
  resolvedAt: string | null
  details: string
  createdAt: string
}

// ─── Animation Variants ─────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Constants ───────────────────────────────────────────────────────────────

const raidTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  join_burst: { label: 'Ráfaga de uniones', icon: UserPlus, color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  bot_raid: { label: 'Raid de bots', icon: Bot, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  similar_names: { label: 'Nombres similares', icon: Fingerprint, color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
  manual: { label: 'Manual', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
}

const raidActionOptions = [
  { value: 'alert', label: 'Solo Alertar', icon: AlertTriangle, description: 'Solo envía una alerta al canal configurado' },
  { value: 'kick', label: 'Expulsar', icon: UserX, description: 'Expulsa automáticamente a los usuarios sospechosos' },
  { value: 'ban', label: 'Banear', icon: ShieldAlert, description: 'Banea automáticamente a los usuarios sospechosos' },
  { value: 'quarantine', label: 'Cuarentena', icon: Lock, description: 'Aísla a los usuarios con el rol de cuarentena' },
  { value: 'verify', label: 'Verificación', icon: ScanEye, description: 'Requiere verificación adicional para los nuevos usuarios' },
]

const defaultConfig: AntiRaidConfig = {
  id: '',
  serverId: '',
  enabled: false,
  joinRateThreshold: 5,
  accountAgeHours: 24,
  requireAvatar: false,
  similarUsernameCheck: false,
  raidAction: 'alert',
  autoLockdown: false,
  alertChannelId: null,
  quarantineRoleId: null,
  staffRoleId: null,
  isLockedDown: false,
  lockdownAt: null,
  totalRaidsDetected: 0,
  lastRaidAt: null,
  createdAt: '',
  updatedAt: '',
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Ahora mismo'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AntiRaidSystem() {
  const { currentServer } = useAppStore()
  const [config, setConfig] = useState<AntiRaidConfig>(defaultConfig)
  const [events, setEvents] = useState<RaidEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lockdownLoading, setLockdownLoading] = useState(false)
  const [resolvingEventId, setResolvingEventId] = useState<string | null>(null)

  // Confirm dialog for lockdown
  const [lockdownDialogOpen, setLockdownDialogOpen] = useState(false)

  // ─── Fetch Data ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/antiraid?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
      }
      if (data.events) {
        setEvents(data.events)
      }
    } catch {
      toast.error('Error al cargar la configuración de AntiRaid')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Save Config ─────────────────────────────────────────────────────────

  const handleSaveConfig = async () => {
    if (!currentServer) return
    setSaving(true)
    try {
      const method = config.id ? 'PATCH' : 'POST'
      const body: Record<string, unknown> = {
        serverId: currentServer.id,
        enabled: config.enabled,
        joinRateThreshold: config.joinRateThreshold,
        accountAgeHours: config.accountAgeHours,
        requireAvatar: config.requireAvatar,
        similarUsernameCheck: config.similarUsernameCheck,
        raidAction: config.raidAction,
        autoLockdown: config.autoLockdown,
        alertChannelId: config.alertChannelId,
        quarantineRoleId: config.quarantineRoleId,
        staffRoleId: config.staffRoleId,
      }

      const res = await fetch('/api/antiraid', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
        toast.success('Configuración guardada correctamente')
      } else {
        toast.error(data.error || 'Error al guardar la configuración')
      }
    } catch {
      toast.error('Error de conexión al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle Lockdown ─────────────────────────────────────────────────────

  const handleToggleLockdown = async () => {
    if (!currentServer) return
    setLockdownLoading(true)
    try {
      const res = await fetch('/api/antiraid?action=lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: currentServer.id }),
      })
      const data = await res.json()
      if (data.config) {
        setConfig(prev => ({
          ...prev,
          isLockedDown: data.config.isLockedDown,
          lockdownAt: data.config.lockdownAt,
        }))
        toast.success(
          data.config.isLockedDown
            ? '🔒 Lockdown activado — El servidor está protegido'
            : '🔓 Lockdown desactivado — El servidor está abierto'
        )
      } else {
        toast.error(data.error || 'Error al cambiar el estado de lockdown')
      }
    } catch {
      toast.error('Error de conexión al cambiar lockdown')
    } finally {
      setLockdownLoading(false)
      setLockdownDialogOpen(false)
    }
  }

  // ─── Resolve Raid Event ──────────────────────────────────────────────────

  const handleResolveEvent = async (eventId: string) => {
    if (!currentServer) return
    setResolvingEventId(eventId)
    try {
      const res = await fetch('/api/antiraid?action=resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: currentServer.id, eventId }),
      })
      const data = await res.json()
      if (data.success) {
        setEvents(prev =>
          prev.map(e => (e.id === eventId ? { ...e, isResolved: true, resolvedAt: new Date().toISOString() } : e))
        )
        toast.success('Evento de raid resuelto')
      } else {
        toast.error(data.error || 'Error al resolver el evento')
      }
    } catch {
      toast.error('Error de conexión al resolver evento')
    } finally {
      setResolvingEventId(null)
    }
  }

  // ─── Master Toggle ───────────────────────────────────────────────────────

  const handleMasterToggle = async (enabled: boolean) => {
    if (!currentServer) return
    const prevEnabled = config.enabled
    setConfig(prev => ({ ...prev, enabled }))
    try {
      const res = await fetch('/api/antiraid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: currentServer.id, enabled }),
      })
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
        toast.success(enabled ? '🛡️ AntiRaid activado' : 'AntiRaid desactivado')
      } else {
        setConfig(prev => ({ ...prev, enabled: prevEnabled }))
        toast.error('Error al cambiar estado de AntiRaid')
      }
    } catch {
      setConfig(prev => ({ ...prev, enabled: prevEnabled }))
      toast.error('Error de conexión')
    }
  }

  // ─── Status Badge ────────────────────────────────────────────────────────

  const getStatusBadge = () => {
    if (config.isLockedDown) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 gap-1.5 px-3 py-1 text-sm font-semibold animate-pulse">
          <Lock className="w-3.5 h-3.5" />
          Lockdown Activo
        </Badge>
      )
    }
    if (config.enabled) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 gap-1.5 px-3 py-1 text-sm font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Activo
        </Badge>
      )
    }
    return (
      <Badge className="bg-zinc-500/20 text-zinc-400 border border-zinc-500/40 gap-1.5 px-3 py-1 text-sm font-semibold">
        <XCircle className="w-3.5 h-3.5" />
        Desactivado
      </Badge>
    )
  }

  // ─── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  // ─── No Server ───────────────────────────────────────────────────────────

  if (!currentServer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Shield className="w-12 h-12 opacity-40" />
        <p className="text-lg">Selecciona un servidor para configurar AntiRaid</p>
      </div>
    )
  }

  // ─── Unresolved raids count ──────────────────────────────────────────────

  const unresolvedRaids = events.filter(e => !e.isResolved).length

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">
      {/* ── Header Section ──────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/10 border border-rose-500/20">
            <Shield className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🛡️ AntiRaid</h1>
            <p className="text-sm text-muted-foreground">Protección contra ataques al servidor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <div className="flex items-center gap-2 bg-background/60 border rounded-lg px-3 py-1.5">
            <Label htmlFor="master-toggle" className="text-sm font-medium cursor-pointer">
              {config.enabled ? 'Activado' : 'Desactivado'}
            </Label>
            <Switch
              id="master-toggle"
              checked={config.enabled}
              onCheckedChange={handleMasterToggle}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Emergency Actions Bar ───────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className={`relative overflow-hidden border-2 ${config.isLockedDown ? 'border-red-500/60' : 'border-rose-500/30'}`}>
          {/* Red gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${config.isLockedDown ? 'from-red-600/15 via-red-500/10 to-rose-600/15' : 'from-rose-600/10 via-rose-500/5 to-red-600/10'} pointer-events-none`} />
          {/* Pulsing border glow when locked down */}
          {config.isLockedDown && (
            <div className="absolute inset-0 rounded-lg ring-2 ring-red-500/30 animate-pulse pointer-events-none" />
          )}

          <CardHeader className="relative pb-3">
            <div className="flex items-center gap-2">
              {config.isLockedDown ? (
                <Lock className="w-5 h-5 text-red-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              )}
              <CardTitle className="text-lg">
                {config.isLockedDown ? '🔒 Servidor en Lockdown' : '⚠️ Acciones de Emergencia'}
              </CardTitle>
            </div>
            <CardDescription>
              {config.isLockedDown
                ? 'El servidor está bloqueado. Los nuevos usuarios no pueden unirse.'
                : 'Activa lockdown en caso de emergencia para proteger el servidor.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                onClick={() => setLockdownDialogOpen(true)}
                disabled={lockdownLoading || !config.enabled}
                className={`gap-2 font-semibold px-6 ${
                  config.isLockedDown
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                size="lg"
              >
                {lockdownLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : config.isLockedDown ? (
                  <Unlock className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {config.isLockedDown ? '🔓 Desactivar Lockdown' : '🔒 Activar Lockdown'}
              </Button>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${config.isLockedDown ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-sm text-muted-foreground">
                    {config.isLockedDown ? 'Bloqueado' : 'Abierto'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    📊 Estado del Servidor:{' '}
                    <span className={config.isLockedDown ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                      {config.isLockedDown ? 'En Lockdown' : 'Normal'}
                    </span>
                  </span>
                </div>

                {config.isLockedDown && config.lockdownAt && (
                  <div className="flex items-center gap-1.5 text-sm text-red-400/80">
                    <Clock className="w-3.5 h-3.5" />
                    Desde {formatRelativeTime(config.lockdownAt)}
                  </div>
                )}
              </div>
            </div>

            {unresolvedRaids > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm text-red-300">
                  ¡Atención! Hay <strong>{unresolvedRaids}</strong> raid{unresolvedRaids > 1 ? 's' : ''} sin resolver
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Main Grid: Detection + Actions ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Detection Settings Card ─────────────────────────────────── */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/10">
                  <ScanEye className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Detección</CardTitle>
                  <CardDescription>Configura los umbrales de detección de raids</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Join Rate Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-400" />
                    Umbral de uniones
                  </Label>
                  <Badge variant="secondary" className="font-mono text-sm">
                    {config.joinRateThreshold} uniones/min
                  </Badge>
                </div>
                <Slider
                  value={[config.joinRateThreshold]}
                  onValueChange={([v]) => setConfig(prev => ({ ...prev, joinRateThreshold: v }))}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Cantidad de uniones por minuto necesarias para activar la alerta de raid
                </p>
              </div>

              <Separator />

              {/* Account Age Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Filtro de edad de cuenta
                  </Label>
                  <Badge variant="secondary" className="font-mono text-sm">
                    {config.accountAgeHours === 0 ? 'Desactivado' : config.accountAgeHours >= 24
                      ? `${Math.floor(config.accountAgeHours / 24)}d ${config.accountAgeHours % 24}h`
                      : `${config.accountAgeHours}h`}
                  </Badge>
                </div>
                <Slider
                  value={[config.accountAgeHours]}
                  onValueChange={([v]) => setConfig(prev => ({ ...prev, accountAgeHours: v }))}
                  min={0}
                  max={168}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Marcar cuentas con menos de X horas de antigüedad como sospechosas (0 = desactivado, máx 7 días)
                </p>
              </div>

              <Separator />

              {/* Require Avatar */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-400" />
                    Requerir avatar
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Los usuarios sin avatar serán marcados como sospechosos
                  </p>
                </div>
                <Switch
                  checked={config.requireAvatar}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, requireAvatar: v }))}
                />
              </div>

              <Separator />

              {/* Similar Username Check */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-purple-400" />
                    Nombres similares
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Detectar patrones de nombres de usuario similares
                  </p>
                </div>
                <Switch
                  checked={config.similarUsernameCheck}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, similarUsernameCheck: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Actions on Raid Card ─────────────────────────────────────── */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-rose-600/10">
                  <Swords className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Acción en Raid</CardTitle>
                  <CardDescription>Define qué hacer cuando se detecte un raid</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Raid Action */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Acción al detectar raid</Label>
                <Select
                  value={config.raidAction}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, raidAction: v }))}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {raidActionOptions.map(opt => {
                      const Icon = opt.icon
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {raidActionOptions.find(o => o.value === config.raidAction)?.description}
                </p>
              </div>

              <Separator />

              {/* Auto Lockdown */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Lockdown automático
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Activar lockdown automáticamente al detectar un raid
                  </p>
                </div>
                <Switch
                  checked={config.autoLockdown}
                  onCheckedChange={(v) => setConfig(prev => ({ ...prev, autoLockdown: v }))}
                />
              </div>

              <Separator />

              {/* Alert Channel */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-400" />
                  Canal de alertas
                </Label>
                <ChannelSelector
                  value={config.alertChannelId}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, alertChannelId: v }))}
                  placeholder="Seleccionar canal de alertas..."
                />
              </div>

              <Separator />

              {/* Quarantine Role ID */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-400" />
                  Rol de cuarentena
                </Label>
                <Input
                  placeholder="ID del rol de cuarentena"
                  value={config.quarantineRoleId || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, quarantineRoleId: e.target.value || null }))}
                  className="bg-background/50 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Rol asignado a usuarios sospechosos al usar la acción Cuarentena
                </p>
              </div>

              <Separator />

              {/* Staff Role ID */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Rol de staff
                </Label>
                <Input
                  placeholder="ID del rol de staff"
                  value={config.staffRoleId || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, staffRoleId: e.target.value || null }))}
                  className="bg-background/50 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Usuarios con este rol no serán afectados por las acciones de AntiRaid
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="gap-2 flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchData}
                  disabled={saving}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Raid History Card ───────────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/10">
                  <Activity className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Historial de Raids</CardTitle>
                  <CardDescription>Registro de eventos de raid detectados</CardDescription>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold text-foreground">{config.totalRaidsDetected}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Último:</span>
                  <span className="font-semibold text-foreground">{formatRelativeTime(config.lastRaidAt)}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <ShieldCheck className="w-12 h-12 opacity-30" />
                <p className="text-sm">No se han detectado raids todavía</p>
                <p className="text-xs opacity-60">Los eventos de raid aparecerán aquí cuando se detecten</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-3 pr-3">
                  <AnimatePresence>
                    {events.map((event, index) => {
                      const typeConf = raidTypeConfig[event.type] || raidTypeConfig.manual
                      const TypeIcon = typeConf.icon

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.03, duration: 0.3 }}
                          className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                            event.isResolved
                              ? 'bg-background/30 border-border/50 opacity-70'
                              : 'bg-background/60 border-border hover:border-foreground/20'
                          }`}
                        >
                          {/* Type Icon */}
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${typeConf.bg} border`}>
                            <TypeIcon className={`w-5 h-5 ${typeConf.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${typeConf.bg} ${typeConf.color} border text-xs font-medium`}>
                                {typeConf.label}
                              </Badge>
                              <span className="text-sm font-medium">
                                {event.joinsDetected} uniones detectadas
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(event.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                {raidActionOptions.find(o => o.value === event.action)?.label || event.action}
                              </span>
                            </div>
                            {/* Show event details if available */}
                            {event.details && (() => {
                              try {
                                const details = JSON.parse(event.details)
                                if (details && typeof details === 'object' && Object.keys(details).length > 0) {
                                  return (
                                    <div className="text-xs text-muted-foreground/70 mt-1">
                                      {Object.entries(details).slice(0, 3).map(([k, v]) => (
                                        <span key={k} className="mr-3">
                                          {k}: <span className="font-medium">{String(v)}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )
                                }
                                return null
                              } catch {
                                return null
                              }
                            })()}
                          </div>

                          {/* Status & Action */}
                          <div className="flex items-center gap-3 shrink-0">
                            {event.isResolved ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1 text-xs">
                                <CheckCircle2 className="w-3 h-3" />
                                Resuelto
                              </Badge>
                            ) : (
                              <>
                                <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 gap-1 text-xs">
                                  <AlertTriangle className="w-3 h-3" />
                                  Activo
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolveEvent(event.id)}
                                  disabled={resolvingEventId === event.id}
                                  className="gap-1.5 text-xs h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                >
                                  {resolvingEventId === event.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  Resolver
                                </Button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Lockdown Confirm Dialog ─────────────────────────────────────── */}
      <Dialog open={lockdownDialogOpen} onOpenChange={setLockdownDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {config.isLockedDown ? (
                <>
                  <Unlock className="w-5 h-5 text-emerald-400" />
                  ¿Desactivar Lockdown?
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-red-400" />
                  ¿Activar Lockdown?
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {config.isLockedDown
                ? 'El servidor volverá a estar abierto para nuevos usuarios. Asegúrate de que la amenaza haya pasado.'
                : 'Se bloquearán todas las nuevas uniones al servidor. Solo el staff podrá ingresar nuevos miembros manualmente.'}
            </DialogDescription>
          </DialogHeader>

          {!config.isLockedDown && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-300 space-y-1">
                <p className="font-medium">Esta es una acción de emergencia</p>
                <p className="text-xs opacity-80">
                  Solo debes activar lockdown cuando detectes un ataque activo al servidor.
                  Los usuarios legítimos también serán bloqueados.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLockdownDialogOpen(false)}
              disabled={lockdownLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleToggleLockdown}
              disabled={lockdownLoading}
              className={`gap-2 ${
                config.isLockedDown
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {lockdownLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : config.isLockedDown ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {config.isLockedDown ? 'Desactivar Lockdown' : 'Activar Lockdown'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
