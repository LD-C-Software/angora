# AI Agent Guidelines — Frontend

Scoped to `apps/frontend/`. See the [root AGENTS.md](../../AGENTS.md) for repo-wide rules, and [`packages/config/AGENTS.md`](../../packages/config/AGENTS.md) for the shared TypeScript/ESLint/Vite config this app consumes.

- **Framework**: React 19 + TypeScript 7 + Vite 8
- **Build**: pnpm + Node.js 24
- **Serve**: nginx:alpine on port 3000
- **Vite root is `src/`**: `vite.config.ts` sets `root: 'src'` and `build.outDir: '../dist'` because `index.html` lives in `src/`, not the project root. Its script tag references `/main.tsx` (relative to that root), not `/src/main.tsx`. Don't change the root without updating both.
- **TypeScript 7 dropped `baseUrl`**: path aliases use `"paths": {"@/*": ["./src/*"]}` with no `baseUrl`.
- **`tsconfig.json`/`tsconfig.node.json`, `eslint.config.mjs`, and `vite.config.ts` all pull from `@angora/config`** — don't inline rules/compiler options that duplicate what the shared base already sets. `vite.config.ts` imports `@angora/config/vite/base` with **no extension** — `tsconfig.node.json` has `composite: true`, which is incompatible with the `noEmit`/`allowImportingTsExtensions` combo that an explicit `.ts` extension would need.
- **`Dockerfile` builds from the repo root**, not `apps/frontend/` — see [`packages/config/AGENTS.md`](../../packages/config/AGENTS.md) before editing it.

## Allowed changes

- `src/main.tsx` — React components
- `vite.config.ts` — Vite configuration (the app-specific object merged on top of the shared base)
- `eslint.config.mjs` — Only if adding app-specific overrides on top of `@angora/config/eslint/react.mjs`; put reusable rules in the shared package instead
- `package.json` — Dependencies (check the license of anything new — see the root AGENTS.md's [Licensing](../../AGENTS.md#licensing) section)
- `Dockerfile` — Container configuration

## Forbidden changes

- Don't change port 3000
- Don't break the API proxy to `/api`
- Don't remove `nginx.conf`

## Verification

After changes, run from the repo root (or `apps/frontend/` without `--filter angora-frontend`):

```bash
pnpm install
pnpm --filter angora-frontend run lint
pnpm --filter angora-frontend exec tsc --noEmit
pnpm --filter angora-frontend exec tsc --noEmit -p tsconfig.node.json
pnpm --filter angora-frontend run test
pnpm run format:check
```

## Troubleshooting

**Frontend can't reach backend**: verify the backend is running (`docker ps`), check the nginx proxy config in the frontend Dockerfile, test the backend directly with `curl http://localhost:8080/api/health`.
