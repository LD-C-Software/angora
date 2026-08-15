import { Client, GatewayIntentBits } from 'discord.js'
import { BOT_CONFIG } from '../constants.js'
import {
  syncGuildWithBackend,
  syncAllGuilds,
} from '../services/backendService.js'
import {
  registerSlashCommands,
  handleInteraction,
} from '../services/commandService.js'

/**
 * Creates and configures the Discord.js Client instance.
 */
export function createDiscordClient(): Client {
  return new Client({
    intents: [GatewayIntentBits.Guilds],
  })
}

/**
 * Attaches event listeners for Discord gateway lifecycle and user interactions.
 */
export function setupClientListeners(
  client: Client,
  token: string,
  clientId?: string,
): void {
  // Ready event
  client.once('ready', async () => {
    console.log(`[Discord Bot] Logged in as ${client.user?.tag}`)

    if (clientId) {
      await registerSlashCommands(token, clientId)
    }

    await syncAllGuilds(client)
    setInterval(() => syncAllGuilds(client), BOT_CONFIG.SYNC_INTERVAL_MS)
  })

  // Joined a server
  client.on('guildCreate', async (guild) => {
    console.log(`[Discord Bot] Joined server: ${guild.name} (ID: ${guild.id})`)
    await syncGuildWithBackend({
      guildId: guild.id,
      name: guild.name,
      iconUrl: guild.iconURL(),
      ownerId: guild.ownerId,
      memberCount: guild.memberCount,
      botJoined: true,
    })
  })

  // Left/Removed from a server
  client.on('guildDelete', async (guild) => {
    console.log(`[Discord Bot] Left server: ${guild.name} (ID: ${guild.id})`)
    await syncGuildWithBackend({
      guildId: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      botJoined: false,
    })
  })

  // Slash commands
  client.on('interactionCreate', (interaction) => {
    handleInteraction(interaction, client)
  })
}
