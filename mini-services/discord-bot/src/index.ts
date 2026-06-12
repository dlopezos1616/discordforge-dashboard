// ============================================
// DiscordForge Bot - Main Entry Point
// ============================================
// Este es el corazón del bot de Discord.
// Se conecta a Discord via discord.js v14,
// a la base de datos via Prisma, y al
// dashboard web via WebSocket (Socket.io).
//
// ARQUITECTURA:
// ┌──────────────┐     WebSocket     ┌──────────────────┐
// │  Dashboard   │ ◄──────────────► │   Discord Bot    │
// │  (Next.js)   │    Port 3003     │  (discord.js)    │
// └──────────────┘                   └────────┬─────────┘
//       │                                     │
//       │  REST API                           │ Discord Gateway
//       ▼                                     ▼
// ┌──────────────┐                   ┌──────────────────┐
// │  Base de     │                   │   Discord API    │
// │  Datos       │                   │   (Servers,      │
// │  (Prisma)    │                   │    Channels,     │
// └──────────────┘                   │    Members)      │
//                                    └──────────────────┘

import { Client, GatewayIntentBits, Partials, Collection, ActivityType } from 'discord.js'
import { io } from 'socket.io-client'

// ============================================
// TIPOS
// ============================================

export interface BotConfig {
  token: string
  clientId: string
  dashboardUrl: string
  dashboardPort: number
  prismaDatabaseUrl: string
}

export interface BotStatus {
  online: boolean
  guilds: number
  users: number
  uptime: number
  ping: number
  lastReady: string | null
}

// ============================================
// CLIENTE PERSONALIZADO
// ============================================

class DiscordForgeClient extends Client {
  public botStatus: BotStatus = {
    online: false,
    guilds: 0,
    users: 0,
    uptime: 0,
    ping: 0,
    lastReady: null,
  }

