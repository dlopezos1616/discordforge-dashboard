'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Ticket, Plus, Pencil, Trash2, Eye, UserPlus, XCircle,
  Hash, Clock, CheckCircle2, AlertCircle, Users, Archive,
  MessageSquare, ChevronRight, Search, Filter, ToggleLeft, ToggleRight,
  FolderOpen, ListFilter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ChannelSelector } from '@/components/shared/ChannelSelector'
import { EmbedConfig, EmbedPreview, defaultEmbedConfig, type EmbedConfigData } from '@/components/shared/EmbedConfig'

// Types
interface TicketCategory {
  id: string
  name: string
  emoji: string
  color: string
  description: string | null
  staffRoleId: string | null
  customMessage: string | null
  channelId: string | null
  embedConfig: EmbedConfigData | null
  position: number
  isActive: boolean
  _count: { tickets: number }
}

interface TicketItem {
  id: string
  subject: string | null
  status: string
  createdAt: string
  closedAt: string | null
  category: { id: string; name: string; emoji: string; color: string }
  creator: { username: string; avatar: string | null }
  transcript?: { id: string; messageCount: number; createdAt: string } | null
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  open: { label: 'Abierto', color: 'text-emerald-400', icon: AlertCircle, bg: 'bg-emerald-500/15 border-emerald-500/30' },
  claimed: { label: 'Reclamado', color: 'text-amber-400', icon: UserPlus, bg: 'bg-amber-500/15 border-amber-500/30' },
  closed: { label: 'Cerrado', color: 'text-zinc-400', icon: CheckCircle2, bg: 'bg-zinc-500/15 border-zinc-500/30' },
}

const defaultCatForm = {
  name: '',
  emoji: '🎫',
  color: '#5865F2',
  description: '',
  customMessage: '',
  channelId: '' as string,
  embedConfig: defaultEmbedConfig as EmbedConfigData,
}

