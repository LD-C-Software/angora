# Frontend

React web application, served by nginx in production.

- **Framework**: React 19, TypeScript 7
- **Bundler**: Vite 8
- **Config**: TypeScript/ESLint/Vite configs are extended from [`@crm/config`](../../packages/config/README.md), the shared config package

See the [root README](../../README.md) for the one-command `docker-compose up --build` quickstart and repo-wide concerns (environment variables, CI, dependency guardrails).

## Running

**Via Docker** (from the repo root): `docker-compose up --build frontend` — production build, served by nginx.

**Locally**, for hot-reloading dev server: with a backend reachable at `http://localhost:8080` (either `docker-compose up -d postgres backend` from the repo root, or running the backend locally per its own README), run:

```bash
cd apps/frontend
pnpm dev
```

This serves the app at [http://localhost:3000](http://localhost:3000) and proxies `/api` requests to `http://localhost:8080`.

## Commands

| Command                                          | What it does                                              |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `pnpm run lint`                                   | ESLint                                                        |
| `pnpm run typecheck`                              | `tsc --noEmit`                                                |
| `pnpm --filter crm-frontend exec tsc --noEmit -p tsconfig.node.json` | Second typecheck pass, needed because the default `typecheck` script doesn't cover `tsconfig.node.json` |
| `pnpm run test`                                   | Vitest — currently just a placeholder smoke test, see the root README's [Limitations](../../README.md#limitations) |
| `pnpm run build`                                  | Production build via Vite (`dist/`)                          |

Run these from `apps/frontend/`, or from the repo root as `pnpm --filter crm-frontend run <script>`.

## Notes

- **Vite root is `src/`**: `vite.config.ts` sets `root: 'src'` and `build.outDir: '../dist'` because `index.html` lives in `src/`, not the project root. Its script tag references `/main.tsx` (relative to that root), not `/src/main.tsx`.
- **Path aliases**: TypeScript 7 dropped `baseUrl`, so `"paths": {"@/*": ["./src/*"]}` is set with no `baseUrl`.
- **API proxy**: `/api` requests are proxied to the backend — via `vite.config.ts` (`http://localhost:8080`) in the local dev server, via `nginx.conf` (`http://backend:8080`) in the production container.
