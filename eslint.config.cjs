const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs,html}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {}
  }
]
