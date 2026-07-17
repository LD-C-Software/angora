package com.crm

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.cors.routing.*
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

val database = Database.connect(
    url = System.getenv("DB_URL") ?: "jdbc:postgresql://postgres:5432/crm",
    driver = "org.postgresql.Driver",
    user = System.getenv("DB_USER") ?: "crm",
    password = System.getenv("DB_PASSWORD") ?: "crm"
)

fun Application.module() {
    install(CORS) {
        anyHost()
        allowNonSimpleContentTypes = true
        allowHeader(HttpHeaders.ContentType)
    }

    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
        })
    }

    routing {
        get("/api/health") {
            val healthStatus = try {
                transaction(database) {
                    mapOf("status" to "ok", "database" to "connected")
                }
            } catch (e: Exception) {
                mapOf("status" to "ok", "database" to "disconnected", "error" to e.message)
            }
            call.respond(healthStatus)
        }
    }
}
