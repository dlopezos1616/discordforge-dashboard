import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const polls = await db.poll.findMany({
      where: { serverId },
      include: {
        votes: {
          include: {
            user: { select: { username: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const totalPolls = await db.poll.count({ where: { serverId } })
    const activePolls = await db.poll.count({ where: { serverId, isActive: true } })
    const totalVotes = await db.pollVote.count({
      where: { poll: { serverId } },
    })

    return Response.json({
      polls,
      stats: { totalPolls, activePolls, totalVotes },
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
      const { serverId, question, options, type, allowMultiple, endsAt, channelId } = body
      if (!serverId || !question) {
        return Response.json({ error: 'serverId and question required' }, { status: 400 })
      }
      const poll = await db.poll.create({
        data: {
          serverId,
          question,
          options: JSON.stringify(options || ['Sí', 'No']),
          type: type || 'yesno',
          allowMultiple: allowMultiple || false,
          endsAt: endsAt ? new Date(endsAt) : null,
          channelId: channelId || null,
        },
      })
      return Response.json({ poll })
    }

    if (action === 'close') {
      const { pollId } = body
      if (!pollId) {
        return Response.json({ error: 'pollId required' }, { status: 400 })
      }
      const poll = await db.poll.update({
        where: { id: pollId },
        data: { isActive: false },
      })
      return Response.json({ poll })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
