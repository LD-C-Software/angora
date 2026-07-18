# Backend

KTor REST API backend with Exposed ORM, backed by PostgreSQL.

- **Language**: Kotlin 2.4.0
- **Framework**: KTor 3.5.1
- **ORM**: Exposed 1.3.1 — imports live under `org.jetbrains.exposed.v1.*` (the post-1.0 package layout, not the older `org.jetbrains.exposed.sql.*` paths shown in older tutorials)
- **Database**: PostgreSQL 18
- **Build**: Maven, JDK 25

See the [root README](../../README.md) for the one-command `docker-compose up --build` quickstart and repo-wide concerns (environment variables, CI, dependency guardrails).

## Running

**Via Docker** (from the repo root): `docker-compose up --build backend` — needs `postgres` running too; `docker-compose up --build postgres backend` starts both.

**Locally**, for a faster feedback loop:

```bash
# Start just the database in Docker, publishing 5432 to the host
docker-compose up -d postgres   # from the repo root

cd apps/backend
mvn clean package -DskipTests    # requires JDK 25
DB_URL=jdbc:postgresql://localhost:5432/crm java -jar target/backend.jar
```

## Testing

```bash
mvn test
```

There are no tests yet (`src/test` doesn't exist) — this currently passes vacuously ("No tests to run"). See the root README's [Limitations](../../README.md#limitations) section.

## API Endpoints

| Method | Endpoint       | Description                          | Response                                    |
| ------ | -------------- | ------------------------------------- | -------------------------------------------- |
| GET    | `/api/health`  | Health check with database connectivity | `{"status": "ok", "database": "connected"}` |

Test it: `curl http://localhost:8080/api/health`

## Database access

The backend connects via Exposed:

```kotlin
import org.jetbrains.exposed.v1.jdbc.Database

val database = Database.connect(
    url = System.getenv("DB_URL") ?: "jdbc:postgresql://postgres:5432/crm",
    driver = "org.postgresql.Driver",
    user = System.getenv("DB_USER") ?: "crm",
    password = System.getenv("DB_PASSWORD") ?: "crm"
)
```

### Environment variables

| Variable      | Default                                    | Notes                                                                                     |
| -------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `DB_URL`      | `jdbc:postgresql://postgres:5432/crm`      | `postgres` only resolves inside the Docker network — use `localhost` when running locally, see above |
| `DB_USER`     | `crm`                                       |                                                                                                |
| `DB_PASSWORD` | `crm`                                       |                                                                                                |

In Docker Compose these are set from `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD` — see the root README's [Environment Variables](../../README.md#environment-variables) section.

## Troubleshooting

**Maven build fails**: check the JDK version in `Dockerfile` matches the Kotlin version; verify dependency versions are compatible; check Maven Central for latest versions.

**Database connection fails**: verify PostgreSQL is running (`docker ps`), check `docker-compose logs postgres`, and make sure `DB_URL` uses `postgres` as the hostname (not `localhost`) when running inside Docker.