export function TicketSystem() {
  const { currentServer } = useAppStore()
  const [categories, setCategories] = useState<TicketCategory[]>([])
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('categories')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<TicketCategory | null>(null)
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false)
  const [selectedTranscript, setSelectedTranscript] = useState<TicketItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'ticket'; id: string } | null>(null)

  // Category dialog tab
  const [categoryDialogTab, setCategoryDialogTab] = useState('general')

  // Form state
  const [catForm, setCatForm] = useState(defaultCatForm)
  const [ticketForm, setTicketForm] = useState({ subject: '', categoryId: '', description: '' })

  const fetchData = useCallback(async () => {
    if (!currentServer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets?serverId=${currentServer.id}`)
      const data = await res.json()
      setCategories(data.categories || [])
      setTickets(data.tickets || [])
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openTickets = tickets.filter(t => t.status === 'open').length
  const closedTickets = tickets.filter(t => t.status === 'closed').length
  const claimedTickets = tickets.filter(t => t.status === 'claimed').length

  const handleCreateCategory = async () => {
    if (!currentServer || !catForm.name) return
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: currentServer.id,
          name: catForm.name,
          emoji: catForm.emoji,
          color: catForm.color,
          description: catForm.description,
          customMessage: catForm.customMessage,
          channelId: catForm.channelId || null,
          embedConfig: catForm.embedConfig,
        }),
      })
      if (res.ok) {
        toast.success('Categoría creada exitosamente')
        setCategoryDialogOpen(false)
        setCatForm(defaultCatForm)
        setEditCategory(null)
        setCategoryDialogTab('general')
        fetchData()
      }
    } catch {
      toast.error('Error al crear categoría')
    }
  }

  const handleToggleCategory = async (cat: TicketCategory) => {
    if (!currentServer) return
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: currentServer.id, categoryId: cat.id, isActive: !cat.isActive }),
      })
      if (res.ok) {
        toast.success(cat.isActive ? 'Categoría desactivada' : 'Categoría activada')
        fetchData()
      }
    } catch {
      toast.error('Error al actualizar categoría')
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteTarget || !currentServer) return
    try {
      const res = await fetch(`/api/tickets?serverId=${currentServer.id}&${deleteTarget.type}Id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success(deleteTarget.type === 'category' ? 'Categoría eliminada' : 'Ticket eliminado')
        fetchData()
      }
    } catch {
      toast.error('Error al eliminar')
    }
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const handleTicketAction = async (ticketId: string, action: string) => {
    if (!currentServer) return
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: currentServer.id, ticketId, action }),
      })
      if (res.ok) {
        toast.success(
          action === 'claim' ? 'Ticket reclamado' :
          action === 'close' ? 'Ticket cerrado' :
          'Acción completada'
        )
        fetchData()
      }
    } catch {
      toast.error('Error al procesar la acción')
    }
  }

  const openEditCategory = (cat: TicketCategory) => {
    setEditCategory(cat)
    setCatForm({
      name: cat.name,
      emoji: cat.emoji,
      color: cat.color,
      description: cat.description || '',
      customMessage: cat.customMessage || '',
      channelId: cat.channelId || '',
      embedConfig: cat.embedConfig || defaultEmbedConfig,
    })
    setCategoryDialogTab('general')
    setCategoryDialogOpen(true)
  }

  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.subject?.toLowerCase().includes(q) ||
      t.creator.username.toLowerCase().includes(q) ||
      t.category.name.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    )
  })

  const closedTicketsWithTranscripts = tickets.filter(t => t.status === 'closed')

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg bg-card/50 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-lg bg-card/50 animate-pulse" />
            <div className="h-8 w-24 rounded-lg bg-card/50 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-card/50 animate-pulse" />
          ))}
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
            <Ticket className="w-5 h-5 text-[#FF3A2F]" />
            Sistema de Tickets
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Gestiona categorías, tickets y transcripts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1.5 px-3 py-1">
            <AlertCircle className="w-3 h-3" /> {openTickets} Abiertos
          </Badge>
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1.5 px-3 py-1">
            <UserPlus className="w-3 h-3" /> {claimedTickets} Reclamados
          </Badge>
          <Badge variant="secondary" className="bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 gap-1.5 px-3 py-1">
            <CheckCircle2 className="w-3 h-3" /> {closedTickets} Cerrados
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <Hash className="w-3 h-3" /> {tickets.length} Total
          </Badge>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="bg-card/50 border border-border">
              <TabsTrigger value="categories" className="gap-1.5 text-xs">
                <FolderOpen className="w-3.5 h-3.5" /> Categorías
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" /> Tickets
              </TabsTrigger>
              <TabsTrigger value="transcripts" className="gap-1.5 text-xs">
                <Archive className="w-3.5 h-3.5" /> Transcripts
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab === 'categories' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditCategory(null)
                    setCatForm(defaultCatForm)
                    setCategoryDialogTab('general')
                    setCategoryDialogOpen(true)
                  }}
                  className="gap-1.5 bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white border-0"
                >
                  <Plus className="w-4 h-4" /> Crear Categoría
                </Button>
              )}
              {activeTab === 'tickets' && (
                <Button
                  size="sm"
                  onClick={() => setTicketDialogOpen(true)}
                  className="gap-1.5 bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white border-0"
                >
                  <Plus className="w-4 h-4" /> Crear Ticket
                </Button>
              )}
              {activeTab === 'tickets' && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tickets..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 w-48 text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-0">
            {categories.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No hay categorías de tickets</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Crea una categoría para empezar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {categories.map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <Card className="group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                        {/* Color accent bar */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }}
                        />
                        <CardContent className="p-4 pt-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{cat.emoji}</span>
                              <div>
                                <h3 className="font-semibold text-sm">{cat.name}</h3>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span className="text-[10px] text-muted-foreground">{cat._count.tickets} tickets</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={cat.isActive}
                                onCheckedChange={() => handleToggleCategory(cat)}
                                className="scale-75"
                              />
                            </div>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cat.description}</p>
                          )}
                          {cat.customMessage && (
                            <p className="text-[10px] text-muted-foreground/60 mb-3 line-clamp-1 italic">
                              &quot;{cat.customMessage}&quot;
                            </p>
                          )}
                          {cat.channelId && (
                            <div className="flex items-center gap-1 mb-2">
                              <Hash className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">Canal configurado</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                            <Badge variant="secondary" className={`text-[9px] ${cat.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'}`}>
                              {cat.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditCategory(cat)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteTarget({ type: 'category', id: cat.id })
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[80px] text-xs">ID</TableHead>
                        <TableHead className="text-xs">Asunto</TableHead>
                        <TableHead className="text-xs">Creador</TableHead>
                        <TableHead className="text-xs">Categoría</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                        <TableHead className="text-xs">Fecha</TableHead>
                        <TableHead className="text-xs text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredTickets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No se encontraron tickets</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTickets.map((ticket, i) => {
                            const status = statusConfig[ticket.status] || statusConfig.open
                            const StatusIcon = status.icon
                            return (
                              <motion.tr
                                key={ticket.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ delay: i * 0.03 }}
                                className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                              >
                                <TableCell className="font-mono text-[10px] text-muted-foreground">
                                  #{ticket.id.slice(-6).toUpperCase()}
                                </TableCell>
                                <TableCell className="text-xs font-medium max-w-[200px] truncate">
                                  {ticket.subject || 'Sin asunto'}
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF3A2F] to-[#FF6B00] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                      {ticket.creator.username[0]}
                                    </div>
                                    <span className="truncate max-w-[100px]">{ticket.creator.username}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span>{ticket.category.emoji}</span>
                                    <span className="truncate max-w-[100px]">{ticket.category.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={`text-[10px] gap-1 border ${status.bg} ${status.color}`}>
                                    <StatusIcon className="w-2.5 h-2.5" />
                                    {status.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground">
                                  {new Date(ticket.createdAt).toLocaleDateString('es-ES', {
                                    day: '2-digit', month: 'short', year: '2-digit'
                                  })}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {ticket.status === 'open' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] gap-1 text-amber-400 hover:text-amber-300"
                                        onClick={() => handleTicketAction(ticket.id, 'claim')}
                                      >
                                        <UserPlus className="w-3 h-3" /> Reclamar
                                      </Button>
                                    )}
                                    {(ticket.status === 'open' || ticket.status === 'claimed') && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] gap-1 text-zinc-400 hover:text-zinc-300"
                                        onClick={() => handleTicketAction(ticket.id, 'close')}
                                      >
                                        <XCircle className="w-3 h-3" /> Cerrar
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setDeleteTarget({ type: 'ticket', id: ticket.id })
                                        setDeleteDialogOpen(true)
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            )
                          })
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts" className="mt-0">
            {closedTicketsWithTranscripts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Archive className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No hay transcripts disponibles</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Los transcripts aparecerán cuando se cierren tickets</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {closedTicketsWithTranscripts.map((ticket, i) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="group hover:shadow-lg transition-all duration-300 border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                              style={{ backgroundColor: ticket.category.color + '20' }}
                            >
                              {ticket.category.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{ticket.subject || 'Sin asunto'}</p>
                              <p className="text-[10px] text-muted-foreground">
                                #{ticket.id.slice(-6).toUpperCase()} • {ticket.category.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                            <Clock className="w-3 h-3" />
                            <span>
                              Cerrado: {new Date(ticket.closedAt || ticket.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit', month: 'short', year: '2-digit'
                              })}
                            </span>
                            <span>•</span>
                            <span>{ticket.creator.username}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5 text-xs"
                            onClick={() => {
                              setSelectedTranscript(ticket)
                              setTranscriptDialogOpen(true)
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver Transcript
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create/Edit Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editCategory ? <Pencil className="w-4 h-4 text-[#FF3A2F]" /> : <Plus className="w-4 h-4 text-[#FF3A2F]" />}
              {editCategory ? 'Editar Categoría' : 'Crear Categoría'}
            </DialogTitle>
            <DialogDescription>
              {editCategory ? 'Modifica los detalles de la categoría' : 'Configura una nueva categoría de tickets'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={categoryDialogTab} onValueChange={setCategoryDialogTab} className="w-full">
            <TabsList className="w-full bg-card/50 border border-border mb-2">
              <TabsTrigger value="general" className="flex-1 text-xs gap-1.5">
                <FolderOpen className="w-3 h-3" /> General
              </TabsTrigger>
              <TabsTrigger value="embed" className="flex-1 text-xs gap-1.5">
                <MessageSquare className="w-3 h-3" /> Embed
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 text-xs gap-1.5">
                <Eye className="w-3 h-3" /> Vista Previa
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="mt-0">
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <Label className="text-xs">Emoji</Label>
                    <Input
                      value={catForm.emoji}
                      onChange={e => setCatForm(f => ({ ...f, emoji: e.target.value }))}
                      className="h-9 text-center text-lg"
                      maxLength={4}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={catForm.name}
                      onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Nombre de la categoría"
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catForm.color}
                      onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={catForm.color}
                      onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))}
                      className="h-9 font-mono text-xs"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5">
                    <Hash className="w-3 h-3" />
                    Canal del Panel de Tickets
                  </Label>
                  <ChannelSelector
                    value={catForm.channelId || null}
                    onValueChange={(channelId) => setCatForm(f => ({ ...f, channelId }))}
                    placeholder="Selecciona el canal donde se enviará el panel..."
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    El bot enviará el mensaje del panel de tickets a este canal
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Descripción</Label>
                  <Textarea
                    value={catForm.description}
                    onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción breve de la categoría..."
                    className="min-h-[60px] text-xs resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs">Mensaje Personalizado</Label>
                  <Textarea
                    value={catForm.customMessage}
                    onChange={e => setCatForm(f => ({ ...f, customMessage: e.target.value }))}
                    placeholder="Mensaje que se envía al abrir un ticket..."
                    className="min-h-[60px] text-xs resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Embed Configuration Tab */}
            <TabsContent value="embed" className="mt-0">
              <div className="py-2">
                <p className="text-xs text-muted-foreground mb-4">
                  Configura cómo se verá el embed del panel de tickets enviado por el bot.
                  El canal de destino se configura en la pestaña General.
                </p>
                <EmbedConfig
                  config={catForm.embedConfig}
                  onChange={(embedConfig) => setCatForm(f => ({ ...f, embedConfig }))}
                  showChannelSelector={false}
                />
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-0">
              <div className="py-2 space-y-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-3 block">Vista previa del Embed</Label>
                  <div className="rounded-lg bg-[#313338] p-4">
                    <EmbedPreview config={catForm.embedConfig} />
                  </div>
                </div>
                <Separator className="opacity-50" />
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Resumen de Configuración</Label>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Canal</span>
                      <span className="font-medium">{catForm.channelId ? 'Configurado' : 'No seleccionado'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Título del Embed</span>
                      <span className="font-medium">{catForm.embedConfig.title || 'Sin título'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Color</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: catForm.embedConfig.color }} />
                        <span className="font-mono text-[10px]">{catForm.embedConfig.color}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Campos</span>
                      <span className="font-medium">{catForm.embedConfig.fields.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Imagen</span>
                      <span className="font-medium">{catForm.embedConfig.imageUrl ? 'Configurada' : 'Sin imagen'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateCategory}
              disabled={!catForm.name}
              className="bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white border-0"
            >
              {editCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#FF3A2F]" /> Crear Ticket
            </DialogTitle>
            <DialogDescription>Abre un nuevo ticket de soporte</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Categoría</Label>
              <Select value={ticketForm.categoryId} onValueChange={v => setTicketForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.isActive).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-1.5">
                        <span>{cat.emoji}</span> {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Asunto</Label>
              <Input
                value={ticketForm.subject}
                onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Asunto del ticket"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Descripción</Label>
              <Textarea
                value={ticketForm.description}
                onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe tu problema o consulta..."
                className="min-h-[80px] text-xs resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTicketDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.success('Ticket creado exitosamente')
                setTicketDialogOpen(false)
                setTicketForm({ subject: '', categoryId: '', description: '' })
              }}
              disabled={!ticketForm.subject || !ticketForm.categoryId}
              className="bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white border-0"
            >
              Crear Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transcript Viewer Dialog */}
      <Dialog open={transcriptDialogOpen} onOpenChange={setTranscriptDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FF3A2F]" /> Transcript del Ticket
            </DialogTitle>
            <DialogDescription>
              {selectedTranscript && `#${selectedTranscript.id.slice(-6).toUpperCase()} — ${selectedTranscript.subject || 'Sin asunto'}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-[#2F3136] rounded-lg p-4 space-y-3 min-h-[200px]">
              {selectedTranscript && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3A2F] to-[#FF6B00] flex items-center justify-center text-[10px] font-bold text-white">
                      {selectedTranscript.creator.username[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{selectedTranscript.creator.username}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(selectedTranscript.createdAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="pl-10 space-y-2">
                    <div className="bg-[#36393F] rounded-lg p-3">
                      <p className="text-xs text-gray-300">
                        Hola, tengo un problema: {selectedTranscript.subject || 'Sin asunto'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] font-bold text-white">
                        S
                      </div>
                      <div className="bg-[#36393F] rounded-lg p-3 flex-1">
                        <p className="text-[10px] font-semibold text-emerald-400">Staff</p>
                        <p className="text-xs text-gray-300">Hola, vamos a revisar tu caso. Un momento por favor.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] font-bold text-white">
                        S
                      </div>
                      <div className="bg-[#36393F] rounded-lg p-3 flex-1">
                        <p className="text-[10px] font-semibold text-emerald-400">Staff</p>
                        <p className="text-xs text-gray-300">Tu caso ha sido resuelto. Cerrando ticket...</p>
                      </div>
                    </div>
                  </div>
                  <div className="pl-10 mt-2">
                    <p className="text-[10px] text-gray-500 italic">
                      🔒 Ticket cerrado por Staff — {new Date(selectedTranscript.closedAt || selectedTranscript.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTranscriptDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" /> Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este {deleteTarget?.type === 'category' ? 'categoría' : 'ticket'}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteItem}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
