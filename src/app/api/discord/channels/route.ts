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

    // Fetch channels from Discord API
    const channelsResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      { headers: { Authorization: `${tokenType} ${accessToken}` } }
    )

    if (!channelsResponse.ok) {
      const errText = await channelsResponse.text()
      console.error('Discord channels fetch error:', channelsResponse.status, errText)

      if (channelsResponse.status === 401) {
        return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 })
      }

      return NextResponse.json({ error: 'Error al obtener canales de Discord' }, { status: 500 })
    }

    const allChannels = await channelsResponse.json()

    // Filter to text channels and categories, organize by category
    const textChannels = allChannels
      .filter((ch: any) => ch.type === 0) // GUILD_TEXT
      .map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        parentId: ch.parent_id || null,
        position: ch.position,
        topic: ch.topic || null,
        nsfw: ch.nsfw || false,
      }))

    const categories = allChannels
      .filter((ch: any) => ch.type === 4) // GUILD_CATEGORY
      .map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        position: ch.position,
      }))
      .sort((a: any, b: any) => a.position - b.position)

    // Organize channels by category
    const organized = categories.map((cat: any) => ({
      ...cat,
      channels: textChannels
        .filter((ch: any) => ch.parentId === cat.id)
        .sort((a: any, b: any) => a.position - b.position),
    }))

    // Add uncategorized channels
    const uncategorized = textChannels
      .filter((ch: any) => !ch.parentId)
      .sort((a: any, b: any) => a.position - b.position)

    return NextResponse.json({
      channels: textChannels.sort((a: any, b: any) => a.position - b.position),
      categories: organized,
      uncategorized,
    })
  } catch (err) {
    console.error('Channels API error:', err)
    return NextResponse.json({ error: 'Error al obtener canales' }, { status: 500 })
  }
}
