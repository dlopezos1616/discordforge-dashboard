import { db } from '@/lib/db'

export async function GET() {
  try {
    // Create demo user
    const user = await db.user.upsert({
      where: { discordId: 'demo_admin_001' },
      update: {},
      create: {
        discordId: 'demo_admin_001',
        username: 'AdminDemo',
        discriminator: '0001',
        avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
        email: 'admin@discordplatform.com',
        isAdmin: true,
      },
    })

    // Create demo servers
    const servers = [
      {
        discordId: 'srv_001',
        name: 'FiveM Roleplay España',
        icon: null,
        ownerId: user.id,
        memberCount: 15420,
        isActive: true,
      },
      {
        discordId: 'srv_002',
        name: 'Comunidad Gaming LATAM',
        icon: null,
        ownerId: user.id,
        memberCount: 8930,
        isActive: true,
      },
      {
        discordId: 'srv_003',
        name: 'Servidor de Pruebas',
        icon: null,
        ownerId: user.id,
        memberCount: 342,
        isActive: true,
      },
    ]

    const createdServers = []
    for (const srv of servers) {
      const server = await db.server.upsert({
        where: { discordId: srv.discordId },
        update: {},
        create: srv,
      })
      createdServers.push(server)

      await db.serverMember.upsert({
        where: { userId_serverId: { userId: user.id, serverId: server.id } },
        update: {},
        create: { userId: user.id, serverId: server.id, role: 'owner' },
      })

      await db.serverConfig.upsert({
        where: { serverId: server.id },
        update: {},
        create: {
          serverId: server.id,
          prefix: '!',
          language: 'es',
          autoModEnabled: true,
          raidProtectionEnabled: true,
          maxTicketsPerUser: 3,
        },
      })

      await db.welcomeConfig.upsert({
        where: { serverId: server.id },
        update: {},
        create: {
          serverId: server.id,
          enabled: true,
          type: 'embed',
          title: '¡Bienvenido/a a {server}!',
          description: '¡Hola {user}! Eres el miembro #{membercount}. Disfruta tu estancia en nuestro servidor.',
          footer: '{server} • {date}',
          color: '#5865F2',
          useAvatar: true,
        },
      })

      await db.verificationConfig.upsert({
        where: { serverId: server.id },
        update: {},
        create: {
          serverId: server.id,
          enabled: true,
          type: 'button',
          message: '✅ Haz clic para verificarte y acceder al servidor',
          autoRole: true,
        },
      })
    }

    // Ticket categories for first server
    const firstServer = createdServers[0]
    const categories = [
      { name: 'Donaciones', emoji: '💰', color: '#F59E0B', description: 'Consultas sobre donaciones', position: 0 },
      { name: 'Soporte Técnico', emoji: '🔧', color: '#3B82F6', description: 'Ayuda técnica general', position: 1 },
      { name: 'Administración', emoji: '👔', color: '#8B5CF6', description: 'Consultas administrativas', position: 2 },
      { name: 'Reportes', emoji: '📢', color: '#EF4444', description: 'Reportar jugadores o problemas', position: 3 },
      { name: 'Whitelist', emoji: '📋', color: '#10B981', description: 'Solicitudes de whitelist', position: 4 },
      { name: 'Policía', emoji: '👮', color: '#1D4ED8', description: 'Tickets de policía', position: 5 },
      { name: 'EMS', emoji: '🚑', color: '#DC2626', description: 'Tickets médicos', position: 6 },
      { name: 'Gobierno', emoji: '🏛️', color: '#D97706', description: 'Asuntos gubernamentales', position: 7 },
      { name: 'Facciones', emoji: '⚔️', color: '#7C3AED', description: 'Gestión de facciones', position: 8 },
      { name: 'Bugs', emoji: '🐛', color: '#6B7280', description: 'Reportar bugs', position: 9 },
    ]

    for (const cat of categories) {
      await db.ticketCategory.create({
        data: {
          serverId: firstServer.id,
          ...cat,
          customMessage: `Hola, gracias por abrir un ticket de ${cat.name}. Un miembro del staff te atenderá pronto.`,
          isActive: true,
        },
      })
    }

    // Auto-mod rules
    const autoModRules = [
      { name: 'Anti-Spam', type: 'spam', threshold: 5, action: 'mute', duration: '10m' },
      { name: 'Anti-Flood', type: 'flood', threshold: 3, action: 'delete' },
      { name: 'Anti-Links', type: 'links', threshold: 1, action: 'delete' },
      { name: 'Anti-Invitaciones', type: 'invites', threshold: 1, action: 'ban' },
      { name: 'Anti-Menciones', type: 'mentions', threshold: 5, action: 'warn' },
      { name: 'Anti-Raid', type: 'raid', threshold: 10, action: 'kick' },
    ]
    for (const rule of autoModRules) {
      await db.autoModRule.create({
        data: { serverId: firstServer.id, ...rule, enabled: true, words: '[]', exemptions: '[]' },
      })
    }

    // Polls
    const pollData = [
      { question: '¿Qué evento deberíamos organizar?', options: JSON.stringify(['Torneo PvP', 'Evento RP', 'Concurso de builds', 'Noche de películas']), type: 'multiple' },
      { question: '¿Estás de acuerdo con las nuevas normas?', options: JSON.stringify(['Sí', 'No']), type: 'yesno' },
    ]
    for (const p of pollData) {
      await db.poll.create({ data: { serverId: firstServer.id, ...p, allowMultiple: false, isActive: true } })
    }

    // Giveaways
    await db.giveaway.create({
      data: {
        serverId: firstServer.id,
        prize: 'Nitro Discord (1 Mes)',
        description: 'Sorteo de Discord Nitro para los miembros activos',
        winnerCount: 3,
        requiredRoleIds: '[]',
        isActive: true,
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Moderation actions
    const modActions = [
      { type: 'warn', reason: 'Spam en chat general' },
      { type: 'timeout', reason: 'Comportamiento tóxico', duration: '1h' },
      { type: 'ban', reason: 'Uso de exploits' },
      { type: 'warn', reason: 'Lenguaje inapropiado' },
      { type: 'kick', reason: 'Invitaciones no autorizadas' },
    ]
    for (const action of modActions) {
      await db.moderationAction.create({
        data: { serverId: firstServer.id, userId: user.id, moderatorId: user.id, ...action, duration: action.duration || null },
      })
    }

    // Whitelist form
    const wlForm = await db.whitelistForm.create({
      data: {
        serverId: firstServer.id,
        name: 'Whitelist FiveM RP',
        description: 'Formulario de whitelist para acceder al servidor de roleplay',
        fields: JSON.stringify([
          { id: 'f1', type: 'short', label: 'Nombre de personaje', required: true },
          { id: 'f2', type: 'short', label: 'Edad (IC)', required: true },
          { id: 'f3', type: 'long', label: 'Historia de tu personaje', required: true },
          { id: 'f4', type: 'select', label: 'Facción de interés', options: ['Civil', 'Policía', 'EMS', 'Gobierno', 'Crimen Organizado'], required: true },
          { id: 'f5', type: 'checkbox', label: 'Acepto las normas del servidor', required: true },
          { id: 'f6', type: 'short', label: 'Experiencia previa en RP', required: false },
        ]),
        isActive: true,
      },
    })

    const appStatuses = ['pending', 'accepted', 'rejected', 'reviewing']
    const appNames = ['Carlos García', 'María López', 'Juan Pérez', 'Ana Martínez', 'Pedro Sánchez', 'Laura Fernández', 'Diego Torres', 'Sofía Ramírez']
    for (let i = 0; i < appNames.length; i++) {
      await db.whitelistApplication.create({
        data: {
          formId: wlForm.id,
          userId: user.id,
          status: appStatuses[i % 4],
          responses: JSON.stringify({
            f1: appNames[i], f2: String(20 + i * 3),
            f3: 'Soy un personaje con una historia interesante y emocionante que aportará al servidor...',
            f4: ['Civil', 'Policía', 'EMS', 'Gobierno', 'Crimen Organizado'][i % 5],
            f5: 'true', f6: i > 2 ? '3 años en otros servidores' : '',
          }),
          reviewedBy: i % 2 === 0 ? user.id : null,
          comment: i % 2 === 0 ? (i % 4 === 0 ? 'Aplicación aprobada' : 'Falta más detalle en la historia') : null,
        },
      })
    }

    // Logs
    const logTypes = [
      { type: 'join', description: 'Usuario se unió al servidor' },
      { type: 'leave', description: 'Usuario salió del servidor' },
      { type: 'ban', description: 'Usuario baneado por spam' },
      { type: 'role_add', description: 'Rol Verificado añadido' },
      { type: 'ticket_create', description: 'Ticket de soporte creado' },
      { type: 'ticket_close', description: 'Ticket cerrado' },
      { type: 'message_delete', description: 'Mensaje eliminado por auto-mod' },
      { type: 'message_edit', description: 'Mensaje editado' },
      { type: 'whitelist_apply', description: 'Nueva solicitud de whitelist' },
      { type: 'reaction_add', description: 'Reacción añadida para rol' },
    ]
    for (let i = 0; i < 50; i++) {
      const logEntry = logTypes[i % logTypes.length]
      await db.log.create({
        data: { serverId: firstServer.id, userId: user.id, type: logEntry.type, description: logEntry.description, metadata: JSON.stringify({ index: i }) },
      })
    }

    // Embed presets
    await db.embedPreset.create({ data: { serverId: firstServer.id, name: 'Normas del Servidor', title: '📜 Normas del Servidor', description: '1. Respetar a todos los miembros\n2. No spam ni flood\n3. No contenido NSFW\n4. Usar canales apropiados\n5. Escuchar al staff', color: '#EF4444', footer: 'Última actualización: Enero 2026', fields: '[]' } })
    await db.embedPreset.create({ data: { serverId: firstServer.id, name: 'Información RP', title: '🎭 Información de Roleplay', description: 'Servidor FiveM RP con economía realista.\n\nHorario: 24/7\nIP: connect cfx.re/join/abc123', color: '#10B981', footer: 'FiveM Roleplay España', fields: '[]' } })

    // Reaction roles
    await db.reactionRole.create({ data: { serverId: firstServer.id, emoji: '🎮', label: 'Gaming', roleIds: '["rol_gaming"]', type: 'reaction', mode: 'single' } })
    await db.reactionRole.create({ data: { serverId: firstServer.id, emoji: '📢', label: 'Notificaciones', roleIds: '["rol_notif"]', type: 'button', mode: 'toggle' } })
    await db.reactionRole.create({ data: { serverId: firstServer.id, emoji: '🎨', label: 'Artista', roleIds: '["rol_artista"]', type: 'select', mode: 'multiple' } })

    // Tickets
    const ticketCategory = await db.ticketCategory.findFirst({ where: { serverId: firstServer.id } })
    if (ticketCategory) {
      const ticketStatuses = ['open', 'claimed', 'closed']
      const ticketSubjects = ['Problema con donación', 'No puedo conectar al servidor', 'Reporte de jugador tóxico', 'Solicitud de unban', 'Error en whitelist']
      for (let i = 0; i < ticketSubjects.length; i++) {
        const ticket = await db.ticket.create({
          data: {
            serverId: firstServer.id,
            categoryId: ticketCategory.id,
            creatorId: user.id,
            subject: ticketSubjects[i],
            status: ticketStatuses[i % 3],
            claimedBy: ticketStatuses[i % 3] === 'claimed' ? user.id : null,
            closedBy: ticketStatuses[i % 3] === 'closed' ? user.id : null,
            closedAt: ticketStatuses[i % 3] === 'closed' ? new Date() : null,
          },
        })
        await db.ticketMessage.create({ data: { ticketId: ticket.id, userId: user.id, content: `Hola, tengo un problema: ${ticketSubjects[i]}`, type: 'message' } })
        await db.ticketMessage.create({ data: { ticketId: ticket.id, userId: user.id, content: 'Hola, vamos a revisar tu caso.', type: 'message' } })
      }
    }

    return Response.json({ success: true, message: 'Database seeded successfully' })
  } catch (error) {
    console.error('Seed error:', error)
    return Response.json({ success: false, error: String(error) }, { status: 500 })
  }
}
