'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Bot, Save, Upload, Trash2, User, ImagePlus, AlertTriangle,
  Info, RefreshCw, Camera, X, Check, Loader2, Shield, Globe,
  Clock, Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

/* ────────────── Types ────────────── */

interface BotData {
  username: string
  avatar: string | null
  id: string
}

/* ────────────── Animation Variants ────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

/* ────────────── Default Discord Avatar ────────────── */

function DefaultAvatar({ username }: { username: string }) {
  const colorMap: Record<string, string> = {
    a: '#5865F2', b: '#57F287', c: '#FEE75C', d: '#EB459E',
    e: '#ED4245', f: '#5865F2', g: '#57F287', h: '#FEE75C',
    i: '#EB459E', j: '#ED4245', k: '#5865F2', l: '#57F287',
    m: '#FEE75C', n: '#EB459E', o: '#ED4245', p: '#5865F2',
    q: '#57F287', r: '#FEE75C', s: '#EB459E', t: '#ED4245',
    u: '#5865F2', v: '#57F287', w: '#FEE75C', x: '#EB459E',
    y: '#ED4245', z: '#5865F2',
  }
  const firstChar = username.charAt(0).toLowerCase()
  const bgColor = colorMap[firstChar] || '#5865F2'

  return (
    <div
      className="w-full h-full rounded-full flex items-center justify-center"
      style={{ backgroundColor: bgColor }}
    >
      <svg width="60%" height="60%" viewBox="0 0 24 24" fill="white">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
      </svg>
    </div>
  )
}

/* ────────────── Main Component ────────────── */

