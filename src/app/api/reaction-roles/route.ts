import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const reactionRoles = await db.reactionRole.findMany({
      where: { serverId },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ reactionRoles })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serverId, type, emoji, label, roleIds, mode, exclusive, autoRemove, channelId, messageId } = body

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const reactionRole = await db.reactionRole.create({
      data: {
        serverId,
        type: type || 'reaction',
        emoji: emoji || null,
        label: label || null,
        roleIds: roleIds || '[]',
        mode: mode || 'single',
        exclusive: exclusive ?? false,
        autoRemove: autoRemove ?? false,
        channelId: channelId || null,
        messageId: messageId || null,
      },
    })

    return Response.json({ reactionRole })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return Response.json({ error: 'id required' }, { status: 400 })
    }

    const reactionRole = await db.reactionRole.update({
      where: { id },
      data: updates,
    })

    return Response.json({ reactionRole })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'id required' }, { status: 400 })
    }

    await db.reactionRole.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
