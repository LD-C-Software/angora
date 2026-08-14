/**
 * Angora CRM — Centralized Application Constants & Configuration
 *
 * All hardcoded strings, endpoints, timing constants, routes,
 * form defaults, and error messages are centralized here for
 * readability, maintainability, and reusability.
 */

// ============================================================================
// 1. API Endpoints & External URLs
// ============================================================================
export const API_ENDPOINTS = {
  SERVERS: '/api/discord/servers',
  INVITE: '/api/discord/bot/invite',
  DELETE_SERVER: (id: string) => `/api/discord/servers/${id}`,
  FALLBACK_INVITE_URL:
    'https://discord.com/oauth2/authorize?client_id=123456789012345678&scope=bot+applications.commands&permissions=8',
} as const

// ============================================================================
// 2. Application Routing & Navigation
// ============================================================================
export const APP_ROUTES = {
  HOME: '/',
  DISCORD_BOT: '/discordbot',
  DISCORD_PREFIX: '/discord',
} as const

// ============================================================================
// 3. Navigation Sub-Tabs
// ============================================================================
export const DISCORD_TABS = {
  DISCORD: 'discord',
  COMMANDS: 'commands',
  HEALTH: 'health',
} as const

export type DiscordTabType = (typeof DISCORD_TABS)[keyof typeof DISCORD_TABS]

// ============================================================================
// 4. Timing & Network Configuration (Milliseconds)
// ============================================================================
export const TIMING = {
  /** Milliseconds per second conversion factor */
  MS_PER_SECOND: 1000,

  /** Client-side fetch timeout before AbortController aborts */
  REQUEST_TIMEOUT_MS: 3500,

  /** Duration a toast notification remains visible before auto-dismiss */
  TOAST_AUTO_DISMISS_MS: 5000,

  /** Normal background polling interval when connected & healthy */
  POLL_INTERVAL_NORMAL_MS: 3500,

  /** First retry delay on error backoff */
  POLL_BACKOFF_1_MS: 6000,

  /** Second retry delay on error backoff */
  POLL_BACKOFF_2_MS: 15000,

  /** Maximum consecutive failed attempts before pausing polling */
  MAX_CONSECUTIVE_ERRORS: 3,

  /** Minimum throttle interval between repeated background error toasts */
  BACKGROUND_ERROR_THROTTLE_MS: 8000,
} as const

// ============================================================================
// 5. Form & Model Defaults
// ============================================================================
export const FORM_DEFAULTS = {
  DEFAULT_MEMBER_COUNT: 10,
} as const

// ============================================================================
// 6. Toast Notification Titles & Categories
// ============================================================================
export const TOAST_DEFAULT_TITLES = {
  error: 'System Alert',
  success: 'Operation Successful',
  warning: 'System Warning',
  info: 'System Information',
} as const

// ============================================================================
// 7. System Messages, Alerts & Error Descriptions
// ============================================================================
export const MESSAGES = {
  // Network & Request Errors
  TIMEOUT_ERROR: (seconds: number) =>
    `Request timed out after ${seconds}s (Backend unreachable or paused)`,
  SERVERS_FETCH_ERROR: 'Failed to load servers',
  SERVERS_HTTP_ERROR: (status: number) =>
    `HTTP error ${status}: Unable to load servers`,
  INVITE_FETCH_ERROR: 'Failed to fetch Discord invite URL',
  INVITE_CONFIG_TITLE: 'Discord Configuration',

  // Server Registration & Deletion
  SERVER_REGISTER_SUCCESS: (name: string) =>
    `Server "${name}" registered successfully!`,
  SERVER_REGISTER_ERROR: 'Failed to register server',
  SERVER_REMOVE_SUCCESS: 'Discord server removed from CRM registry.',
  SERVER_REMOVE_ERROR: 'Failed to remove server',
  SERVER_DELETE_CONFIRM: 'Are you sure you want to remove this Discord server?',

  // Live Sync & Backoff
  SYNC_COMPLETED: (count: number) =>
    `Successfully synchronized ${count} Discord server(s).`,
  SYNC_BACKOFF_NOTICE: (msg: string) =>
    `${msg}. Entering backoff retry mode...`,
  SYNC_PAUSED_NOTICE:
    'Live background sync paused after 3 consecutive failures. Click "Sync Data" to resume.',

  // Simulated Playground Alerts
  SIMULATED_ERROR:
    'Database connection timed out while querying discord_servers (Error 504 Gateway Timeout).',
  SIMULATED_SUCCESS:
    'Discord OAuth payload verified and guild synced with Exposed ORM.',
  SIMULATED_WARNING:
    'DISCORD_CLIENT_ID not configured in .env. Bot invite link will use fallback.',
  SIMULATED_INFO:
    'Polling cycle completed: all 2 active Discord guilds are healthy.',
} as const

