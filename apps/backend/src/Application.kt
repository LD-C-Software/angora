package cloud.angora

import io.ktor.server.application.*
import io.ktor.server.netty.*
import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.cors.routing.*
import kotlinx.serialization.json.Json
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

fun main(args: Array<String>) {
    EngineMain.main(args)
}

fun Application.module() {
    val dbUrl = environment.config.property(BackendConstants.Config.DB_URL_PROPERTY).getString()
    val dbUser = environment.config.property(BackendConstants.Config.DB_USER_PROPERTY).getString()
    val dbPassword = environment.config.property(BackendConstants.Config.DB_PASSWORD_PROPERTY).getString()

    Flyway.configure()
        .dataSource(dbUrl, dbUser, dbPassword)
        .load()
        .migrate()

    val database = Database.connect(
        url = dbUrl,
        driver = BackendConstants.Config.POSTGRES_DRIVER,
        user = dbUser,
        password = dbPassword
    )

    install(CORS) {
        anyHost()
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Delete)
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowNonSimpleContentTypes = true
    }

    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            encodeDefaults = true
        })
    }

    val discordClientId = System.getenv(BackendConstants.Config.ENV_DISCORD_CLIENT_ID)?.takeIf { it.isNotBlank() }
    if (discordClientId == null) {
        log.warn(BackendConstants.Messages.WARN_DISCORD_CLIENT_ID_NOT_SET)
    }

    routing {
        get(BackendConstants.Routes.HEALTH) {
            val healthStatus = try {
                transaction(database) {
                    mapOf(
                        BackendConstants.Responses.KEY_STATUS to BackendConstants.Responses.STATUS_OK,
                        BackendConstants.Responses.KEY_DATABASE to BackendConstants.Responses.STATUS_CONNECTED
                    )
                }
            } catch (e: Exception) {
                mapOf(
                    BackendConstants.Responses.KEY_STATUS to BackendConstants.Responses.STATUS_OK,
                    BackendConstants.Responses.KEY_DATABASE to BackendConstants.Responses.STATUS_DISCONNECTED,
                    BackendConstants.Responses.KEY_ERROR to e.message
                )
            }
            call.respond(healthStatus)
        }

        discordRoutes(database, discordClientId)
    }
}
