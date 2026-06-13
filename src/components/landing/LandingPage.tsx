'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Ticket, Bot, BarChart3,
  Users, MessageSquare, ChevronRight, Globe,
  Lock, Star, Cog, Wrench, Heart, X, AlertCircle,
  Flame, Zap, ShieldAlert, Anvil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  { icon: Ticket, title: 'Sistema de Tickets', desc: 'Categorías ilimitadas, transcripciones automáticas, claimed por staff.', color: 'from-[#FFD700] to-[#FF6B00]' },
  { icon: ShieldAlert, title: 'AntiRaid', desc: 'Protección contra ataques, lockdown de emergencia, detección en tiempo real.', color: 'from-[#FF3A2F] to-[#FF6B00]' },
  { icon: Users, title: 'Verificación', desc: 'Botón, reacción, captcha matemático. Evita raids y bots automáticos.', color: 'from-[#00B4D8] to-[#FF3A2F]' },
  { icon: MessageSquare, title: 'Welcome System', desc: 'Embeds personalizables, imágenes, auto-roles, variables dinámicas.', color: 'from-[#FF6B00] to-[#FFD700]' },
  { icon: BarChart3, title: 'Encuestas y Sorteos', desc: 'Encuestas con opciones múltiples, giveaways con roles requeridos.', color: 'from-[#FFD700] to-[#FF3A2F]' },
  { icon: Wrench, title: 'Embed Builder', desc: 'Constructor visual de embeds, presets guardados, envío a canales.', color: 'from-[#FF3A2F] to-[#FFD700]' },
  { icon: Lock, title: 'Whitelist FiveM', desc: 'Formularios personalizados, revisión de aplicaciones, integración RP.', color: 'from-[#00B4D8] to-[#FF6B00]' },
  { icon: Globe, title: 'Reaction Roles', desc: 'Reacciones, botones o select menu. Modos single, multiple, toggle.', color: 'from-[#FF6B00] to-[#00B4D8]' },
]

const steps = [
  { num: '1', title: 'Inicia sesión con Discord', desc: 'Conecta tu cuenta de Discord de forma segura' },
  { num: '2', title: 'Selecciona tu servidor', desc: 'Elige el servidor donde quieres añadir el bot' },
  { num: '3', title: 'Configura y disfruta', desc: 'Personaliza todo desde el dashboard web' },
]

interface LandingPageProps {
  authError?: string | null
  onClearError?: () => void
}

