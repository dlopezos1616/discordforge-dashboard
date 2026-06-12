'use client'

import { useAppStore } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { LoginScreen } from '@/components/dashboard/LoginScreen'
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

function SectionRenderer() {
  const { currentSection } = useAppStore()

  const sections: Record<string, React.ReactNode> = {
    dashboard: <DashboardHome />,
    'bot-status': <BotStatusPanel />,
    tickets: <TicketSystem />,
    welcome: <WelcomeSystem />,
    embeds: <EmbedBuilder />,
    moderation: <ModerationPanel />,
    automod: <AutoModConfig />,
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

export default function Home() {
  const { isAuthenticated } = useAppStore()

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <SectionRenderer />
      </div>
    </div>
  )
}