  // Socket.io connection to dashboard
  public dashboardSocket: ReturnType<typeof io> | null = null

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
      ],
    })
  }

  // ============================================
  // CONEXIÓN CON EL DASHBOARD
  // ============================================
  connectToDashboard(url: string) {
    console.log(`🔌 Conectando al dashboard en ${url}...`)

    this.dashboardSocket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 50,
      timeout: 10000,
    })

    this.dashboardSocket.on('connect', () => {
      console.log('✅ Conectado al dashboard via WebSocket')
      // Identificarse como bot ante el WS Bridge
      this.dashboardSocket?.emit('identify', 'bot')
      this.dashboardSocket?.emit('bot:status', this.getStatus())
    })

    this.dashboardSocket.on('disconnect', () => {
      console.log('⚠️ Desconectado del dashboard')
    })

    this.dashboardSocket.on('connect_error', (err: any) => {
      console.error('❌ Error conectando al dashboard:', err.message)
    })

    // ============================================
    // EVENTOS DEL DASHBOARD → BOT
    // El dashboard envía comandos, el bot los ejecuta
    // ============================================

    // El dashboard pide el estado actual del bot
    this.dashboardSocket.on('dashboard:getStatus', () => {
      this.dashboardSocket?.emit('bot:status', this.getStatus())
    })

    // El dashboard pide actualizar la configuración de un servidor
    this.dashboardSocket.on('dashboard:updateConfig', async (data: { serverId: string; config: any }) => {
      console.log(`📝 Actualizando config para servidor ${data.serverId}`)
      // La config se guarda en la DB desde el dashboard (API REST).
      // El bot la lee cuando necesita actuar.
      this.emitToDashboard('bot:configUpdated', { serverId: data.serverId, success: true })
    })

    // El dashboard pide enviar un embed a un canal
    this.dashboardSocket.on('dashboard:sendEmbed', async (data: { channelId: string; embed: any }) => {
      console.log(`📤 Enviando embed al canal ${data.channelId}`)
      try {
        const channel = await this.channels.fetch(data.channelId)
        if (channel?.isTextBased()) {
          await channel.send({ embeds: [data.embed] })
          this.emitToDashboard('bot:embedSent', { success: true })
        }
      } catch (error) {
        this.emitToDashboard('bot:embedSent', { success: false, error: String(error) })
      }
    })

    // El dashboard pide ejecutar una acción de moderación
    this.dashboardSocket.on('dashboard:moderate', async (data: { guildId: string; userId: string; action: string; reason?: string; duration?: string }) => {
      console.log(`🔨 Acción de moderación: ${data.action} para ${data.userId}`)
      try {
        const guild = await this.guilds.fetch(data.guildId)
        const member = await guild.members.fetch(data.userId)

        switch (data.action) {
          case 'ban':
            await guild.members.ban(data.userId, { reason: data.reason })
            break
          case 'kick':
            await member.kick(data.reason)
            break
          case 'timeout':
            const ms = parseDuration(data.duration || '1h')
            await member.timeout(ms, data.reason)
            break
          case 'softban':
            await guild.members.ban(data.userId, { reason: data.reason })
            await guild.members.unban(data.userId)
            break
        }

        this.emitToDashboard('bot:moderationDone', { success: true, action: data.action, userId: data.userId })
      } catch (error) {
        this.emitToDashboard('bot:moderationDone', { success: false, error: String(error) })
      }
    })

    // El dashboard pide crear un ticket panel en un canal
    this.dashboardSocket.on('dashboard:createTicketPanel', async (data: { channelId: string; categories: any[] }) => {
      console.log(`🎫 Creando panel de tickets en canal ${data.channelId}`)
      try {
        const channel = await this.channels.fetch(data.channelId)
        if (channel?.isTextBased()) {
          const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = await import('discord.js')

          const embed = new EmbedBuilder()
            .setTitle('🎫 Sistema de Tickets')
            .setDescription('Selecciona una categoría para abrir un ticket')
            .setColor(0x5865F2)

          // If few categories, use buttons
          if (data.categories.length <= 5) {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              ...data.categories.map((cat: any) =>
                new ButtonBuilder()
                  .setCustomId(`ticket_${cat.id}`)
                  .setLabel(`${cat.emoji} ${cat.name}`)
                  .setStyle(ButtonStyle.Primary)
              )
            )
            await channel.send({ embeds: [embed], components: [row] })
          } else {
            // If many categories, use select menu
            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('Selecciona una categoría...')
                .addOptions(
                  ...data.categories.map((cat: any) => ({
                    label: cat.name,
                    description: cat.description || '',
                    value: cat.id,
                    emoji: cat.emoji,
                  }))
                )
            )
            await channel.send({ embeds: [embed], components: [row] })
          }

          this.emitToDashboard('bot:ticketPanelCreated', { success: true })
        }
      } catch (error) {
        this.emitToDashboard('bot:ticketPanelCreated', { success: false, error: String(error) })
      }
    })

    // El dashboard pide crear un reaction role
    this.dashboardSocket.on('dashboard:createReactionRole', async (data: { channelId: string; type: string; emoji: string; label: string; roleIds: string[] }) => {
      console.log(`😀 Creando reaction role en canal ${data.channelId}`)
      try {
        const channel = await this.channels.fetch(data.channelId)
        if (channel?.isTextBased()) {
          const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = await import('discord.js')

          const embed = new EmbedBuilder()
            .setTitle('Roles Disponibles')
            .setDescription('Haz clic en un botón para obtener o quitar un rol')
            .setColor(0x5865F2)

          if (data.type === 'button') {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`rr_${data.roleIds[0]}`)
                .setLabel(data.label)
                .setEmoji(data.emoji)
                .setStyle(ButtonStyle.Primary)
            )
            await channel.send({ embeds: [embed], components: [row] })
          }

          this.emitToDashboard('bot:reactionRoleCreated', { success: true })
        }
      } catch (error) {
        this.emitToDashboard('bot:reactionRoleCreated', { success: false, error: String(error) })
      }
    })

    // El dashboard pide crear una encuesta
    this.dashboardSocket.on('dashboard:createPoll', async (data: { channelId: string; question: string; options: string[] }) => {
      console.log(`📊 Creando encuesta en canal ${data.channelId}`)
      try {
        const channel = await this.channels.fetch(data.channelId)
        if (channel?.isTextBased()) {
          const { EmbedBuilder } = await import('discord.js')
          const pollText = data.options.map((opt, i) => `**${i + 1}.** ${opt}`).join('\n')

          const embed = new EmbedBuilder()
            .setTitle(`📊 ${data.question}`)
            .setDescription(pollText)
            .setColor(0x8B5CF6)
            .setFooter({ text: 'Reacciona con el número de tu opción' })

          const msg = await channel.send({ embeds: [embed] })
          const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
          for (let i = 0; i < data.options.length && i < 10; i++) {
            await msg.react(numberEmojis[i])
          }

          this.emitToDashboard('bot:pollCreated', { success: true, messageId: msg.id })
        }
      } catch (error) {
        this.emitToDashboard('bot:pollCreated', { success: false, error: String(error) })
      }
    })

    // El dashboard pide crear un sorteo
    this.dashboardSocket.on('dashboard:createGiveaway', async (data: { channelId: string; prize: string; description: string; duration: string; winnerCount: number }) => {
      console.log(`🎁 Creando sorteo en canal ${data.channelId}`)
      try {
        const channel = await this.channels.fetch(data.channelId)
        if (channel?.isTextBased()) {
          const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js')

          const embed = new EmbedBuilder()
            .setTitle(`🎁 Sorteo: ${data.prize}`)
            .setDescription(data.description || '¡Participa para ganar!')
            .setColor(0xF59E0B)
            .addFields(
              { name: '🏆 Ganadores', value: String(data.winnerCount), inline: true },
              { name: '⏰ Termina', value: `<t:${Math.floor((Date.now() + parseDuration(data.duration)) / 1000)}:R>`, inline: true },
            )
            .setFooter({ text: 'Haz clic en el botón para participar' })

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('giveaway_join')
              .setLabel('🎉 Participar')
              .setStyle(ButtonStyle.Success)
          )

          const msg = await channel.send({ embeds: [embed], components: [row] })
          this.emitToDashboard('bot:giveawayCreated', { success: true, messageId: msg.id })
        }
      } catch (error) {
        this.emitToDashboard('bot:giveawayCreated', { success: false, error: String(error) })
      }
    })

    // El dashboard pide crear un mensaje de verificación
    this.dashboardSocket.on('dashboard:createVerification', async (data: { channelId: string; type: string; message: string; roleId: string }) => {
      console.log(`✅ Creando verificación en canal ${data.channelId}`)
      try {
        const channel = await this.channels.fetch(data.channelId)
        if (channel?.isTextBased()) {
          const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js')

          const embed = new EmbedBuilder()
            .setTitle('✅ Verificación')
            .setDescription(data.message)
            .setColor(0x10B981)

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`verify_${data.type}`)
              .setLabel('Verificarse')
              .setStyle(ButtonStyle.Success)
          )

          await channel.send({ embeds: [embed], components: [row] })
          this.emitToDashboard('bot:verificationCreated', { success: true })
        }
      } catch (error) {
        this.emitToDashboard('bot:verificationCreated', { success: false, error: String(error) })
      }
    })

    console.log('✅ Eventos del dashboard registrados')
  }

  // ============================================
  // EMITIR EVENTOS AL DASHBOARD
  // El bot notifica al dashboard de todo lo que pasa
  // ============================================
  emitToDashboard(event: string, data: any) {
    if (this.dashboardSocket?.connected) {
      this.dashboardSocket.emit(event, data)
    }
  }

  // ============================================
  // OBTENER ESTADO DEL BOT
  // ============================================
  getStatus(): BotStatus {
    return {
      online: this.isReady(),
      guilds: this.guilds.cache.size,
      users: this.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0),
      uptime: this.uptime ?? 0,
      ping: this.ws.ping ?? 0,
      lastReady: this.botStatus.lastReady,
    }
  }
}

