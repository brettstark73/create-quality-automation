#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const {
  STYLELINT_EXTENSIONS,
  getDefaultDevDependencies,
  getDefaultLintStaged,
  getDefaultScripts,
} = require('./config/defaults')

const STYLELINT_EXTENSION_SET = new Set(STYLELINT_EXTENSIONS)
const STYLELINT_DEFAULT_TARGET = `**/*.{${STYLELINT_EXTENSIONS.join(',')}}`
const STYLELINT_EXTENSION_GLOB = `*.{${STYLELINT_EXTENSIONS.join(',')}}`
const STYLELINT_SCAN_EXCLUDES = new Set([
  '.git',
  '.github',
  '.husky',
  '.next',
  '.nuxt',
  '.output',
  '.turbo',
  '.vercel',
  '.cache',
  '.pnpm-store',
  'coverage',
  'node_modules',
])
const MAX_STYLELINT_SCAN_DEPTH = 4

const safeReadDir = dir => {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

const isStylelintFile = fileName => {
  const ext = path.extname(fileName).slice(1).toLowerCase()
  return STYLELINT_EXTENSION_SET.has(ext)
}

const directoryContainsStylelintFiles = (dir, depth = 0) => {
  if (depth > MAX_STYLELINT_SCAN_DEPTH) {
    return false
  }

  const entries = safeReadDir(dir)
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue
    }

    const entryPath = path.join(dir, entry.name)

    if (entry.isFile() && isStylelintFile(entry.name)) {
      return true
    }

    if (entry.isDirectory()) {
      if (STYLELINT_SCAN_EXCLUDES.has(entry.name)) {
        continue
      }
      if (directoryContainsStylelintFiles(entryPath, depth + 1)) {
        return true
      }
    }
  }

  return false
}

const findStylelintTargets = rootDir => {
  const entries = safeReadDir(rootDir)
  const targets = new Set()
  let hasRootCss = false

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue
    }

    const entryPath = path.join(rootDir, entry.name)

    if (entry.isFile()) {
      if (isStylelintFile(entry.name)) {
        hasRootCss = true
      }
      continue
    }

    if (!entry.isDirectory()) {
      continue
    }

    if (STYLELINT_SCAN_EXCLUDES.has(entry.name)) {
      continue
    }

    if (directoryContainsStylelintFiles(entryPath)) {
      targets.add(entry.name)
    }
  }

  const resolvedTargets = []

  if (hasRootCss) {
    resolvedTargets.push(STYLELINT_EXTENSION_GLOB)
  }

  Array.from(targets)
    .sort()
    .forEach(dir => {
      resolvedTargets.push(`${dir}/**/${STYLELINT_EXTENSION_GLOB}`)
    })

  if (!resolvedTargets.length) {
    return [STYLELINT_DEFAULT_TARGET]
  }

  return resolvedTargets
}

const patternIncludesStylelintExtension = pattern => {
  const lower = pattern.toLowerCase()
  return STYLELINT_EXTENSIONS.some(ext => lower.includes(`.${ext}`))
}

// CLI argument parsing
const args = process.argv.slice(2)
const isUpdateMode = args.includes('--update')

console.log(
  `🚀 ${isUpdateMode ? 'Updating' : 'Setting up'} Quality Automation...\n`
)

// Check if we're in a git repository
try {
  execSync('git status', { stdio: 'ignore' })
} catch {
  console.error('❌ This must be run in a git repository')
  console.log('Run "git init" first, then try again.')
  process.exit(1)
}

// Check if package.json exists
const packageJsonPath = path.join(process.cwd(), 'package.json')
let packageJson = {}

if (fs.existsSync(packageJsonPath)) {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  console.log('✅ Found existing package.json')
} else {
  console.log('📦 Creating new package.json')
  packageJson = {
    name: path.basename(process.cwd()),
    version: '1.0.0',
    description: '',
    main: 'index.js',
    scripts: {},
  }
}

const hasTypeScriptDependency = Boolean(
  (packageJson.devDependencies && packageJson.devDependencies.typescript) ||
    (packageJson.dependencies && packageJson.dependencies.typescript)
)

const tsconfigCandidates = ['tsconfig.json', 'tsconfig.base.json']
const hasTypeScriptConfig = tsconfigCandidates.some(file =>
  fs.existsSync(path.join(process.cwd(), file))
)

const usesTypeScript = Boolean(hasTypeScriptDependency || hasTypeScriptConfig)
if (usesTypeScript) {
  console.log(
    '🔍 Detected TypeScript configuration; enabling TypeScript lint defaults'
  )
}

