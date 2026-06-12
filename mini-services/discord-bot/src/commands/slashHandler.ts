// ============================================
// Manejador de Slash Commands
// ============================================
// Los slash commands se registran via REST API
// y se manejan aquí cuando un usuario los ejecuta.

import { ChatInputCommandInteraction, Client, EmbedBuilder, SlashCommandBuilder } from 'discord.js'

export async function handleSlashCommand(client: any, interaction: ChatInputCommandInteraction) {
  const command = interaction.commandName

  switch (command) {
    // ============================================
    // /help - Lista de comandos
    // ============================================
    case 'help': {
      const embed = new EmbedBuilder()
        .setTitle('🤖 DiscordForge - Comandos')
        .setDescription('Lista de comandos disponibles:')
        .setColor(0x5865F2)
        .addFields(
          { name: '🎫 Tickets', value: '`/ticket` - Abrir un ticket\n`/ticket-close` - Cerrar ticket', inline: true },
          { name: '🛡️ Moderación', value: '`/ban` - Banear usuario\n`/kick` - Expulsar usuario\n`/timeout` - Aislar usuario\n`/warn` - Advertir usuario\n`/unban` - Desbanear', inline: true },
          { name: '📊 Utilidades', value: '`/poll` - Crear encuesta\n`/giveaway` - Crear sorteo\n`/embed` - Crear embed\n`/userinfo` - Info de usuario\n`/serverinfo` - Info del servidor', inline: true },
          { name: '⚙️ Configuración', value: '`/setup tickets` - Configurar tickets\n`/setup welcome` - Configurar bienvenidas\n`/setup verify` - Configurar verificación\n`/setup automod` - Configurar auto-mod', inline: true },
        )
        .setFooter({ text: 'DiscordForge Bot | Usa /setup para comenzar' })

      await interaction.reply({ embeds: [embed], ephemeral: true })
      break
    }

    // ============================================
    // /ticket - Abrir ticket
    // ============================================
    case 'ticket': {
      await interaction.reply({
        content: '🎫 Para abrir un ticket, ve al canal de tickets y haz clic en el botón de la categoría deseada.',
        ephemeral: true,
      })
      break
    }

    // ============================================
    // /ban - Banear usuario
    // ============================================
    case 'ban': {
      const user = interaction.options.getUser('usuario', true)
      const reason = interaction.options.getString('razón') || 'Sin razón especificada'
      const deleteDays = interaction.options.getInteger('días') || 0

      if (!interaction.memberPermissions?.has('BanMembers')) {
        await interaction.reply({ content: '❌ No tienes permisos para banear.', ephemeral: true })
        return
      }

      try {
        await interaction.guild?.members.ban(user, { reason, deleteMessageDays: deleteDays as any })

        const embed = new EmbedBuilder()
          .setTitle('🔨 Usuario Baneado')
          .setColor(0xEF4444)
          .addFields(
            { name: '👤 Usuario', value: `${user.tag} (${user.id})`, inline: true },
            { name: '🛡️ Moderador', value: `${interaction.user.tag}`, inline: true },
            { name: '📝 Razón', value: reason, inline: false },
          )
          .setTimestamp()

        await interaction.reply({ embeds: [embed] })

        // Notificar al dashboard
        client.emitToDashboard('bot:modAction', {
          type: 'ban',
          guildId: interaction.guildId,
          userId: user.id,
          moderatorId: interaction.user.id,
          reason,
        })
      } catch (error) {
        await interaction.reply({ content: `❌ No se pudo banear: ${error}`, ephemeral: true })
      }
      break
    }

    // ============================================
    // /kick - Expulsar usuario
    // ============================================
    case 'kick': {
      const user = interaction.options.getUser('usuario', true)
      const reason = interaction.options.getString('razón') || 'Sin razón especificada'

      if (!interaction.memberPermissions?.has('KickMembers')) {
        await interaction.reply({ content: '❌ No tienes permisos para expulsar.', ephemeral: true })
        return
      }

      try {
        const member = await interaction.guild?.members.fetch(user.id)
        await member?.kick(reason)

        await interaction.reply(`✅ ${user.tag} ha sido expulsado. Razón: ${reason}`)
        client.emitToDashboard('bot:modAction', {
          type: 'kick', guildId: interaction.guildId, userId: user.id, moderatorId: interaction.user.id, reason,
        })
      } catch (error) {
        await interaction.reply({ content: `❌ No se pudo expulsar: ${error}`, ephemeral: true })
      }
      break
    }

    // ============================================
    // /timeout - Aislar usuario
    // ============================================
    case 'timeout': {
      const user = interaction.options.getUser('usuario', true)
      const duration = interaction.options.getString('duración') || '1h'
      const reason = interaction.options.getString('razón') || 'Sin razón especificada'

      try {
        const member = await interaction.guild?.members.fetch(user.id)
        const ms = parseDuration(duration)
        await member?.timeout(ms, reason)

        await interaction.reply(`✅ ${user.tag} ha sido aislado por ${duration}. Razón: ${reason}`)
        client.emitToDashboard('bot:modAction', {
          type: 'timeout', guildId: interaction.guildId, userId: user.id, moderatorId: interaction.user.id, reason, duration,
        })
      } catch (error) {
        await interaction.reply({ content: `❌ No se pudo aislar: ${error}`, ephemeral: true })
      }
      break
    }

    // ============================================
    // /warn - Advertir usuario
    // ============================================
    case 'warn': {
      const user = interaction.options.getUser('usuario', true)
      const reason = interaction.options.getString('razón') || 'Sin razón especificada'

      try {
        // Guardar en la base de datos
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        const server = await prisma.server.findUnique({ where: { discordId: interaction.guildId! } })

        if (server) {
          await prisma.moderationAction.create({
            data: {
              serverId: server.id,
              userId: user.id,
              moderatorId: interaction.user.id,
              type: 'warn',
              reason,
            },
          })

          await prisma.log.create({
            data: {
              serverId: server.id,
              userId: user.id,
              type: 'ban',
              description: `Warn: ${reason}`,
              metadata: JSON.stringify({ moderator: interaction.user.tag }),
            },
          })
        }

        await prisma.$disconnect()

        // Notificar al usuario
        try {
          await user.send(`⚠️ Has sido advertido en **${interaction.guild?.name}** por: ${reason}`)
        } catch {}

        await interaction.reply(`✅ ${user.tag} ha sido advertido. Razón: ${reason}`)
        client.emitToDashboard('bot:modAction', {
          type: 'warn', guildId: interaction.guildId, userId: user.id, moderatorId: interaction.user.id, reason,
        })
      } catch (error) {
        await interaction.reply({ content: `❌ Error: ${error}`, ephemeral: true })
      }
      break
    }

    // ============================================
    // /userinfo - Información de usuario
    // ============================================
    case 'userinfo': {
      const user = interaction.options.getUser('usuario') || interaction.user
      const member = await interaction.guild?.members.fetch(user.id)

      const embed = new EmbedBuilder()
        .setTitle(`👤 ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .setColor(0x5865F2)
        .addFields(
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '📅 Cuenta creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 Se unió', value: member?.joinedAt ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : 'N/A', inline: true },
          { name: '🎭 Roles', value: member?.roles.cache.filter(r => r.id !== interaction.guildId).map(r => r.toString()).join(', ') || 'Ninguno', inline: false },
        )
        .setTimestamp()

      await interaction.reply({ embeds: [embed], ephemeral: true })
      break
    }

    // ============================================
    // /serverinfo - Información del servidor
    // ============================================
    case 'serverinfo': {
      const guild = interaction.guild!
      const embed = new EmbedBuilder()
        .setTitle(`🏛️ ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256 }) || '')
        .setColor(0x5865F2)
        .addFields(
          { name: '🆔 ID', value: guild.id, inline: true },
          { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: '👥 Miembros', value: String(guild.memberCount), inline: true },
          { name: '📅 Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '💬 Canales', value: String(guild.channels.cache.size), inline: true },
          { name: '🎭 Roles', value: String(guild.roles.cache.size), inline: true },
        )
        .setTimestamp()

      await interaction.reply({ embeds: [embed], ephemeral: true })
      break
    }

    default:
      await interaction.reply({ content: '❓ Comando no reconocido.', ephemeral: true })
  }
}

