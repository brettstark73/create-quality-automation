'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync, execSync } = require('child_process')

const templateRoot = path.resolve(__dirname, '..')
const setupScript = path.join(templateRoot, 'setup.js')
const {
  getDefaultDevDependencies,
  getDefaultLintStaged,
  getDefaultScripts,
  STYLELINT_EXTENSIONS,
} = require('../config/defaults')

const createTempProject = initialPackageJson => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-template-'))
  execSync('git init', { cwd: tempDir, stdio: 'ignore' })

  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(initialPackageJson, null, 2)
  )

  return { tempDir, initialPackageJson }
}

const runSetup = cwd => {
  execFileSync(process.execPath, [setupScript], { cwd, stdio: 'ignore' })
}

const readJson = filePath =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

const expectFile = (cwd, relativePath) => {
  const target = path.join(cwd, relativePath)
  assert.ok(fs.existsSync(target), `${relativePath} should exist`)
  return target
}

const cleanup = cwd => {
  fs.rmSync(cwd, { recursive: true, force: true })
}

const normalizeArray = value => {
  const arr = Array.isArray(value) ? value : [value]
  return [...new Set(arr)].sort()
}

const STYLELINT_EXTENSION_GLOB = `*.{${STYLELINT_EXTENSIONS.join(',')}}`
const DEFAULT_STYLELINT_TARGET = `**/*.{${STYLELINT_EXTENSIONS.join(',')}}`

const makeStylelintTarget = dir => `${dir}/**/${STYLELINT_EXTENSION_GLOB}`

const patternIncludesStylelintExtension = pattern => {
  const lower = pattern.toLowerCase()
  return STYLELINT_EXTENSIONS.some(ext => lower.includes(`.${ext}`))
}

const mergeScripts = (initialScripts = {}, defaultScripts) => {
  const scripts = { ...initialScripts }
  Object.entries(defaultScripts).forEach(([name, command]) => {
    if (!scripts[name]) {
      scripts[name] = command
    }
  })

  const prepareScript = scripts.prepare
  if (!prepareScript) {
    scripts.prepare = 'husky'
  } else if (prepareScript.includes('husky install')) {
    scripts.prepare = prepareScript.replace(/husky install/g, 'husky')
  } else if (!prepareScript.includes('husky')) {
    scripts.prepare = `${prepareScript} && husky`
  }

  return scripts
}

const mergeDevDependencies = (initialDevDeps = {}, defaultDevDeps) => {
  const devDeps = { ...initialDevDeps }
  Object.entries(defaultDevDeps).forEach(([dependency, version]) => {
    if (!devDeps[dependency]) {
      devDeps[dependency] = version
    }
  })
  return devDeps
}

const mergeLintStaged = (
  initialLintStaged = {},
  defaultLintStaged,
  stylelintTargets = [DEFAULT_STYLELINT_TARGET]
) => {
  const lintStaged = { ...initialLintStaged }
  const stylelintTargetSet = new Set(stylelintTargets)
  const hasExistingCssPatterns = Object.keys(lintStaged).some(
    patternIncludesStylelintExtension
  )

  Object.entries(defaultLintStaged).forEach(([pattern, commands]) => {
    const isStylelintPattern = stylelintTargetSet.has(pattern)
    if (isStylelintPattern && hasExistingCssPatterns) {
      return
    }
    if (!lintStaged[pattern]) {
      lintStaged[pattern] = commands
      return
    }
    const existing = Array.isArray(lintStaged[pattern])
      ? [...lintStaged[pattern]]
      : [lintStaged[pattern]]
    const merged = [...existing]
    commands.forEach(command => {
      if (!merged.includes(command)) {
        merged.push(command)
      }
    })
    lintStaged[pattern] = merged
  })
  return lintStaged
}

const assertLintStagedEqual = (actual, expected) => {
  const actualKeys = Object.keys(actual).sort()
  const expectedKeys = Object.keys(expected).sort()
  assert.deepStrictEqual(actualKeys, expectedKeys)

  expectedKeys.forEach(key => {
    assert.deepStrictEqual(
      normalizeArray(actual[key]),
      normalizeArray(expected[key])
    )
  })
}

// JavaScript project baseline
const jsInitialPackageJson = {
  name: 'fixture-project',
  version: '0.1.0',
  scripts: {
    lint: 'custom lint',
  },
  devDependencies: {
    prettier: '^2.0.0',
  },
  'lint-staged': {
    'package.json': ['custom-command'],
  },
}

const { tempDir: jsProjectDir, initialPackageJson: jsInitial } =
  createTempProject(jsInitialPackageJson)