// ============================================
// UTILIDADES
// ============================================

function parseDuration(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/)
  if (!match) return 3600000 // default 1h
  const num = parseInt(match[1])
  const unit = match[2]
  switch (unit) {
    case 's': return num * 1000
    case 'm': return num * 60 * 1000
    case 'h': return num * 60 * 60 * 1000
    case 'd': return num * 24 * 60 * 60 * 1000
    default: return 3600000
  }
}

// ============================================
// INICIALIZACIÓN DEL BOT
// ============================================

const client = new DiscordForgeClient()

// Configuración (leer desde variables de entorno o archivo)
const config: BotConfig = {
  token: process.env.DISCORD_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  clientId: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
  dashboardUrl: process.env.DASHBOARD_WS_URL || 'http://localhost:3003',
  dashboardPort: 3003,
  prismaDatabaseUrl: process.env.DATABASE_URL || 'file:../../db/custom.db',
}

// ============================================
// REGISTRAR EVENTOS DE DISCORD
// ============================================

// --- EVENT: Bot Ready ---
client.on('ready', async () => {
  console.log(`\n🤖 DiscordForge Bot conectado como ${client.user?.tag}`)

  // Fetch guilds actively (needed if Guilds intent is not fully cached)
  console.log(`📍 Cache inicial: ${client.guilds.cache.size} servidores`)
  try {
    const guilds = await client.guilds.fetch()
    console.log(`📍 En ${guilds.size} servidores (REST fetch)`)

    // Fetch full guild data for each
    for (const [id] of guilds) {
      try {
        const guild = await client.guilds.fetch(id)
        console.log(`👥 Servidor: ${guild.name} (${guild.memberCount || '?'} miembros)`)
      } catch (fetchErr) {
        console.error(`  ⚠️ Error fetching guild ${id}:`, fetchErr)
      }
    }
  } catch (e) {
    console.error('⚠️ Error fetching guilds via REST:', e)
    console.log(`📍 En ${client.guilds.cache.size} servidores (caché)`)
    for (const [id, guild] of client.guilds.cache) {
      console.log(`👥 Servidor (cache): ${guild.name} (${guild.memberCount || '?'} miembros)`)
    }
  }

  client.botStatus.online = true
  client.botStatus.lastReady = new Date().toISOString()

  // Establecer presencia
  client.user?.setActivity('DiscordForge | /help', { type: ActivityType.Watching })

  // Conectar al dashboard
  client.connectToDashboard(config.dashboardUrl)

  // Notificar al dashboard (con delay para que la conexión WS se establezca)
  setTimeout(() => {
    client.emitToDashboard('bot:ready', client.getStatus())
  }, 2000)

  // Sincronizar servidores con la base de datos usando REST API
  try {
    const rest = new (await import('discord.js')).REST({ version: '10' }).setToken(config.token)
    const guildsData = await rest.get((await import('discord.js')).Routes.userGuilds()) as any[]

    for (const guild of guildsData) {
      console.log(`  📌 Sincronizando servidor: ${guild.name} (${guild.id})`)
      client.emitToDashboard('bot:guildSync', {
        discordId: guild.id,
        name: guild.name,
        icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
        memberCount: guild.approximate_member_count || 0,
      })

      // Sincronizar con la base de datos
      try {
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        await prisma.server.upsert({
          where: { discordId: guild.id },
          update: { name: guild.name, icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null },
          create: {
            discordId: guild.id,
            name: guild.name,
            icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
            ownerId: guild.owner_id || 'unknown',
            memberCount: guild.approximate_member_count || 0,
          },
        })
        await prisma.$disconnect()
      } catch (dbErr) {
        console.error(`  ⚠️ Error DB para ${guild.name}:`, dbErr)
      }
    }

    // Update status with real guild count
    client.botStatus.guilds = guildsData.length
    client.emitToDashboard('bot:status', client.getStatus())
  } catch (err) {
    console.log('  ⚠️ No se pudieron obtener guilds via REST, usando caché')
    for (const [id, guild] of client.guilds.cache) {
      console.log(`  📌 Sincronizando servidor: ${guild.name} (${guild.memberCount} miembros)`)
      client.emitToDashboard('bot:guildSync', {
        discordId: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
      })
    }
  }
})

