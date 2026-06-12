'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  ShieldCheck, MousePointer, SmilePlus, Calculator,
  Image as ImageIcon, ToggleLeft, ToggleRight, Hash, Users,
  Info, Sparkles, Eye, CheckCircle2, MessageSquare,
  KeyRound
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

type VerificationType = 'button' | 'reaction' | 'captcha_math' | 'captcha_visual'

interface VerificationConfig {
  enabled: boolean
  type: VerificationType
  channelId: string
  roleId: string
  message: string
  acceptRules: boolean
  autoRole: boolean
  captchaDifficulty: string
  emoji: string
  buttonText: string
  numQuestions: number
  imageProvider: string
}

const verificationTypes = [
  {
    id: 'button' as VerificationType,
    label: 'Botón',
    icon: MousePointer,
    description: 'Verificación con un simple clic en un botón',
    color: 'from-violet-500/20 to-violet-600/10',
    iconColor: 'text-violet-400',
  },
  {
    id: 'reaction' as VerificationType,
    label: 'Reacción',
    icon: SmilePlus,
    description: 'Verificación reaccionando a un mensaje',
    color: 'from-fuchsia-500/20 to-fuchsia-600/10',
    iconColor: 'text-fuchsia-400',
  },
  {
    id: 'captcha_math' as VerificationType,
    label: 'Captcha Matemático',
    icon: Calculator,
    description: 'Resuelve operaciones matemáticas para verificar',
    color: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
  },
  {
    id: 'captcha_visual' as VerificationType,
    label: 'Captcha Visual',
    icon: ImageIcon,
    description: 'Resuelve un captcha visual tipo imagen',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
  },
]

const variables = [
  { name: '{user}', desc: 'Mención del usuario' },
  { name: '{username}', desc: 'Nombre del usuario' },
  { name: '{server}', desc: 'Nombre del servidor' },
  { name: '{memberCount}', desc: 'Número de miembros' },
]

const tips = [
  'Usa un canal dedicado para la verificación',
  'Activa auto-rol para asignar el rol automáticamente',
  'El captcha matemático es ideal contra bots',
  'Combina con Auto Mod para máxima protección',
]

