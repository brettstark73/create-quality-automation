#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const {
  defaultDevDependencies,
  defaultLintStaged,
  defaultScripts
} = require('./config/defaults')

console.log('🚀 Setting up Quality Automation Template...\n')

// Check if we're in a git repository
try {
  execSync('git status', { stdio: 'ignore' })
} catch (error) {
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
    scripts: {}
  }
}

// Add quality automation scripts (conservative: do not overwrite existing)
console.log('📝 Adding quality automation scripts...')
packageJson.scripts = packageJson.scripts || {}
Object.entries(defaultScripts).forEach(([name, command]) => {
  if (!packageJson.scripts[name]) {
    packageJson.scripts[name] = command
  }
})
// prepare: ensure husky install is present
if (!packageJson.scripts.prepare) {
  packageJson.scripts.prepare = 'husky install'
} else if (!packageJson.scripts.prepare.includes('husky install')) {
  packageJson.scripts.prepare += ' && husky install'
}

// Add devDependencies
console.log('📦 Adding devDependencies...')
packageJson.devDependencies = packageJson.devDependencies || {}
Object.entries(defaultDevDependencies).forEach(([dependency, version]) => {
  if (!packageJson.devDependencies[dependency]) {
    packageJson.devDependencies[dependency] = version
  }
})

// Add lint-staged configuration
console.log('⚙️ Adding lint-staged configuration...')
const lintStagedConfig = packageJson['lint-staged'] || {}
Object.entries(defaultLintStaged).forEach(([pattern, commands]) => {
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
const eslintrcPath = path.join(process.cwd(), '.eslintrc.json')
if (!fs.existsSync(eslintrcPath)) {
  const templateEslint = fs.readFileSync(
    path.join(__dirname, '.eslintrc.json'),
    'utf8'
  )
  fs.writeFileSync(eslintrcPath, templateEslint)
  console.log('✅ Added ESLint configuration')
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