// ============================================================================
// 8. User Interface Copy & Content
// ============================================================================
export const UI_TEXT = {
  BRAND: {
    NAME: 'Angora CRM',
    SUBTITLE: 'Self-Hosted CRM & Integration Stack',
    INITIAL: 'A',
  },
  NAV: {
    HOME: '🏠 Home',
    DISCORD: '🎮 Discord Bot',
  },
  HERO: {
    BADGE: '✨ Self-Hosted CRM Platform v1.0',
    TITLE: 'Manage Support Channels & Discord Integrations Seamlessly',
    SUBTITLE:
      'Angora is a modern self-hosted customer support CRM system with native integrations for Discord servers, Slack channels, and email automated workflows.',
    CTA_PRIMARY: '🎮 Open Discord Manager (/discordbot) →',
    CTA_SECONDARY: '🔄 Sync System State',
  },
  MODULES: {
    SECTION_TITLE: 'Integrated Apps & Modules',
    SECTION_SUBTITLE:
      'Click any module to manage its gateway connection and live status',
    DISCORD_CARD_TITLE: 'Discord Bot Integration',
    DISCORD_CARD_DESC:
      'View active Discord servers, manage bot OAuth invitation links, track member stats, and execute slash commands (/ping).',
    DISCORD_CARD_BTN: 'Launch Discord Manager →',

    SLACK_CARD_TITLE: 'Slack Workspace Bot',
    SLACK_CARD_DESC:
      'Connect support agents with customer support channels, receive ticket updates, and automate workspace notifications.',
    SLACK_CARD_BTN: 'Slack Engine Ready',

    EMAIL_CARD_TITLE: 'Email Ticket System',
    EMAIL_CARD_DESC:
      'Inbound IMAP/SMTP message listener for automatic ticket generation, response dispatching, and conversation logs.',
    EMAIL_CARD_BTN: 'Email Engine Ready',

    DB_CARD_TITLE: 'PostgreSQL Database',
    DB_CARD_DESC:
      'KTor 3.5.1 Exposed ORM engine powered by PostgreSQL 18 with Flyway automated migrations.',
    DB_CARD_BTN: 'View Connected Records',
  },
  DISCORD_MANAGER: {
    BREADCRUMB_OVERVIEW: '🏠 Overview',
    BREADCRUMB_DISCORD: '🎮 Discord Bot Manager (/discordbot)',
    TITLE: 'Discord Server Integration',
    SUBTITLE:
      'Manage connected Discord servers, invite Angora Bot, and view slash commands.',
    BTN_BACK_HOME: '← Back to Home',
    BTN_SYNC_DATA: '🔄 Sync Data',
    BTN_ADD_BOT_OAUTH: '🤖 Add Bot to Server (OAuth)',
    BTN_REGISTER_SERVER: '➕ Register Server',

    STATUS_LIVE_SYNC: 'Live Sync',
    STATUS_RECONNECTING: 'Reconnecting...',
    STATUS_SYNC_PAUSED: '🔴 Sync Paused (Click to Resume)',

    TAB_SERVERS_LABEL: (count: number) => `🎮 Connected Servers (${count})`,
    TAB_COMMANDS_LABEL: '⚡ Bot Slash Commands',
    TAB_HEALTH_LABEL: '💚 Backend Health',

    LOADING_SERVERS: 'Loading connected servers...',
    EMPTY_TITLE: 'No Discord Servers Connected',
    EMPTY_DESC:
      'Invite the bot to your Discord server or list a server manually to get started.',
    EMPTY_BTN: '🤖 Invite Bot to Discord Server (OAuth)',

    CARD_BOT_CONNECTED: 'Bot Connected',
    CARD_BOT_LEFT: 'Bot Left',
    CARD_BTN_REMOVE: 'Remove',
    CARD_BTN_RECONNECT: '🔄 Reconnect',

    COMMANDS_TITLE: 'Command Registry Overview',
    COMMAND_PING_NAME: '/ping',
    COMMAND_PING_DESC: 'Checks bot WebSocket latency & API roundtrip latency',
    COMMAND_PING_STATUS: 'Registered',
    COMMAND_DEDICATED_NAME: '/angora (Dedicated)',
    COMMAND_DEDICATED_DESC:
      'Placeholder slot ready for custom dedicated commands',
    COMMAND_DEDICATED_STATUS: 'Ready for implementation',

    PLAYGROUND_TITLE: '🔔 Interactive Toast & Alert Playground',
    PLAYGROUND_DESC:
      'Click any button below to preview how errors, warnings, successes, and telemetry alerts display with auto-dismiss timers and custom styling:',
    PLAYGROUND_BTN_ERROR: '⚠️ Trigger Error Toast',
    PLAYGROUND_BTN_SUCCESS: '✅ Trigger Success Toast',
    PLAYGROUND_BTN_WARNING: '⚡ Trigger Warning Toast',
    PLAYGROUND_BTN_INFO: 'ℹ️ Trigger Info Toast',

    OAUTH_DATA_TITLE: 'Discord OAuth Invite Link Data',
  },
  MODAL: {
    TITLE: 'List / Register Discord Server',
    SUBTITLE: 'Add a server record manually to register it in your CRM system.',
    LABEL_GUILD_ID: 'Discord Server (Guild) ID',
    PLACEHOLDER_GUILD_ID: 'e.g. 102938475665748392',
    LABEL_NAME: 'Server Name',
    PLACEHOLDER_NAME: 'e.g. My Community Server',
    LABEL_MEMBER_COUNT: 'Member Count',
    BTN_CANCEL: 'Cancel',
    BTN_SUBMIT: 'Save Server',
  },
} as const
