'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type Section } from '@/lib/store'
import {
  LayoutDashboard, Ticket, HandMetal, Code2, SmilePlus,
  ShieldCheck, Shield, Bot, ClipboardList, BarChart3,
  Gift, ScrollText, Settings, Crown, ChevronLeft, ChevronRight,
  Sparkles, Cpu
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
  { id: 'tickets', label: 'Tickets', icon: Ticket, section: 'systems' },
  { id: 'welcome', label: 'Bienvenidas', icon: HandMetal, section: 'systems' },
  { id: 'embeds', label: 'Embeds', icon: Code2, section: 'systems' },
  { id: 'reaction-roles', label: 'Reaction Roles', icon: SmilePlus, section: 'systems' },
  { id: 'verification', label: 'Verificación', icon: ShieldCheck, section: 'systems' },
  { id: 'moderation', label: 'Moderación', icon: Shield, section: 'moderation' },
  { id: 'automod', label: 'Auto Mod', icon: Cpu, section: 'moderation' },
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

  const sections = ['general', 'systems', 'moderation', 'engagement', 'admin']
  const groupedItems = sections.map(section => ({
    section,
    label: sectionLabels[section],
    items: navItems.filter(item => item.section === section),
  }))

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col h-full border-r border-border bg-card/50 backdrop-blur-xl"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
          <motion.div
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shrink-0"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
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
                <h1 className="text-sm font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent whitespace-nowrap">
                  DiscordForge
                </h1>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">Management Platform</p>
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
                    className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1.5"
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
                          ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 text-violet-400'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                      whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-violet-500 to-fuchsia-500"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-violet-400')} />
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
                    </motion.button>
                  )

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
                      </Tooltip>
                    )
                  }

                  return button
                })}
              </div>
              {group.section !== 'admin' && <Separator className="mt-3 opacity-30" />}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="shrink-0 h-9 w-9"
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
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {user.username[0]}
                  </div>
                  <span className="text-xs font-medium truncate">{user.username}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={toggleSidebar}
            className={cn('w-full h-8', sidebarCollapsed ? 'px-0' : '')}
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
