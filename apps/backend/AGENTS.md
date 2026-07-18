# AI Agent Guidelines — Backend

Scoped to `apps/backend/`. See the [root AGENTS.md](../../AGENTS.md) for repo-wide rules (general rules, testing commands, dependency guardrails, CI).

- **Language**: Kotlin 2.4.0
- **Framework**: KTor 3.5.1
- **ORM**: Exposed 1.3.1 — imports are `org.jetbrains.exposed.v1.jdbc.*`, **not** the pre-1.0 `org.jetbrains.exposed.sql.*` paths shown in older tutorials/blog posts
- **Build**: Maven with JDK 25
- **Dependencies**: Use the `-jvm` suffix for all KTor artifacts

## Allowed changes

- `src/Application.kt` — KTor routes and business logic
- `pom.xml` — Dependencies and plugins
- `Dockerfile`, `.dockerignore` — Container configuration

## Forbidden changes

- Don't remove the health endpoint (`/api/health`)
- Don't change port 8080 without updating `docker-compose.yml`
- Don't remove Exposed ORM unless explicitly requested

## Common tasks

### Add a new API endpoint

1. Edit `apps/backend/src/Application.kt`
2. Add the route inside the `routing { }` block
3. Use Exposed for database operations
4. Test with `docker-compose up --build backend`

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
