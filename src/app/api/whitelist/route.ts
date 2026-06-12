import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const forms = await db.whitelistForm.findMany({
      where: { serverId },
      include: {
        _count: { select: { applications: true } },
        applications: {
          include: {
            user: { select: { username: true, avatar: true, discordId: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const pendingCount = await db.whitelistApplication.count({
      where: { form: { serverId }, status: 'pending' },
    })
    const acceptedToday = await db.whitelistApplication.count({
      where: {
        form: { serverId },
        status: 'accepted',
        updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    })
    const rejectedToday = await db.whitelistApplication.count({
      where: {
        form: { serverId },
        status: 'rejected',
        updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    })

    return Response.json({
      forms,
      stats: { pending: pendingCount, acceptedToday, rejectedToday },
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'createForm') {
      const { serverId, name, description, fields, channelId, roleId } = body
      if (!serverId || !name) {
        return Response.json({ error: 'serverId and name required' }, { status: 400 })
      }
      const form = await db.whitelistForm.create({
        data: {
          serverId,
          name,
          description: description || null,
          fields: JSON.stringify(fields || []),
          channelId: channelId || null,
          roleId: roleId || null,
        },
      })
      return Response.json({ form })
    }

    if (action === 'review') {
      const { applicationId, status, reviewedBy, comment } = body
      if (!applicationId || !status) {
        return Response.json({ error: 'applicationId and status required' }, { status: 400 })
      }
      const application = await db.whitelistApplication.update({
        where: { id: applicationId },
        data: {
          status,
          reviewedBy: reviewedBy || null,
          comment: comment || null,
        },
      })
      return Response.json({ application })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
