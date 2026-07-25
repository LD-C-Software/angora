# AI Agent Guidelines — Backend

Scoped to `apps/backend/`. See the [root AGENTS.md](../../AGENTS.md) for repo-wide rules (general rules, testing commands, dependency guardrails, CI).

- **Language**: Kotlin 2.4.0
- **Framework**: KTor 3.5.1
- **ORM**: Exposed 1.3.1 — imports are `org.jetbrains.exposed.v1.jdbc.*`, **not** the pre-1.0 `org.jetbrains.exposed.sql.*` paths shown in older tutorials/blog posts
- **Build**: Maven with JDK 25
- **Dependencies**: Use the `-jvm` suffix for all KTor artifacts — the non-suffixed coordinate for a Kotlin-multiplatform Ktor module resolves under plain Maven to a metadata-only stub with zero real classes. It compiles fine and fails silently/confusingly at runtime, so this is easy to get wrong and hard to notice.
- **Config**: `src/main/resources/application.yaml` (must be `.yaml`, not `.yml` — Ktor's packaged-jar config auto-discovery doesn't recognize `.yml`) holds Ktor's own deployment/module config *and* the `database.*` block (`DB_URL`/`DB_USER`/`DB_PASSWORD`, each `${VAR:default}`-substituted against real env vars, no separate per-environment file). `Application.kt` reads it via `environment.config.property(...)`, not `System.getenv()` directly.

## Allowed changes

- `src/Application.kt` — KTor routes and business logic
- `src/main/resources/application.yaml` — Ktor deployment config and database connection settings
- `pom.xml` — Dependencies and plugins
- `Dockerfile`, `.dockerignore` — Container configuration

## Forbidden changes

- Don't remove the health endpoint (`/api/health`)
- Don't change the port without updating both `application.yaml`'s `ktor.deployment.port` and `docker-compose.yml` — it's not hardcoded in `Application.kt` anymore
- Don't remove Exposed ORM unless explicitly requested
- If `maven-shade-plugin`'s config changes, keep the `ServicesResourceTransformer` — without it, only one of the two `META-INF/services/io.ktor.server.config.ConfigLoader` providers (HOCON's, from `ktor-server-core-jvm`, and YAML's, from `ktor-server-config-yaml-jvm`) survives shading into `target/backend.jar`, silently breaking config loading in the packaged jar (though not under `mvn exec:java`, which masks it)

## Common tasks

### Add a new API endpoint

1. Edit `apps/backend/src/Application.kt`
2. Add the route inside the `routing { }` block
3. Use Exposed for database operations
4. Test with `docker-compose up --build backend`, or faster: `pnpm run dev:backend` (or `mvn compile exec:java` from `apps/backend/`) against `docker-compose up -d postgres` — hot-reloads on `mvn compile`, no restart needed. See `apps/backend/README.md`'s "Locally, with hot reload" section.

## Dependencies

Maven has no automatic supply-chain age gate (unlike the pnpm side). After adding or bumping any dependency/plugin in `pom.xml`, run the audit script from the repo root before considering the task done:

```bash
node scripts/check-dependency-age.ts
# or: pnpm run check:dep-age
```

If it reports a violation, pick an older version of that artifact — check the real publish date via `curl -sI https://repo1.maven.org/maven2/<group-path>/<artifact>/<version>/<artifact>-<version>.pom | grep -i last-modified` (Maven Central's Solr search index lags/misses recent releases, so don't trust `search.maven.org` for this). See the root AGENTS.md's [Dependency Pinning & Guardrails](../../AGENTS.md#dependency-pinning--guardrails) for the full policy.

## Troubleshooting

- **Maven build fails**: check the JDK version in `Dockerfile` matches the Kotlin version; verify dependency versions are compatible; check Maven Central for latest versions.
- **Database connection fails**: verify PostgreSQL is running (`docker ps`), check `docker-compose logs postgres`, ensure `DB_URL` uses `postgres` as hostname (not `localhost`) inside Docker.
- **`java -jar target/backend.jar` fails with "Neither port nor sslPort specified"**: `application.yaml` isn't being found — see `apps/backend/README.md`'s Troubleshooting section for the two known causes (wrong file extension, missing shade-plugin transformer) and how they were fixed here.