// ============================================
// DEFINICIÓN DE SLASH COMMANDS
// ============================================
// Estos se registran via Discord REST API

export const slashCommands = [
  new SlashCommandBuilder().setName('help').setDescription('Muestra la lista de comandos'),

  new SlashCommandBuilder().setName('ticket').setDescription('Abre un ticket de soporte'),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banear un usuario del servidor')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a banear').setRequired(true))
    .addStringOption(o => o.setName('razón').setDescription('Razón del ban'))
    .addIntegerOption(o => o.setName('días').setDescription('Días de mensajes a eliminar (0-7)')),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsar un usuario del servidor')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
    .addStringOption(o => o.setName('razón').setDescription('Razón de la expulsión')),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Aislar un usuario temporalmente')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a aislar').setRequired(true))
    .addStringOption(o => o.setName('duración').setDescription('Duración (ej: 10m, 1h, 1d)'))
    .addStringOption(o => o.setName('razón').setDescription('Razón del aislamiento')),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advertir a un usuario')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
    .addStringOption(o => o.setName('razón').setDescription('Razón de la advertencia')),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Ver información de un usuario')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar')),

  new SlashCommandBuilder().setName('serverinfo').setDescription('Ver información del servidor'),
]

// ============================================
// UTILIDADES
// ============================================

function parseDuration(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/)
  if (!match) return 3600000
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
