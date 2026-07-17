import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'
import { base } from './base.mjs'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
]
