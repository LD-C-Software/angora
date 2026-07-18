# AI Agent Guidelines for CRM/Support Monorepo

This document provides instructions and constraints for AI agents (like Mistral Vibe) working with this project.

## Project Overview

This is a **self-hosted CRM/Support System** starter monorepo with the following architecture:

- **Backend**: KTor 3.5.1 + Kotlin 2.4.0 + Exposed ORM 1.3.1 + PostgreSQL 18
- **Frontend**: React 19 + TypeScript 7 + Vite 8
- **Bots**: Node.js 24+ + TypeScript 7 (Slack, Discord, Email)
- **Containerization**: Docker + Docker Compose

All components run in Docker containers and the entire stack starts with:
```bash
docker-compose up --build
```

## Agent Instructions

### General Rules

1. **Always use Docker**: Never assume host tools (JDK, Node.js, pnpm, Maven) are installed. All development and testing must happen inside containers.

2. **Read before editing**: Never edit a file without reading it first in the current session.

3. **Minimal changes**: Only modify files explicitly requested or necessary to fulfill the task. Don't touch unrelated files.

4. **Verify with Docker**: After any changes, validate with:
   ```bash
   docker-compose build
   docker-compose up --build
   ```

### File Modification Rules

#### Backend (`apps/backend/`)
- **Language**: Kotlin 2.4.0
- **Framework**: KTor 3.5.1
- **ORM**: Exposed 1.3.1 — imports are `org.jetbrains.exposed.v1.jdbc.*`, **not** the pre-1.0 `org.jetbrains.exposed.sql.*` paths shown in older tutorials/blog posts
- **Build**: Maven with JDK 25
- **Dependencies**: Use `-jvm` suffix for all KTor artifacts

**Allowed Changes**:
- `src/Application.kt` - KTor routes and business logic
- `pom.xml` - Dependencies and plugins
- `Dockerfile`, `.dockerignore` - Container configuration

**Forbidden Changes**:
- Don't remove health endpoint (`/api/health`)
- Don't change port 8080 without updating docker-compose.yml
- Don't remove Exposed ORM unless explicitly requested

#### Frontend (`apps/frontend/`)
- **Framework**: React 19 + TypeScript 7 + Vite 8
- **Build**: pnpm + Node.js 24
- **Serve**: nginx:alpine on port 3000
- **Vite root is `src/`**: `vite.config.ts` sets `root: 'src'` and `build.outDir: '../dist'` because `index.html` lives in `src/`, not the project root. Its script tag references `/main.tsx` (relative to that root), not `/src/main.tsx`. Don't change the root without updating both.
- **TypeScript 7 dropped `baseUrl`**: path aliases use `"paths": {"@/*": ["./src/*"]}` with no `baseUrl`.
- **`tsconfig.json`/`tsconfig.node.json`, `eslint.config.mjs`, and `vite.config.ts` all pull from `@crm/config`** (see Shared Tooling Configs below) — don't inline rules/compiler options that duplicate what the shared base already sets. `vite.config.ts` imports `@crm/config/vite/base` with **no extension** — `tsconfig.node.json` has `composite: true`, which is incompatible with the `noEmit`/`allowImportingTsExtensions` combo that an explicit `.ts` extension would need.
- **`Dockerfile` builds from the repo root**, not `apps/frontend/` — see Shared Tooling Configs before editing it.

**Allowed Changes**:
- `src/main.tsx` - React components
- `vite.config.ts` - Vite configuration (the app-specific object merged on top of the shared base)
- `eslint.config.mjs` - Only if adding app-specific overrides on top of `@crm/config/eslint/react.mjs`; put reusable rules in the shared package instead
- `package.json` - Dependencies
- `Dockerfile` - Container configuration

**Forbidden Changes**:
- Don't change port 3000
- Don't break API proxy to `/api`
- Don't remove nginx.conf

