package cloud.angora

/**
 * Centralized Backend Constants & Configuration Keys
 *
 * Groups all endpoints, configuration properties, environment variables,
 * response payloads, status constants, error messages, and OAuth URLs.
 */
object BackendConstants {

    object Config {
        const val DB_URL_PROPERTY = "database.url"
        const val DB_USER_PROPERTY = "database.user"
        const val DB_PASSWORD_PROPERTY = "database.password"
        const val POSTGRES_DRIVER = "org.postgresql.Driver"

        const val ENV_DISCORD_CLIENT_ID = "DISCORD_CLIENT_ID"
        const val ENV_DISCORD_BOT_URL = "DISCORD_BOT_URL"
        const val DEFAULT_DISCORD_BOT_URL = "http://discord-bot:3001"
        const val PLACEHOLDER_DISCORD_CLIENT_ID = "YOUR_DISCORD_CLIENT_ID"
    }

    object Routes {
        const val HEALTH = "/api/health"
        const val DISCORD_BASE = "/api/discord"
        const val DISCORD_SERVERS = "/servers"
        const val DISCORD_SERVERS_ID = "/servers/{id}"
        const val DISCORD_BOT_SYNC = "/bot/sync"
        const val DISCORD_BOT_INVITE = "/bot/invite"

        fun discordBotLeaveUrl(botBaseUrl: String, guildId: String): String =
            "$botBaseUrl/leave/$guildId"
    }

    object Responses {
        const val STATUS_OK = "ok"
        const val STATUS_CONNECTED = "connected"
        const val STATUS_DISCONNECTED = "disconnected"
        const val STATUS_REGISTERED = "registered"
        const val STATUS_UPDATED = "updated"
        const val STATUS_SYNCED = "synced"

        const val KEY_STATUS = "status"
        const val KEY_DATABASE = "database"
        const val KEY_ERROR = "error"
        const val KEY_ID = "id"
        const val KEY_INVITE_URL = "inviteUrl"
        const val KEY_CLIENT_ID = "clientId"
    }

    object Messages {
        const val ERROR_MISSING_SERVER_ID = "Missing server id"
        const val ERROR_SERVER_NOT_FOUND = "Server not found"
        const val ERROR_DISCORD_CLIENT_ID_NOT_SET =
            "DISCORD_CLIENT_ID environment variable is not set. Please configure DISCORD_CLIENT_ID in your environment."
        const val WARN_DISCORD_CLIENT_ID_NOT_SET =
            "DISCORD_CLIENT_ID environment variable is not set."

        fun warnFailedBotLeave(guildId: String): String =
            "Failed to notify Discord bot to leave guild $guildId"
    }

    object DiscordOAuth {
        const val DEFAULT_PERMISSIONS = "8"
        const val DEFAULT_SCOPES = "bot+applications.commands"
        const val AUTHORIZE_BASE_URL = "https://discord.com/oauth2/authorize"

        fun buildInviteUrl(
            clientId: String,
            scopes: String = DEFAULT_SCOPES,
            permissions: String = DEFAULT_PERMISSIONS
        ): String = "$AUTHORIZE_BASE_URL?client_id=$clientId&scope=$scopes&permissions=$permissions"
    }
}
