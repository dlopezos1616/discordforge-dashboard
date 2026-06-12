import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const giveaways = await db.giveaway.findMany({
      where: { serverId },
      include: {
        entries: {
          include: {
            user: { select: { username: true, avatar: true, discordId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const activeGiveaways = await db.giveaway.count({
      where: { serverId, isActive: true },
    })
    const totalParticipants = await db.giveawayEntry.count({
      where: { giveaway: { serverId } },
    })
    const totalPrizesGiven = await db.giveaway.count({
      where: { serverId, isActive: false },
    })

    return Response.json({
      giveaways,
      stats: { activeGiveaways, totalParticipants, totalPrizesGiven },
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      const { serverId, prize, description, winnerCount, requiredRoleIds, endsAt, channelId } = body
      if (!serverId || !prize) {
        return Response.json({ error: 'serverId and prize required' }, { status: 400 })
      }
      const giveaway = await db.giveaway.create({
        data: {
          serverId,
          prize,
          description: description || null,
          winnerCount: winnerCount || 1,
          requiredRoleIds: JSON.stringify(requiredRoleIds || []),
          endsAt: endsAt ? new Date(endsAt) : null,
          channelId: channelId || null,
        },
      })
      return Response.json({ giveaway })
    }

    if (action === 'end') {
      const { giveawayId } = body
      if (!giveawayId) {
        return Response.json({ error: 'giveawayId required' }, { status: 400 })
      }
      const giveaway = await db.giveaway.update({
        where: { id: giveawayId },
        data: { isActive: false },
      })
      return Response.json({ giveaway })
    }

    if (action === 'reroll') {
      const { giveawayId } = body
      if (!giveawayId) {
        return Response.json({ error: 'giveawayId required' }, { status: 400 })
      }
      const entries = await db.giveawayEntry.findMany({
        where: { giveawayId },
        include: { user: { select: { username: true } } },
      })
      if (entries.length === 0) {
        return Response.json({ error: 'No entries to reroll' }, { status: 400 })
      }
      const randomEntry = entries[Math.floor(Math.random() * entries.length)]
      return Response.json({ winner: randomEntry.user })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