#### Bots (`apps/bots/*/`)
- **Runtime**: Node.js 24+ + TypeScript 7
- **Build**: pnpm + tsc
- **Module resolution**: `moduleResolution: "nodenext"` (TypeScript 7 removed the old `"node"`/node10 resolution mode); keep `module` set to `"nodenext"` too since they must match.
- **`tsconfig.json` and `eslint.config.mjs` pull from `@crm/config`** — see Shared Tooling Configs below.
- **`Dockerfile` builds from the repo root**, not the bot's own directory.

**Allowed Changes**:
- `src/index.ts` - Bot logic
- `package.json` - Dependencies
- `Dockerfile` - Container configuration

**Forbidden Changes**:
- Don't change start command (`node dist/index.js`)
- Don't remove TypeScript type: module

#### Shared config (`packages/config/`, package name `@crm/config`)
- Single source of truth for TypeScript, ESLint, Prettier, and Vite configuration, consumed by `apps/frontend` and all three bots via `"@crm/config": "workspace:*"`.
- **If a rule/compiler-option/format-setting should apply to more than one package, it belongs here — not copy-pasted into each app.**
- `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`'s exact export shapes are version-sensitive and have changed between releases (e.g., `reactRefresh.configs.vite` is a plain object in the pinned version, not a factory function — don't assume the shape from a README or an older version; check `node --input-type=module -e "import p from '<pkg>'; console.log(p.configs)"` from inside `packages/config` after any version bump).
- Prettier is intentionally **not** per-package: `prettier.config.ts` at the repo root re-exports `@crm/config/prettier/index.ts`, and that's the only Prettier config in the repo.
- **`typescript/`, `prettier/`, `vite/` are `.ts`/`.json`; `eslint/` is deliberately plain `.mjs` — do not convert it.** Loading a `.ts` ESLint flat config works mechanically (via an extra `jiti` devDependency), but `typescript-eslint` (every 8.x version, checked) crashes immediately on import against the pinned TypeScript 7 — its code does `ts.Extension.Cjs` at module-load time, and TypeScript 7's Go-rewritten package doesn't export `Extension` the same way anymore. This isn't a lint-time-only failure or a peer-range nitpick; it's an unconditional crash the moment `typescript-eslint` is imported. If you're tempted to convert `eslint/*.mjs` to `.ts` for consistency, don't — confirmed broken as of typescript-eslint 8.64.0 (the newest version available when this was diagnosed).
- **This is also why `packages/config/package.json` pins `"typescript": "5.9.3"` directly instead of `"typescript": "catalog:"`** (which would resolve to the repo's TypeScript 7). pnpm's peer-dependency resolution is per-consumer: because only `packages/config` declares this older TypeScript, `typescript-eslint`'s peer resolves to 5.9.3 *only inside `packages/config`'s own dependency graph*, while `apps/frontend`/the bots' own `tsc`/`vite build` still use the real TypeScript 7 from the catalog. Don't change this pin to `catalog:` — that reintroduces the crash. If a future `typescript-eslint` release adds real TypeScript 7 support, this pin can be removed and reset to `catalog:`.

**Allowed Changes**:
- Anything under `typescript/`, `eslint/` (as plain `.mjs`, see above), `prettier/`, `vite/`
- `package.json` - Dependencies (keep entries pointed at `catalog:` where the version is also used elsewhere, **except** the intentional `typescript: 5.9.3` pin above)

**Forbidden Changes**:
- Don't add `exports` restrictions to `package.json` that would break the deep imports (`@crm/config/eslint/react.mjs`, etc.) apps already use
- Don't convert `eslint/base.mjs`, `eslint/react.mjs`, or `eslint/node.mjs` to `.ts`, and don't add `jiti` as a dependency anywhere in the repo (see above)

#### Infrastructure Files
- **`docker-compose.yml`**: Service orchestration. `frontend`, `slack-bot`, `discord-bot`, `email-bot` build with `context: .` (repo root) + an explicit `dockerfile:` path — required so their builds can see `packages/config`. Only `backend` still uses `context: ./apps/backend`. Don't revert the four to a per-app context; that would break `@crm/config` resolution inside the image. Database credentials and host ports are `${VAR:-default}` interpolations reading from `.env` — see Environment Variables below.
- **`pnpm-workspace.yaml`**: Workspace packages (including `packages/config`), the shared version `catalog:`, and the `minimumReleaseAge` supply-chain policy — see Dependency Pinning & Guardrails below before touching this file
- **`package.json`** (repo root): `packageManager` pin, the `check:dep-age`/`lint`/`format`/`format:check` scripts, and `prettier` + `@crm/config` as devDependencies (needed for `prettier.config.ts` to resolve); not a workspace package itself
- **`prettier.config.ts`** / **`.prettierignore`** (repo root): The one Prettier config for the whole repo — don't add per-package Prettier configs
- **`.dockerignore`** (repo root): Used by the four root-context builds above; `apps/backend/.dockerignore` is separate and still used by backend's own context
- **`.env.example`** / **`.env.production.example`** (repo root): Templates for `.env`/`.env.production`, which are gitignored. Keep these in sync with whatever variables `docker-compose.yml` actually reads — if you add a new `${VAR:-default}` to docker-compose.yml, add the variable (with its default) to `.env.example` too, and to `.env.production.example` if it's something a real deployment should set explicitly (e.g. a password).
- **`scripts/check-dependency-age.ts`**: Maven + npm dependency-age audit; keep it in sync if `pom.xml`'s structure or the catalog format changes. It reads every `package.json` in the workspace (root, `packages/config`, `apps/frontend`, each bot) — add new manifests to its `manifests` list if you add a new workspace package. Runs directly via `node scripts/check-dependency-age.ts` — Node 24 executes `.ts` natively, no build step or `ts-node` needed.
- **`.gitignore`**: Standard ignore patterns. Do not add a bare `Dockerfile` entry — that previously matched every file named `Dockerfile` in the repo and silently kept all five of them out of git history. The `.env` block uses `.env` / `.env.*` with `!.env.example` / `!.env.*.example` negations — if you add a new env file pattern, make sure real files stay ignored and `.example` templates stay tracked.
- **`README.md`**: Documentation only

### Environment Variables

`docker-compose.yml` sources its configurable values from environment variables, each with a `:-default` fallback matching the original hardcoded values — so `docker-compose up --build` still works with zero setup even if no `.env` file exists. The variables: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`. `.env.example` documents all of them; `.env.production.example` is the same set with a placeholder password that must be replaced.

- `.env` is auto-loaded by docker-compose from the project root (local dev, optional).
- `.env.production` is **not** auto-loaded — it must be passed explicitly with `docker-compose --env-file .env.production up -d --build`. That's intentional: a production run should never happen by accident.
- Both are gitignored; only the `.example` templates are tracked. If you add a new configurable value to docker-compose.yml, add it to both `.example` files too (see Infrastructure Files above).

The following environment variables are available in the backend container itself (set by docker-compose from the `POSTGRES_*` values above, or directly when running the backend locally — see README's Development section):

```
DB_URL=jdbc:postgresql://postgres:5432/crm
DB_USER=crm
DB_PASSWORD=crm
```

**Important**: When accessing services from within the Docker network, use the service name as hostname:
- `postgres:5432` for PostgreSQL
- `backend:8080` for the KTor backend
- `frontend:3000` for the React app

Do NOT use `localhost` or `127.0.0.1` for inter-service communication.

### Database Access

The backend uses Exposed ORM to connect to PostgreSQL:

```kotlin
import org.jetbrains.exposed.v1.jdbc.Database

val database = Database.connect(
    url = System.getenv("DB_URL") ?: "jdbc:postgresql://postgres:5432/crm",
    driver = "org.postgresql.Driver",
    user = System.getenv("DB_USER") ?: "crm",
    password = System.getenv("DB_PASSWORD") ?: "crm"
)
```

### API Communication

- Frontend → Backend: Use relative path `/api/...` (proxied via nginx)
- Bot → Backend: Use `http://backend:8080/...` (Docker network DNS)
- External → Backend: Use `http://localhost:8080/...`

### Testing Commands

After making changes, always verify with:

```bash
# Full stack test
docker-compose down
docker-compose up --build

# Check containers
docker ps

# Test backend health
curl http://localhost:8080/api/health

# Test frontend
curl http://localhost:3000

# View logs
docker-compose logs -f backend
```

For frontend/bot changes, also run before considering the task done:

```bash
pnpm install                 # from repo root; re-verifies the age guardrail too
pnpm --filter <pkg> run lint
pnpm --filter <pkg> exec tsc --noEmit   # frontend: also run against tsconfig.node.json
pnpm run format:check        # from repo root; `pnpm run format` to fix
pnpm run test                # from repo root; runs Vitest across frontend + all 3 bots
```

### CI, hooks, and branch protection

- **Pre-commit** (`.husky/pre-commit`): runs `pnpm run lint` + `pnpm run format:check` on every commit, check-only (no auto-fix). Set up automatically by `pnpm install` via the root `prepare` script.
- **Pre-push** (`.husky/pre-push`): blocks `git push` directly to `main` from any machine with hooks installed — a **soft, local-only stand-in for real branch protection**, not a security boundary (bypassable with `--no-verify` or a push from an unhooked clone). This exists because real GitHub branch protection / rulesets are unavailable on this repo: it's private on a plan that gates that feature behind "upgrade to GitHub Pro or make this repository public" (confirmed via `gh api repos/.../branches/main/protection`). **Once the repo goes public or the org is on a plan that supports it, set up real branch protection requiring the `backend`, `frontend-bots`, and `guardrails` status checks, and delete `.husky/pre-push`.**
- **CI** (`.github/workflows/ci.yml`): runs on every PR and every push to `main` — `backend` (`mvn test`), `frontend-bots` (lint, format:check, typecheck, test, build), `guardrails` (`check:dep-age`). All third-party Actions are pinned to commit SHA, not floating tags.
- **Deploy** (`.github/workflows/deploy.yml`): manual `workflow_dispatch` only, with TODO placeholder steps — intentionally inert until a real deploy target exists. Don't change its trigger to run automatically without filling in the real steps first.
- Since `main` isn't push-protected server-side, treat the pre-push hook as the only thing stopping an accidental direct push — don't work around it without good reason, and don't remove it without replacing it with real branch protection.

### Success Criteria

A task is complete when:
1. ✅ All relevant tests pass (Docker build succeeds)
2. ✅ The code runs and produces expected output
3. ✅ User's explicit acceptance criterion is met
4. ✅ No new warnings or errors in logs

## Version Constraints

| Component | Version | Notes |
|-----------|---------|-------|
| Kotlin | 2.4.0 | Newest version that clears the 7-day age guardrail (2.4.10 is newer but too recent); required for KTor 3.5.1 + Exposed 1.3.1 |
| KTor | 3.5.1 | Latest stable |
| Exposed | 1.3.1 | Latest stable; post-1.0 `org.jetbrains.exposed.v1.*` package layout |
| PostgreSQL JDBC | 42.7.13 | Latest stable |
| PostgreSQL (server) | 18.x | `docker-compose.yml` uses `postgres:18-alpine`; volume mounts at `/var/lib/postgresql`, not `/var/lib/postgresql/data` |
| Node.js | 24.x | Active LTS; used for frontend and bots |
| React | 19.x | Latest stable |
| TypeScript | 7.x | Latest stable (Go-based compiler); dropped `baseUrl` and `moduleResolution: "node"` |
| Vite | 8.x | Latest stable, for frontend |
| ESLint | 10.x | Flat config (`eslint.config.mjs`) only, no legacy `.eslintrc`; the config files stay `.mjs`, not `.ts` — see Shared Tooling Configs |
| typescript-eslint | 8.63.0 | Not just "peer range caps under TS 7" — it hard-crashes on import against TypeScript 7 (confirmed through 8.64.0, the newest available). `packages/config` works around this with its own isolated `typescript@5.9.3` pin; see Shared Tooling Configs. Don't bump this without re-verifying against whatever TypeScript is pinned at the time |
| Prettier | 3.x | One config for the whole repo (`.ts`), see Shared Tooling Configs |
| jiti | — | **Not a dependency anywhere in this repo, intentionally.** It's what ESLint would need to load a `.ts` flat config, and installing it is what surfaced the typescript-eslint crash above. Don't add it back as a way to convert `eslint.config.mjs` to `.ts`. |
| Docker | Latest | Container runtime |

## Dependency Pinning & Guardrails

1. **Always pin exact versions.** No `^`/`~`/range prefixes in any `package.json`. No version ranges or `LATEST`/`RELEASE` in `pom.xml`. If you add a dependency, write the specific version you resolved, not a range.

2. **Shared JS/TS versions live in the pnpm catalog, not in each `package.json`.** `pnpm-workspace.yaml` has a `catalog:` block; `typescript` (used by the frontend and all three bots) is defined there once and referenced as `"typescript": "catalog:"`. If you add a new dependency that's used by more than one package in `apps/`, add it to the catalog instead of pinning the same version four times. The backend is a single Maven module, so this doesn't apply there — its versions live directly in `apps/backend/pom.xml`.

3. **A 7-day minimum release age is enforced — don't work around it.** `pnpm-workspace.yaml` sets `minimumReleaseAge: 10080` (minutes) with `minimumReleaseAgeStrict: true`, so `pnpm install`/`pnpm add` will hard-fail if a resolved version (direct or transitive) was published in the last 7 days. **This is expected behavior, not a bug**: if you hit `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, pin the dependency to the next older version instead of lowering/removing `minimumReleaseAge`. Never edit `minimumReleaseAge`, `minimumReleaseAgeStrict`, or add entries to `minimumReleaseAgeExclude` to make a failing install pass, unless the user explicitly asks you to change the policy itself.

4. **Maven has no equivalent automatic gate**, so after editing `apps/backend/pom.xml` (adding or bumping any dependency or plugin), run the audit script before considering the task done:

   ```bash
   node scripts/check-dependency-age.ts
   # or: pnpm run check:dep-age
   ```

   It also cross-checks the npm side as a second line of defense. If it reports a violation, pick an older version of that artifact (check the real publish date via `curl -sI https://repo1.maven.org/maven2/<group-path>/<artifact>/<version>/<artifact>-<version>.pom | grep -i last-modified` — Maven Central's Solr search index lags/misses recent releases, so don't trust `search.maven.org` for this).

## Shared Tooling Configs

TypeScript, ESLint, Prettier, and Vite configuration for `apps/frontend` and the three bots all come from `packages/config` (`@crm/config`), a private workspace package — not from `apps/backend`, which has no JS/TS tooling at all.

1. **Don't inline a rule/option in an app when the shared base already covers it, or could reasonably cover it for more than one package.** Add it to `packages/config` instead: `typescript/base.json` (or `react-app.json`/`node.json`), `eslint/base.mjs` (or `react.mjs`/`node.mjs`), `prettier/index.ts`, or `vite/base.ts`. Each app's own `tsconfig.json`/`eslint.config.mjs`/`vite.config.ts` should only contain what's genuinely specific to that app (ports, proxy targets, `outDir`, etc.).

2. **Prettier has exactly one config in the whole repo**: `prettier.config.ts` at the root, which re-exports `@crm/config/prettier/index.ts`. Never add a per-package Prettier config or a second `prettier.config.*` file.

3. **A new app that needs any of these tools must add `"@crm/config": "workspace:*"` as a devDependency**, plus its own direct `eslint`/`typescript`/`vite` devDependency (pnpm's strict `node_modules` means depending on `@crm/config` alone does not put those binaries on that package's `PATH` — only the config *content* is shared, the CLI tools are not).

4. **The four JS/TS Dockerfiles (frontend + 3 bots) build from the repo root, not their own directory**, specifically so `tsc`/`vite build` running inside the image can resolve `@crm/config`. If you add a new Vite- or tsc-based service, its `docker-compose.yml` entry needs `context: .` + an explicit `dockerfile:` path (not `context: ./apps/<service>`), and its Dockerfile needs to `COPY` `pnpm-workspace.yaml`, the root `package.json`/`pnpm-lock.yaml`, `packages/config`, and its own `apps/<service>` directory before `pnpm install --frozen-lockfile`. Copy `apps/frontend` and `apps/bots` too even in a bot's Dockerfile — `pnpm install --frozen-lockfile` expects the on-disk package set to match every importer in the lockfile, not just the one you're building.

5. **Before assuming an ESLint plugin's config export shape** (e.g., whether `plugin.configs.foo` is a plain object or a factory function you need to call), check it empirically against the actually-installed version rather than trusting a README or a different version's source — this has already changed once between what was documented and what's on the registry for a package pinned here. From `packages/config`: `node --input-type=module -e "import p from '<pkg>'; console.log(p.configs)"`.

6. **`eslint/*.mjs` stays plain JS; everything else in `packages/config` is `.ts`.** Node runs `.ts` natively (used by `scripts/check-dependency-age.ts` and, via each tool's own loader, by Vite and Prettier) — but ESLint's flat config loader needs an extra `jiti` dependency to load a `.ts` config, and `jiti` + `typescript-eslint` + the pinned TypeScript 7 don't work together (see Version Constraints and the Shared config section above). Don't add `jiti` to try to convert the ESLint configs to TypeScript.

## Common Tasks

### Add a New API Endpoint

1. Edit `apps/backend/src/Application.kt`
2. Add route in the `routing { }` block
3. Use Exposed for database operations
4. Test with `docker-compose up --build backend`

### Add a New Bot

1. Create directory: `apps/bots/new-bot/`
2. Add `src/index.ts` with bot logic
3. Add `package.json` — `"typescript": "catalog:"`, `"eslint": "catalog:"`, `"@crm/config": "workspace:*"` as devDependencies, plus `build`/`start`/`lint` scripts (copy an existing bot's `package.json` as the template)
4. Add `tsconfig.json` that extends `@crm/config/typescript/node.json` and `eslint.config.mjs` that re-exports `@crm/config/eslint/node.mjs` (copy an existing bot's files — they're all identical except `outDir`/`rootDir`, which don't even vary)
5. Add `Dockerfile` for containerization — copy an existing bot's `Dockerfile` and update the two `apps/bots/<name>` path segments; it must build from the repo root context (see Shared Tooling Configs)
6. Add service to `docker-compose.yml` with `context: .` + `dockerfile: apps/bots/new-bot/Dockerfile` (not `context: ./apps/bots/new-bot`)
7. `pnpm-workspace.yaml`'s `apps/bots/**` glob already covers it — no change needed there unless the new bot needs its own catalog entry
8. Add the new `package.json` path to the `manifests` list in `scripts/check-dependency-age.ts`

### Update Dependencies

1. Edit `apps/backend/pom.xml` for backend, or the relevant `package.json` for frontend/bots — pin the exact new version, never a range
2. If the dependency is shared across frontend + bots, bump it once in the `catalog:` block of `pnpm-workspace.yaml` instead of each `package.json`
3. Use `-jvm` suffix for KTor artifacts
4. Verify versions are compatible
5. `pnpm install` — if it fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, pick an older version (see Dependency Pinning & Guardrails above), don't relax the policy
6. For backend changes, run `node scripts/check-dependency-age.ts` and fix any violation the same way
7. Test with Docker build

## Troubleshooting

### Maven Build Fails
- Check JDK version in Dockerfile matches Kotlin version
- Verify all dependency versions are compatible
- Check Maven Central for latest versions

### Database Connection Fails
- Verify PostgreSQL is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Ensure `DB_URL` uses `postgres` as hostname (not localhost)

### Frontend Can't Reach Backend
- Verify backend is running: `docker ps`
- Check nginx proxy config in frontend Dockerfile
- Test backend directly: `curl http://localhost:8080/api/health`

## Security Notes

- Never commit secrets to the repository
- Use environment variables for sensitive data
- Database credentials are in docker-compose.yml (for development only)
- For production, use proper secret management

## Style Guidelines

- Match existing code style
- Use Kotlin idiomatic patterns
- TypeScript: Use strict mode
- Docker: Use multi-stage builds where appropriate
- Documentation: Keep it concise and accurate

## Contact

For questions about this project's agent configuration, refer to the README.md or check the project structure.

---

*Last updated: July 18, 2026*
