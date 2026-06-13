import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('discord_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let sessionData: any
    try {
      sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      )
    } catch {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    const { accessToken, tokenType } = sessionData

    if (!accessToken || !tokenType) {
      return NextResponse.json({ error: 'Token de acceso no encontrado' }, { status: 401 })
    }

    const guildId = new URL(request.url).searchParams.get('guildId')

    if (!guildId) {
      return NextResponse.json({ error: 'guildId es requerido' }, { status: 400 })
    }

    // Fetch guild details from Discord API with counts
    const guildResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
      { headers: { Authorization: `${tokenType} ${accessToken}` } }
    )

    if (!guildResponse.ok) {
      const errText = await guildResponse.text()
      console.error('Discord guild fetch error:', guildResponse.status, errText)

      if (guildResponse.status === 401) {
        return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 })
      }

      if (guildResponse.status === 403) {
        return NextResponse.json({ error: 'Sin acceso a este servidor' }, { status: 403 })
      }

      return NextResponse.json({ error: 'Error al obtener datos del servidor de Discord' }, { status: 500 })
    }

    const guildData = await guildResponse.json()

    return NextResponse.json({
      id: guildData.id,
      name: guildData.name,
      icon: guildData.icon || null,
      description: guildData.description || null,
      owner: guildData.owner || false,
      approximate_member_count: guildData.approximate_member_count || 0,
      approximate_presence_count: guildData.approximate_presence_count || 0,
      max_members: guildData.max_members || 0,
      vanity_url_code: guildData.vanity_url_code || null,
      boost_count: guildData.premium_subscription_count || 0,
      boost_tier: guildData.premium_tier || 0,
      channel_count: guildData.channels ? guildData.channels.length : 0,
      role_count: guildData.roles ? guildData.roles.length : 0,
      emoji_count: guildData.emojis ? guildData.emojis.length : 0,
      sticker_count: guildData.stickers ? guildData.stickers.length : 0,
      features: guildData.features || [],
      banner: guildData.banner || null,
      splash: guildData.splash || null,
    })
  } catch (err) {
    console.error('Guild detail API error:', err)
    return NextResponse.json({ error: 'Error al obtener datos del servidor' }, { status: 500 })
  }
}
