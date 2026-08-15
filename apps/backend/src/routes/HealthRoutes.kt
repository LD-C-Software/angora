package cloud.angora.routes

import cloud.angora.constants.BackendConstants
import cloud.angora.service.HealthService
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.healthRoutes(healthService: HealthService) {
    get(BackendConstants.Routes.HEALTH_PATH) {
        val healthStatus = healthService.getHealthStatus()
        call.respond(healthStatus)
    }
}

