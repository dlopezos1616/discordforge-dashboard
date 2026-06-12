// Script para registrar los Slash Commands en Discord
import { REST, Routes } from 'discord.js'
import { SlashCommandBuilder } from 'discord.js'

const TOKEN = process.env.DISCORD_BOT_TOKEN!
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!

const commands = [
  new SlashCommandBuilder().setName('help').setDescription('Muestra la lista de comandos del bot'),

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
    .setName('unban')
    .setDescription('Desbanear un usuario')
    .addStringOption(o => o.setName('usuario_id').setDescription('ID del usuario a desbanear').setRequired(true)),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Ver información de un usuario')
    .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar')),

  new SlashCommandBuilder().setName('serverinfo').setDescription('Ver información del servidor'),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configurar un sistema del bot')
    .addStringOption(o =>
      o.setName('sistema')
        .setDescription('Sistema a configurar')
        .setRequired(true)
        .addChoices(
          { name: '🎫 Tickets', value: 'tickets' },
          { name: '👋 Bienvenidas', value: 'welcome' },
          { name: '✅ Verificación', value: 'verify' },
          { name: '🤖 Auto-Mod', value: 'automod' },
        )
    ),
].map(cmd => cmd.toJSON())

const rest = new REST({ version: '10' }).setToken(TOKEN)

async function registerCommands() {
  try {
    console.log(`🔄 Registrando ${commands.length} slash commands...`)

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    )

    console.log(`✅ ${commands.length} slash commands registrados exitosamente!`)
    console.log('\n📋 Comandos disponibles:')
    console.log('  /help          - Lista de comandos')
    console.log('  /ticket        - Abrir ticket')
    console.log('  /ban           - Banear usuario')
    console.log('  /kick          - Expulsar usuario')
    console.log('  /timeout       - Aislar usuario')
    console.log('  /warn          - Advertir usuario')
    console.log('  /unban         - Desbanear usuario')
    console.log('  /userinfo      - Info de usuario')
    console.log('  /serverinfo    - Info del servidor')
    console.log('  /setup         - Configurar sistemas')
    console.log('\n🔗 URL de invitación:')
    console.log(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`)
  } catch (error) {
    console.error('❌ Error registrando commands:', error)
  }
}

registerCommands()
