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
    route("/api/discord") {
        get("/servers") {
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

        post("/servers") {
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
            call.respond(HttpStatusCode.Created, mapOf("id" to createdId, "status" to "registered"))
        }

        delete("/servers/{id}") {
            val idParam = call.parameters["id"]
            if (idParam == null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing server id"))
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
                        val botUrl = System.getenv("DISCORD_BOT_URL") ?: "http://discord-bot:3001"
                        val httpClient = java.net.http.HttpClient.newHttpClient()
                        val request = java.net.http.HttpRequest.newBuilder()
                            .uri(java.net.URI.create("$botUrl/leave/$targetGuildId"))
                            .POST(java.net.http.HttpRequest.BodyPublishers.noBody())
                            .build()
                        httpClient.sendAsync(request, java.net.http.HttpResponse.BodyHandlers.ofString())
                    } catch (e: Exception) {
                        application.log.warn("Failed to notify Discord bot to leave guild $targetGuildId", e)
                    }
                }
                call.respond(HttpStatusCode.OK, DeleteServerResponse(status = "updated", guildId = targetGuildId, botJoined = false))
            } else {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Server not found"))
            }
        }

        post("/bot/sync") {
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
            call.respond(HttpStatusCode.OK, mapOf("status" to "synced"))
        }

        get("/bot/invite") {
            if (clientId.isNullOrBlank() || clientId == "YOUR_DISCORD_CLIENT_ID") {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "DISCORD_CLIENT_ID environment variable is not set. Please configure DISCORD_CLIENT_ID in your environment.", "inviteUrl" to "", "clientId" to "")
                )
                return@get
            }
            val permissions = "8"
            val url = "https://discord.com/oauth2/authorize?client_id=$clientId&scope=bot+applications.commands&permissions=$permissions"
            call.respond(mapOf("inviteUrl" to url, "clientId" to clientId))
        }
    }
}
