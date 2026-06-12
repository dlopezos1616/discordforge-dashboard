import { db } from '@/lib/db'

export async function GET(request: Request) {
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
    const [
      openTickets, closedTickets, totalMembers,
      moderationCount, verificationCount, activePolls,
      activeGiveaways, whitelistPending, logsToday,
      ticketsByCategory, recentLogs, modActions
    ] = await Promise.all([
      db.ticket.count({ where: { serverId, status: 'open' } }),
      db.ticket.count({ where: { serverId, status: 'closed' } }),
      db.server.findUnique({ where: { id: serverId }, select: { memberCount: true } }),
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

    return Response.json({
      openTickets, closedTickets,
      totalMembers: totalMembers?.memberCount || 0,
      moderationCount, activePolls, activeGiveaways,
      whitelistPending, logsToday,
      chartData, ticketsByCategory, recentLogs, modActions,
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
