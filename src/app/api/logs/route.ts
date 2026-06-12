import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const range = searchParams.get('range') || '7d'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { serverId }

    if (type && type !== 'all') {
      where.type = type
    }

    if (search) {
      where.description = { contains: search }
    }

    if (range === 'today') {
      where.createdAt = { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    } else if (range === '7d') {
      where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    } else if (range === '30d') {
      where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }

    const [logs, total] = await Promise.all([
      db.log.findMany({
        where,
        include: {
          user: { select: { username: true, avatar: true, discordId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.log.count({ where }),
    ])

    const totalLogs = await db.log.count({ where: { serverId } })
    const logsToday = await db.log.count({
      where: {
        serverId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    })

    const typeCounts = await db.log.groupBy({
      by: ['type'],
      where: { serverId },
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
    })

    const mostActiveType = typeCounts.length > 0 ? typeCounts[0].type : '—'

    return Response.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: { totalLogs, logsToday, mostActiveType, typeCounts },
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
