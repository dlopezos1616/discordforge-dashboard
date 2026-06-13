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

    const { searchParams } = new URL(request.url)
    const guildId = searchParams.get('guildId')

    if (!guildId) {
      return NextResponse.json({ error: 'guildId es requerido' }, { status: 400 })
    }

    const authHeader = { Authorization: `${tokenType} ${accessToken}` }

    // Collect all activity items
    let allActivity: any[] = []
    let hasAuditAccess = false
    let hasChannelAccess = false
    let memberCount = 0
    let presenceCount = 0

    // 1. Fetch guild details with counts
    try {
      const guildRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
        { headers: authHeader }
      )
      if (guildRes.ok) {
        const guildJson = await guildRes.json()
        memberCount = guildJson.approximate_member_count || 0
        presenceCount = guildJson.approximate_presence_count || 0
      }
    } catch {
      // Non-critical
    }

    // 2. Fetch audit log entries (requires VIEW_AUDIT_LOG permission)
    let auditEntries: any[] = []
    try {
      const auditRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/audit-logs?limit=50`,
        { headers: authHeader }
      )
      if (auditRes.ok) {
        const auditData = await auditRes.json()
        auditEntries = auditData.audit_log_entries || []
        hasAuditAccess = true
      } else if (auditRes.status === 403) {
        hasAuditAccess = false
      }
    } catch {
      // Non-critical
    }

    // 3. Process audit log entries
    const auditActivity = auditEntries.map((entry: any) => {
      const actionType = entry.action_type
      let type = 'unknown'
      let description = ''

      switch (actionType) {
        case 1: type = 'server_update'; description = 'Servidor actualizado'; break
        case 5: type = 'channel_create'; description = 'Canal creado'; break
        case 6: type = 'channel_update'; description = 'Canal actualizado'; break
        case 7: type = 'channel_delete'; description = 'Canal eliminado'; break
        case 13: type = 'kick'; description = 'Miembro expulsado'; break
        case 14: type = 'prune'; description = 'Miembros podados'; break
        case 15: type = 'ban'; description = 'Miembro baneado'; break
        case 16: type = 'unban'; description = 'Miembro desbaneado'; break
        case 17: type = 'member_update'; description = 'Miembro actualizado'; break
        case 18: type = 'role_update'; description = 'Roles de miembro actualizados'; break
        case 20: type = 'member_move'; description = 'Miembro movido de canal'; break
        case 22: type = 'bot_add'; description = 'Bot añadido al servidor'; break
        case 24: type = 'role_create'; description = 'Rol creado'; break
        case 25: type = 'role_update'; description = 'Rol actualizado'; break
        case 26: type = 'role_delete'; description = 'Rol eliminado'; break
        case 28: type = 'invite_create'; description = 'Invitación creada'; break
        case 30: type = 'invite_delete'; description = 'Invitación eliminada'; break
        case 32: type = 'webhook_create'; description = 'Webhook creado'; break
        case 34: type = 'webhook_delete'; description = 'Webhook eliminado'; break
        case 40: type = 'emoji_create'; description = 'Emoji creado'; break
        case 42: type = 'emoji_delete'; description = 'Emoji eliminado'; break
        case 60: type = 'join'; description = 'Nuevo miembro unido'; break
        case 61: type = 'leave'; description = 'Miembro salió'; break
        case 72: type = 'message_delete'; description = 'Mensaje eliminado'; break
        case 73: type = 'message_bulk_delete'; description = 'Mensajes eliminados en masa'; break
        case 74: type = 'message_pin'; description = 'Mensaje fijado'; break
        case 75: type = 'message_unpin'; description = 'Mensaje desfijado'; break
        case 80: type = 'automod_block'; description = 'Mensaje bloqueado por AutoMod'; break
        case 81: type = 'automod_flag'; description = 'Mensaje marcado por AutoMod'; break
        case 82: type = 'automod_timeout'; description = 'Timeout por AutoMod'; break
        default: type = `action_${actionType}`; description = `Acción del servidor (${actionType})`
      }

      return {
        id: `audit-${entry.id}`,
        type,
        description,
        userId: entry.user_id,
        targetId: entry.target_id,
        timestamp: new Date(parseInt(entry.id) / 4194304 + 1420070400000).toISOString(),
        changes: entry.changes || null,
        reason: entry.reason || null,
        actionType,
      }
    })

    // 4. Fetch channels list (for showing channel activity info)
    let channels: any[] = []
    let channelCount = 0
    let textChannelCount = 0
    try {
      const channelsRes = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/channels`,
        { headers: authHeader }
      )
      if (channelsRes.ok) {
        channels = await channelsRes.json()
        hasChannelAccess = true
        channelCount = channels.length
        textChannelCount = channels.filter((ch: any) => ch.type === 0).length

        // Add channel activity items from audit log
        const channelEvents = auditActivity.filter((a: any) =>
          ['channel_create', 'channel_update', 'channel_delete'].includes(a.type)
        )
        for (const evt of channelEvents) {
          const channel = channels.find((c: any) => c.id === evt.targetId)
          if (channel) {
            evt.channelName = channel.name
          }
        }
      }
    } catch {
      // Non-critical
    }

    // 5. Try to fetch recent messages from text channels
    // Note: This requires the user to have READ_MESSAGE_HISTORY permission
    // User OAuth tokens can read messages if they have the permission in the guild
    let recentMessages: any[] = []
    if (hasChannelAccess) {
      const textChannels = channels
        .filter((ch: any) => ch.type === 0)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))

      // Try to fetch messages from top 5 text channels
      const messagePromises = textChannels.slice(0, 5).map(async (ch: any) => {
        try {
          const msgRes = await fetch(
            `https://discord.com/api/v10/channels/${ch.id}/messages?limit=5`,
            { headers: authHeader }
          )
          if (msgRes.ok) {
            const msgs = await msgRes.json()
            return msgs.map((m: any) => ({
              id: `msg-${m.id}`,
              type: 'message',
              channelId: ch.id,
              channelName: ch.name,
              content: m.content?.substring(0, 200) || '',
              author: m.author?.username || 'Desconocido',
              authorAvatar: m.author?.avatar
                ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png`
                : null,
              timestamp: m.timestamp,
              description: m.content ? `"${m.content.substring(0, 80)}"` : 'Mensaje sin contenido',
            }))
          }
          return []
        } catch {
          return []
        }
      })

      const messageResults = await Promise.all(messagePromises)
      recentMessages = messageResults.flat()
      recentMessages.sort((a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      recentMessages = recentMessages.slice(0, 20)
    }

    // 6. Combine all activity and sort by time
    allActivity = [
      ...recentMessages,
      ...auditActivity,
    ].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 30)

    // 7. Generate chart data from audit logs + messages (last 7 days)
    const chartData = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayAudit = auditActivity.filter((e: any) => {
        const t = new Date(e.timestamp)
        return t >= dayStart && t <= dayEnd
      })

      const dayMessages = recentMessages.filter((m: any) => {
        const t = new Date(m.timestamp)
        return t >= dayStart && t <= dayEnd
      }).length

      const joins = dayAudit.filter((e: any) => e.type === 'join').length
      const leaves = dayAudit.filter((e: any) => e.type === 'leave').length
      const modActions = dayAudit.filter((e: any) =>
        ['ban', 'kick', 'timeout', 'unban', 'automod_block'].includes(e.type)
      ).length

      chartData.push({
        date: dayStart.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        joins,
        leaves,
        messages: dayMessages,
        modActions,
      })
    }

    // 8. Summary stats
    const memberJoins = auditActivity.filter((e: any) => e.type === 'join').length
    const memberLeaves = auditActivity.filter((e: any) => e.type === 'leave').length
    const modEvents = auditActivity.filter((e: any) =>
      ['ban', 'kick', 'timeout', 'unban', 'automod_block'].includes(e.type)
    ).length
    const messageCount = recentMessages.length

    return NextResponse.json({
      activity: allActivity,
      chartData,
      recentMessages,
      summary: {
        totalAuditEntries: auditEntries.length,
        memberJoins,
        memberLeaves,
        modEvents,
        messageCount,
        hasAuditAccess,
        hasChannelAccess,
        memberCount,
        presenceCount,
        channelCount,
        textChannelCount,
      },
    })
  } catch (err) {
    console.error('Discord activity API error:', err)
    return NextResponse.json({ error: 'Error al obtener actividad de Discord' }, { status: 500 })
  }
}
