'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Ticket, Bot, BarChart3,
  Users, MessageSquare, ChevronRight, Globe,
  Lock, Star, Cog, Wrench, Heart, X, AlertCircle,
  Flame, Zap, ShieldAlert, Anvil, ArrowRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

const features = [
  { icon: Ticket, title: 'Sistema de Tickets', desc: 'Categorías ilimitadas, transcripciones automáticas, claimed por staff.', color: 'from-[#FFD700] to-[#FF6600]' },
  { icon: ShieldAlert, title: 'AntiRaid', desc: 'Protección contra ataques, lockdown de emergencia, detección en tiempo real.', color: 'from-[#DC2626] to-[#FF6600]' },
  { icon: Users, title: 'Verificación', desc: 'Botón, reacción, captcha matemático. Evita raids y bots automáticos.', color: 'from-[#00B4D8] to-[#DC2626]' },
  { icon: MessageSquare, title: 'Welcome System', desc: 'Embeds personalizables, imágenes, auto-roles, variables dinámicas.', color: 'from-[#FF6600] to-[#FFD700]' },
  { icon: BarChart3, title: 'Encuestas y Sorteos', desc: 'Encuestas con opciones múltiples, giveaways con roles requeridos.', color: 'from-[#FFD700] to-[#DC2626]' },
  { icon: Wrench, title: 'Embed Builder', desc: 'Constructor visual de embeds, presets guardados, envío a canales.', color: 'from-[#DC2626] to-[#FFD700]' },
  { icon: Lock, title: 'Whitelist FiveM', desc: 'Formularios personalizados, revisión de aplicaciones, integración RP.', color: 'from-[#00B4D8] to-[#FF6600]' },
  { icon: Globe, title: 'Reaction Roles', desc: 'Reacciones, botones o select menu. Modos single, multiple, toggle.', color: 'from-[#FF6600] to-[#00B4D8]' },
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Stable particle positions
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 40 + Math.random() * 60,
      size: 1 + Math.random() * 3,
      color: i % 5 === 0 ? '#FF6600' : i % 5 === 1 ? '#FFD700' : i % 5 === 2 ? '#DC2626' : i % 5 === 3 ? '#00B4D8' : '#FF8C00',
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 6,
      opacity: 0.2 + Math.random() * 0.6,
    }))
  }, [])

  const risingEmbers = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1 + Math.random() * 2,
      color: i % 4 === 0 ? '#FF6600' : i % 4 === 1 ? '#DC2626' : i % 4 === 2 ? '#00B4D8' : '#FFD700',
      duration: 8 + Math.random() * 15,
      delay: Math.random() * 10,
      drift: -50 + Math.random() * 100,
    }))
  }, [])

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
            className="fixed top-0 left-0 right-0 z-[100] bg-[#DC2626]/90 backdrop-blur-sm text-white px-4 py-3"
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
      <nav className={`fixed ${authError ? 'top-12' : 'top-0'} left-0 right-0 z-50 glass-strong transition-top duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-9 h-9 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #FF6600, #DC2626)', boxShadow: '0 0 10px rgba(255,102,0,0.3), 0 0 20px rgba(0,180,216,0.1)' }}
              whileHover={{ scale: 1.08 }}
            >
              <Image
                src="/logo-v2.png"
                alt="DiscordForge"
                width={26}
                height={26}
                className="w-[26px] h-[26px] relative z-10 object-contain"
                style={{ filter: 'drop-shadow(0 0 4px rgba(255,102,0,0.5))' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/20 to-transparent pointer-events-none" />
            </motion.div>
            <span className="font-bold text-lg animate-gradient-text">DiscordForge</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-[#888] hover:text-[#FF6600] transition-colors hidden sm:block">Características</a>
            <Button onClick={handleLogin} disabled={loginLoading} className="bg-gradient-to-r from-[#FF6600] to-[#DC2626] hover:from-[#FF6600]/90 hover:to-[#DC2626]/90 text-white gap-2 border-0 font-semibold" style={{ boxShadow: '0 0 12px rgba(255,102,0,0.3)' }}>
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
        </div>
      </nav>

      {/* Hero */}
      <section className={`pt-32 ${authError ? 'pt-44' : ''} pb-20 px-4 relative`}>
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Large glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-[#FF6600]/8 rounded-full blur-3xl" style={{ animation: 'forge-pulse 6s ease-in-out infinite' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#DC2626]/6 rounded-full blur-3xl" style={{ animation: 'forge-pulse 8s ease-in-out infinite 2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00B4D8]/3 rounded-full blur-3xl" style={{ animation: 'forge-pulse 10s ease-in-out infinite 4s' }} />

          {/* Abstract flame shapes derived from logo - very subtle */}
          <div
            className="absolute -bottom-[10%] left-[20%] w-[500px] h-[600px] opacity-[0.04] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 40% 70% at 50% 60%, #FF6600 0%, #DC2626 30%, #FF8C00 60%, transparent 100%)',
              clipPath: 'polygon(50% 0%, 75% 25%, 90% 50%, 85% 75%, 70% 90%, 50% 100%, 30% 90%, 15% 75%, 10% 50%, 25% 25%)',
              animation: 'forge-pulse 8s ease-in-out infinite 1s',
            }}
          />
          <div
            className="absolute top-[10%] right-[15%] w-[350px] h-[450px] opacity-[0.03] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 35% 65% at 50% 55%, #FF8C00 0%, #FFD700 25%, #FF6600 50%, transparent 100%)',
              clipPath: 'polygon(50% 0%, 72% 20%, 88% 45%, 82% 70%, 65% 88%, 50% 100%, 35% 88%, 18% 70%, 12% 45%, 28% 20%)',
              animation: 'forge-pulse 10s ease-in-out infinite 5s',
            }}
          />

          {/* Floating embers */}
          {mounted && particles.map(p => (
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

          {/* Rising embers from bottom */}
          {mounted && risingEmbers.map(e => (
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

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Logo badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <motion.div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FF6600, #DC2626)',
                    boxShadow: '0 0 20px rgba(255,102,0,0.3), 0 0 40px rgba(0,180,216,0.1)',
                  }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                >
                  <Image
                    src="/logo-v2.png"
                    alt="DiscordForge"
                    width={56}
                    height={56}
                    className="w-14 h-14 relative z-10 object-contain"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(255,102,0,0.6))' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FFD700]/20 to-transparent rounded-2xl pointer-events-none" />
                </motion.div>
                {/* Rotating glow ring */}
                <div
                  className="absolute -inset-2 rounded-3xl opacity-30"
                  style={{
                    background: 'conic-gradient(from 0deg, #FF6600, #FFD700, #DC2626, #00B4D8, #FF8C00, #FF6600)',
                    animation: 'rotate-glow 8s linear infinite',
                    filter: 'blur(8px)',
                  }}
                />
              </div>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full px-4 py-1.5 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-sm text-[#FF6600] font-medium">La plataforma #1 para gestionar tu servidor Discord</span>
            </motion.div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Forja tu servidor{' '}
              <span className="animate-gradient-text">Discord</span>
              <br />
              <span className="text-[#FF6600]">como nunca antes</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#888] max-w-2xl mx-auto mb-10 leading-relaxed">
              Tickets, moderación, anti-raid, verificación, welcome, embeds, whitelist FiveM y mucho más.
              Todo desde un dashboard web intuitivo y en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleLogin} disabled={loginLoading} size="lg" className="h-14 text-base font-semibold bg-gradient-to-r from-[#FF6600] to-[#DC2626] hover:from-[#FF6600]/90 hover:to-[#DC2626]/90 text-white gap-3 px-8 hover:scale-105 transition-all neon-orange group">
                {loginLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Cog className="w-5 h-5" /></motion.div>
                ) : (
                  <>
                    <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Forjar mi Servidor
                  </>
                )}
              </Button>
              <Button variant="outline" size="lg" className="h-14 text-base gap-2 px-8 border-[#FF6600]/30 text-[#FF6600] hover:bg-[#FF6600]/10 hover:border-[#FF6600]/50 group" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver Características <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16">
            {[{ value: '8+', label: 'Sistemas' }, { value: '24/7', label: 'Uptime' }, { value: '100%', label: 'Gratis' }].map((s) => (
              <motion.div
                key={s.label}
                whileHover={{ scale: 1.1 }}
                className="text-center cursor-default"
              >
                <div className="text-2xl font-bold animate-gradient-text">{s.value}</div>
                <div className="text-sm text-[#888]">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              ¿Cómo funciona? <span className="animate-gradient-text">3 pasos</span>
            </h2>
            <p className="text-[#888]">En 3 simples pasos</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <Card className="border-white/5 bg-[#111]/80 backdrop-blur h-full forge-card-premium group">
                  <CardContent className="p-6 text-center relative">
                    <motion.div
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF6600] to-[#DC2626] flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-[#FF6600]/25"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {step.num}
                    </motion.div>
                    <h3 className="font-semibold mb-2 text-white">{step.title}</h3>
                    <p className="text-sm text-[#888]">{step.desc}</p>
                    {/* Step connector line (not on last) */}
                    {i < 2 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 w-6">
                        <ArrowRight className="w-4 h-4 text-[#FF6600]/40" />
                      </div>
                    )}
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
            <div className="inline-flex items-center gap-2 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full px-4 py-1.5 mb-4">
              <Star className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-sm text-[#FF6600] font-medium">Funcionalidades</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Todo lo que <span className="animate-gradient-text">necesitas</span>
            </h2>
            <p className="text-[#888]">Sistemas completos para gestionar tu comunidad</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Card className="border-white/5 bg-[#111]/80 backdrop-blur h-full forge-card-premium group cursor-default">
                  <CardContent className="p-5">
                    <motion.div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: 5 }}
                    >
                      <feat.icon className="w-5 h-5 text-white" />
                    </motion.div>
                    <h3 className="font-semibold mb-1.5 text-white">{feat.title}</h3>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl"
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-2xl p-[1.5px]" style={{ background: 'linear-gradient(135deg, #FF6600, #FFD700, #DC2626, #FF8C00, #FF6600)', backgroundSize: '300% 300%', animation: 'gradient-shift 4s ease infinite' }}>
              <div className="w-full h-full rounded-2xl bg-[#0A0A0A]" />
            </div>
            <div className="relative bg-gradient-to-br from-[#FF6600]/8 via-[#DC2626]/5 to-[#FFD700]/3 rounded-2xl p-8 sm:p-12 text-center overflow-hidden">
              <div className="absolute inset-0 bg-forge-grid opacity-50" />
              {/* Flame accent shapes */}
              <div
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] opacity-[0.06] pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 40% 70% at 50% 60%, #FF6600 0%, #DC2626 30%, #FF8C00 60%, transparent 100%)',
                  clipPath: 'polygon(50% 0%, 75% 25%, 90% 50%, 85% 75%, 70% 90%, 50% 100%, 30% 90%, 15% 75%, 10% 50%, 25% 25%)',
                  animation: 'forge-pulse 5s ease-in-out infinite',
                }}
              />
              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="inline-block mb-4"
                >
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center neon-orange" style={{ background: 'linear-gradient(135deg, #FF6600, #DC2626)' }}>
                    <Image src="/logo-v2.png" alt="DiscordForge" width={40} height={40} className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,102,0,0.5)]" />
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold mb-4">¿Listo para <span className="animate-gradient-text">empezar</span>?</h2>
                <p className="text-[#888] mb-8 max-w-lg mx-auto">Añade DiscordForge a tu servidor y gestiona todo desde un dashboard moderno y en tiempo real.</p>
                <Button onClick={handleLogin} disabled={loginLoading} size="lg" className="h-14 text-base font-semibold bg-gradient-to-r from-[#FF6600] to-[#DC2626] hover:from-[#FF6600]/90 hover:to-[#DC2626]/90 text-white gap-3 px-10 hover:scale-105 transition-all neon-orange group">
                  {loginLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Cog className="w-5 h-5" /></motion.div>
                  ) : (
                    <><Flame className="w-5 h-5 group-hover:scale-110 transition-transform" /> Forjar mi Servidor</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#888]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6600, #DC2626)' }}>
              <Image src="/logo-v2.png" alt="" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
            </div>
            <span>DiscordForge © 2025</span>
          </div>
          <p>Forjado con <Heart className="w-3 h-3 inline text-[#FF6600]" /> para la comunidad Discord</p>
        </div>
      </footer>
    </div>
  )
}
