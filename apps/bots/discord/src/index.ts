import { BOT_CONFIG } from './constants.js'
import {
  createDiscordClient,
  setupClientListeners,
} from './client/discordClient.js'
import { startInternalHttpServer } from './server/internalHttpServer.js'

const token = process.env.DISCORD_BOT_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID

// Check if credentials are configured
if (!token || token === BOT_CONFIG.TOKEN_PLACEHOLDER) {
  console.log('[Discord Bot] No DISCORD_BOT_TOKEN provided in environment.')
  console.log(
    '[Discord Bot] Set DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in .env to connect to live Discord gateway.',
  )
  console.log('[Discord Bot] Standing by in passive state...')

  // Passive heartbeat to keep container daemon alive
  setInterval(() => {}, BOT_CONFIG.PASSIVE_HEARTBEAT_MS)
} else {
  // 1. Initialize Discord Gateway Client & Events
  const client = createDiscordClient()
  setupClientListeners(client, token, clientId)

  // 2. Start Internal HTTP Control Server
  startInternalHttpServer(client, BOT_CONFIG.DEFAULT_PORT)

  // 3. Connect to Discord Gateway
  client.login(token).catch((err: Error) => {
    console.error('[Discord Bot] Login failed:', err.message)
  })
}
