// Only apps/frontend uses Vite today, but this establishes the shared
// pattern for any future Vite-based service. Consumers merge this in with
// vite's `mergeConfig` and layer their own root/server/plugins on top.
/** @type {import('vite').UserConfig} */
export const base = {
  build: {
    emptyOutDir: true,
    sourcemap: true,
  },
}

export default base
