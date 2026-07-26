# AI Agent Guidelines — Bots

Scoped to `apps/bots/*/` (slack, discord, email). All three are identical in structure — see the [root AGENTS.md](../../AGENTS.md) for repo-wide rules, and [`packages/config/AGENTS.md`](../../packages/config/AGENTS.md) for the shared TypeScript/ESLint config these consume.

- **Runtime**: Node.js 24+ + TypeScript 7
- **Build**: pnpm + `tsc`
- **Module resolution**: `moduleResolution: "nodenext"` (TypeScript 7 removed the old `"node"`/node10 resolution mode); keep `module` set to `"nodenext"` too since they must match.
- **`tsconfig.json` extends `@angora/config/typescript/node.json`; `eslint.config.mjs` re-exports `@angora/config/eslint/node.mjs`** — see `packages/config/AGENTS.md`.
- **`Dockerfile` builds from the repo root**, not the bot's own directory.
- **`tsconfig.json` excludes `src/**/*.test.ts`** from the compiled `dist/` output — the `build`/`start` scripts should never ship the placeholder Vitest test.

## Allowed changes

- `src/index.ts` — Bot logic
- `package.json` — Dependencies (check the license of anything new — see the root AGENTS.md's [Licensing](../../AGENTS.md#licensing) section)
- `Dockerfile` — Container configuration

## Forbidden changes

- Don't change the start command (`node dist/index.js`)
- Don't remove `"type": "module"`

## Common tasks

### Add a new bot

1. Create directory `apps/bots/new-bot/`
2. Add `src/index.ts` with bot logic
3. Add `package.json` — `"typescript": "catalog:"`, `"eslint": "catalog:"`, `"vitest": "catalog:"`, `"@angora/config": "workspace:*"` as devDependencies, plus `build`/`start`/`lint`/`test` scripts (copy an existing bot's `package.json` as the template)
4. Add `tsconfig.json` that extends `@angora/config/typescript/node.json`, excludes `src/**/*.test.ts`, and `eslint.config.mjs` that re-exports `@angora/config/eslint/node.mjs` (copy an existing bot's files — they're all identical except `outDir`/`rootDir`, which don't even vary)
5. Add a placeholder `src/placeholder.test.ts` (copy an existing bot's) so CI's test step has something to run
6. Add `Dockerfile` for containerization — copy an existing bot's `Dockerfile` and update the two `apps/bots/<name>` path segments; it must build from the repo root context (see `packages/config/AGENTS.md`)
7. Add the service to `docker-compose.yml` with `context: .` + `dockerfile: apps/bots/new-bot/Dockerfile` (not `context: ./apps/bots/new-bot`)
8. `pnpm-workspace.yaml`'s `apps/bots/**` glob already covers it — no change needed there unless the new bot needs its own catalog entry
9. Add the new `package.json` path to the `manifests` list in `scripts/check-dependency-age.ts`

## Verification

After changes, run from the repo root:

```bash
pnpm install
pnpm --filter <pkg> run lint
pnpm --filter <pkg> run build
pnpm --filter <pkg> run test
pnpm run format:check
```
