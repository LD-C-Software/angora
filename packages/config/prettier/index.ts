import type { Config } from 'prettier'

// Matches the style already used across the repo (main.tsx, vite.config.ts):
// single quotes, no semicolons. Everything else is Prettier's default.
const config: Config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
}

export default config
