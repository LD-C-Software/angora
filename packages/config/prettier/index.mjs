// Matches the style already used across the repo (main.tsx, vite.config.ts):
// single quotes, no semicolons. Everything else is Prettier's default.
/** @type {import('prettier').Config} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
}

export default config
