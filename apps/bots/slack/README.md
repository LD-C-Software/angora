# Slack bot

Slack integration bot (`crm-slack-bot`) — Node.js service that talks to the backend.

- **Runtime**: Node.js 24+, TypeScript 7
- **Config**: TypeScript/ESLint configs are extended from [`@crm/config`](../../../packages/config/README.md), the shared config package

See the [root README](../../../README.md) for the one-command `docker-compose up --build` quickstart and repo-wide concerns (environment variables, CI, dependency guardrails). See the [Discord bot](../discord/README.md) and [Email bot](../email/README.md) READMEs — same layout, same commands.

## Running

**Via Docker** (from the repo root): `docker-compose up --build slack-bot`

**Locally**:

```bash
cd apps/bots/slack
pnpm run build
pnpm run start
```

## Commands

| Command             | What it does                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm run lint`      | ESLint                                                                                                |
| `pnpm run build`     | `tsc` — compiles `src/` to `dist/` (also the typecheck step; excludes `*.test.ts` from the output)  |
| `pnpm run test`      | Vitest — currently just a placeholder smoke test, see the root README's [Limitations](../../../README.md#limitations) |
| `pnpm run start`     | `node dist/index.js`                                                                                 |

Run these from `apps/bots/slack/`, or from the repo root as `pnpm --filter crm-slack-bot run <script>`.

## Communicating with the backend

Inside Docker, use the service name as hostname: `http://backend:8080/...` (not `localhost`).
