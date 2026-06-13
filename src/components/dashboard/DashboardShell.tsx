'use client'

import { useAppStore } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { TicketSystem } from '@/components/dashboard/TicketSystem'
import { WelcomeSystem } from '@/components/dashboard/WelcomeSystem'
import { EmbedBuilder } from '@/components/dashboard/EmbedBuilder'
import { ModerationPanel } from '@/components/dashboard/ModerationPanel'
import { AutoModConfig } from '@/components/dashboard/AutoModConfig'
import { VerificationSystem } from '@/components/dashboard/VerificationSystem'
import { ReactionRoles } from '@/components/dashboard/ReactionRoles'
import { WhitelistSystem } from '@/components/dashboard/WhitelistSystem'
import { PollsSystem } from '@/components/dashboard/PollsSystem'
import { GiveawaysSystem } from '@/components/dashboard/GiveawaysSystem'
import { LogsViewer } from '@/components/dashboard/LogsViewer'
import { SettingsPanel } from '@/components/dashboard/SettingsPanel'
import { SuperAdmin } from '@/components/dashboard/SuperAdmin'
import { BotStatusPanel } from '@/components/dashboard/BotStatusPanel'
import { BotCustomization } from '@/components/dashboard/BotCustomization'
import { AntiRaidSystem } from '@/components/dashboard/AntiRaidSystem'
import { useMemo, useState, useEffect } from 'react'

function SectionRenderer() {
  const { currentSection } = useAppStore()

  const sections: Record<string, React.ReactNode> = {
    dashboard: <DashboardHome />,
    'bot-status': <BotStatusPanel />,
    'bot-customize': <BotCustomization />,
    tickets: <TicketSystem />,
    welcome: <WelcomeSystem />,
    embeds: <EmbedBuilder />,
    moderation: <ModerationPanel />,
    automod: <AutoModConfig />,
    antiraid: <AntiRaidSystem />,
    verification: <VerificationSystem />,
    'reaction-roles': <ReactionRoles />,
    whitelist: <WhitelistSystem />,
    polls: <PollsSystem />,
    giveaways: <GiveawaysSystem />,
    logs: <LogsViewer />,
    settings: <SettingsPanel />,
    superadmin: <SuperAdmin />,
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentSection}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 overflow-auto"
      >
        {sections[currentSection] || (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-sm">Sección en desarrollo...</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/* Enhanced animated background with flame-themed particles and glows */
function ForgeParticles() {
  // Only render on client to avoid hydration mismatch with Math.random()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Generate stable particle positions using useMemo
  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 50 + Math.random() * 50,
      size: 1 + Math.random() * 2.5,
      color: i % 4 === 0 ? '#FF6600' : i % 4 === 1 ? '#FFD700' : i % 4 === 2 ? '#FF3A2F' : '#FF8C00',
      duration: 4 + Math.random() * 8,
      delay: Math.random() * 6,
      opacity: 0.3 + Math.random() * 0.5,
      drift: -30 + Math.random() * 60,
    }))
  }, [])

  // Rising embers from bottom
  const risingEmbers = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1 + Math.random() * 2,
      color: i % 3 === 0 ? '#FF6600' : i % 3 === 1 ? '#FF3A2F' : '#FFD700',
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      drift: -40 + Math.random() * 80,
    }))
  }, [])

  if (!mounted) return null

  return (
    <div className="particles-bg">
      {/* Large ambient glow orbs */}
      <div
        className="absolute top-[5%] left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #FF6600, transparent 70%)',
          animation: 'forge-pulse 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, #FFD700, transparent 70%)',
          animation: 'forge-pulse 8s ease-in-out infinite 2s',
        }}
      />
      <div
        className="absolute top-[40%] left-[40%] w-[700px] h-[700px] rounded-full opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, #FF3A2F, transparent 70%)',
          animation: 'forge-pulse 10s ease-in-out infinite 4s',
        }}
      />
      {/* Teal accent glow */}
      <div
        className="absolute top-[70%] right-[30%] w-[400px] h-[400px] rounded-full opacity-[0.015]"
        style={{
          background: 'radial-gradient(circle, #00B4D8, transparent 70%)',
          animation: 'forge-pulse 12s ease-in-out infinite 3s',
        }}
      />

      {/* Flame shape accent - abstract derived from logo, very subtle */}
      <div
        className="absolute -bottom-[10%] right-[10%] w-[500px] h-[600px] opacity-[0.02] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 70% at 50% 60%, #FF6600 0%, #FF3A2F 30%, #FF8C00 60%, transparent 100%)',
          clipPath: 'polygon(50% 0%, 75% 25%, 90% 50%, 85% 75%, 70% 90%, 50% 100%, 30% 90%, 15% 75%, 10% 50%, 25% 25%)',
          animation: 'forge-pulse 8s ease-in-out infinite 1s',
        }}
      />
      {/* Second flame shape accent, different position */}
      <div
        className="absolute -top-[5%] left-[60%] w-[300px] h-[400px] opacity-[0.015] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 35% 65% at 50% 55%, #FF8C00 0%, #FFD700 25%, #FF6600 50%, transparent 100%)',
          clipPath: 'polygon(50% 0%, 72% 20%, 88% 45%, 82% 70%, 65% 88%, 50% 100%, 35% 88%, 18% 70%, 12% 45%, 28% 20%)',
          animation: 'forge-pulse 10s ease-in-out infinite 5s',
        }}
      />

      {/* Floating ember particles */}
      {particles.map(p => (
        <div
          key={`p-${p.id}`}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}40`,
          }}
        />
      ))}

      {/* Rising ember particles from bottom */}
      {risingEmbers.map(e => (
        <div
          key={`e-${e.id}`}
          className="ember-particle"
          style={{
            left: `${e.left}%`,
            bottom: '-5px',
            width: `${e.size}px`,
            height: `${e.size}px`,
            background: e.color,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            ['--drift' as string]: e.drift,
            boxShadow: `0 0 ${e.size * 3}px ${e.color}60`,
          }}
        />
      ))}
    </div>
  )
}

export function DashboardShell() {
  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden relative">
      <ForgeParticles />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-forge-grid flame-bg-accent">
        <Header />
        <SectionRenderer />
      </div>
    </div>
  )
}
