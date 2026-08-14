package cloud.angora

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import java.time.Instant
import java.util.UUID

@Serializable
data class DiscordServerDto(
    val id: String,
    val guildId: String,
    val name: String,
    val iconUrl: String? = null,
    val ownerId: String? = null,
    val memberCount: Int = 0,
    val botJoined: Boolean,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class SyncGuildRequest(
    val guildId: String,
    val name: String,
    val iconUrl: String? = null,
    val ownerId: String? = null,
    val memberCount: Int = 0,
    val botJoined: Boolean = true
)

@Serializable
data class ManualServerRequest(
    val guildId: String,
    val name: String,
    val iconUrl: String? = null,
    val memberCount: Int = 0
)

@Serializable
data class DeleteServerResponse(
    val status: String,
    val guildId: String? = null,
    val botJoined: Boolean = false
)

fun Route.discordRoutes(database: Database, clientId: String?) {
    route(BackendConstants.Routes.DISCORD_BASE) {
        get(BackendConstants.Routes.DISCORD_SERVERS) {
            val servers = transaction(database) {
                DiscordServers.selectAll()
                    .orderBy(DiscordServers.createdAt to SortOrder.DESC)
                    .map { row ->
                        DiscordServerDto(
                            id = row[DiscordServers.id].value.toString(),
                            guildId = row[DiscordServers.guildId],
                            name = row[DiscordServers.name],
                            iconUrl = row[DiscordServers.iconUrl],
                            ownerId = row[DiscordServers.ownerId],
                            memberCount = row[DiscordServers.memberCount],
                            botJoined = row[DiscordServers.botJoined],
                            createdAt = row[DiscordServers.createdAt].toString(),
                            updatedAt = row[DiscordServers.updatedAt].toString()
                        )
                    }
            }
            call.respond(servers)
        }

        post(BackendConstants.Routes.DISCORD_SERVERS) {
            val req = call.receive<ManualServerRequest>()
            val now = Instant.now()
            val createdId = transaction(database) {
                val existing = DiscordServers.selectAll()
                    .where { DiscordServers.guildId eq req.guildId }
                    .singleOrNull()

                if (existing != null) {
                    DiscordServers.update({ DiscordServers.guildId eq req.guildId }) {
                        it[name] = req.name
                        if (req.iconUrl != null) it[iconUrl] = req.iconUrl
                        if (req.memberCount > 0) it[memberCount] = req.memberCount
                        it[botJoined] = true
                        it[updatedAt] = now
                    }
                    existing[DiscordServers.id].value.toString()
                } else {
                    DiscordServers.insert {
                        it[guildId] = req.guildId
                        it[name] = req.name
                        it[iconUrl] = req.iconUrl
                        it[memberCount] = req.memberCount
                        it[botJoined] = true
                        it[createdAt] = now
                        it[updatedAt] = now
                    }[DiscordServers.id].value.toString()
                }
            }
            call.respond(
                HttpStatusCode.Created,
                mapOf(
                    BackendConstants.Responses.KEY_ID to createdId,
                    BackendConstants.Responses.KEY_STATUS to BackendConstants.Responses.STATUS_REGISTERED
                )
            )
        }

        delete(BackendConstants.Routes.DISCORD_SERVERS_ID) {
            val idParam = call.parameters["id"]
            if (idParam == null) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf(BackendConstants.Responses.KEY_ERROR to BackendConstants.Messages.ERROR_MISSING_SERVER_ID)
                )
                return@delete
            }

            val (updatedCount, targetGuildId) = transaction(database) {
                val serverRow = try {
                    val uuid = UUID.fromString(idParam)
                    DiscordServers.selectAll().where { DiscordServers.id eq uuid }.singleOrNull()
                } catch (_: Exception) {
                    DiscordServers.selectAll().where { DiscordServers.guildId eq idParam }.singleOrNull()
                }

                if (serverRow != null) {
                    val gId = serverRow[DiscordServers.guildId]
                    val count = DiscordServers.update({ DiscordServers.id eq serverRow[DiscordServers.id] }) {
                        it[botJoined] = false
                        it[updatedAt] = Instant.now()
                    }
                    Pair(count, gId)
                } else {
                    Pair(0, null)
                }
            }

            if (updatedCount > 0) {
                if (targetGuildId != null) {
                    try {
                        val botUrl = System.getenv(BackendConstants.Config.ENV_DISCORD_BOT_URL)
                            ?: BackendConstants.Config.DEFAULT_DISCORD_BOT_URL
                        val httpClient = java.net.http.HttpClient.newHttpClient()
                        val request = java.net.http.HttpRequest.newBuilder()
                            .uri(java.net.URI.create(BackendConstants.Routes.discordBotLeaveUrl(botUrl, targetGuildId)))
                            .POST(java.net.http.HttpRequest.BodyPublishers.noBody())
                            .build()
                        httpClient.sendAsync(request, java.net.http.HttpResponse.BodyHandlers.ofString())
                    } catch (e: Exception) {
                        application.log.warn(BackendConstants.Messages.warnFailedBotLeave(targetGuildId), e)
                    }
                }
                call.respond(
                    HttpStatusCode.OK,
                    DeleteServerResponse(
                        status = BackendConstants.Responses.STATUS_UPDATED,
                        guildId = targetGuildId,
                        botJoined = false
                    )
                )
            } else {
                call.respond(
                    HttpStatusCode.NotFound,
                    mapOf(BackendConstants.Responses.KEY_ERROR to BackendConstants.Messages.ERROR_SERVER_NOT_FOUND)
                )
            }
        }

        post(BackendConstants.Routes.DISCORD_BOT_SYNC) {
            val req = call.receive<SyncGuildRequest>()
            val now = Instant.now()
            transaction(database) {
                val existing = DiscordServers.selectAll()
                    .where { DiscordServers.guildId eq req.guildId }
                    .singleOrNull()

                if (existing != null) {
                    DiscordServers.update({ DiscordServers.guildId eq req.guildId }) {
                        it[name] = req.name
                        if (req.iconUrl != null) it[iconUrl] = req.iconUrl
                        if (req.ownerId != null) it[ownerId] = req.ownerId
                        it[memberCount] = req.memberCount
                        it[botJoined] = req.botJoined
                        it[updatedAt] = now
                    }
                } else {
                    DiscordServers.insert {
                        it[guildId] = req.guildId
                        it[name] = req.name
                        it[iconUrl] = req.iconUrl
                        it[ownerId] = req.ownerId
                        it[memberCount] = req.memberCount
                        it[botJoined] = req.botJoined
                        it[createdAt] = now
                        it[updatedAt] = now
                    }
                }
            }
            call.respond(
                HttpStatusCode.OK,
                mapOf(BackendConstants.Responses.KEY_STATUS to BackendConstants.Responses.STATUS_SYNCED)
            )
        }

        get(BackendConstants.Routes.DISCORD_BOT_INVITE) {
            if (clientId.isNullOrBlank() || clientId == BackendConstants.Config.PLACEHOLDER_DISCORD_CLIENT_ID) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf(
                        BackendConstants.Responses.KEY_ERROR to BackendConstants.Messages.ERROR_DISCORD_CLIENT_ID_NOT_SET,
                        BackendConstants.Responses.KEY_INVITE_URL to "",
                        BackendConstants.Responses.KEY_CLIENT_ID to ""
                    )
                )
                return@get
            }
            val url = BackendConstants.DiscordOAuth.buildInviteUrl(clientId)
            call.respond(
                mapOf(
                    BackendConstants.Responses.KEY_INVITE_URL to url,
                    BackendConstants.Responses.KEY_CLIENT_ID to clientId
                )
            )
        }
    }
}
