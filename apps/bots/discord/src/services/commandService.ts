import {
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
  type Client,
  type Interaction,
} from 'discord.js'
import { BOT_CONFIG } from '../constants.js'

/**
 * Registers global slash commands with Discord API.
 */
export async function registerSlashCommands(
  botToken: string,
  botClientId: string,
): Promise<void> {
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check Angora CRM Discord bot latency'),
  ].map((cmd) => cmd.toJSON())

  const rest = new REST({ version: BOT_CONFIG.REST_API_VERSION }).setToken(
    botToken,
  )

  try {
    console.log('[Discord Bot] Registering global slash commands...')
    await rest.put(Routes.applicationCommands(botClientId), { body: commands })
    console.log('[Discord Bot] Slash commands registered successfully.')
  } catch (err) {
    console.error('[Discord Bot] Error registering slash commands:', err)
  }
}

/**
 * Handles incoming interactions/slash commands.
 */
export async function handleInteraction(
  interaction: Interaction,
  client: Client,
): Promise<void> {
  if (!interaction.isChatInputCommand()) return

  try {
    const { commandName } = interaction

    if (commandName === 'ping') {
      const response = await interaction.reply({
        content: '🏓 Pinging...',
        withResponse: true,
        flags: MessageFlags.Ephemeral,
      })
      const roundtripLatency = response.resource?.message?.createdTimestamp
        ? response.resource.message.createdTimestamp -
          interaction.createdTimestamp
        : Date.now() - interaction.createdTimestamp
      const wsLatency = Math.round(client.ws.ping)

      await interaction.editReply({
        content: `🏓 Pong!\n• **Roundtrip Latency:** ${roundtripLatency}ms\n• **WebSocket Latency:** ${wsLatency}ms`,
      })
    }
  } catch (err) {
    console.error('[Discord Bot] Error handling command interaction:', err)
  }
}
