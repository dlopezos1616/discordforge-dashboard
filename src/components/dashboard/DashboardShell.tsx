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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
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

/* Animated background particles */
function ForgeParticles() {
  return (
    <div className="particles-bg">
      {/* Ambient glow orbs */}
      <div
        className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, #FF3A2F, transparent 70%)',
          animation: 'forge-pulse 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, #FFD700, transparent 70%)',
          animation: 'forge-pulse 8s ease-in-out infinite 2s',
        }}
      />
      <div
        className="absolute top-[50%] left-[50%] w-[600px] h-[600px] rounded-full opacity-[0.015] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, #00B4D8, transparent 70%)',
          animation: 'forge-pulse 10s ease-in-out infinite 4s',
        }}
      />

      {/* Floating ember particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${60 + Math.random() * 40}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            background: i % 3 === 0 ? '#FF3A2F' : i % 3 === 1 ? '#FFD700' : '#FF6B00',
            animationDuration: `${4 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.4 + Math.random() * 0.4,
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
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-forge-grid">
        <Header />
        <SectionRenderer />
      </div>
    </div>
  )
}