export function LandingPage({ authError, onClearError }: LandingPageProps) {
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = () => {
    setLoginLoading(true)
    window.location.href = '/api/auth/discord'
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-auto text-white">
      {/* Auth Error Banner */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-[#FF3A2F]/90 backdrop-blur-sm text-white px-4 py-3"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{authError}</span>
              </div>
              <button onClick={onClearError} className="shrink-0 hover:bg-white/20 rounded p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className={`fixed ${authError ? 'top-12' : 'top-0'} left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 transition-top duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF3A2F] to-[#FF6B00] flex items-center justify-center relative overflow-hidden">
              <Flame className="w-4 h-4 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/30 to-transparent" />
            </div>
            <span className="font-bold text-lg animate-gradient-text">DiscordForge</span>
          </div>
          <Button onClick={handleLogin} disabled={loginLoading} className="bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white gap-2 border-0 shadow-lg shadow-[#FF3A2F]/20">
            {loginLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Cog className="w-4 h-4" />
              </motion.div>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
              </svg>
            )}
            Iniciar Sesión
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className={`pt-32 ${authError ? 'pt-44' : ''} pb-20 px-4 relative`}>
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FF3A2F]/8 rounded-full blur-3xl" style={{ animation: 'forge-pulse 6s ease-in-out infinite' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF6B00]/6 rounded-full blur-3xl" style={{ animation: 'forge-pulse 8s ease-in-out infinite 2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FFD700]/4 rounded-full blur-3xl" style={{ animation: 'forge-pulse 10s ease-in-out infinite 4s' }} />
          {/* Floating embers */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${50 + Math.random() * 50}%`,
                width: `${1 + Math.random() * 3}px`,
                height: `${1 + Math.random() * 3}px`,
                background: i % 3 === 0 ? '#FF3A2F' : i % 3 === 1 ? '#FFD700' : '#FF6B00',
                animationDuration: `${5 + Math.random() * 8}s`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: 0.3 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-[#FF3A2F]/10 border border-[#FF3A2F]/20 rounded-full px-4 py-1.5 mb-6">
              <Flame className="w-3.5 h-3.5 text-[#FF3A2F]" />
              <span className="text-sm text-[#FF6B00]">La plataforma #1 para gestionar tu servidor Discord</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
              Forja tu servidor <span className="animate-gradient-text">Discord</span> como nunca antes
            </h1>
            <p className="text-lg sm:text-xl text-[#888] max-w-2xl mx-auto mb-10">
              Tickets, moderación, anti-raid, verificación, welcome, embeds, whitelist FiveM y mucho más.
              Todo desde un dashboard web intuitivo y en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleLogin} disabled={loginLoading} size="lg" className="h-14 text-base font-semibold bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white gap-3 px-8 hover:scale-105 transition-all shadow-xl shadow-[#FF3A2F]/25">
                {loginLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Cog className="w-5 h-5" /></motion.div>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Forjar mi Servidor
                  </>
                )}
              </Button>
              <Button variant="outline" size="lg" className="h-14 text-base gap-2 px-8 border-[#FF3A2F]/30 text-[#FF3A2F] hover:bg-[#FF3A2F]/10 hover:border-[#FF3A2F]/50" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver Características <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16">
            {[{ value: '8+', label: 'Sistemas' }, { value: '24/7', label: 'Uptime' }, { value: '100%', label: 'Gratis' }].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold animate-gradient-text">{s.value}</div>
                <div className="text-sm text-[#888]">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">¿Cómo funciona?</h2>
            <p className="text-[#888]">En 3 simples pasos</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <Card className="border-white/5 bg-[#111]/80 backdrop-blur h-full forge-card">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF3A2F] to-[#FF6B00] flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-lg shadow-[#FF3A2F]/20">{step.num}</div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-[#888]">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Todo lo que necesitas</h2>
            <p className="text-[#888]">Sistemas completos para gestionar tu comunidad</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat, i) => (
              <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="border-white/5 bg-[#111]/80 backdrop-blur h-full forge-card">
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feat.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <feat.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1.5">{feat.title}</h3>
                    <p className="text-sm text-[#888] leading-relaxed">{feat.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-gradient-to-br from-[#FF3A2F]/10 to-[#FF6B00]/10 border border-[#FF3A2F]/20 rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-forge-grid opacity-50" />
            <div className="relative z-10">
              <Flame className="w-10 h-10 text-[#FF3A2F] mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
              <p className="text-[#888] mb-8 max-w-lg mx-auto">Añade DiscordForge a tu servidor y gestiona todo desde un dashboard moderno y en tiempo real.</p>
              <Button onClick={handleLogin} disabled={loginLoading} size="lg" className="h-14 text-base font-semibold bg-gradient-to-r from-[#FF3A2F] to-[#FF6B00] hover:from-[#FF3A2F]/90 hover:to-[#FF6B00]/90 text-white gap-3 px-10 hover:scale-105 transition-all shadow-xl shadow-[#FF3A2F]/25">
                {loginLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Cog className="w-5 h-5" /></motion.div>
                ) : (
                  <><Zap className="w-5 h-5" /> Forjar mi Servidor</>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#888]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#FF3A2F] to-[#FF6B00] flex items-center justify-center"><Flame className="w-3 h-3 text-white" /></div>
            <span>DiscordForge © 2025</span>
          </div>
          <p>Forjado con <Heart className="w-3 h-3 inline text-[#FF3A2F]" /> para la comunidad Discord</p>
        </div>
      </footer>
    </div>
  )
}