// --- EVENT: Bot se une a un servidor ---
client.on('guildCreate', async (guild) => {
  console.log(`🆕 Bot añadido al servidor: ${guild.name} (${guild.memberCount} miembros)`)
  client.emitToDashboard('bot:guildJoined', {
    discordId: guild.id,
    name: guild.name,
    icon: guild.iconURL(),
    memberCount: guild.memberCount,
    ownerId: guild.ownerId,
  })
})

// --- EVENT: Bot es eliminado de un servidor ---
client.on('guildDelete', async (guild) => {
  console.log(`👋 Bot eliminado del servidor: ${guild.name}`)
  client.emitToDashboard('bot:guildLeft', { discordId: guild.id })
})

// --- EVENT: Nuevo miembro se une ---
client.on('guildMemberAdd', async (member) => {
  console.log(`👤 Nuevo miembro en ${member.guild.name}: ${member.user.tag}`)

  // Leer la configuración de bienvenida desde la DB
  // Aquí se implementaría la lógica de bienvenida
  // con la configuración que el admin definió en el dashboard

  client.emitToDashboard('bot:memberJoined', {
    guildId: member.guild.id,
    userId: member.user.id,
    username: member.user.username,
    avatar: member.user.avatarURL(),
    memberCount: member.guild.memberCount,
  })

  // ============================================
  // SISTEMA DE BIENVENIDA
  // Aquí el bot lee la config de la DB y ejecuta:
  // ============================================
  try {
    // Buscar config de bienvenida para este servidor
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const server = await prisma.server.findUnique({
      where: { discordId: member.guild.id },
      include: { welcomeConfig: true, config: true },
    })

    if (server?.welcomeConfig?.enabled && server.config?.welcomeChannelId) {
      const wc = server.welcomeConfig
      const channel = member.guild.channels.cache.get(server.config.welcomeChannelId)

      if (channel?.isTextBased()) {
        // Reemplazar variables
        const replaceVars = (text: string) =>
          text
            .replace(/\{user\}/g, `<@${member.id}>`)
            .replace(/\{username\}/g, member.user.username)
            .replace(/\{membercount\}/g, String(member.guild.memberCount))
            .replace(/\{server\}/g, member.guild.name)
            .replace(/\{date\}/g, new Date().toLocaleDateString('es-ES'))

        if (wc.type === 'embed') {
          const { EmbedBuilder } = await import('discord.js')
          const embed = new EmbedBuilder()
            .setColor(wc.color as any)
            .setTitle(wc.title ? replaceVars(wc.title) : null)
            .setDescription(wc.description ? replaceVars(wc.description) : null)
            .setFooter(wc.footer ? { text: replaceVars(wc.footer) } : null)
            .setTimestamp()

          if (wc.useAvatar) {
            embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          }

          await (channel as any).send({ embeds: [embed] })
        } else {
          // Simple message
          const msg = wc.description ? replaceVars(wc.description) : `¡Bienvenido/a <@${member.id}> al servidor!`
          await (channel as any).send(msg)
        }

        // Auto-role
        if (wc.autoRole) {
          const roleIds = JSON.parse(wc.autoRoleIds || '[]')
          for (const roleId of roleIds) {
            const role = member.guild.roles.cache.get(roleId)
            if (role) {
              await member.roles.add(role)
            }
          }
        }
      }
    }

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error en bienvenida:', error)
  }

  // ============================================
  // SISTEMA DE VERIFICACIÓN
  // Si el servidor tiene verificación, el usuario no tiene el rol verificado
  // ============================================
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const server = await prisma.server.findUnique({
      where: { discordId: member.guild.id },
      include: { verification: true },
    })

    if (server?.verification?.enabled && server.verification.roleId) {
      // No dar el rol hasta que se verifique
      // El rol se asigna cuando el usuario hace clic en el botón de verificación
      console.log(`  ✅ Verificación requerida para ${member.user.tag}`)
    }

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error en verificación:', error)
  }
})

