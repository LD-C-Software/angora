import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { base } from '@crm/config/vite/base.mjs'

export default defineConfig(
  mergeConfig(base, {
    root: 'src',
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://backend:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: '../dist',
    },
  }),
)
