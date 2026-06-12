import { db } from '@/lib/db'

// In-memory cache for bot customization state
let botCustomization = {
  username: 'DiscordForge',
  avatar: null as string | null,
  id: 'bot_default_001',
}

/**
 * Call the Discord API to modify the bot user.
 * Requires BOT_TOKEN env variable. Falls back to in-memory if not available.
 */
async function updateDiscordBot(username?: string, avatar?: string | null) {
  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    // No bot token - use in-memory fallback
    if (username !== undefined) botCustomization.username = username
    if (avatar !== undefined) botCustomization.avatar = avatar
    return {
      username: botCustomization.username,
      avatar: botCustomization.avatar,
      id: botCustomization.id,
    }
  }

  // Build the patch body for Discord API
  const patchBody: Record<string, string> = {}
  if (username !== undefined) patchBody.username = username
  if (avatar !== undefined) patchBody.avatar = avatar ?? ''

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Discord API error:', response.status, errorData)
      // Fall back to in-memory on API error
      if (username !== undefined) botCustomization.username = username
      if (avatar !== undefined) botCustomization.avatar = avatar
      return {
        username: botCustomization.username,
        avatar: botCustomization.avatar,
        id: botCustomization.id,
      }
    }

    const data = await response.json()
    // Update in-memory cache from Discord response
    botCustomization.username = data.username || botCustomization.username
    botCustomization.avatar = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
      : null
    botCustomization.id = data.id || botCustomization.id

    return {
      username: botCustomization.username,
      avatar: botCustomization.avatar,
      id: botCustomization.id,
    }
  } catch (error) {
    console.error('Failed to call Discord API:', error)
    // Fall back to in-memory
    if (username !== undefined) botCustomization.username = username
    if (avatar !== undefined) botCustomization.avatar = avatar
    return {
      username: botCustomization.username,
      avatar: botCustomization.avatar,
      id: botCustomization.id,
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    // Try to get bot info from Discord API if token available
    const botToken = process.env.BOT_TOKEN
    if (botToken) {
      try {
        const response = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bot ${botToken}` },
        })
        if (response.ok) {
          const data = await response.json()
          botCustomization.username = data.username || botCustomization.username
          botCustomization.avatar = data.avatar
            ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
            : null
          botCustomization.id = data.id || botCustomization.id
        }
      } catch {
        // Use cached values
      }
    }

    return Response.json({
      bot: {
        username: botCustomization.username,
        avatar: botCustomization.avatar,
        id: botCustomization.id,
      },
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { serverId, username, avatar } = body

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    // Validate username if provided
    if (username !== undefined) {
      if (typeof username !== 'string') {
        return Response.json({ error: 'El nombre debe ser texto' }, { status: 400 })
      }
      if (username.length < 2) {
        return Response.json({ error: 'El nombre debe tener al menos 2 caracteres' }, { status: 400 })
      }
      if (username.length > 32) {
        return Response.json({ error: 'El nombre no puede exceder 32 caracteres' }, { status: 400 })
      }
    }

    // Validate avatar if provided
    if (avatar !== undefined && avatar !== null) {
      if (typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
        return Response.json({ error: 'Formato de avatar inválido. Debe ser una imagen en base64' }, { status: 400 })
      }
      // Check approximate size (base64 is ~33% larger than binary)
      const sizeInBytes = (avatar.length * 3) / 4
      if (sizeInBytes > 512 * 1024) {
        return Response.json({ error: 'La imagen es demasiado grande. Máximo 512KB' }, { status: 400 })
      }
    }

    // Update via Discord API (or in-memory fallback)
    const updatedBot = await updateDiscordBot(username, avatar)

    // Log the change
    try {
      await db.log.create({
        data: {
          serverId,
          type: 'bot_customize',
          description: `Bot personalizado: ${username !== undefined ? `nombre → ${username}` : ''}${avatar !== undefined ? (avatar === null ? ', avatar restaurado' : ', avatar actualizado') : ''}`,
          metadata: JSON.stringify({
            username: updatedBot.username,
            hasAvatar: !!updatedBot.avatar,
          }),
        },
      })
    } catch {
      // Log creation is best-effort
    }

    return Response.json({
      success: true,
      bot: updatedBot,
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