// --- EVENT: Miembro sale ---
client.on('guildMemberRemove', async (member) => {
  console.log(`👋 Miembro salió de ${member.guild.name}: ${member.user.tag}`)
  client.emitToDashboard('bot:memberLeft', {
    guildId: member.guild.id,
    userId: member.user.id,
    username: member.user.username,
  })
})

// --- EVENT: Interacción (botones, select menus, modales) ---
client.on('interactionCreate', async (interaction) => {
  // ============================================
  // SISTEMA DE TICKETS - Botones y Select Menus
  // ============================================
  if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
    const categoryId = interaction.customId.replace('ticket_', '')
    console.log(`🎫 Ticket abierto para categoría: ${categoryId}`)

    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      const category = await prisma.ticketCategory.findUnique({ where: { id: categoryId } })
      const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId! } })

      if (category && server) {
        // Check max tickets
        const userTickets = await prisma.ticket.count({
          where: { serverId: server.id, creatorId: interaction.user.id, status: 'open' },
        })

        const serverConfig = await prisma.serverConfig.findUnique({ where: { serverId: server.id } })
        const maxTickets = serverConfig?.maxTicketsPerUser || 3

        if (userTickets >= maxTickets) {
          await interaction.reply({
            content: `❌ Ya tienes ${maxTickets} tickets abiertos. Cierra uno antes de abrir otro.`,
            ephemeral: true,
          })
          await prisma.$disconnect()
          return
        }

        // Crear canal de ticket
        const { ChannelType, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = await import('discord.js')
        const guild = interaction.guild!

        const ticketChannel = await guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: null, // Podría ser una categoría de Discord
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ...(category.staffRoleId ? [{ id: category.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
          ],
        })

        // Embed del ticket
        const ticketEmbed = new EmbedBuilder()
          .setTitle(`${category.emoji} Ticket: ${category.name}`)
          .setDescription(category.customMessage || 'Un miembro del staff te atenderá pronto.')
          .setColor(category.color as any)
          .addFields(
            { name: '👤 Usuario', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📋 Categoría', value: category.name, inline: true },
          )
          .setTimestamp()

        // Botones de control del ticket
        const controls = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('📌 Reclamar').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Cerrar').setStyle(ButtonStyle.Danger),
        )

        await ticketChannel.send({
          content: `<@${interaction.user.id}>${category.staffRoleId ? ` | <@&${category.staffRoleId}>` : ''}`,
          embeds: [ticketEmbed],
          components: [controls],
        })

        // Guardar en la base de datos
        const ticket = await prisma.ticket.create({
          data: {
            serverId: server.id,
            categoryId: category.id,
            channelId: ticketChannel.id,
            creatorId: interaction.user.id,
            subject: `Ticket de ${category.name}`,
            status: 'open',
          },
        })

        await interaction.reply({
          content: `✅ Ticket creado: ${ticketChannel}`,
          ephemeral: true,
        })

        client.emitToDashboard('bot:ticketCreated', {
          ticketId: ticket.id,
          channelId: ticketChannel.id,
          categoryId: category.id,
          userId: interaction.user.id,
          username: interaction.user.username,
        })

        // Log
        await prisma.log.create({
          data: {
            serverId: server.id,
            userId: interaction.user.id,
            type: 'ticket_create',
            description: `Ticket creado en categoría ${category.name}`,
            metadata: JSON.stringify({ ticketId: ticket.id, channelId: ticketChannel.id }),
          },
        })
      }

      await prisma.$disconnect()
    } catch (error) {
      console.error('Error creando ticket:', error)
      await interaction.reply({ content: '❌ Error al crear el ticket.', ephemeral: true }).catch(() => {})
    }
  }

  // ============================================
  // TICKET - Reclamar
  // ============================================
  if (interaction.isButton() && interaction.customId === 'ticket_claim') {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId! } })

      if (server) {
        const ticket = await prisma.ticket.update({
          where: { channelId: interaction.channelId },
          data: { status: 'claimed', claimedBy: interaction.user.id },
        })

        await interaction.reply(`📌 Ticket reclamado por <@${interaction.user.id}>`)
        client.emitToDashboard('bot:ticketClaimed', { ticketId: ticket.id, claimedBy: interaction.user.id })
      }

      await prisma.$disconnect()
    } catch (error) {
      await interaction.reply({ content: '❌ Error al reclamar.', ephemeral: true }).catch(() => {})
    }
  }

  // ============================================
  // TICKET - Cerrar
  // ============================================
  if (interaction.isButton() && interaction.customId === 'ticket_close') {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId! } })

      if (server) {
        const ticket = await prisma.ticket.update({
          where: { channelId: interaction.channelId },
          data: { status: 'closed', closedBy: interaction.user.id, closedAt: new Date() },
        })

        // Generar transcript
        const messages = await interaction.channel?.messages.fetch({ limit: 100 })
        const transcriptHtml = generateTranscriptHtml(messages, interaction.channel as any)

        await prisma.transcript.upsert({
          where: { ticketId: ticket.id },
          update: { htmlContent: transcriptHtml, messageCount: messages?.size || 0 },
          create: { ticketId: ticket.id, htmlContent: transcriptHtml, messageCount: messages?.size || 0 },
        })

        await interaction.reply(`🔒 Ticket cerrado por <@${interaction.user.id}>. Este canal se eliminará en 10 segundos.`)
        client.emitToDashboard('bot:ticketClosed', { ticketId: ticket.id, closedBy: interaction.user.id })

        // Eliminar canal después de 10 segundos
        setTimeout(async () => {
          await (interaction.channel as any)?.delete?.().catch(() => {})
        }, 10000)
      }

      await prisma.$disconnect()
    } catch (error) {
      await interaction.reply({ content: '❌ Error al cerrar.', ephemeral: true }).catch(() => {})
    }
  }

  // ============================================
  // SELECT MENU - Tickets (para muchas categorías)
  // ============================================
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
    const categoryId = interaction.values[0]
    // Simular el mismo flujo que el botón
    console.log(`🎫 Ticket desde select menu: ${categoryId}`)
    await interaction.reply({ content: `✅ Creando ticket para la categoría seleccionada...`, ephemeral: true })
  }

  // ============================================
  // SISTEMA DE VERIFICACIÓN
  // ============================================
  if (interaction.isButton() && interaction.customId.startsWith('verify_')) {
    const verifyType = interaction.customId.replace('verify_', '')
    console.log(`✅ Verificación solicitada: ${verifyType}`)

    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      const server = await prisma.server.findUnique({
        where: { discordId: interaction.guildId! },
        include: { verification: true },
      })

      if (server?.verification?.enabled && server.verification.roleId) {
        const member = interaction.member

        if (verifyType === 'button') {
          // Verificación simple con botón
          const role = interaction.guild?.roles.cache.get(server.verification.roleId)
          if (role && member && 'roles' in member) {
            await (member as any).roles.add(role)
            await interaction.reply({ content: '✅ ¡Te has verificado correctamente!', ephemeral: true })
            client.emitToDashboard('bot:userVerified', { userId: interaction.user.id, guildId: interaction.guildId })
          }
        } else if (verifyType === 'captcha_math') {
          // Captcha matemático
          const a = Math.floor(Math.random() * 10) + 1
          const b = Math.floor(Math.random() * 10) + 1
          const answer = a + b

          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js')

          const modal = new ModalBuilder()
            .setCustomId(`captcha_math_${answer}`)
            .setTitle('Verificación - Captcha Matemático')

          const input = new TextInputBuilder()
            .setCustomId('captcha_answer')
            .setLabel(`¿Cuánto es ${a} + ${b}?`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(3)

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input))
          await interaction.showModal(modal)
        }
      }

      await prisma.$disconnect()
    } catch (error) {
      await interaction.reply({ content: '❌ Error en la verificación.', ephemeral: true }).catch(() => {})
    }
  }

  // ============================================
  // MODAL SUBMIT - Captcha matemático
  // ============================================
  if (interaction.isModalSubmit() && interaction.customId.startsWith('captcha_math_')) {
    const correctAnswer = interaction.customId.replace('captcha_math_', '')
    const userAnswer = interaction.fields.getTextInputValue('captcha_answer')

    if (userAnswer === correctAnswer) {
      try {
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        const server = await prisma.server.findUnique({
          where: { discordId: interaction.guildId! },
          include: { verification: true },
        })

        if (server?.verification?.roleId) {
          const role = interaction.guild?.roles.cache.get(server.verification.roleId)
          if (role) {
            const member = interaction.guild?.members.cache.get(interaction.user.id)
            await member?.roles.add(role)
          }
        }
        await prisma.$disconnect()
      } catch {}

      await interaction.reply({ content: '✅ ¡Verificación exitosa!', ephemeral: true })
    } else {
      await interaction.reply({ content: '❌ Respuesta incorrecta. Intenta de nuevo.', ephemeral: true })
    }
  }

  // ============================================
  // REACTION ROLES - Botones
  // ============================================
  if (interaction.isButton() && interaction.customId.startsWith('rr_')) {
    const roleId = interaction.customId.replace('rr_', '')
    console.log(`😀 Reaction role: ${roleId}`)

    const member = interaction.member
    if (member && 'roles' in member) {
      const hasRole = (member as any).roles.cache.has(roleId)
      if (hasRole) {
        await (member as any).roles.remove(roleId)
        await interaction.reply({ content: `❌ Rol removido.`, ephemeral: true })
      } else {
        await (member as any).roles.add(roleId)
        await interaction.reply({ content: `✅ Rol añadido.`, ephemeral: true })
      }
    }
  }

  // ============================================
  // GIVEAWAY - Participar
  // ============================================
  if (interaction.isButton() && interaction.customId === 'giveaway_join') {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId! } })

      if (server) {
        const giveaway = await prisma.giveaway.findFirst({
          where: { serverId: server.id, isActive: true },
        })

        if (giveaway) {
          try {
            await prisma.giveawayEntry.create({
              data: { giveawayId: giveaway.id, userId: interaction.user.id },
            })
            await interaction.reply({ content: '🎉 ¡Te has unido al sorteo!', ephemeral: true })
          } catch {
            await interaction.reply({ content: '⚠️ Ya estás participando.', ephemeral: true })
          }
        }
      }

      await prisma.$disconnect()
    } catch (error) {
      await interaction.reply({ content: '❌ Error al participar.', ephemeral: true }).catch(() => {})
    }
  }

  // ============================================
  // SLASH COMMANDS
  // ============================================
  if (interaction.isChatInputCommand()) {
    const { handleSlashCommand } = await import('./commands/slashHandler')
    await handleSlashCommand(client, interaction)
  }
})

