import js from '@eslint/js'
import tseslint from 'typescript-eslint'

// Shared by every package. Flavor-specific files (react.mjs, node.mjs) add
// their own globals/plugins on top and append eslint-config-prettier last.
/** @type {import('eslint').Linter.Config[]} */
export const base = [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
]

export default base
