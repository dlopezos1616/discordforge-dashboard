import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const [config, events] = await Promise.all([
      db.antiRaidConfig.findUnique({ where: { serverId } }),
      db.raidEvent.findMany({
        where: { serverId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    return Response.json({
      config: config || {
        id: null,
        serverId,
        enabled: false,
        joinRateThreshold: 5,
        accountAgeHours: 24,
        requireAvatar: false,
        similarUsernameCheck: false,
        raidAction: 'alert',
        autoLockdown: false,
        alertChannelId: null,
        quarantineRoleId: null,
        staffRoleId: null,
        isLockedDown: false,
        lockdownAt: null,
        totalRaidsDetected: 0,
        lastRaidAt: null,
      },
      events,
    })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serverId, action, eventId, ...configFields } = body

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    // Handle special actions
    if (action === 'lockdown') {
      const existing = await db.antiRaidConfig.findUnique({ where: { serverId } })
      const newLockdownState = existing ? !existing.isLockedDown : true

      const config = await db.antiRaidConfig.upsert({
        where: { serverId },
        update: {
          isLockedDown: newLockdownState,
          lockdownAt: newLockdownState ? new Date() : null,
        },
        create: {
          serverId,
          isLockedDown: true,
          lockdownAt: new Date(),
        },
      })

      // Log the lockdown toggle
      try {
        await db.log.create({
          data: {
            serverId,
            type: newLockdownState ? 'raid_lockdown_enable' : 'raid_lockdown_disable',
            description: newLockdownState
              ? '🔒 Lockdown activado manualmente'
              : '🔓 Lockdown desactivado manualmente',
            metadata: JSON.stringify({ isLockedDown: newLockdownState }),
          },
        })
      } catch {
        // best effort
      }

      return Response.json({ config, lockdownActive: newLockdownState })
    }

    if (action === 'resolve') {
      if (!eventId) {
        return Response.json({ error: 'eventId required for resolve action' }, { status: 400 })
      }

      const event = await db.raidEvent.update({
        where: { id: eventId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      })

      return Response.json({ event })
    }

    if (action === 'simulate_raid') {
      // Create a demo raid event for testing
      const raidTypes = ['join_burst', 'bot_raid', 'similar_names', 'manual']
      const randomType = raidTypes[Math.floor(Math.random() * raidTypes.length)]
      const joinsDetected = Math.floor(Math.random() * 30) + 5

      const event = await db.raidEvent.create({
        data: {
          serverId,
          type: randomType,
          joinsDetected,
          action: 'alert',
          isResolved: false,
          details: JSON.stringify({
            simulated: true,
            accounts: Array.from({ length: Math.min(joinsDetected, 5) }, (_, i) => ({
              username: `raider_${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
            })),
          }),
        },
      })

      // Update stats
      await db.antiRaidConfig.upsert({
        where: { serverId },
        update: {
          totalRaidsDetected: { increment: 1 },
          lastRaidAt: new Date(),
        },
        create: {
          serverId,
          enabled: true,
          totalRaidsDetected: 1,
          lastRaidAt: new Date(),
        },
      })

      return Response.json({ event })
    }

    // Default: create or update config
    const config = await db.antiRaidConfig.upsert({
      where: { serverId },
      update: {
        ...configFields,
        ...(configFields.joinRateThreshold !== undefined && { joinRateThreshold: Number(configFields.joinRateThreshold) }),
        ...(configFields.accountAgeHours !== undefined && { accountAgeHours: Number(configFields.accountAgeHours) }),
      },
      create: {
        serverId,
        enabled: configFields.enabled ?? false,
        joinRateThreshold: Number(configFields.joinRateThreshold ?? 5),
        accountAgeHours: Number(configFields.accountAgeHours ?? 24),
        requireAvatar: configFields.requireAvatar ?? false,
        similarUsernameCheck: configFields.similarUsernameCheck ?? false,
        raidAction: configFields.raidAction ?? 'alert',
        autoLockdown: configFields.autoLockdown ?? false,
        alertChannelId: configFields.alertChannelId ?? null,
        quarantineRoleId: configFields.quarantineRoleId ?? null,
        staffRoleId: configFields.staffRoleId ?? null,
      },
    })

    return Response.json({ config })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { serverId, ...updates } = body

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    // Ensure config exists first
    const existing = await db.antiRaidConfig.findUnique({ where: { serverId } })

    if (!existing) {
      // Create with defaults + updates
      const config = await db.antiRaidConfig.create({
        data: {
          serverId,
          enabled: updates.enabled ?? false,
          joinRateThreshold: Number(updates.joinRateThreshold ?? 5),
          accountAgeHours: Number(updates.accountAgeHours ?? 24),
          requireAvatar: updates.requireAvatar ?? false,
          similarUsernameCheck: updates.similarUsernameCheck ?? false,
          raidAction: updates.raidAction ?? 'alert',
          autoLockdown: updates.autoLockdown ?? false,
          alertChannelId: updates.alertChannelId ?? null,
          quarantineRoleId: updates.quarantineRoleId ?? null,
          staffRoleId: updates.staffRoleId ?? null,
        },
      })
      return Response.json({ config })
    }

    // Build update data with proper type conversions
    const updateData: Record<string, unknown> = {}
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled
    if (updates.joinRateThreshold !== undefined) updateData.joinRateThreshold = Number(updates.joinRateThreshold)
    if (updates.accountAgeHours !== undefined) updateData.accountAgeHours = Number(updates.accountAgeHours)
    if (updates.requireAvatar !== undefined) updateData.requireAvatar = updates.requireAvatar
    if (updates.similarUsernameCheck !== undefined) updateData.similarUsernameCheck = updates.similarUsernameCheck
    if (updates.raidAction !== undefined) updateData.raidAction = updates.raidAction
    if (updates.autoLockdown !== undefined) updateData.autoLockdown = updates.autoLockdown
    if (updates.alertChannelId !== undefined) updateData.alertChannelId = updates.alertChannelId
    if (updates.quarantineRoleId !== undefined) updateData.quarantineRoleId = updates.quarantineRoleId
    if (updates.staffRoleId !== undefined) updateData.staffRoleId = updates.staffRoleId
    if (updates.isLockedDown !== undefined) {
      updateData.isLockedDown = updates.isLockedDown
      updateData.lockdownAt = updates.isLockedDown ? new Date() : null
    }

    const config = await db.antiRaidConfig.update({
      where: { serverId },
      data: updateData,
    })

    return Response.json({ config })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return Response.json({ error: 'eventId required' }, { status: 400 })
    }

    await db.raidEvent.delete({ where: { id: eventId } })
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
