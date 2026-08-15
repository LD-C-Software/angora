package cloud.angora

import cloud.angora.constants.BackendConstants
import cloud.angora.repository.DiscordRepositoryImpl
import cloud.angora.repository.HealthRepositoryImpl
import cloud.angora.routes.discordRoutes
import cloud.angora.routes.healthRoutes
import cloud.angora.service.DiscordServiceImpl
import cloud.angora.service.HealthServiceImpl
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.Database

fun main(args: Array<String>) {
    EngineMain.main(args)
}

fun Application.module() {
    val dbUrl = environment.config.property("database.url").getString()
    val dbUser = environment.config.property("database.user").getString()
    val dbPassword = environment.config.property("database.password").getString()

    Flyway.configure()
        .dataSource(dbUrl, dbUser, dbPassword)
        .load()
        .migrate()

    val database = Database.connect(
        url = dbUrl,
        driver = BackendConstants.DatabaseDefaults.DRIVER_CLASS,
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

    val discordClientId = System.getenv("DISCORD_CLIENT_ID") ?: BackendConstants.Discord.DEFAULT_CLIENT_ID
    val discordBotUrl = System.getenv("DISCORD_BOT_URL") ?: BackendConstants.Discord.DEFAULT_BOT_URL

    // Repositories (Data Access Layer)
    val healthRepository = HealthRepositoryImpl(database)
    val discordRepository = DiscordRepositoryImpl(database)

    // Services (Business Logic Layer)
    val healthService = HealthServiceImpl(healthRepository)
    val discordService = DiscordServiceImpl(
        discordRepository = discordRepository,
        clientId = discordClientId,
        botUrl = discordBotUrl
    )

    // Routing (API / Controller Layer)
    routing {
        healthRoutes(healthService)
        discordRoutes(discordService)
    }
}

