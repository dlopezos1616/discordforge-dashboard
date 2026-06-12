import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('discord_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No autenticado. Inicia sesión con Discord.' }, { status: 401 })
    }

    // Decode session data
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    )

    if (!sessionData.guilds || sessionData.guilds.length === 0) {
      return NextResponse.json({ guilds: [] })
    }

    // Filter guilds where user has admin permissions
    const adminGuilds = sessionData.guilds.filter((g: any) => {
      const perms = Number(g.permissions)
      // ADMINISTRATOR (0x8) or MANAGE_GUILD (0x20) or owner
      return g.owner || (perms & 0x8) === 0x8 || (perms & 0x20) === 0x20
    })

    return NextResponse.json({
      guilds: adminGuilds,
      user: sessionData.user,
    })
  } catch (err) {
    console.error('Guilds API error:', err)
    return NextResponse.json({ error: 'Error al obtener servidores' }, { status: 500 })
  }
}
