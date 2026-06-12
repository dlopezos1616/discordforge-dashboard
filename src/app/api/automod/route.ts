import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const rules = await db.autoModRule.findMany({
      where: { serverId },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ rules })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serverId, name, type, enabled, threshold, action, duration, words, exemptions } = body

    if (!serverId || !name || !type) {
      return Response.json({ error: 'serverId, name, and type required' }, { status: 400 })
    }

    const rule = await db.autoModRule.create({
      data: {
        serverId,
        name,
        type,
        enabled: enabled ?? true,
        threshold: threshold ?? 3,
        action: action ?? 'warn',
        duration: duration || null,
        words: words || '[]',
        exemptions: exemptions || '[]',
      },
    })

    return Response.json({ rule })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { ruleId, ...updates } = body

    if (!ruleId) {
      return Response.json({ error: 'ruleId required' }, { status: 400 })
    }

    const rule = await db.autoModRule.update({
      where: { id: ruleId },
      data: updates,
    })

    return Response.json({ rule })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) {
      return Response.json({ error: 'ruleId required' }, { status: 400 })
    }

    await db.autoModRule.delete({ where: { id: ruleId } })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
