import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const config = await db.serverConfig.findUnique({
      where: { serverId },
    })

    if (!config) {
      return Response.json({ config: null })
    }

    return Response.json({ config })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serverId } = body

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const config = await db.serverConfig.upsert({
      where: { serverId },
      update: {
        prefix: body.prefix,
        language: body.language,
        logChannelId: body.logChannelId || null,
        modLogChannelId: body.modLogChannelId || null,
        welcomeChannelId: body.welcomeChannelId || null,
        ticketLogChannelId: body.ticketLogChannelId || null,
        autoModEnabled: body.autoModEnabled,
        raidProtectionEnabled: body.raidProtectionEnabled,
        darkModeDefault: body.darkModeDefault,
        maxTicketsPerUser: body.maxTicketsPerUser,
      },
      create: {
        serverId,
        prefix: body.prefix || '!',
        language: body.language || 'es',
        logChannelId: body.logChannelId || null,
        modLogChannelId: body.modLogChannelId || null,
        welcomeChannelId: body.welcomeChannelId || null,
        ticketLogChannelId: body.ticketLogChannelId || null,
        autoModEnabled: body.autoModEnabled ?? true,
        raidProtectionEnabled: body.raidProtectionEnabled ?? false,
        darkModeDefault: body.darkModeDefault ?? true,
        maxTicketsPerUser: body.maxTicketsPerUser || 3,
      },
    })

    return Response.json({ config })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    await db.serverConfig.deleteMany({ where: { serverId } })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