export function VerificationSystem() {
  const { currentServer } = useAppStore()
  const [config, setConfig] = useState<VerificationConfig>({
    enabled: false,
    type: 'button',
    channelId: '',
    roleId: '',
    message: '¡Haz clic en el botón para verificar tu cuenta!',
    acceptRules: false,
    autoRole: true,
    captchaDifficulty: 'easy',
    emoji: '✅',
    buttonText: 'Verificarme',
    numQuestions: 3,
    imageProvider: 'default',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!currentServer) return
    setSaving(true)
    try {
      // In a real app, this would POST to an API
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success('Configuración de verificación guardada')
    } catch {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: keyof VerificationConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  // Preview helpers
  const getPreviewContent = () => {
    switch (config.type) {
      case 'button':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                B
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-400">Bot de Verificación</p>
                <p className="text-[10px] text-muted-foreground">Hoy a las 12:00</p>
              </div>
            </div>
            <div className="bg-[#2b2d31] rounded-lg p-3 space-y-3">
              <p className="text-sm text-gray-200">{config.message || '¡Haz clic en el botón para verificar tu cuenta!'}</p>
              {config.acceptRules && (
                <p className="text-xs text-gray-400">✅ Al verificar, aceptas las reglas del servidor</p>
              )}
              <button className="px-4 py-1.5 rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-medium">
                {config.buttonText || 'Verificarme'}
              </button>
            </div>
          </div>
        )
      case 'reaction':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                B
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-400">Bot de Verificación</p>
                <p className="text-[10px] text-muted-foreground">Hoy a las 12:00</p>
              </div>
            </div>
            <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
              <p className="text-sm text-gray-200">{config.message || '¡Reacciona para verificar tu cuenta!'}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-lg">{config.emoji || '✅'}</span>
                <span className="text-xs text-gray-400">Reacciona con {config.emoji || '✅'}</span>
              </div>
            </div>
          </div>
        )
      case 'captcha_math':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                B
              </div>
              <div>
                <p className="text-xs font-semibold text-cyan-400">Bot de Verificación</p>
                <p className="text-[10px] text-muted-foreground">Hoy a las 12:00</p>
              </div>
            </div>
            <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
              <p className="text-sm text-gray-200">Resuelve el captcha para verificar tu cuenta</p>
              <div className="bg-[#1e1f22] rounded p-3 text-center">
                <p className="text-2xl font-mono font-bold text-cyan-400">
                  {config.captchaDifficulty === 'easy' ? '7 + 3 = ?' :
                   config.captchaDifficulty === 'medium' ? '24 × 3 = ?' :
                   '147 ÷ 7 + 12 = ?'}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#1e1f22] rounded px-3 py-1.5 text-xs text-gray-400">
                  Escribe tu respuesta...
                </div>
                <button className="px-3 py-1.5 rounded bg-cyan-500 text-white text-xs font-medium">
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )
      case 'captcha_visual':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-xs font-bold text-white">
                B
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400">Bot de Verificación</p>
                <p className="text-[10px] text-muted-foreground">Hoy a las 12:00</p>
              </div>
            </div>
            <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
              <p className="text-sm text-gray-200">Selecciona las imágenes con semáforos</p>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded ${
                      i === 2 || i === 4 || i === 7
                        ? 'bg-emerald-500/30 border-2 border-emerald-500/50'
                        : 'bg-[#1e1f22] border border-gray-700/50'
                    } flex items-center justify-center`}
                  >
                    {(i === 2 || i === 4 || i === 7) && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                ))}
              </div>
              <button className="w-full py-1.5 rounded bg-emerald-500 text-white text-xs font-medium">
                Verificar
              </button>
            </div>
          </div>
        )
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
            Sistema de Verificación
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configura la verificación de nuevos miembros
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {config.enabled ? 'Activado' : 'Desactivado'}
          </span>
          <Switch
            checked={config.enabled}
            onCheckedChange={(v) => updateConfig('enabled', v)}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-fuchsia-500"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left side - Configuration */}
        <div className="lg:col-span-3 space-y-6">
          {/* Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-violet-400" />
                  Tipo de Verificación
                </CardTitle>
                <CardDescription>Selecciona el método de verificación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {verificationTypes.map((vt) => (
                    <motion.button
                      key={vt.id}
                      onClick={() => updateConfig('type', vt.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        config.type === vt.id
                          ? 'border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                          : 'border-border/50 bg-card/50 hover:bg-accent/30 hover:border-border'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {config.type === vt.id && (
                        <motion.div
                          layoutId="verification-type-glow"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative space-y-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${vt.color} inline-flex`}>
                          <vt.icon className={`w-5 h-5 ${vt.iconColor}`} />
                        </div>
                        <p className="text-sm font-semibold">{vt.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{vt.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Configuration Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Mensaje de Verificación</Label>
                  <Input
                    placeholder="Mensaje que verán los usuarios..."
                    value={config.message}
                    onChange={(e) => updateConfig('message', e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                {/* Type-specific config */}
                <AnimatePresence mode="wait">
                  {config.type === 'button' && (
                    <motion.div
                      key="button-config"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Texto del Botón</Label>
                          <Input
                            placeholder="Verificarme"
                            value={config.buttonText}
                            onChange={(e) => updateConfig('buttonText', e.target.value)}
                            className="bg-background/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Emoji</Label>
                          <Input
                            placeholder="✅"
                            value={config.emoji}
                            onChange={(e) => updateConfig('emoji', e.target.value)}
                            className="bg-background/50"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="accept-rules"
                          checked={config.acceptRules}
                          onCheckedChange={(v) => updateConfig('acceptRules', v)}
                        />
                        <Label htmlFor="accept-rules" className="text-xs">
                          Al verificar, acepta las reglas del servidor
                        </Label>
                      </div>
                    </motion.div>
                  )}

                  {config.type === 'reaction' && (
                    <motion.div
                      key="reaction-config"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Emoji de Reacción</Label>
                        <Input
                          placeholder="✅"
                          value={config.emoji}
                          onChange={(e) => updateConfig('emoji', e.target.value)}
                          className="bg-background/50 max-w-48"
                        />
                      </div>
                    </motion.div>
                  )}

                  {config.type === 'captcha_math' && (
                    <motion.div
                      key="captcha-math-config"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Dificultad</Label>
                          <Select
                            value={config.captchaDifficulty}
                            onValueChange={(v) => updateConfig('captchaDifficulty', v)}
                          >
                            <SelectTrigger className="bg-background/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Fácil (suma/resta)</SelectItem>
                              <SelectItem value="medium">Medio (multiplicación)</SelectItem>
                              <SelectItem value="hard">Difícil (operaciones mixtas)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Nº de Preguntas</Label>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={config.numQuestions}
                            onChange={(e) => updateConfig('numQuestions', parseInt(e.target.value) || 1)}
                            className="bg-background/50"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {config.type === 'captcha_visual' && (
                    <motion.div
                      key="captcha-visual-config"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Proveedor de Imágenes</Label>
                        <Select
                          value={config.imageProvider}
                          onValueChange={(v) => updateConfig('imageProvider', v)}
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Predeterminado</SelectItem>
                            <SelectItem value="hcaptcha">hCaptcha</SelectItem>
                            <SelectItem value="recaptcha">reCAPTCHA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Separator className="opacity-50" />

                {/* Common settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Canal
                    </Label>
                    <Input
                      placeholder="ID del canal"
                      value={config.channelId}
                      onChange={(e) => updateConfig('channelId', e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> Rol Verificado
                    </Label>
                    <Input
                      placeholder="ID del rol"
                      value={config.roleId}
                      onChange={(e) => updateConfig('roleId', e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.autoRole}
                    onCheckedChange={(v) => updateConfig('autoRole', v)}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-fuchsia-500"
                  />
                  <Label className="text-xs">Auto-asignar rol al verificar</Label>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                >
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right side - Preview & Tips */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-violet-400" />
                  Vista Previa
                </CardTitle>
                <CardDescription>Así se verá en Discord</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-[#313338] rounded-lg p-4 min-h-[200px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={config.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getPreviewContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Variables */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  Variables Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {variables.map((v) => (
                    <div key={v.name} className="flex items-center justify-between py-1">
                      <code className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded font-mono">
                        {v.name}
                      </code>
                      <span className="text-xs text-muted-foreground">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-violet-400" />
                  Consejos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 mt-1.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
