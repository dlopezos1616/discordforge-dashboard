'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  FileText, Plus, CheckCircle2, XCircle, Clock, Eye,
  ChevronDown, ChevronUp, GripVertical, Trash2, Settings2,
  ClipboardList, Users, Palette
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ChannelSelector } from '@/components/shared/ChannelSelector'
import { EmbedConfig, EmbedPreview, defaultEmbedConfig, type EmbedConfigData } from '@/components/shared/EmbedConfig'

interface FormField {
  id: string
  label: string
  type: 'short_text' | 'long_text' | 'select' | 'checkbox'
  required: boolean
  options?: string[]
}

interface WhitelistFormData {
  id: string
  name: string
  description: string | null
  fields: string
  isActive: boolean
  channelId: string | null
  roleId: string | null
  createdAt: string
  _count: { applications: number }
  applications: ApplicationData[]
}

interface ApplicationData {
  id: string
  formId: string
  userId: string
  status: string
  responses: string
  reviewedBy: string | null
  comment: string | null
  createdAt: string
  updatedAt: string
  user: { username: string; avatar: string | null; discordId: string }
}

interface WhitelistStats {
  pending: number
  acceptedToday: number
  rejectedToday: number
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  reviewing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  reviewing: 'Revisando',
}

const fieldTypes = [
  { value: 'short_text', label: 'Texto corto' },
  { value: 'long_text', label: 'Texto largo' },
  { value: 'select', label: 'Selección' },
  { value: 'checkbox', label: 'Casilla' },
]

