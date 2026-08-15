export const APP_ROUTES = {
  HOME: '/',
  DISCORD_BOT: '/discordbot',
} as const

export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  DISCORD_SERVERS: '/api/discord/servers',
  DISCORD_BOT_INVITE: '/api/discord/bot/invite',
  DISCORD_SERVER_BY_ID: (id: string) => `/api/discord/servers/${id}`,
} as const

export const DISCORD_CONFIG = {
  DEFAULT_CLIENT_ID: '123456789012345678',
  DEFAULT_PERMISSIONS: '2147568640',
  OAUTH_SCOPES: 'bot+applications.commands',
  OAUTH_AUTHORIZE_BASE_URL: 'https://discord.com/oauth2/authorize',
  FALLBACK_INVITE_URL:
    'https://discord.com/oauth2/authorize?client_id=123456789012345678&scope=bot+applications.commands&permissions=2147568640',
} as const

export const TIMING_CONFIG = {
  BACKGROUND_POLL_INTERVAL_MS: 2500,
  TOAST_AUTO_DISMISS_MS: 5000,
} as const

export const TOAST_MESSAGES = {
  SYNC_SUCCESS: {
    title: 'System Synchronized',
    message: 'Discord server status and records have been refreshed.',
  },
  SYNC_ERROR: (reason?: string) => ({
    title: 'Data Sync Failed',
    message: `Unable to connect to Angora backend (${reason || 'Network error'}).`,
  }),
  INVITE_FETCH_ERROR: (reason?: string) => ({
    title: 'Invite Link Notice',
    message: `Could not refresh Discord bot OAuth invite link (${reason || 'connection failed'}).`,
  }),
  SERVER_DISCONNECT_REQUESTED: (serverName?: string) => ({
    title: 'Disconnect Requested',
    message: `Requested Discord bot to leave ${serverName || 'the server'}.`,
  }),
  SERVER_DISCONNECT_FAILED: (serverName?: string, reason?: string) => ({
    title: 'Disconnect Failed',
    message: `Could not disconnect ${serverName || 'server'} (${reason || 'Network error'}).`,
  }),
  UNHANDLED_ERROR: (message?: string) => ({
    title: 'Application Error',
    message: message || 'An unexpected error occurred.',
  }),
  UNHANDLED_REJECTION: (reason?: string) => ({
    title: 'Operation Failed',
    message: reason || 'An unexpected async operation failed.',
  }),
} as const
