import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const categories = await db.ticketCategory.findMany({
      where: { serverId },
      include: { _count: { select: { tickets: true } } },
      orderBy: { position: 'asc' },
    })

    const tickets = await db.ticket.findMany({
      where: { serverId },
      include: {
        category: true,
        creator: { select: { username: true, avatar: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return Response.json({ categories, tickets })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serverId, name, emoji, color, description, staffRoleId, customMessage } = body

    if (!serverId || !name) {
      return Response.json({ error: 'serverId and name required' }, { status: 400 })
    }

    const category = await db.ticketCategory.create({
      data: { serverId, name, emoji: emoji || '🎫', color: color || '#5865F2', description, staffRoleId, customMessage },
    })

    return Response.json({ category })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { serverId, categoryId, ticketId, action, isActive } = body

    // Toggle category active status
    if (categoryId && isActive !== undefined) {
      const category = await db.ticketCategory.update({
        where: { id: categoryId },
        data: { isActive },
      })
      return Response.json({ category })
    }

    // Ticket actions (claim, close)
    if (ticketId && action) {
      const updateData: Record<string, unknown> = {}
      if (action === 'claim') {
        updateData.status = 'claimed'
      } else if (action === 'close') {
        updateData.status = 'closed'
        updateData.closedAt = new Date()
      }
      const ticket = await db.ticket.update({
        where: { id: ticketId },
        data: updateData,
      })
      return Response.json({ ticket })
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const ticketId = searchParams.get('ticketId')

    if (categoryId) {
      await db.ticketCategory.delete({ where: { id: categoryId } })
      return Response.json({ success: true })
    }

    if (ticketId) {
      await db.ticket.delete({ where: { id: ticketId } })
      return Response.json({ success: true })
    }

    return Response.json({ error: 'categoryId or ticketId required' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