export function BotCustomization() {
  const { currentServer } = useAppStore()

  /* ── State ── */
  const [bot, setBot] = useState<BotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingUsername, setSavingUsername] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)

  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')

  const [newAvatar, setNewAvatar] = useState<string | null>(null) // base64 data URI for preview
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Fetch Bot Data ── */
  const fetchBot = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bot/customize?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.bot) {
        setBot(data.bot)
        setNewUsername(data.bot.username)
      }
    } catch {
      toast.error('Error al cargar los datos del bot')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchBot()
  }, [fetchBot])

  /* ── Username Validation ── */
  const validateUsername = (value: string): boolean => {
    if (value.length < 2) {
      setUsernameError('El nombre debe tener al menos 2 caracteres')
      return false
    }
    if (value.length > 32) {
      setUsernameError('El nombre no puede exceder 32 caracteres')
      return false
    }
    if (value !== value.trim()) {
      setUsernameError('El nombre no puede empezar o terminar con espacios')
      return false
    }
    setUsernameError('')
    return true
  }

  const handleUsernameChange = (value: string) => {
    setNewUsername(value)
    if (value && value !== bot?.username) {
      validateUsername(value)
    } else {
      setUsernameError('')
    }
  }

  /* ── Save Username ── */
  const handleSaveUsername = async () => {
    if (!currentServer || !bot) return
    if (!validateUsername(newUsername)) return
    if (newUsername === bot.username) {
      toast.error('El nombre es el mismo que el actual')
      return
    }
    setSavingUsername(true)
    try {
      const res = await fetch('/api/bot/customize', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          username: newUsername,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setBot(data.bot)
        toast.success('Nombre del bot actualizado correctamente')
      } else {
        toast.error(data.error || 'Error al actualizar el nombre')
      }
    } catch {
      toast.error('Error de conexión al actualizar el nombre')
    } finally {
      setSavingUsername(false)
    }
  }

  /* ── Avatar File Handling ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setAvatarError('Formato no soportado. Usa PNG, JPG o GIF.')
      return
    }

    // Validate file size (256KB)
    const maxSize = 256 * 1024
    if (file.size > maxSize) {
      setAvatarError('El archivo supera el límite de 256KB')
      return
    }

    setAvatarError('')
    setAvatarFile(file)

    // Convert to base64 for preview and API submission
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setNewAvatar(base64)
    }
    reader.onerror = () => {
      setAvatarError('Error al leer el archivo')
    }
    reader.readAsDataURL(file)
  }

  /* ── Save Avatar ── */
  const handleSaveAvatar = async () => {
    if (!currentServer || !bot || !newAvatar) return
    setSavingAvatar(true)
    try {
      const res = await fetch('/api/bot/customize', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          avatar: newAvatar,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setBot(data.bot)
        setNewAvatar(null)
        setAvatarFile(null)
        toast.success('Avatar del bot actualizado correctamente')
      } else {
        toast.error(data.error || 'Error al actualizar el avatar')
      }
    } catch {
      toast.error('Error de conexión al actualizar el avatar')
    } finally {
      setSavingAvatar(false)
    }
  }

  /* ── Reset Avatar ── */
  const handleResetAvatar = async () => {
    if (!currentServer || !bot) return
    setSavingAvatar(true)
    try {
      const res = await fetch('/api/bot/customize', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          avatar: null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setBot(data.bot)
        setNewAvatar(null)
        setAvatarFile(null)
        toast.success('Avatar restaurado al valor por defecto')
      } else {
        toast.error(data.error || 'Error al restaurar el avatar')
      }
    } catch {
      toast.error('Error de conexión al restaurar el avatar')
    } finally {
      setSavingAvatar(false)
    }
  }

  /* ── Clear Avatar Preview ── */
  const handleClearAvatarPreview = () => {
    setNewAvatar(null)
    setAvatarFile(null)
    setAvatarError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /* ── Derived State ── */
  const usernameChanged = newUsername !== (bot?.username ?? '') && newUsername.trim().length > 0
  const avatarChanged = newAvatar !== null

  /* ── Loading State ── */
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

  /* ── No Server ── */
  if (!currentServer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Selecciona un servidor para continuar</p>
      </div>
    )
  }

  /* ── Render ── */
  const displayAvatar = newAvatar || bot?.avatar

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
            🤖 Personalización del Bot
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Personaliza el nombre y la imagen de perfil de tu bot en Discord
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs gap-1.5"
        >
          <Sparkles className="w-3 h-3" />
          {currentServer.name}
        </Badge>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* ─── Column 1: Bot Preview ─── */}
        <motion.div variants={item} className="lg:col-span-1">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                Vista Previa
              </CardTitle>
              <CardDescription className="text-xs">
                Así se verá tu bot en Discord
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Discord-style profile popup */}
              <div className="bg-[#2B2D31] rounded-lg overflow-hidden shadow-xl">
                {/* Banner gradient */}
                <div className="h-16 bg-gradient-to-r from-emerald-600/60 to-teal-600/60 relative">
                  {avatarChanged && (
                    <div className="absolute top-1 right-1">
                      <Badge className="bg-amber-500/90 text-white text-[9px] px-1.5 py-0 border-0">
                        Vista previa
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="px-4 -mt-10 relative z-10">
                  <div className="w-[80px] h-[80px] rounded-full border-4 border-[#2B2D31] overflow-hidden bg-[#1E1F22] relative group">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt="Bot avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar username={bot?.username || 'Bot'} />
                    )}
                  </div>
                </div>

                {/* User info */}
                <div className="px-4 pt-2 pb-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold text-base truncate">
                      {newUsername || bot?.username || 'Bot'}
                    </span>
                    <Badge className="bg-[#5865F2] text-white text-[9px] px-1 py-0 border-0 rounded-sm font-medium">
                      BOT
                    </Badge>
                  </div>
                  <div className="border-t border-[#3F4147] pt-2 mt-2">
                    <p className="text-[#B5BAC1] text-xs font-semibold uppercase mb-1">Miembro desde</p>
                    <p className="text-[#DBDEE1] text-xs">Hoy</p>
                  </div>
                  {bot?.id && (
                    <div className="border-t border-[#3F4147] pt-2 mt-2">
                      <p className="text-[#B5BAC1] text-[10px] font-mono select-all">
                        ID: {bot.id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Column 2-3: Settings ─── */}
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          {/* ─── Username Card ─── */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                Nombre del Bot
              </CardTitle>
              <CardDescription className="text-xs">
                Cambia el nombre de usuario de tu bot. Este cambio es global y afecta todos los servidores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current username */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Nombre actual</Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border/50">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{bot?.username || '—'}</span>
                </div>
              </div>

              {/* New username input */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Nuevo nombre</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={newUsername}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="Introduce el nuevo nombre..."
                      maxLength={32}
                      className={`bg-background/50 pr-10 ${
                        usernameError
                          ? 'border-red-500/50 focus-visible:ring-red-500/30'
                          : usernameChanged
                          ? 'border-emerald-500/50 focus-visible:ring-emerald-500/30'
                          : ''
                      }`}
                    />
                    {usernameChanged && !usernameError && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <Button
                    onClick={handleSaveUsername}
                    disabled={savingUsername || !usernameChanged || !!usernameError}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white min-w-[100px]"
                  >
                    {savingUsername ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar
                  </Button>
                </div>
                {/* Validation feedback */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {usernameError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {usernameError}
                      </motion.p>
                    )}
                  </div>
                  <span className={`text-xs ${
                    (newUsername?.length || 0) > 28
                      ? 'text-amber-400'
                      : 'text-muted-foreground'
                  }`}>
                    {newUsername?.length || 0}/32
                  </span>
                </div>
              </div>

              <Separator />

              {/* Rate limit warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Discord permite cambiar el nombre del bot hasta <strong>2 veces por hora</strong>. Los cambios pueden tardar unos minutos en propagarse.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ─── Avatar Card ─── */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                Avatar del Bot
              </CardTitle>
              <CardDescription className="text-xs">
                Cambia la imagen de perfil de tu bot. Este cambio es global.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current avatar */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Avatar actual</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border/50 bg-muted/30">
                    {bot?.avatar ? (
                      <img
                        src={bot.avatar}
                        alt="Avatar actual del bot"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar username={bot?.username || 'Bot'} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      {bot?.avatar ? 'Avatar personalizado' : 'Avatar por defecto de Discord'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bot?.avatar ? 'El bot tiene un avatar personalizado' : 'Se usa el avatar generado por Discord'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Upload area */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Nuevo avatar</Label>

                {/* Drop zone / upload button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer border-2 border-dashed border-border/60 rounded-xl p-6 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {newAvatar ? (
                    /* Preview of selected image */
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/40 shrink-0">
                        <img
                          src={newAvatar}
                          alt="Nuevo avatar (vista previa)"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          Imagen seleccionada
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {avatarFile?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {avatarFile ? `${(avatarFile.size / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClearAvatarPreview()
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                        <Upload className="w-5 h-5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-emerald-400 transition-colors">
                          Haz clic para subir una imagen
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          o arrastra y suelta aquí
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar error */}
                {avatarError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {avatarError}
                  </motion.p>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleSaveAvatar}
                    disabled={savingAvatar || !avatarChanged}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  >
                    {savingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Avatar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetAvatar}
                    disabled={savingAvatar || !bot?.avatar}
                    className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Restaurar por defecto
                  </Button>
                </div>

                {/* Format info */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <ImagePlus className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Formatos soportados: <strong>PNG, JPG, GIF</strong> (máximo 256KB). Se recomienda una imagen cuadrada de al menos 128×128 píxeles.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Info / Warning Card ─── */}
          <motion.div variants={item}>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-400" />
                  Información Importante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">Cambio global</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Los cambios en el nombre y avatar del bot afectan a <strong>todos los servidores</strong> donde el bot está presente, no solo al servidor actual.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                  <Shield className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-violet-300">Permisos necesarios</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Solo el <strong>propietario del bot</strong> puede realizar estos cambios. Si no eres el propietario, las modificaciones serán rechazadas por la API de Discord.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Tiempo de propagación</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Los cambios pueden tardar <strong>unos minutos</strong> en propagarse completamente a través de los servidores de Discord. Si no ves los cambios inmediatamente, espera unos momentos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
