'use strict'

const JS_LINT_EXTENSIONS = '.js,.jsx,.mjs,.cjs,.html'
const TS_LINT_EXTENSIONS = '.js,.jsx,.mjs,.cjs,.ts,.tsx,.html'

const STYLELINT_EXTENSIONS = ['css', 'scss', 'sass', 'less', 'pcss']
const DEFAULT_STYLELINT_TARGET = `**/*.{${STYLELINT_EXTENSIONS.join(',')}}`

const baseScripts = {
  format: 'prettier --write .',
  'format:check': 'prettier --check .',
  'security:audit': 'npm audit --audit-level high',
  'security:secrets':
    "node -e \"const fs=require('fs');const content=fs.readFileSync('package.json','utf8');if(/[\\\"\\'][a-zA-Z0-9+/]{20,}[\\\"\\']/.test(content)){console.error('❌ Potential hardcoded secrets in package.json');process.exit(1)}else{console.log('✅ No secrets detected in package.json')}\"",
}

const normalizeStylelintTargets = stylelintTargets => {
  const targets = Array.isArray(stylelintTargets)
    ? stylelintTargets.filter(Boolean)
    : []
  if (!targets.length) {
    return [DEFAULT_STYLELINT_TARGET]
  }
  return [...new Set(targets)]
}

const stylelintBraceGroup = stylelintTargets => {
  const targets = normalizeStylelintTargets(stylelintTargets)
  if (targets.length === 1) {
    return targets[0]
  }
  return `{${targets.join(',')}}`
}

const baseLintScripts = ({ extensions, stylelintTargets }) => {
  const stylelintTarget = stylelintBraceGroup(stylelintTargets)
  return {
    lint: `eslint . --ext ${extensions} && stylelint "${stylelintTarget}" --allow-empty-input`,
    'lint:fix': `eslint . --ext ${extensions} --fix && stylelint "${stylelintTarget}" --fix --allow-empty-input`,
  }
}

const baseDevDependencies = {
  husky: '^9.1.4',
  'lint-staged': '^15.2.10',
  prettier: '^3.3.3',
  eslint: '^9.12.0',
  'eslint-plugin-security': '^3.0.1',
  globals: '^15.9.0',
  stylelint: '^16.8.0',
  'stylelint-config-standard': '^37.0.0',
}

const typeScriptDevDependencies = {
  '@typescript-eslint/eslint-plugin': '^8.9.0',
  '@typescript-eslint/parser': '^8.9.0',
}

const baseLintStaged = (patterns, stylelintTargets) => {
  const lintStaged = {
    'package.json': ['prettier --write'],
    [patterns]: ['eslint --fix', 'prettier --write'],
    '**/*.{json,md,yml,yaml}': ['prettier --write'],
  }

  normalizeStylelintTargets(stylelintTargets).forEach(target => {
    lintStaged[target] = ['stylelint --fix', 'prettier --write']
  })

  return lintStaged
}

const JS_LINT_STAGED_PATTERN = '**/*.{js,jsx,mjs,cjs,html}'
const TS_LINT_STAGED_PATTERN = '**/*.{js,jsx,ts,tsx,mjs,cjs,html}'

const clone = value => JSON.parse(JSON.stringify(value))

function getDefaultScripts({ typescript, stylelintTargets } = {}) {
  const extensions = typescript ? TS_LINT_EXTENSIONS : JS_LINT_EXTENSIONS
  return {
    ...clone(baseScripts),
    ...baseLintScripts({ extensions, stylelintTargets }),
  }
}

function getDefaultDevDependencies({ typescript } = {}) {
  const devDeps = { ...clone(baseDevDependencies) }
  if (typescript) {
    Object.assign(devDeps, typeScriptDevDependencies)
  }
  return devDeps
}

function getDefaultLintStaged({ typescript, stylelintTargets } = {}) {
  const pattern = typescript ? TS_LINT_STAGED_PATTERN : JS_LINT_STAGED_PATTERN
  return clone(baseLintStaged(pattern, stylelintTargets))
}

module.exports = {
  getDefaultDevDependencies,
  getDefaultLintStaged,
  getDefaultScripts,
  STYLELINT_EXTENSIONS,
}
