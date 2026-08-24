import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Fetch/reset effects are intentional in this client. React's compiler-oriented rule
      // rejects these conventional synchronization effects even though they are guarded.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/context/**/*.{js,jsx}'],
    rules: {
      // Context modules deliberately export both their provider and the context consumed by hooks.
      'react-refresh/only-export-components': 'off',
    },
  },
])
