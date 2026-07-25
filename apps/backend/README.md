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

**Locally, with hot reload** (recommended for development):

```bash
# Start just the database in Docker, publishing 5432 to the host
docker-compose up -d postgres   # from the repo root

cd apps/backend
mvn compile exec:java
```

Or from the repo root, without `cd`-ing in: `pnpm run dev:backend` — same command, just a shortcut.

No env vars needed — `DB_URL` defaults to `localhost:5432` when nothing overrides it. See "Database access" below for exactly how that works.

This runs via Ktor's `EngineMain` in development mode (`-Dio.ktor.development=true`, set by `exec-maven-plugin` in `pom.xml`). Server config — port, host, which module to load, and the database connection — all live in `src/main/resources/application.yaml`, not in `Application.kt`. Must be `.yaml`, not `.yml` — see Troubleshooting.

Once it's up, edits to `.kt` files take effect on the *next request* as soon as they're recompiled — no restart of the running server needed:

```bash
mvn compile
```

To trigger that automatically on save instead of running it by hand: enable "Build project automatically" in IntelliJ, or use a file watcher —

```bash
sudo apt install entr   # one-time
find src -name '*.kt' | entr -r mvn -q compile
```

Caveats: only route/module logic reloads cleanly this way. Top-level `val`s (like the `database` connection) get reinitialized on every reload since they live in the same reloaded class. Changes to `main()` itself, or new dependencies, still need you to stop and re-run `mvn compile exec:java`.

**Locally, packaged jar** (closer to how Docker actually runs it):

```bash
docker-compose up -d postgres   # from the repo root

cd apps/backend
mvn clean package -DskipTests    # requires JDK 25
java -jar target/backend.jar
```

## Testing

```bash
mvn test
```

There are no tests yet (`src/test` doesn't exist) — this currently passes vacuously ("No tests to run"). See the root README's [Limitations](../../README.md#limitations) section.

To add the first one: create `src/test/kotlin/...`, add a test dependency to `pom.xml` (JUnit 5 or Kotest are the usual choices for Kotlin), and `mvn test` will pick it up automatically via the default `maven-surefire-plugin` binding — no extra plugin configuration needed. Run `node scripts/check-dependency-age.ts` after adding the dependency (see the repo-wide [Dependency Pinning & Guardrails](../../AGENTS.md#dependency-pinning--guardrails)).

## API Endpoints

| Method | Endpoint       | Description                          | Response                                    |
| ------ | -------------- | ------------------------------------- | -------------------------------------------- |
| GET    | `/api/health`  | Health check with database connectivity | `{"status": "ok", "database": "connected"}` |

Test it: `curl http://localhost:8080/api/health`

## Database access

The backend connects via Exposed, reading the connection details from Ktor's config (`environment.config`) rather than `System.getenv()` directly:

```kotlin
val database = Database.connect(
    url = environment.config.property("database.url").getString(),
    driver = "org.postgresql.Driver",
    user = environment.config.property("database.user").getString(),
    password = environment.config.property("database.password").getString()
)
```

All config — including the database block — lives in the one `application.yaml`:

```yaml
database:
  url: "${DB_URL:jdbc:postgresql://localhost:5432/crm}"
  user: "${DB_USER:crm}"
  password: "${DB_PASSWORD:crm}"
```

`${VAR:default}` is Ktor's own environment-variable substitution (no extra library). The rule is always the same, everywhere this file is read: **if a real `DB_URL`/`DB_USER`/`DB_PASSWORD` environment variable is set, use it; otherwise fall back to the literal default shown.** There's no per-environment file and no `-config=` flag to remember — the same `application.yaml` produces different actual values only because different launch contexts set different real env vars:

| Context | Real env vars set? | Resolved `DB_URL` |
| --- | --- | --- |
| Local (`mvn compile exec:java` / bare `java -jar`) | No | Falls through to the default: `localhost:5432` |
| `docker-compose up` (dev) | Yes — `docker-compose.yml` sets `DB_URL=postgres:5432` explicitly | `postgres:5432` (from the env var, overriding the default) |
| `docker-compose --env-file .env.production up` | Yes — same `docker-compose.yml`, but `POSTGRES_PASSWORD` (etc.) now comes from `.env.production` | `postgres:5432`, with the production password |

The last two rows use the exact same `application.yaml` and the exact same Docker image — the dev/production split happens entirely at the `docker-compose`/`.env` layer (see the root README), one level above this file. `application.yaml` never needs to know which one it's in; it just reads whatever's in its environment.

### Environment variables

| Variable      | Default                                    | Notes                                                                                     |
| -------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `DB_URL`      | `jdbc:postgresql://localhost:5432/crm`     | Docker Compose overrides this to `postgres:5432` for the containerized backend |
| `DB_USER`     | `crm`                                       |                                                                                                |
| `DB_PASSWORD` | `crm`                                       |                                                                                                |

In Docker Compose these are set from `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD` — see the root README's [Environment Variables](../../README.md#environment-variables) section. That's also where the actual dev-vs-production credential split happens (`.env` vs `.env.production`) — this module doesn't participate in that choice at all, it just reads whatever ends up in its environment.

None of this is read directly via `System.getenv()` in Kotlin — `Application.kt` only ever reads `environment.config.property(...)`, which resolves through the substitution above.

## Troubleshooting

**Maven build fails**: check the JDK version in `Dockerfile` matches the Kotlin version; verify dependency versions are compatible; check Maven Central for latest versions.

**A `dependency-reduced-pom.xml` file appears in `apps/backend/` after building**: this is a normal byproduct of the Maven Shade Plugin (used to build `target/backend.jar`) — it's gitignored, safe to ignore.

**`java -jar target/backend.jar` fails with "Neither port nor sslPort specified"**: `application.yaml` isn't being found. Two known causes, both already fixed in this repo but worth knowing if they resurface: (1) the file must be named `application.yaml`, not `application.yml` — Ktor's automatic config-file discovery only recognizes the former in a packaged jar (`.yml` happens to work under `mvn compile exec:java`'s raw classpath, which masks the problem in dev); (2) `maven-shade-plugin` must include a `ServicesResourceTransformer` — without it, only one of the two `META-INF/services/io.ktor.server.config.ConfigLoader` providers (HOCON's and YAML's, contributed by different dependency jars) survives shading, silently dropping the other.

**Ktor dependency added but nothing works**: double check it uses the `-jvm`-suffixed artifact coordinate (e.g. `ktor-server-config-yaml-jvm`, not `ktor-server-config-yaml`) — see the note in the AGENTS.md file for this module. The non-suffixed coordinate for Kotlin-multiplatform Ktor modules resolves under plain Maven to a metadata-only stub with zero real classes; it fails silently rather than erroring, which makes this easy to miss.

**Backend won't start**:

- Check PostgreSQL is healthy: `docker-compose logs postgres`
- Verify the database connection: `docker-compose logs backend`
- Test manually: `curl http://localhost:8080/api/health`
- Make sure `DB_URL` uses `postgres` as the hostname (not `localhost`) when running inside Docker
