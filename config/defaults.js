'use strict'

const JS_LINT_EXTENSIONS = '.js,.jsx,.mjs,.cjs,.html'
const TS_LINT_EXTENSIONS = '.js,.jsx,.mjs,.cjs,.ts,.tsx,.html'

const baseScripts = {
  format: 'prettier --write .',
  'format:check': 'prettier --check .'
}

const baseLintScripts = extensions => ({
  lint: `eslint . --ext ${extensions} && stylelint "**/*.{css,scss}" --allow-empty-input`,
  'lint:fix': `eslint . --ext ${extensions} --fix && stylelint "**/*.{css,scss}" --fix --allow-empty-input`
})

const baseDevDependencies = {
  husky: '^9.1.4',
  'lint-staged': '^15.2.10',
  prettier: '^3.3.3',
  eslint: '^9.12.0',
  globals: '^15.9.0',
  stylelint: '^16.8.0',
  'stylelint-config-standard': '^37.0.0'
}

const typeScriptDevDependencies = {
  '@typescript-eslint/eslint-plugin': '^8.9.0',
  '@typescript-eslint/parser': '^8.9.0'
}

const baseLintStaged = patterns => ({
  'package.json': ['prettier --write'],
  [patterns]: ['eslint --fix', 'prettier --write'],
  '**/*.{css,scss}': ['stylelint --fix', 'prettier --write'],
  '**/*.{json,md,yml,yaml}': ['prettier --write']
})

const JS_LINT_STAGED_PATTERN = '**/*.{js,jsx,mjs,cjs,html}'
const TS_LINT_STAGED_PATTERN = '**/*.{js,jsx,ts,tsx,mjs,cjs,html}'

const clone = value => JSON.parse(JSON.stringify(value))

function getDefaultScripts({ typescript } = {}) {
  const extensions = typescript ? TS_LINT_EXTENSIONS : JS_LINT_EXTENSIONS
  return { ...clone(baseScripts), ...baseLintScripts(extensions) }
}

function getDefaultDevDependencies({ typescript } = {}) {
  const devDeps = { ...clone(baseDevDependencies) }
  if (typescript) {
    Object.assign(devDeps, typeScriptDevDependencies)
  }
  return devDeps
}

function getDefaultLintStaged({ typescript } = {}) {
  const pattern = typescript ? TS_LINT_STAGED_PATTERN : JS_LINT_STAGED_PATTERN
  return clone(baseLintStaged(pattern))
}

module.exports = {
  getDefaultDevDependencies,
  getDefaultLintStaged,
  getDefaultScripts
}