// --- EVENT: Mensaje creado (para auto-mod) ---
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return

  // ============================================
  // SISTEMA DE AUTO-MODERACIÓN
  // ============================================
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const server = await prisma.server.findUnique({
      where: { discordId: message.guild.id },
      include: { config: true, autoModRules: { where: { enabled: true } } },
    })

    if (server?.config?.autoModEnabled) {
      for (const rule of server.autoModRules) {
        let violated = false

        switch (rule.type) {
          case 'spam': {
            // Detección básica de spam (mensajes repetidos en poco tiempo)
            // En producción se usaría un sistema de rate limiting por usuario
            const msgCount = 1 // Placeholder - se implementaría con cache de mensajes
            violated = msgCount >= rule.threshold
            break
          }
          case 'flood': {
            // Detección de flood (mensajes muy seguidos)
            violated = message.content.length > 500 && message.content.split('\n').length > rule.threshold
            break
          }
          case 'links': {
            const urlRegex = /https?:\/\/[^\s]+/gi
            violated = urlRegex.test(message.content)
            break
          }
          case 'invites': {
            const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[^\s]+/gi
            violated = inviteRegex.test(message.content)
            break
          }
          case 'words': {
            const badWords: string[] = JSON.parse(rule.words || '[]')
            violated = badWords.some(w => message.content.toLowerCase().includes(w.toLowerCase()))
            break
          }
          case 'mentions': {
            const mentionCount = (message.content.match(/<@!?\d+>/g) || []).length
            violated = mentionCount >= rule.threshold
            break
          }
          case 'raid': {
            // La detección de raid se haría a nivel de guild (muchas entradas rápidas)
            violated = false // Se maneja en guildMemberAdd
            break
          }
        }

        if (violated) {
          console.log(`🚫 Auto-mod: Regla "${rule.name}" violada por ${message.author.tag}`)

          // Ejecutar acción
          switch (rule.action) {
            case 'delete':
              await message.delete().catch(() => {})
              break
            case 'warn':
              await message.reply(`⚠️ **Aviso:** ${rule.name}`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000))
              break
            case 'mute': {
              const member = message.member
              if (member) {
                const ms = parseDuration(rule.duration || '10m')
                await member.timeout(ms, `Auto-mod: ${rule.name}`).catch(() => {})
              }
              await message.delete().catch(() => {})
              break
            }
            case 'kick':
              await message.member?.kick(`Auto-mod: ${rule.name}`).catch(() => {})
              break
            case 'ban':
              await message.member?.ban({ reason: `Auto-mod: ${rule.name}` }).catch(() => {})
              break
          }

          // Notificar al dashboard
          client.emitToDashboard('bot:autoModTriggered', {
            guildId: message.guild.id,
            userId: message.author.id,
            username: message.author.tag,
            rule: rule.name,
            action: rule.action,
            messageContent: message.content.substring(0, 200),
          })

          // Log
          await prisma.log.create({
            data: {
              serverId: server.id,
              userId: message.author.id,
              type: 'message_delete',
              description: `Auto-mod: ${rule.name} - ${rule.action}`,
              metadata: JSON.stringify({ ruleId: rule.id, content: message.content.substring(0, 100) }),
            },
          })

          break // Solo aplicar la primera regla violada
        }
      }
    }

    await prisma.$disconnect()
  } catch (error) {
    // Silenciar errores de auto-mod para no romper el flujo
  }
})