const stylelintTargets = findStylelintTargets(process.cwd())
const usingDefaultStylelintTarget =
  stylelintTargets.length === 1 &&
  stylelintTargets[0] === STYLELINT_DEFAULT_TARGET
if (!usingDefaultStylelintTarget) {
  console.log(`🔍 Detected stylelint targets: ${stylelintTargets.join(', ')}`)
}

// Add quality automation scripts (conservative: do not overwrite existing)
console.log('📝 Adding quality automation scripts...')
packageJson.scripts = packageJson.scripts || {}
const defaultScripts = getDefaultScripts({
  typescript: usesTypeScript,
  stylelintTargets,
})
Object.entries(defaultScripts).forEach(([name, command]) => {
  if (!packageJson.scripts[name]) {
    packageJson.scripts[name] = command
  }
})
// prepare: ensure husky command is present
const prepareScript = packageJson.scripts.prepare
if (!prepareScript) {
  packageJson.scripts.prepare = 'husky'
} else if (prepareScript.includes('husky install')) {
  packageJson.scripts.prepare = prepareScript.replace(/husky install/g, 'husky')
} else if (!prepareScript.includes('husky')) {
  packageJson.scripts.prepare = `${prepareScript} && husky`
}

// Add devDependencies
console.log('📦 Adding devDependencies...')
packageJson.devDependencies = packageJson.devDependencies || {}
const defaultDevDependencies = getDefaultDevDependencies({
  typescript: usesTypeScript,
})
Object.entries(defaultDevDependencies).forEach(([dependency, version]) => {
  if (!packageJson.devDependencies[dependency]) {
    packageJson.devDependencies[dependency] = version
  }
})

// Add lint-staged configuration
console.log('⚙️ Adding lint-staged configuration...')
const lintStagedConfig = packageJson['lint-staged'] || {}
const defaultLintStaged = getDefaultLintStaged({
  typescript: usesTypeScript,
  stylelintTargets,
})
const stylelintTargetSet = new Set(stylelintTargets)
const hasExistingCssPatterns = Object.keys(lintStagedConfig).some(
  patternIncludesStylelintExtension
)

if (hasExistingCssPatterns) {
  console.log(
    'ℹ️ Detected existing lint-staged CSS globs; preserving current CSS targets'
  )
}

Object.entries(defaultLintStaged).forEach(([pattern, commands]) => {
  const isStylelintPattern = stylelintTargetSet.has(pattern)
  if (isStylelintPattern && hasExistingCssPatterns) {
    return
  }
  if (!lintStagedConfig[pattern]) {
    lintStagedConfig[pattern] = commands
    return
  }
  const existing = Array.isArray(lintStagedConfig[pattern])
    ? [...lintStagedConfig[pattern]]
    : [lintStagedConfig[pattern]]
  const merged = [...existing]
  commands.forEach(command => {
    if (!merged.includes(command)) {
      merged.push(command)
    }
  })
  lintStagedConfig[pattern] = merged
})
packageJson['lint-staged'] = lintStagedConfig

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
console.log('✅ Updated package.json')

// Ensure Node toolchain pinning in target project
const nvmrcPath = path.join(process.cwd(), '.nvmrc')
if (!fs.existsSync(nvmrcPath)) {
  fs.writeFileSync(nvmrcPath, '20\n')
  console.log('✅ Added .nvmrc (Node 20)')
}

const npmrcPath = path.join(process.cwd(), '.npmrc')
if (!fs.existsSync(npmrcPath)) {
  fs.writeFileSync(npmrcPath, 'engine-strict = true\n')
  console.log('✅ Added .npmrc (engine-strict)')
}

// Create .github/workflows directory if it doesn't exist
const workflowDir = path.join(process.cwd(), '.github', 'workflows')
if (!fs.existsSync(workflowDir)) {
  fs.mkdirSync(workflowDir, { recursive: true })
  console.log('📁 Created .github/workflows directory')
}

// Copy workflow file if it doesn't exist
const workflowFile = path.join(workflowDir, 'quality.yml')
if (!fs.existsSync(workflowFile)) {
  const templateWorkflow = fs.readFileSync(
    path.join(__dirname, '.github/workflows/quality.yml'),
    'utf8'
  )
  fs.writeFileSync(workflowFile, templateWorkflow)
  console.log('✅ Added GitHub Actions workflow')
}

// Copy Prettier config if it doesn't exist
const prettierrcPath = path.join(process.cwd(), '.prettierrc')
if (!fs.existsSync(prettierrcPath)) {
  const templatePrettierrc = fs.readFileSync(
    path.join(__dirname, '.prettierrc'),
    'utf8'
  )
  fs.writeFileSync(prettierrcPath, templatePrettierrc)
  console.log('✅ Added Prettier configuration')
}