export function WhitelistSystem() {
  const { currentServer } = useAppStore()
  const [forms, setForms] = useState<WhitelistFormData[]>([])
  const [stats, setStats] = useState<WhitelistStats>({ pending: 0, acceptedToday: 0, rejectedToday: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('formularios')

  // Form builder state
  const [showBuilder, setShowBuilder] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [channelId, setChannelId] = useState<string | null>(null)
  const [embedConfig, setEmbedConfig] = useState<EmbedConfigData>(defaultEmbedConfig)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Expanded application
  const [expandedApp, setExpandedApp] = useState<string | null>(null)

  // Review comment
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/whitelist?serverId=${currentServer.id}`)
      const data = await res.json()
      if (data.forms) {
        setForms(data.forms)
        setStats(data.stats)
      }
    } catch {
      toast.error('Error al cargar formularios de whitelist')
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'short_text',
      required: false,
      options: [],
    }
    setFormFields([...formFields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setFormFields(formFields.filter(f => f.id !== id))
  }

  const handleCreateForm = async () => {
    if (!currentServer || !formName) {
      toast.error('El nombre es obligatorio')
      return
    }
    try {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createForm',
          serverId: currentServer.id,
          name: formName,
          description: formDescription,
          fields: formFields,
          channelId,
          embedConfig: { ...embedConfig, channelId },
        }),
      })
      const data = await res.json()
      if (data.form) {
        toast.success('Formulario creado exitosamente')
        setShowBuilder(false)
        setFormName('')
        setFormDescription('')
        setFormFields([])
        setChannelId(null)
        setEmbedConfig(defaultEmbedConfig)
        fetchData()
      } else {
        toast.error(data.error || 'Error al crear formulario')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const handleReview = async (applicationId: string, status: string) => {
    try {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          applicationId,
          status,
          reviewedBy: 'admin',
          comment: reviewComments[applicationId] || null,
        }),
      })
      const data = await res.json()
      if (data.application) {
        toast.success(`Solicitud ${status === 'accepted' ? 'aceptada' : 'rechazada'}`)
        setReviewComments(prev => {
          const next = { ...prev }
          delete next[applicationId]
          return next
        })
        fetchData()
      }
    } catch {
      toast.error('Error al revisar solicitud')
    }
  }

  const allApplications = forms.flatMap(f => f.applications)
  const filteredApplications = allApplications.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const pendingApps = allApplications.filter(a => a.status === 'pending')

  const statCards = [
    { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'from-yellow-500/20 to-yellow-600/10', iconColor: 'text-yellow-400' },
    { label: 'Aceptadas Hoy', value: stats.acceptedToday, icon: CheckCircle2, color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
    { label: 'Rechazadas Hoy', value: stats.rejectedToday, icon: XCircle, color: 'from-red-500/20 to-red-600/10', iconColor: 'text-red-400' },
    { label: 'Formularios', value: forms.length, icon: FileText, color: 'from-[#FF3A2F]/20 to-fuchsia-600/10', iconColor: 'text-[#FF3A2F]' },
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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] bg-clip-text text-transparent">
            Sistema Whitelist
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de whitelist FiveM
          </p>
        </div>
        <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white">
              <Plus className="w-4 h-4" />
              Crear Formulario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#FF3A2F]" />
                Crear Formulario de Whitelist
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Nombre del formulario</Label>
                <Input
                  placeholder="Ej: Whitelist RP"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Descripción</Label>
                <Textarea
                  placeholder="Descripción del formulario..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="bg-background/50 resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Canal de destino</Label>
                <ChannelSelector
                  value={channelId}
                  onValueChange={setChannelId}
                  placeholder="Selecciona el canal donde se enviará el formulario..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-[#FF3A2F]" />
                  Configuración del Embed
                </Label>
                <EmbedConfig
                  config={embedConfig}
                  onChange={setEmbedConfig}
                  showChannelSelector={false}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#FF3A2F]" />
                  Vista Previa
                </Label>
                <Card className="bg-[#313338] border-border/30 overflow-hidden">
                  <CardContent className="p-4">
                    <EmbedPreview config={{ ...embedConfig, channelId }} />
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Campos del formulario</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="gap-1 border-[#FF3A2F]/30 hover:bg-[#FF3A2F]/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showPreview ? 'Editor' : 'Vista previa'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addField}
                    className="gap-1 border-[#FF3A2F]/30 hover:bg-[#FF3A2F]/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir campo
                  </Button>
                </div>
              </div>

              {showPreview ? (
                <Card className="bg-background/50 border-border/30">
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold text-lg">{formName || 'Sin nombre'}</h3>
                    {formDescription && <p className="text-sm text-muted-foreground">{formDescription}</p>}
                    {formFields.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No hay campos aún</p>
                    ) : (
                      formFields.map(field => (
                        <div key={field.id} className="space-y-1">
                          <Label className="text-xs">
                            {field.label || 'Sin etiqueta'}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </Label>
                          {field.type === 'short_text' && (
                            <Input disabled placeholder="Texto corto" className="bg-background/30 h-8 text-sm" />
                          )}
                          {field.type === 'long_text' && (
                            <Textarea disabled placeholder="Texto largo" className="bg-background/30 resize-none h-16 text-sm" />
                          )}
                          {field.type === 'select' && (
                            <Select disabled>
                              <SelectTrigger className="bg-background/30 h-8 text-sm">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                            </Select>
                          )}
                          {field.type === 'checkbox' && (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border border-border/50" />
                              <span className="text-sm text-muted-foreground">Opción</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {formFields.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg">
                      Haz clic en &quot;Añadir campo&quot; para empezar
                    </div>
                  ) : (
                    formFields.map((field, idx) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div className="flex items-center gap-1 pt-2 text-muted-foreground">
                          <GripVertical className="w-4 h-4" />
                          <span className="text-xs font-mono">{idx + 1}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="Etiqueta del campo"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="bg-background/50 h-8 text-sm"
                          />
                          <div className="flex gap-2">
                            <Select value={field.type} onValueChange={(v) => updateField(field.id, { type: v as FormField['type'] })}>
                              <SelectTrigger className="bg-background/50 h-8 text-sm flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map(ft => (
                                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={field.required}
                                onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                                className="scale-75"
                              />
                              <span className="text-xs text-muted-foreground">Req</span>
                            </div>
                          </div>
                          {field.type === 'select' && (
                            <div className="col-span-full">
                              <Input
                                placeholder="Opciones separadas por coma"
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
                                className="bg-background/50 h-8 text-sm"
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowBuilder(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateForm}
                  disabled={!formName || formFields.length === 0}
                  className="bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white"
                >
                  Crear Formulario
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card/50 border border-border/30">
          <TabsTrigger value="formularios" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF3A2F] data-[state=active]:to-[#FF6B00] data-[state=active]:text-white">
            <FileText className="w-3.5 h-3.5" />
            Formularios
          </TabsTrigger>
          <TabsTrigger value="solicitudes" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF3A2F] data-[state=active]:to-[#FF6B00] data-[state=active]:text-white">
            <ClipboardList className="w-3.5 h-3.5" />
            Solicitudes
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF3A2F] data-[state=active]:to-[#FF6B00] data-[state=active]:text-white">
            <Settings2 className="w-3.5 h-3.5" />
            Panel Staff
          </TabsTrigger>
        </TabsList>

        {/* Formularios Tab */}
        <TabsContent value="formularios">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-[#FF3A2F] border-t-transparent rounded-full"
                />
              </div>
            ) : forms.length === 0 ? (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No hay formularios de whitelist</p>
                  <p className="text-xs mt-1">Crea uno con el botón de arriba</p>
                </CardContent>
              </Card>
            ) : (
              forms.map((form, i) => {
                let fields: FormField[] = []
                try { fields = JSON.parse(form.fields || '[]') } catch { fields = [] }
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-[#FF3A2F]/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{form.name}</h3>
                              <Badge
                                variant="outline"
                                className={form.isActive
                                  ? 'bg-green-500/15 text-green-400 border-green-500/30 text-xs'
                                  : 'bg-gray-500/15 text-gray-400 border-gray-500/30 text-xs'
                                }
                              >
                                {form.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            {form.description && (
                              <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{fields.length} campos</span>
                              <span>•</span>
                              <span>{form._count.applications} solicitudes</span>
                              <span>•</span>
                              <span>{new Date(form.createdAt).toLocaleDateString('es-ES')}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#FF3A2F] hover:bg-[#FF3A2F]/10">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </TabsContent>

        {/* Solicitudes Tab */}
        <TabsContent value="solicitudes">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[#FF3A2F]" />
                    Solicitudes
                  </CardTitle>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-background/50 h-8 text-sm w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="accepted">Aceptada</SelectItem>
                      <SelectItem value="rejected">Rechazada</SelectItem>
                      <SelectItem value="reviewing">Revisando</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-[#FF3A2F] border-t-transparent rounded-full"
                    />
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">No hay solicitudes</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="text-xs font-semibold">Solicitante</TableHead>
                          <TableHead className="text-xs font-semibold">Estado</TableHead>
                          <TableHead className="text-xs font-semibold hidden md:table-cell">Fecha</TableHead>
                          <TableHead className="text-xs font-semibold w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredApplications.map((app, i) => (
                            <motion.tr
                              key={app.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="border-b border-border/30 hover:bg-accent/30 transition-colors cursor-pointer"
                              onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                            >
                              <TableCell>
                                <span className="text-sm font-medium">{app.user?.username || 'Desconocido'}</span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${statusColors[app.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                                >
                                  {statusLabels[app.status] || app.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                {new Date(app.createdAt).toLocaleDateString('es-ES', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                })}
                              </TableCell>
                              <TableCell>
                                {expandedApp === app.id ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}

                {/* Expanded Application Detail */}
                <AnimatePresence>
                  {expandedApp && (() => {
                    const app = filteredApplications.find(a => a.id === expandedApp)
                    if (!app) return null
                    let responses: Record<string, string> = {}
                    try { responses = JSON.parse(app.responses || '{}') } catch { responses = {} }
                    const form = forms.find(f => f.id === app.formId)
                    let formFields: FormField[] = []
                    try { formFields = form ? JSON.parse(form.fields || '[]') : [] } catch { formFields = [] }
                    return (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/30 p-4 bg-accent/10"
                      >
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">
                            Respuestas de {app.user?.username || 'Desconocido'}
                          </h4>
                          {formFields.map(field => (
                            <div key={field.id} className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">
                                {field.label}
                                {field.required && <span className="text-red-400 ml-1">*</span>}
                              </span>
                              <span className="text-sm bg-background/50 rounded px-3 py-1.5">
                                {responses[field.id] || '—'}
                              </span>
                            </div>
                          ))}
                          {app.comment && (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">Comentario del revisor</span>
                              <span className="text-sm bg-background/50 rounded px-3 py-1.5">{app.comment}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })()}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Panel Staff Tab */}
        <TabsContent value="staff">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-0">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{pendingApps.length}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-0">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.acceptedToday}</p>
                  <p className="text-xs text-muted-foreground">Aceptadas hoy</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-0">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.rejectedToday}</p>
                  <p className="text-xs text-muted-foreground">Rechazadas hoy</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FF3A2F]" />
                  Cola de Revisión
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApps.map((app, i) => {
                      let responses: Record<string, string> = {}
                      try { responses = JSON.parse(app.responses || '{}') } catch { responses = {} }
                      const form = forms.find(f => f.id === app.formId)
                      let formFields: FormField[] = []
                      try { formFields = form ? JSON.parse(form.fields || '[]') : [] } catch { formFields = [] }
                      return (
                        <motion.div
                          key={app.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-4 rounded-lg bg-background/50 border border-border/30 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-sm">{app.user?.username || 'Desconocido'}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {form?.name || 'Formulario'} • {new Date(app.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                              Pendiente
                            </Badge>
                          </div>

                          {formFields.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {formFields.map(field => (
                                <div key={field.id} className="text-xs">
                                  <span className="text-muted-foreground">{field.label}: </span>
                                  <span className="font-medium">{responses[field.id] || '—'}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2">
                            <Input
                              placeholder="Comentario (opcional)..."
                              value={reviewComments[app.id] || ''}
                              onChange={(e) => setReviewComments(prev => ({ ...prev, [app.id]: e.target.value }))}
                              className="bg-background/50 h-8 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReview(app.id, 'accepted')}
                                className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Aceptar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReview(app.id, 'rejected')}
                                className="gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
