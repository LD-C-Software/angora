# Build context is the repo root (see docker-compose.yml), not this
# directory, so the build can see the shared @crm/config workspace package
# that tsconfig.json / eslint.config.mjs extend.

FROM node:24-alpine AS build
WORKDIR /workspace
RUN npm install -g pnpm
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/config ./packages/config
COPY apps/frontend ./apps/frontend
COPY apps/bots ./apps/bots
RUN pnpm install --frozen-lockfile
WORKDIR /workspace/apps/bots/discord
RUN pnpm run build

# This bot has no runtime dependencies (empty "dependencies" in
# package.json), so the runtime image just needs the compiled output.
FROM node:24-alpine
WORKDIR /app
COPY --from=build /workspace/apps/bots/discord/dist ./dist
COPY --from=build /workspace/apps/bots/discord/package.json .
CMD ["node", "dist/index.js"]
