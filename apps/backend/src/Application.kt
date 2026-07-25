package com.crm

import io.ktor.server.application.*
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

fun main(args: Array<String>) {
    EngineMain.main(args)
}

fun Application.module() {
    val database = Database.connect(
        url = environment.config.property("database.url").getString(),
        driver = "org.postgresql.Driver",
        user = environment.config.property("database.user").getString(),
        password = environment.config.property("database.password").getString()
    )

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
