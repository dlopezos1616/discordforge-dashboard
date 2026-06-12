import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/sync - Sincronizar servidor real de Discord con la DB
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { discordId, name, icon, memberCount, ownerId } = body

    if (!discordId || !name) {
      return NextResponse.json({ error: 'discordId and name are required' }, { status: 400 })
    }

    // Upsert the real server
    const server = await db.server.upsert({
      where: { discordId },
      update: {
        name,
        icon: icon || null,
        memberCount: memberCount || 0,
        ownerId: ownerId || 'unknown',
      },
      create: {
        discordId,
        name,
        icon: icon || null,
        memberCount: memberCount || 0,
        ownerId: ownerId || 'unknown',
      },
    })

    // Create default server config if it doesn't exist
    const existingConfig = await db.serverConfig.findUnique({
      where: { serverId: server.id },
    })

    if (!existingConfig) {
      await db.serverConfig.create({
        data: {
          serverId: server.id,
          prefix: '!',
          language: 'es',
          logChannelId: null,
          welcomeChannelId: null,
          modLogChannelId: null,
          maxTicketsPerUser: 3,
        },
      })
    }

    // Create default welcome config if it doesn't exist
    const existingWelcome = await db.welcomeConfig.findUnique({
      where: { serverId: server.id },
    })

    if (!existingWelcome) {
      await db.welcomeConfig.create({
        data: {
          serverId: server.id,
          enabled: false,
          type: 'embed',
          title: '¡Bienvenido/a!',
          description: '¡Bienvenido/a {user} a {server}! Esperamos que disfrutes tu estadía.',
          color: '#5865F2',
          footer: '{server} • {date}',
          useAvatar: true,
          autoRole: false,
          autoRoleIds: '[]',
        },
      })
    }

    return NextResponse.json({
      success: true,
      server,
      message: `Servidor "${name}" sincronizado correctamente`,
    })
  } catch (error) {
    console.error('Error syncing server:', error)
    return NextResponse.json({ error: 'Failed to sync server' }, { status: 500 })
  }
}

// GET /api/sync - Obtener estado de sincronización
export async function GET() {
  try {
    const servers = await db.server.findMany({
      include: {
        config: true,
        welcomeConfig: true,
        _count: {
          select: {
            tickets: true,
            moderationActions: true,
            logs: true,
          },
        },
      },
    })

    const realServers = servers.filter(s => !s.discordId.startsWith('srv_'))
    const demoServers = servers.filter(s => s.discordId.startsWith('srv_'))

    return NextResponse.json({
      total: servers.length,
      realServers,
      demoServers,
      servers,
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 })
  }
}
