'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type Section } from '@/lib/store'
import {
  LayoutDashboard, Ticket, HandMetal, Code2, SmilePlus,
  ShieldCheck, Shield, Bot, ClipboardList, BarChart3,
  Gift, ScrollText, Settings, Crown, ChevronLeft, ChevronRight,
  Sparkles, Cpu, Palette, ShieldAlert, Flame, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const navItems: { id: Section; label: string; icon: React.ElementType; section: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'general' },
  { id: 'bot-status', label: 'Bot Status', icon: Bot, section: 'general' },
  { id: 'bot-customize', label: 'Personalizar Bot', icon: Palette, section: 'general' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, section: 'systems' },
  { id: 'welcome', label: 'Bienvenidas', icon: HandMetal, section: 'systems' },
  { id: 'embeds', label: 'Embeds', icon: Code2, section: 'systems' },
  { id: 'reaction-roles', label: 'Reaction Roles', icon: SmilePlus, section: 'systems' },
  { id: 'verification', label: 'Verificación', icon: ShieldCheck, section: 'systems' },
  { id: 'moderation', label: 'Moderación', icon: Shield, section: 'moderation' },
  { id: 'automod', label: 'Auto Mod', icon: Cpu, section: 'moderation' },
  { id: 'antiraid', label: 'AntiRaid', icon: ShieldAlert, section: 'moderation' },
  { id: 'whitelist', label: 'Whitelist', icon: ClipboardList, section: 'systems' },
  { id: 'polls', label: 'Encuestas', icon: BarChart3, section: 'engagement' },
  { id: 'giveaways', label: 'Sorteos', icon: Gift, section: 'engagement' },
  { id: 'logs', label: 'Logs', icon: ScrollText, section: 'general' },
  { id: 'settings', label: 'Ajustes', icon: Settings, section: 'general' },
  { id: 'superadmin', label: 'Super Admin', icon: Crown, section: 'admin' },
]

const sectionLabels: Record<string, string> = {
  general: 'General',
  systems: 'Sistemas',
  moderation: 'Moderación',
  engagement: 'Interacción',
  admin: 'Admin',
}

export function Sidebar() {
  const { currentSection, setCurrentSection, sidebarCollapsed, toggleSidebar, user } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const res = await fetch('/api/auth/superadmin')
        const data = await res.json()
        setIsSuperAdmin(data.isSuperAdmin)
      } catch {
        setIsSuperAdmin(false)
      }
    }
    checkSuperAdmin()
  }, [])

  const visibleNavItems = navItems.filter(item => {
    if (item.id === 'superadmin' && !isSuperAdmin) return false
    return true
  })

  const sections = isSuperAdmin
    ? ['general', 'systems', 'moderation', 'engagement', 'admin']
    : ['general', 'systems', 'moderation', 'engagement']
  const groupedItems = sections.map(section => ({
    section,
    label: sectionLabels[section],
    items: visibleNavItems.filter(item => item.section === section),
  }))

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col h-full bg-[#0A0A0A] sidebar-forge-border overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
          <motion.div
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF3A2F] to-[#FF6B00] shrink-0 relative overflow-hidden"
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <Flame className="w-5 h-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/30 to-transparent" />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="text-sm font-bold animate-gradient-text whitespace-nowrap">
                  DiscordForge
                </h1>
                <p className="text-[10px] text-[#FF3A2F]/60 whitespace-nowrap font-medium">Management Platform</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
          {groupedItems.map(group => (
            <div key={group.section}>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-[#FF3A2F]/40 px-3 mb-1.5"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = currentSection === item.id
                  const Icon = item.icon

                  const button = (
                    <motion.button
                      key={item.id}
                      onClick={() => setCurrentSection(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg transition-all duration-200 relative group',
                        sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                        isActive
                          ? 'bg-gradient-to-r from-[#FF3A2F]/15 to-[#FF6B00]/5 text-[#FF3A2F]'
                          : 'text-[#888] hover:text-[#FFD700] hover:bg-white/[0.03]'
                      )}
                      whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[#FF3A2F] to-[#FF6B00]"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon className={cn('w-[18px] h-[18px] shrink-0 transition-colors', isActive ? 'text-[#FF3A2F]' : 'group-hover:text-[#FFD700]')} />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            className="text-sm font-medium whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isActive && !sidebarCollapsed && (
                        <Zap className="w-3 h-3 ml-auto text-[#FF6B00] animate-pulse" />
                      )}
                    </motion.button>
                  )

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium bg-[#1A1A1A] border-white/10 text-white">{item.label}</TooltipContent>
                      </Tooltip>
                    )
                  }

                  return button
                })}
              </div>
              {group.section !== 'admin' && <Separator className="mt-3 opacity-10 bg-gradient-to-r from-transparent via-[#FF3A2F]/20 to-transparent" />}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="shrink-0 h-9 w-9 text-[#888] hover:text-[#FFD700]"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <AnimatePresence>
              {!sidebarCollapsed && user && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF3A2F] to-[#FF6B00] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {user.username[0]}
                  </div>
                  <span className="text-xs font-medium truncate text-[#ccc]">{user.username}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={toggleSidebar}
            className={cn('w-full h-8 text-[#888] hover:text-[#FFD700]', sidebarCollapsed ? 'px-0' : '')}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Colapsar</span>
              </div>
            )}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
