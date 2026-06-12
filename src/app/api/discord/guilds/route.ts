import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('discord_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No autenticado. Inicia sesión con Discord.' }, { status: 401 })
    }

    // Decode session data
    let sessionData: any
    try {
      sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      )
    } catch {
      return NextResponse.json({ error: 'Sesión inválida. Inicia sesión de nuevo.' }, { status: 401 })
    }

    const { accessToken, tokenType, user } = sessionData

    if (!accessToken || !tokenType) {
      return NextResponse.json({ error: 'Token de acceso no encontrado. Inicia sesión de nuevo.' }, { status: 401 })
    }

    // Fetch guilds directly from Discord API (not from cookie)
    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `${tokenType} ${accessToken}` },
    })

    if (!guildsResponse.ok) {
      const errText = await guildsResponse.text()
      console.error('Discord guilds fetch error:', guildsResponse.status, errText)

      if (guildsResponse.status === 401) {
        return NextResponse.json({ error: 'Sesión expirada. Inicia sesión de nuevo.' }, { status: 401 })
      }

      return NextResponse.json({ error: 'Error al obtener servidores de Discord' }, { status: 500 })
    }

    const allGuilds = await guildsResponse.json()

    // Filter guilds where user has admin permissions
    const adminGuilds = allGuilds.filter((g: any) => {
      const perms = Number(g.permissions)
      // ADMINISTRATOR (0x8) or MANAGE_GUILD (0x20) or owner
      return g.owner || (perms & 0x8) === 0x8 || (perms & 0x20) === 0x20
    })

    return NextResponse.json({
      guilds: adminGuilds,
      user,
    })
  } catch (err) {
    console.error('Guilds API error:', err)
    return NextResponse.json({ error: 'Error al obtener servidores' }, { status: 500 })
  }
}
