import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { base } from '@angora/config/vite/base'

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
  }),
)
