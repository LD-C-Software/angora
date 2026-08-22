import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { base } from '@angora/config/vite/base'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

// In CI/Docker builds .git isn't present in the build context (see
// .dockerignore), so the Dockerfile passes the real commit as a GIT_SHA
// build arg/env var instead. Locally (pnpm dev/build), fall back to asking
// git directly.
function resolveCommitHash(): string {
  if (process.env.GIT_SHA) return process.env.GIT_SHA
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig(
  mergeConfig(base, {
    root: 'src',
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        // 'backend' is the Docker Compose service name and only resolves
        // inside the Docker network (that's what nginx.conf uses in the
        // production container). `pnpm dev` runs on the host, where the
        // backend is reachable via its published port instead.
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: '../dist',
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __COMMIT_HASH__: JSON.stringify(resolveCommitHash()),
    },
  }),
)
