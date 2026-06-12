'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Sparkles, Shield, Ticket, Bot, BarChart3, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  { icon: Ticket, title: 'Tickets', desc: 'Sistema completo de tickets con categorías ilimitadas' },
  { icon: Shield, title: 'Moderación', desc: 'Auto-mod, bans, warns y más' },
  { icon: Bot, title: 'Automatización', desc: 'Configura y olvida, el bot hace el resto' },
  { icon: BarChart3, title: 'Analíticas', desc: 'Estadísticas detalladas en tiempo real' },
  { icon: Zap, title: 'Rápido', desc: 'Optimizado para la mejor experiencia' },
]

export function LoginScreen() {
  const { setUser, setServers, setCurrentServer } = useAppStore()

  const handleLogin = async () => {
    try {
      // Fetch user data
      const userRes = await fetch('/api/auth/login', { method: 'POST' })
      const userData = await userRes.json()

      if (userData.user) {
        setUser(userData.user)

        // Fetch servers
        const serversRes = await fetch('/api/servers')
        const serversData = await serversRes.json()

        if (serversData.servers) {
          const mappedServers = serversData.servers.map((s: any) => ({
            id: s.id,
            discordId: s.discordId,
            name: s.name,
            icon: s.icon,
            memberCount: s.memberCount,
            isActive: s.isActive,
          }))
          setServers(mappedServers)
          if (mappedServers.length > 0) {
            setCurrentServer(mappedServers[0])
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-4"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
          >
            DiscordForge
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-2"
          >
            La plataforma más avanzada de gestión para Discord
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl"
        >
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-base font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
            </svg>
            Iniciar Sesión con Discord
          </Button>

          <div className="mt-6 grid grid-cols-1 gap-3">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg"
              >
                <feat.icon className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-xs text-muted-foreground"><strong className="text-foreground">{feat.title}</strong> — {feat.desc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-[11px] text-muted-foreground/50 mt-4"
        >
          Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad
        </motion.p>
      </motion.div>
    </div>
  )
}
