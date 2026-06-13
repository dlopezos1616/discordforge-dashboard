import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      // Global stats
      const [totalServers, totalUsers, totalTickets, totalLogs] = await Promise.all([
        db.server.count(),
        db.user.count(),
        db.ticket.count(),
        db.log.count(),
      ])
      return Response.json({ global: true, totalServers, totalUsers, totalTickets, totalLogs })
    }

    // Server-specific stats
    const server = await db.server.findUnique({
      where: { id: serverId },
      select: {
        id: true,
        discordId: true,
        name: true,
        icon: true,
        memberCount: true,
        isActive: true,
        config: { select: { autoModEnabled: true, raidProtectionEnabled: true } },
        antiRaidConfig: { select: { enabled: true, totalRaidsDetected: true, isLockedDown: true } },
      },
    })

    if (!server) {
      return Response.json({ error: 'Servidor no encontrado' }, { status: 404 })
    }

    const [
      openTickets, closedTickets,
      moderationCount, verificationCount, activePolls,
      activeGiveaways, whitelistPending, logsToday,
      ticketsByCategory, recentLogs, modActions,
      totalLogs, joinLogsWeek, leaveLogsWeek,
      automodRules, activeAutomodRules,
      ticketCreateLogsWeek,
    ] = await Promise.all([
      db.ticket.count({ where: { serverId, status: 'open' } }),
      db.ticket.count({ where: { serverId, status: 'closed' } }),
      db.moderationAction.count({ where: { serverId } }),
      db.verificationConfig.count({ where: { serverId, enabled: true } }),
      db.poll.count({ where: { serverId, isActive: true } }),
      db.giveaway.count({ where: { serverId, isActive: true } }),
      db.whitelistApplication.count({ where: { form: { serverId }, status: 'pending' } }),
      db.log.count({ where: { serverId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      db.ticketCategory.findMany({
        where: { serverId },
        include: { _count: { select: { tickets: true } } },
        orderBy: { position: 'asc' },
      }),
      db.log.findMany({ where: { serverId }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { username: true, avatar: true } } } }),
      db.moderationAction.findMany({ where: { serverId }, orderBy: { createdAt: 'desc' }, take: 5, include: { moderator: { select: { username: true } }, target: { select: { username: true } } } }),
      db.log.count({ where: { serverId } }),
      db.log.count({ where: { serverId, type: 'join', createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.log.count({ where: { serverId, type: 'leave', createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.autoModRule.count({ where: { serverId } }),
      db.autoModRule.count({ where: { serverId, enabled: true } }),
      db.log.count({ where: { serverId, type: 'ticket_create', createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ])

    // Generate chart data for the last 7 days
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const [joins, leaves, ticketsCreated, messages] = await Promise.all([
        db.log.count({ where: { serverId, type: 'join', createdAt: { gte: dayStart, lte: dayEnd } } }),
        db.log.count({ where: { serverId, type: 'leave', createdAt: { gte: dayStart, lte: dayEnd } } }),
        db.log.count({ where: { serverId, type: 'ticket_create', createdAt: { gte: dayStart, lte: dayEnd } } }),
        db.log.count({ where: { serverId, createdAt: { gte: dayStart, lte: dayEnd } } }),
      ])

      chartData.push({
        date: dayStart.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        joins, leaves, tickets: ticketsCreated, messages,
      })
    }

    // Compute dynamic health metrics
    const totalMembers = server.memberCount || 0

    // Auto-Mod health: based on whether automod is enabled and has active rules
    const automodHealth = server.config?.autoModEnabled
      ? Math.min(100, 40 + (activeAutomodRules > 0 ? 30 : 0) + (server.antiRaidConfig?.enabled ? 30 : 0))
      : Math.min(100, (activeAutomodRules > 0 ? 20 : 0) + (server.antiRaidConfig?.enabled ? 30 : 0))

    // Activity health: based on logs in the last 7 days relative to server size
    const activityRate = totalMembers > 0 ? (logsToday / Math.max(totalMembers, 1)) * 100 : 0
    const activityHealth = Math.min(100, Math.round(
      totalMembers > 0
        ? Math.min(80, (joinLogsWeek + leaveLogsWeek + logsToday * 7) / Math.max(totalMembers * 0.01, 1) * 10) + (logsToday > 0 ? 20 : 0)
        : logsToday > 0 ? 30 : 5
    ))

    // Security health: based on moderation setup
    const securityHealth = Math.min(100, Math.round(
      (server.config?.autoModEnabled ? 25 : 0) +
      (server.antiRaidConfig?.enabled ? 25 : 0) +
      (verificationCount > 0 ? 25 : 0) +
      (activeAutomodRules > 0 ? 25 : 0)
    ))

    // Engagement health: based on polls, giveaways, tickets activity
    const engagementHealth = Math.min(100, Math.round(
      (activePolls > 0 ? 20 : 0) +
      (activeGiveaways > 0 ? 20 : 0) +
      (openTickets + closedTickets > 0 ? 30 : 0) +
      (joinLogsWeek > leaveLogsWeek ? 30 : joinLogsWeek > 0 ? 15 : 0)
    ))

    // Try to fetch live Discord data (non-blocking)
    let discordData = null
    try {
      const sessionCookie = request.cookies.get('discord_session')
      if (sessionCookie?.value) {
        const sessionData = JSON.parse(
          Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
        )
        if (sessionData.accessToken && sessionData.tokenType) {
          const guildRes = await fetch(
            `https://discord.com/api/v10/guilds/${server.discordId}?with_counts=true`,
            { headers: { Authorization: `${sessionData.tokenType} ${sessionData.accessToken}` } }
          )
          if (guildRes.ok) {
            const guildJson = await guildRes.json()
            const memberCount = guildJson.approximate_member_count || 0
            const presenceCount = guildJson.approximate_presence_count || 0

            discordData = {
              approximate_member_count: memberCount,
              approximate_presence_count: presenceCount,
              boost_count: guildJson.premium_subscription_count || 0,
              boost_tier: guildJson.premium_tier || 0,
              emoji_count: guildJson.emojis ? guildJson.emojis.length : 0,
              role_count: guildJson.roles ? guildJson.roles.length : 0,
              description: guildJson.description || null,
              banner: guildJson.banner || null,
            }

            // Always update member count in DB with latest Discord data
            if (memberCount > 0 && memberCount !== server.memberCount) {
              try {
                await db.server.update({
                  where: { id: serverId },
                  data: { memberCount },
                })
              } catch {
                // Ignore DB update errors
              }
            }
          }
        }
      }
    } catch {
      // Non-critical: just use DB values if Discord API fails
    }

    // If we still don't have Discord data, try the user guilds endpoint as fallback
    if (!discordData) {
      try {
        const sessionCookie = request.cookies.get('discord_session')
        if (sessionCookie?.value) {
          const sessionData = JSON.parse(
            Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
          )
          if (sessionData.accessToken && sessionData.tokenType) {
            const guildsRes = await fetch(
              'https://discord.com/api/v10/users/@me/guilds?with_counts=true',
              { headers: { Authorization: `${sessionData.tokenType} ${sessionData.accessToken}` } }
            )
            if (guildsRes.ok) {
              const allGuilds = await guildsRes.json()
              const matchingGuild = allGuilds.find((g: any) => g.id === server.discordId)
              if (matchingGuild) {
                const memberCount = matchingGuild.approximate_member_count || 0
                const presenceCount = matchingGuild.approximate_presence_count || 0
                if (memberCount > 0) {
                  discordData = {
                    approximate_member_count: memberCount,
                    approximate_presence_count: presenceCount,
                    boost_count: 0,
                    boost_tier: 0,
                    emoji_count: 0,
                    role_count: 0,
                    description: null,
                    banner: null,
                  }
                  // Update DB with latest count
                  if (memberCount !== server.memberCount) {
                    try {
                      await db.server.update({
                        where: { id: serverId },
                        data: { memberCount },
                      })
                    } catch { /* ignore */ }
                  }
                }
              }
            }
          }
        }
      } catch {
        // Non-critical fallback
      }
    }

    // Use Discord live data for member count if available, otherwise use DB value
    const liveMemberCount = discordData?.approximate_member_count || totalMembers
    const onlineCount = discordData?.approximate_presence_count || 0

    return Response.json({
      openTickets, closedTickets,
      totalMembers: liveMemberCount,
      onlineMembers: onlineCount,
      moderationCount, activePolls, activeGiveaways,
      whitelistPending, logsToday,
      totalLogs,
      chartData, ticketsByCategory, recentLogs, modActions,
      // Computed health metrics
      healthMetrics: {
        automod: automodHealth,
        activity: activityHealth,
        security: securityHealth,
        engagement: engagementHealth,
      },
      // Discord live data
      discordData,
      // Server info
      serverInfo: {
        name: server.name,
        icon: server.icon,
        boostCount: discordData?.boost_count || 0,
        boostTier: discordData?.boost_tier || 0,
        emojiCount: discordData?.emoji_count || 0,
        roleCount: discordData?.role_count || 0,
        automodRules: activeAutomodRules,
        totalAutomodRules: automodRules,
        hasVerification: verificationCount > 0,
        raidProtectionEnabled: server.antiRaidConfig?.enabled || false,
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
