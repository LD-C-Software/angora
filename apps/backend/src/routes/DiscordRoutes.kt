package cloud.angora.routes

import cloud.angora.constants.BackendConstants
import cloud.angora.dto.ErrorResponse
import cloud.angora.dto.SyncGuildRequest
import cloud.angora.dto.SyncStatusResponse
import cloud.angora.service.DiscordService
import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.discordRoutes(discordService: DiscordService) {
    route(BackendConstants.Routes.DISCORD_BASE) {
        get(BackendConstants.Routes.DISCORD_SERVERS) {
            val servers = discordService.getAllServers()
            call.respond(servers)
        }

        delete(BackendConstants.Routes.DISCORD_SERVERS_BY_ID) {
            val idParam = call.parameters["id"]
            if (idParam.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Missing server id"))
                return@delete
            }

            val response = discordService.leaveServer(idParam)
            if (response != null) {
                call.respond(HttpStatusCode.OK, response)
            } else {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Server not found"))
            }
        }

        post(BackendConstants.Routes.DISCORD_BOT_SYNC) {
            val req = call.receive<SyncGuildRequest>()
            discordService.syncGuild(req)
            call.respond(HttpStatusCode.OK, SyncStatusResponse(status = "synced"))
        }

        get(BackendConstants.Routes.DISCORD_BOT_INVITE) {
            val inviteInfo = discordService.getInviteInfo()
            call.respond(inviteInfo)
        }
    }
}

