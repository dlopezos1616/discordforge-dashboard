import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/servers/refresh - Refresh server data from Discord API
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('discord_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let sessionData: any
    try {
      sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      )
    } catch {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    const { accessToken, tokenType } = sessionData

    if (!accessToken || !tokenType) {
      return NextResponse.json({ error: 'Token de acceso no encontrado' }, { status: 401 })
    }

    const body = await request.json()
    const { serverId } = body

    if (!serverId) {
      return NextResponse.json({ error: 'serverId es requerido' }, { status: 400 })
    }

    // Find server in DB to get discordId
    const server = await db.server.findUnique({
      where: { id: serverId },
    })

    if (!server) {
      return NextResponse.json({ error: 'Servidor no encontrado' }, { status: 404 })
    }

    // Fetch fresh data from Discord API
    const guildResponse = await fetch(
      `https://discord.com/api/v10/guilds/${server.discordId}?with_counts=true`,
      { headers: { Authorization: `${tokenType} ${accessToken}` } }
    )

    let discordData: any = null

    if (guildResponse.ok) {
      const guildJson = await guildResponse.json()
      discordData = {
        approximate_member_count: guildJson.approximate_member_count || 0,
        approximate_presence_count: guildJson.approximate_presence_count || 0,
        boost_count: guildJson.premium_subscription_count || 0,
        boost_tier: guildJson.premium_tier || 0,
        emoji_count: guildJson.emojis ? guildJson.emojis.length : 0,
        role_count: guildJson.roles ? guildJson.roles.length : 0,
        features: guildJson.features || [],
      }

      // Update member count in DB
      await db.server.update({
        where: { id: serverId },
        data: {
          memberCount: discordData.approximate_member_count,
          name: guildJson.name || server.name,
          icon: guildJson.icon || server.icon,
        },
      })
    } else {
      console.warn('Could not fetch Discord guild data, using DB values')
    }

    // Fetch channels count from Discord
    let channelCount = 0
    const channelsResponse = await fetch(
      `https://discord.com/api/v10/guilds/${server.discordId}/channels`,
      { headers: { Authorization: `${tokenType} ${accessToken}` } }
    )
    if (channelsResponse.ok) {
      const channels = await channelsResponse.json()
      channelCount = channels.length
    }

    // Return refreshed stats
    const updatedServer = await db.server.findUnique({
      where: { id: serverId },
    })

    // Get current DB stats
    const [openTickets, closedTickets, moderationCount, whitelistPending, activePolls, logsToday] = await Promise.all([
      db.ticket.count({ where: { serverId, status: 'open' } }),
      db.ticket.count({ where: { serverId, status: 'closed' } }),
      db.moderationAction.count({ where: { serverId } }),
      db.whitelistApplication.count({ where: { form: { serverId }, status: 'pending' } }),
      db.poll.count({ where: { serverId, isActive: true } }),
      db.log.count({ where: { serverId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ])

    return NextResponse.json({
      success: true,
      memberCount: updatedServer?.memberCount || 0,
      discordData: discordData ? {
        ...discordData,
        channelCount,
      } : null,
      dbStats: {
        openTickets,
        closedTickets,
        moderationCount,
        whitelistPending,
        activePolls,
        logsToday,
      },
    })
  } catch (error) {
    console.error('Error refreshing server:', error)
    return NextResponse.json({ error: 'Error al refrescar datos del servidor' }, { status: 500 })
  }
}