// Copy ESLint config if it doesn't exist
const eslintConfigPath = path.join(process.cwd(), 'eslint.config.cjs')
const templateEslintPath = path.join(
  __dirname,
  usesTypeScript ? 'eslint.config.ts.cjs' : 'eslint.config.cjs'
)
const templateEslint = fs.readFileSync(templateEslintPath, 'utf8')

if (!fs.existsSync(eslintConfigPath)) {
  fs.writeFileSync(eslintConfigPath, templateEslint)
  console.log(
    `✅ Added ESLint configuration${usesTypeScript ? ' (TypeScript-aware)' : ''}`
  )
} else if (usesTypeScript) {
  const existingConfig = fs.readFileSync(eslintConfigPath, 'utf8')
  if (!existingConfig.includes('@typescript-eslint')) {
    fs.writeFileSync(eslintConfigPath, templateEslint)
    console.log('♻️ Updated ESLint configuration with TypeScript support')
  }
}

const legacyEslintrcPath = path.join(process.cwd(), '.eslintrc.json')
if (fs.existsSync(legacyEslintrcPath)) {
  console.log(
    'ℹ️ Detected legacy .eslintrc.json; ESLint 9 prefers eslint.config.cjs. Consider removing the legacy file after verifying the new config.'
  )
}

// Copy Stylelint config if it doesn't exist
const stylelintrcPath = path.join(process.cwd(), '.stylelintrc.json')
if (!fs.existsSync(stylelintrcPath)) {
  const templateStylelint = fs.readFileSync(
    path.join(__dirname, '.stylelintrc.json'),
    'utf8'
  )
  fs.writeFileSync(stylelintrcPath, templateStylelint)
  console.log('✅ Added Stylelint configuration')
}

// Copy .prettierignore if it doesn't exist
const prettierignorePath = path.join(process.cwd(), '.prettierignore')
if (!fs.existsSync(prettierignorePath)) {
  const templatePrettierignore = fs.readFileSync(
    path.join(__dirname, '.prettierignore'),
    'utf8'
  )
  fs.writeFileSync(prettierignorePath, templatePrettierignore)
  console.log('✅ Added Prettier ignore file')
}

// Copy ESLint ignore if it doesn't exist
const eslintignorePath = path.join(process.cwd(), '.eslintignore')
if (!fs.existsSync(eslintignorePath)) {
  const templateEslintIgnore = fs.readFileSync(
    path.join(__dirname, '.eslintignore'),
    'utf8'
  )
  fs.writeFileSync(eslintignorePath, templateEslintIgnore)
  console.log('✅ Added ESLint ignore file')
}

// Copy .editorconfig if it doesn't exist
const editorconfigPath = path.join(process.cwd(), '.editorconfig')
if (!fs.existsSync(editorconfigPath)) {
  const templateEditorconfig = fs.readFileSync(
    path.join(__dirname, '.editorconfig'),
    'utf8'
  )
  fs.writeFileSync(editorconfigPath, templateEditorconfig)
  console.log('✅ Added .editorconfig')
}

// Ensure Husky pre-commit hook runs lint-staged
try {
  const huskyDir = path.join(process.cwd(), '.husky')
  if (!fs.existsSync(huskyDir)) {
    fs.mkdirSync(huskyDir, { recursive: true })
  }
  const preCommitPath = path.join(huskyDir, 'pre-commit')
  if (!fs.existsSync(preCommitPath)) {
    const hook =
      '#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\n\n# Run lint-staged on staged files\nnpx --no -- lint-staged\n'
    fs.writeFileSync(preCommitPath, hook)
    fs.chmodSync(preCommitPath, 0o755)
    console.log('✅ Added Husky pre-commit hook (lint-staged)')
  }
} catch (e) {
  console.warn('⚠️ Could not create Husky pre-commit hook:', e.message)
}

// Ensure engines/volta pins in target package.json (non-destructive)
try {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  pkg.engines = { node: '>=20', ...(pkg.engines || {}) }
  pkg.volta = { node: '20.11.1', npm: '10.2.4', ...(pkg.volta || {}) }
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))
  console.log('✅ Ensured engines and Volta pins in package.json')
} catch (e) {
  console.warn('⚠️ Could not update engines/volta in package.json:', e.message)
}

console.log('\n🎉 Quality automation setup complete!')
console.log('\n📋 Next steps:')
console.log('1. Run: npm install')
console.log('2. Run: npm run prepare')
console.log('3. Commit your changes to activate the workflow')
console.log('\n✨ Your project now has:')
console.log('  • Prettier code formatting')
console.log('  • Pre-commit hooks via Husky')
console.log('  • GitHub Actions quality checks')
console.log('  • Lint-staged for efficient processing')
