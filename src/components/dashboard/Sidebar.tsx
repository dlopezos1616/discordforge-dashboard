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
import Image from 'next/image'

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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

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
        {/* Animated glow at top - matching logo's gear energy */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-[200%] h-40 opacity-[0.07]"
            style={{
              background: 'radial-gradient(ellipse 50% 80% at 50% 100%, #FF6600, #DC2626 30%, #00B4D8 50%, transparent 70%)',
              animation: 'forge-pulse 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 relative z-10">
          <motion.div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 relative overflow-hidden"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'linear-gradient(135deg, #FF6600, #DC2626)',
              boxShadow: '0 0 12px rgba(255,102,0,0.3), 0 0 24px rgba(0,180,216,0.1)',
            }}
          >
            <Image
              src="/logo.png"
              alt="DiscordForge"
              width={32}
              height={32}
              className="w-8 h-8 relative z-10 object-contain"
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,102,0,0.5))' }}
            />
            {/* Inner glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/20 to-transparent pointer-events-none" />
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
                <p className="text-[10px] text-[#FF6600]/60 whitespace-nowrap font-medium tracking-wider">MANAGEMENT PLATFORM</p>
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
                    className="text-[10px] font-semibold uppercase tracking-widest text-[#FF6600]/35 px-3 mb-1.5"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = currentSection === item.id
                  const Icon = item.icon
                  const isHovered = hoveredItem === item.id

                  const button = (
                    <motion.button
                      key={item.id}
                      onClick={() => setCurrentSection(item.id)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg transition-all duration-200 relative group',
                        sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                        isActive
                          ? 'bg-gradient-to-r from-[#FF6600]/15 via-[#FF3A2F]/10 to-[#FF6600]/5 text-[#FF6600]'
                          : 'text-[#888] hover:text-[#FFD700] hover:bg-white/[0.03]'
                      )}
                      whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{
                            background: 'linear-gradient(to bottom, #FF6600, #FF3A2F)',
                            boxShadow: '0 0 8px rgba(255, 102, 0, 0.4), 0 0 16px rgba(255, 102, 0, 0.2)',
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      {/* Hover glow effect */}
                      {(isHovered || isActive) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 rounded-lg pointer-events-none"
                          style={{
                            background: isActive
                              ? 'radial-gradient(ellipse at left center, rgba(255, 102, 0, 0.08) 0%, transparent 70%)'
                              : 'radial-gradient(ellipse at left center, rgba(255, 215, 0, 0.04) 0%, transparent 70%)',
                          }}
                        />
                      )}
                      <Icon className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-all duration-300',
                        isActive ? 'text-[#FF6600] drop-shadow-[0_0_6px_rgba(255,102,0,0.4)]' : 'group-hover:text-[#FFD700]'
                      )} />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            className="text-sm font-medium whitespace-nowrap relative z-10"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isActive && !sidebarCollapsed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto"
                        >
                          <Flame className="w-3.5 h-3.5 text-[#FF6600]" style={{ animation: 'neon-flicker 2s ease-in-out infinite' }} />
                        </motion.div>
                      )}
                    </motion.button>
                  )

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium bg-[#1A1A1A] border-[#FF6600]/20 text-white">{item.label}</TooltipContent>
                      </Tooltip>
                    )
                  }

                  return button
                })}
              </div>
              {group.section !== 'admin' && (
                <Separator className="mt-3 opacity-10 bg-gradient-to-r from-transparent via-[#FF6600]/20 to-transparent" />
              )}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 p-3 space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="shrink-0 h-9 w-9 text-[#888] hover:text-[#FFD700] hover:bg-[#FF6600]/10"
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
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6600] to-[#FF3A2F] flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-[0_0_8px_rgba(255,102,0,0.3)]">
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
            className={cn('w-full h-8 text-[#888] hover:text-[#FF6600] hover:bg-[#FF6600]/10', sidebarCollapsed ? 'px-0' : '')}
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
