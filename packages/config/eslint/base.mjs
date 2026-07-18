import js from '@eslint/js'
import tseslint from 'typescript-eslint'

// Shared by every package. Flavor-specific files (react.mjs, node.mjs) add
// their own globals/plugins on top and append eslint-config-prettier last.
//
// This stays plain JS (not .ts) deliberately: jiti — the loader ESLint uses
// for TypeScript config files — breaks when it has to transform a chain of
// .ts files that transitively import typescript-eslint (it interferes with
// typescript-eslint's own interop with the `typescript` package). The
// app-level eslint.config.ts entry files are real TypeScript; this and its
// siblings (react.mjs, node.mjs) are the one place in packages/config that
// stays .mjs for that reason.
/** @type {import('eslint').Linter.Config[]} */
export const base = [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
]

export default base
