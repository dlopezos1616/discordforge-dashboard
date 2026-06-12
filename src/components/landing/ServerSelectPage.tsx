'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Server, Plus, Shield, Users, ExternalLink,
  Cog, ChevronRight, CheckCircle2, LogOut, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: number
  features: string[]
}

export function ServerSelectPage() {
  const { user, setUser, setServers, setCurrentServer } = useAppStore()
  const [guilds, setGuilds] = useState<DiscordGuild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1514983732761854113'
  const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot+applications.commands&permissions=8`

  useEffect(() => {
    fetchGuilds()
  }, [])

  const fetchGuilds = async () => {
    try {
      const res = await fetch('/api/discord/guilds')
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else if (data.guilds) {
        setGuilds(data.guilds)
      }
    } catch (err) {
      setError('Error al cargar los servidores')
    } finally {
      setLoading(false)
    }
  }

  const hasAdminPermission = (permissions: number) => {
    // ADMINISTRATOR = 0x8, MANAGE_GUILD = 0x20
    return (permissions & 0x8) === 0x8 || (permissions & 0x20) === 0x20
  }

  const adminGuilds = guilds.filter(g => g.owner || hasAdminPermission(g.permissions))
  const iconUrl = (guild: DiscordGuild) =>
    guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128` : null

  const handleSelectServer = async (guild: DiscordGuild) => {
    // Sync server to our database
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: guild.id,
          name: guild.name,
          icon: guild.icon,
          ownerId: guild.owner ? (user as any)?.discordId || 'unknown' : 'unknown',
        }),
      })

      // Fetch all servers from our DB
      const serversRes = await fetch('/api/servers')
      const serversData = await serversRes.json()

      if (serversData.servers) {
        const mappedServers = serversData.servers
          .filter((s: any) => /^\d+$/.test(s.discordId))
          .map((s: any) => ({
            id: s.id,
            discordId: s.discordId,
            name: s.name,
            icon: s.icon,
            memberCount: s.memberCount,
            isActive: s.isActive,
          }))
        setServers(mappedServers)
        const target = mappedServers.find((s: any) => s.discordId === guild.id)
        if (target) setCurrentServer(target)
      }
    } catch (err) {
      console.error('Error selecting server:', err)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/discord', { method: 'DELETE' }).catch(() => {})
    setUser(null)
    setServers([])
    setCurrentServer(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Cog className="w-8 h-8 text-violet-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">DiscordForge</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-muted-foreground hidden sm:inline">{(user as any)?.username || 'Usuario'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground gap-1">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Selecciona un servidor</h1>
          <p className="text-muted-foreground mb-8">
            Elige el servidor de Discord que quieres gestionar. Solo se muestran los servidores donde eres propietario o administrador.
          </p>

          {error && (
            <Card className="border-red-500/30 bg-red-500/5 mb-6">
              <CardContent className="p-4 text-red-400 text-sm">{error}</CardContent>
            </Card>
          )}

          {adminGuilds.length === 0 && !error && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-8 text-center">
                <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No tienes servidores con permisos de administrador</h3>
                <p className="text-sm text-muted-foreground mb-4">Necesitas ser propietario o administrador de un servidor para usar DiscordForge.</p>
                <Button onClick={() => window.open('https://discord.com/channels/@me', '_blank')} variant="outline" className="gap-2">
                  Abrir Discord <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Server list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {adminGuilds.map((guild, i) => (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-violet-500/30 transition-all cursor-pointer group"
                  onClick={() => handleSelectServer(guild)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Server icon */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-violet-500/20 flex items-center justify-center shrink-0">
                      {iconUrl(guild) ? (
                        <img src={iconUrl(guild)!} alt={guild.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-violet-400">
                          {guild.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{guild.name}</h3>
                        {guild.owner && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-500/30 text-violet-400">
                            <Shield className="w-2.5 h-2.5 mr-0.5" /> Owner
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {guild.owner ? 'Propietario' : 'Administrador'}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Add bot section */}
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">¿No ves tu servidor?</h3>
                  <p className="text-sm text-muted-foreground">
                    Primero necesitas añadir el bot a tu servidor de Discord. Haz clic en el botón y selecciona el servidor al que quieres invitarlo.
                  </p>
                </div>
                <Button
                  onClick={() => window.open(INVITE_URL, '_blank')}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Añadir Bot a un Servidor
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