try {
  runSetup(jsProjectDir)

  const pkg = readJson(path.join(jsProjectDir, 'package.json'))
  const expectedScripts = mergeScripts(
    jsInitial.scripts,
    getDefaultScripts({ typescript: false })
  )
  const expectedDevDependencies = mergeDevDependencies(
    jsInitial.devDependencies,
    getDefaultDevDependencies({ typescript: false })
  )
  const expectedLintStaged = mergeLintStaged(
    jsInitial['lint-staged'],
    getDefaultLintStaged({ typescript: false })
  )

  assert.deepStrictEqual(pkg.scripts, expectedScripts)
  assert.deepStrictEqual(pkg.devDependencies, expectedDevDependencies)
  assertLintStagedEqual(pkg['lint-staged'], expectedLintStaged)

  expectFile(jsProjectDir, '.prettierrc')
  const eslintConfigPathJs = expectFile(jsProjectDir, 'eslint.config.cjs')
  expectFile(jsProjectDir, '.stylelintrc.json')
  expectFile(jsProjectDir, '.prettierignore')
  expectFile(jsProjectDir, '.eslintignore')
  expectFile(jsProjectDir, '.editorconfig')
  expectFile(jsProjectDir, '.github/workflows/quality.yml')

  const huskyHookPath = expectFile(jsProjectDir, '.husky/pre-commit')
  const huskyHookContents = fs.readFileSync(huskyHookPath, 'utf8')
  const eslintConfigContentsJs = fs.readFileSync(eslintConfigPathJs, 'utf8')

  // Idempotency check
  runSetup(jsProjectDir)
  const pkgSecond = readJson(path.join(jsProjectDir, 'package.json'))
  const lintStagedSecond = pkgSecond['lint-staged']
  const huskyHookContentsSecond = fs.readFileSync(huskyHookPath, 'utf8')
  const eslintConfigContentsJsSecond = fs.readFileSync(
    eslintConfigPathJs,
    'utf8'
  )

  assert.deepStrictEqual(pkgSecond.scripts, expectedScripts)
  assert.deepStrictEqual(pkgSecond.devDependencies, expectedDevDependencies)
  assertLintStagedEqual(lintStagedSecond, expectedLintStaged)
  assert.strictEqual(huskyHookContentsSecond, huskyHookContents)
  assert.strictEqual(eslintConfigContentsJsSecond, eslintConfigContentsJs)
} finally {
  cleanup(jsProjectDir)
}

// TypeScript project baseline
const tsInitialPackageJson = {
  name: 'fixture-project-ts',
  version: '0.1.0',
  scripts: {},
  devDependencies: {
    typescript: '^5.4.0',
  },
  'lint-staged': {
    'src/**/*.ts': ['custom-ts'],
  },
}

const { tempDir: tsProjectDir, initialPackageJson: tsInitial } =
  createTempProject(tsInitialPackageJson)

// Ensure TypeScript config is present for detection as well
fs.writeFileSync(
  path.join(tsProjectDir, 'tsconfig.json'),
  JSON.stringify({ extends: './tsconfig.base.json' }, null, 2)
)

try {
  runSetup(tsProjectDir)

  const pkg = readJson(path.join(tsProjectDir, 'package.json'))
  const expectedScripts = mergeScripts(
    tsInitial.scripts,
    getDefaultScripts({ typescript: true })
  )
  const expectedDevDependencies = mergeDevDependencies(
    tsInitial.devDependencies,
    getDefaultDevDependencies({ typescript: true })
  )
  const expectedLintStaged = mergeLintStaged(
    tsInitial['lint-staged'],
    getDefaultLintStaged({ typescript: true })
  )

  assert.deepStrictEqual(pkg.scripts, expectedScripts)
  assert.strictEqual(pkg.scripts.lint.includes('.ts'), true)
  assert.deepStrictEqual(pkg.devDependencies, expectedDevDependencies)
  assertLintStagedEqual(pkg['lint-staged'], expectedLintStaged)
  assert.ok(pkg['lint-staged']['src/**/*.ts'].includes('custom-ts'))

  const eslintConfigPathTs = expectFile(tsProjectDir, 'eslint.config.cjs')
  const eslintConfigContentsTs = fs.readFileSync(eslintConfigPathTs, 'utf8')
  assert.ok(eslintConfigContentsTs.includes('@typescript-eslint'))
  expectFile(tsProjectDir, '.editorconfig')

  // Idempotency check (also validates TypeScript paths stay stable)
  runSetup(tsProjectDir)
  const pkgSecond = readJson(path.join(tsProjectDir, 'package.json'))
  const lintStagedSecond = pkgSecond['lint-staged']
  const eslintConfigContentsTsSecond = fs.readFileSync(
    eslintConfigPathTs,
    'utf8'
  )

  assert.deepStrictEqual(pkgSecond.scripts, expectedScripts)
  assert.deepStrictEqual(pkgSecond.devDependencies, expectedDevDependencies)
  assertLintStagedEqual(lintStagedSecond, expectedLintStaged)
  assert.strictEqual(eslintConfigContentsTsSecond, eslintConfigContentsTs)
} finally {
  cleanup(tsProjectDir)
}

// Preserve existing CSS lint-staged globs without adding conflicting defaults
const cssInitialPackageJson = {
  name: 'fixture-css-targets',
  version: '0.1.0',
  scripts: {},
  'lint-staged': {
    'public/**/*.css': ['stylelint --fix'],
  },
}

const { tempDir: cssProjectDir, initialPackageJson: cssInitial } =
  createTempProject(cssInitialPackageJson)

fs.mkdirSync(path.join(cssProjectDir, 'public'), { recursive: true })
fs.writeFileSync(
  path.join(cssProjectDir, 'public', 'styles.css'),
  'body { color: #c00; }\n'
)

try {
  runSetup(cssProjectDir)

  const pkg = readJson(path.join(cssProjectDir, 'package.json'))
  const publicStylelintTarget = makeStylelintTarget('public')
  const expectedLintStaged = mergeLintStaged(
    cssInitial['lint-staged'],
    getDefaultLintStaged({ stylelintTargets: [publicStylelintTarget] }),
    [publicStylelintTarget]
  )

  assertLintStagedEqual(pkg['lint-staged'], expectedLintStaged)
  assert.ok(!pkg['lint-staged'][DEFAULT_STYLELINT_TARGET])
  assert.deepStrictEqual(pkg['lint-staged']['public/**/*.css'], [
    'stylelint --fix',
  ])
} finally {
  cleanup(cssProjectDir)
}
