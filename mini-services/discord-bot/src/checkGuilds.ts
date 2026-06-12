// Quick test script to verify bot guilds
import { REST, Routes } from 'discord.js'

const TOKEN = process.env.DISCORD_BOT_TOKEN!
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!

const rest = new REST({ version: '10' }).setToken(TOKEN)

async function check() {
  try {
    // Get current user (bot info)
    const user = await rest.get(Routes.user()) as any
    console.log(`🤖 Bot: ${user.username}#${user.discriminator}`)
    console.log(`🆔 ID: ${user.id}`)

    // Get guilds the bot is in
    const guilds = await rest.get(Routes.userGuilds()) as any[]
    console.log(`\n📍 Servidores (${guilds.length}):`)
    for (const guild of guilds) {
      console.log(`  📌 ${guild.name} (ID: ${guild.id}, Miembros: ${guild.approximate_member_count || 'N/A'})`)
    }

    if (guilds.length > 0) {
      console.log(`\n✅ ¡El bot está en ${guilds.length} servidor(es)!`)
    } else {
      console.log('\n⚠️ El bot no está en ningún servidor aún.')
      console.log('Invítalo con esta URL:')
      console.log(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

check()