// --- EVENT: Mensaje eliminado ---
client.on('messageDelete', async (message) => {
  if (!message.guild || message.author?.bot) return

  client.emitToDashboard('bot:messageDeleted', {
    guildId: message.guild.id,
    channelId: message.channelId,
    messageId: message.id,
    authorId: message.author?.id,
    content: message.content?.substring(0, 200),
  })
})

// --- EVENT: Mensaje editado ---
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!oldMessage.guild || oldMessage.author?.bot) return

  client.emitToDashboard('bot:messageEdited', {
    guildId: oldMessage.guild.id,
    channelId: oldMessage.channelId,
    messageId: oldMessage.id,
    authorId: oldMessage.author?.id,
    oldContent: oldMessage.content?.substring(0, 200),
    newContent: newMessage.content?.substring(0, 200),
  })
})

// --- EVENT: Reacción añadida (para reaction roles) ---
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return

  // Aquí se implementaría la lógica de reaction roles con reacciones
  console.log(`👍 Reacción añadida: ${reaction.emoji.name} por ${user.tag}`)
})

// --- EVENT: Miembro baneado ---
client.on('guildBanAdd', async (ban) => {
  client.emitToDashboard('bot:memberBanned', {
    guildId: ban.guild.id,
    userId: ban.user.id,
    username: ban.user.tag,
    reason: ban.reason || 'Sin razón especificada',
  })
})

