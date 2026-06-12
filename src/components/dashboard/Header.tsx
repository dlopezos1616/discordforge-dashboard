'use client'

import { useAppStore, type DiscordServer } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, Search, Bell, LogOut, User,
  Server, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, currentServer, servers, setCurrentServer, currentSection, logout } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications] = useState(3)

  const sectionNames: Record<string, string> = {
    dashboard: 'Dashboard',
    tickets: 'Sistema de Tickets',
    welcome: 'Bienvenidas',
    embeds: 'Constructor de Embeds',
    'reaction-roles': 'Reaction Roles',
    verification: 'Verificación',
    moderation: 'Moderación',
    automod: 'Auto Moderación',
    whitelist: 'Whitelist',
    polls: 'Encuestas',
    giveaways: 'Sorteos',
    logs: 'Registro de Logs',
    settings: 'Ajustes',
    superadmin: 'Super Admin',
  }

  const getServerInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  const getServerColor = (name: string) => {
    const colors = [
      'from-violet-500 to-fuchsia-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-blue-500 to-cyan-500',
    ]
    const idx = name.length % colors.length
    return colors[idx]
  }

  return (
    <header className="h-14 border-b border-border bg-card/30 backdrop-blur-xl flex items-center justify-between px-4 gap-4">
      {/* Left: Section title + Server selector */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentSection}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-sm font-semibold hidden sm:block"
          >
            {sectionNames[currentSection] || 'Dashboard'}
          </motion.h2>
        </AnimatePresence>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 max-w-[240px]">
              {currentServer ? (
                <>
                  <div className={cn('w-5 h-5 rounded-md bg-gradient-to-br flex items-center justify-center text-[8px] font-bold text-white shrink-0', getServerColor(currentServer.name))}>
                    {getServerInitials(currentServer.name)}
                  </div>
                  <span className="truncate text-xs">{currentServer.name}</span>
                </>
              ) : (
                <>
                  <Server className="w-4 h-4" />
                  <span className="text-xs">Seleccionar servidor</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Tus Servidores</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-64">
              {servers.map(server => (
                <DropdownMenuItem
                  key={server.id}
                  onClick={() => setCurrentServer(server)}
                  className={cn('gap-2 cursor-pointer', currentServer?.id === server.id && 'bg-accent')}
                >
                  <div className={cn('w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center text-[9px] font-bold text-white shrink-0', getServerColor(server.name))}>
                    {getServerInitials(server.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{server.name}</p>
                    <p className="text-[10px] text-muted-foreground">{server.memberCount.toLocaleString()} miembros</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-3">
            <Input placeholder="Buscar en el dashboard..." className="h-8 text-sm" autoFocus />
            <p className="text-[10px] text-muted-foreground mt-2 px-1">Busca ajustes, comandos y más...</p>
          </PopoverContent>
        </Popover>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold">Notificaciones</h3>
            </div>
            <ScrollArea className="h-64">
              <div className="p-2 space-y-1">
                {[
                  { title: 'Nuevo ticket abierto', desc: 'Soporte Técnico - Ticket #5', time: 'Hace 5 min', type: 'ticket' },
                  { title: 'Whitelist pendiente', desc: '3 solicitudes por revisar', time: 'Hace 15 min', type: 'whitelist' },
                  { title: 'Raid detectado', desc: '5 usuarios sospechosos', time: 'Hace 1h', type: 'automod' },
                ].map((notif, i) => (
                  <div key={i} className="p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                      <p className="text-xs font-medium">{notif.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground ml-4">{notif.desc}</p>
                    <p className="text-[10px] text-muted-foreground/60 ml-4 mt-0.5">{notif.time}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold">
                  {user?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[9px] font-bold">
                    {user?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium">{user?.username || 'Usuario'}</p>
                  <p className="text-[10px] text-muted-foreground">Administrador</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
              <User className="w-3.5 h-3.5" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-xs gap-2 text-red-400 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
