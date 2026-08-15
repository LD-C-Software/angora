package cloud.angora.repository

import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.transactions.transaction

interface HealthRepository {
    fun checkDatabaseConnection(): Boolean
}

class HealthRepositoryImpl(private val database: Database) : HealthRepository {
    override fun checkDatabaseConnection(): Boolean {
        return transaction(database) {
            exec("SELECT 1") { true } ?: true
        }
    }
}