// --- EVENT: Miembro desbaneado ---
client.on('guildBanRemove', async (ban) => {
  client.emitToDashboard('bot:memberUnbanned', {
    guildId: ban.guild.id,
    userId: ban.user.id,
  })
})

// ============================================
// TRANSCRIPT GENERATOR
// ============================================
function generateTranscriptHtml(messages: any, channel: any): string {
  if (!messages) return '<html><body><p>No hay mensajes</p></body></html>'

  const msgs = [...messages.values()].reverse()

  const messageRows = msgs.map(m => `
    <div style="display:flex;gap:12px;padding:8px 16px;border-bottom:1px solid #3f4147;">
      <img src="${m.author?.displayAvatarURL?.() || ''}" style="width:40px;height:40px;border-radius:50%;" />
      <div>
        <div style="display:flex;gap:8px;align-items:center;">
          <strong style="color:${m.author?.id === channel?.client?.user?.id ? '#5865F2' : '#ffffff'}">${m.author?.username || 'Unknown'}</strong>
          <span style="color:#72767d;font-size:12px;">${m.createdAt?.toLocaleString('es-ES') || ''}</span>
        </div>
        <div style="color:#dcddde;margin-top:2px;">${m.content || ''}</div>
      </div>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transcript - #${channel?.name || 'ticket'}</title>
  <style>
    body { background:#36393f; color:#dcddde; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; margin:0; }
    .header { background:#2f3136; padding:16px; border-bottom:2px solid #5865F2; }
    .header h1 { color:#ffffff; margin:0; font-size:18px; }
    .header p { color:#72767d; margin:4px 0 0; font-size:13px; }
    .messages { max-width:800px; margin:0 auto; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Transcript: #${channel?.name || 'ticket'}</h1>
    <p>${msgs.length} mensajes | Generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>
  <div class="messages">${messageRows}</div>
</body>
</html>`
}

// ============================================
// INICIAR BOT
// ============================================

async function startBot() {
  console.log('\n🚀 DiscordForge Bot v1.0.0')
  console.log('═══════════════════════════════════\n')

  if (config.token === 'YOUR_BOT_TOKEN_HERE') {
    console.log('⚠️  CONFIGURACIÓN REQUERIDA')
    console.log('─────────────────────────────────────')
    console.log('Para ejecutar el bot necesitas:')
    console.log('')
    console.log('1. Crear una aplicación en https://discord.com/developers/applications')
    console.log('2. Crear un Bot y copiar el TOKEN')
    console.log('3. Activar los Intents necesarios en el Portal')
    console.log('4. Configurar las variables de entorno:')
    console.log('')
    console.log('   DISCORD_BOT_TOKEN=tu_token_aqui')
    console.log('   DISCORD_CLIENT_ID=tu_client_id_aqui')
    console.log('   DASHBOARD_WS_URL=http://localhost:3003')
    console.log('')
    console.log('5. Invitar el bot con la URL:')
    console.log('   https://discord.com/api/oauth2/authorize?client_id=TU_CLIENT_ID&permissions=8&scope=bot%20applications.commands')
    console.log('')
    console.log('📖 El bot se ejecutará en modo DEMO sin conexión a Discord.')
    console.log('   El Dashboard funciona independientemente.\n')

    // Iniciar solo la conexión WebSocket con el dashboard
    // para que el dashboard pueda mostrar el estado del bot
    client.connectToDashboard(config.dashboardUrl)
    client.botStatus.online = false

    console.log('🟡 Bot en modo DEMO - Solo WebSocket activo')
    console.log('   Configura DISCORD_BOT_TOKEN para conexión completa\n')
    return
  }

  try {
    await client.login(config.token)
  } catch (error) {
    console.error('❌ Error al conectar el bot:', error)
    console.log('\n🔄 Iniciando en modo DEMO (solo WebSocket)...')
    client.connectToDashboard(config.dashboardUrl)
  }
}

startBot()

export { client, config }
