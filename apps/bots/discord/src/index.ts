import http from 'node:http'
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js'
import { BOT_CONFIG, BOT_ROUTES } from './constants.js'

const token = process.env.DISCORD_BOT_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const backendUrl = process.env.BACKEND_URL || BOT_CONFIG.DEFAULT_BACKEND_URL

// Sync guild status with Angora backend
async function syncGuildWithBackend(guildData: {
  guildId: string
  name: string
  iconUrl?: string | null
  ownerId?: string | null
  memberCount: number
  botJoined: boolean
}) {
  try {
    const res = await fetch(
      `${backendUrl}${BOT_ROUTES.BACKEND_SYNC_ENDPOINT}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guildData),
      },
    )
    if (!res.ok) {
      console.error(
        `[Discord Bot] Failed to sync guild ${guildData.name} (${res.status})`,
      )
    } else {
      console.log(
        `[Discord Bot] Successfully synced server: ${guildData.name} (${guildData.guildId})`,
      )
    }
  } catch (err) {
    console.error(`[Discord Bot] Backend connection error during sync:`, err)
  }
}

// Dedicated commands registration framework (empty command list prepared for future extension)
async function registerCommands(botToken: string, botClientId: string) {
  const commands = [
    // Dedicated commands can be added here (e.g. new SlashCommandBuilder().setName('crm').setDescription('CRM command'))
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

if (!token || token === BOT_CONFIG.TOKEN_PLACEHOLDER) {
  console.log('[Discord Bot] No DISCORD_BOT_TOKEN provided in environment.')
  console.log(
    '[Discord Bot] Set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in .env to connect to live Discord gateway.',
  )
  console.log('[Discord Bot] Standing by in passive state...')

  // Keep process active in docker container
  setInterval(() => {
    // Passive heartbeat check
  }, BOT_CONFIG.PASSIVE_HEARTBEAT_MS)
} else {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  })

  const syncAllGuilds = async () => {
    for (const [, guild] of client.guilds.cache) {
      await syncGuildWithBackend({
        guildId: guild.id,
        name: guild.name,
        iconUrl: guild.iconURL(),
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
        botJoined: true,
      })
    }
  }

  client.once('ready', async () => {
    console.log(`[Discord Bot] Logged in as ${client.user?.tag}`)

    // Register slash commands if client ID is set
    if (clientId) {
      await registerCommands(token, clientId)
    }

    // Sync all currently joined guilds on startup & set periodic sync
    await syncAllGuilds()
    setInterval(syncAllGuilds, BOT_CONFIG.SYNC_INTERVAL_MS)
  })

  // Start internal HTTP listener for CRM control actions (e.g. leaving guild)
  const server = http.createServer(async (req, res) => {
    const url = req.url || ''
    if (
      req.method === 'POST' &&
      url.startsWith(BOT_ROUTES.INTERNAL_LEAVE_PREFIX)
    ) {
      const targetGuildId = url.split(BOT_ROUTES.INTERNAL_LEAVE_PREFIX)[1]
      if (targetGuildId) {
        const guild = client.guilds.cache.get(targetGuildId)
        if (guild) {
          try {
            console.log(
              `[Discord Bot] Leaving server: ${guild.name} (${targetGuildId}) per CRM request`,
            )
            await guild.leave()
            await syncGuildWithBackend({
              guildId: targetGuildId,
              name: guild.name,
              memberCount: guild.memberCount,
              botJoined: false,
            })
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ status: 'left', guildId: targetGuildId }))
            return
          } catch (err) {
            console.error(
              `[Discord Bot] Error leaving guild ${targetGuildId}:`,
              err,
            )
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Failed to leave guild' }))
            return
          }
        }
      }
    }
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  server.listen(BOT_CONFIG.DEFAULT_PORT, () => {
    console.log(
      `[Discord Bot] Internal API listener running on port ${BOT_CONFIG.DEFAULT_PORT}`,
    )
  })

  // Handle joining new Discord server
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

  // Handle leaving/removal from Discord server
  client.on('guildDelete', async (guild) => {
    console.log(`[Discord Bot] Left server: ${guild.name} (ID: ${guild.id})`)
    await syncGuildWithBackend({
      guildId: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      botJoined: false,
    })
  })

  // Handle slash commands
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return

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
  })

  client.login(token).catch((err) => {
    console.error('[Discord Bot] Login failed:', err.message)
  })
}
