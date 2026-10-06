import js from '@eslint/js'
import tseslint, { type ConfigArray } from 'typescript-eslint'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

const config: ConfigArray = tseslint.config(
  {
    ignores: ['dist/**', 'vite.config.ts', 'examples/playground/dist/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierRecommended,
)

export default config
