import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const actions = await db.moderationAction.findMany({
      where: { serverId },
      include: {
        moderator: { select: { id: true, username: true, discordId: true, avatar: true } },
        target: { select: { id: true, username: true, discordId: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute stats
    const stats = {
      bans: actions.filter(a => a.type === 'ban').length,
      kicks: actions.filter(a => a.type === 'kick').length,
      timeouts: actions.filter(a => a.type === 'timeout').length,
      warns: actions.filter(a => a.type === 'warn').length,
      softbans: actions.filter(a => a.type === 'softban').length,
      unbans: actions.filter(a => a.type === 'unban').length,
    }

    return Response.json({ actions, stats })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serverId, userId, moderatorId, type, reason, duration } = body

    if (!serverId || !userId || !moderatorId || !type) {
      return Response.json({ error: 'serverId, userId, moderatorId, and type required' }, { status: 400 })
    }

    const action = await db.moderationAction.create({
      data: {
        serverId,
        userId,
        moderatorId,
        type,
        reason: reason || null,
        duration: duration || null,
        isActive: type !== 'unban',
      },
      include: {
        moderator: { select: { id: true, username: true, discordId: true, avatar: true } },
        target: { select: { id: true, username: true, discordId: true, avatar: true } },
      },
    })

    return Response.json({ action })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
