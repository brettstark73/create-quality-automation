#!/usr/bin/env node

/* eslint-disable security/detect-non-literal-fs-filename */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const {
  mergeScripts,
  mergeDevDependencies,
  mergeLintStaged,
} = require('./lib/package-utils')

/**
 * Check Node version and lazily load @npmcli/package-json
 * This prevents import errors on older Node versions for basic commands like --help
 */
function checkNodeVersionAndLoadPackageJson() {
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.split('.')[0].slice(1))

  if (majorVersion < 20) {
    console.error(
      `❌ Node.js ${nodeVersion} is not supported. This tool requires Node.js 20 or higher.`
    )
    console.log('Please upgrade Node.js and try again.')
    console.log('Visit https://nodejs.org/ to download the latest version.')
    process.exit(1)
  }

  try {
    return require('@npmcli/package-json')
  } catch (error) {
    console.error(`❌ Failed to load package.json utilities: ${error.message}`)
    console.log('This tool requires Node.js 20+ with modern module support.')
    process.exit(1)
  }
}

const {
  STYLELINT_EXTENSIONS,
  getDefaultDevDependencies,
  getDefaultLintStaged,
  getDefaultScripts,
} = require('./config/defaults')

// Enhanced validation capabilities
const { ValidationRunner } = require('./lib/validation')

// Interactive mode capabilities
const { InteractivePrompt } = require('./lib/interactive/prompt')
const { runInteractiveFlow } = require('./lib/interactive/questions')

// Basic dependency monitoring (Free Tier)
const {
  hasNpmProject,
  generateBasicDependabotConfig,
  writeBasicDependabotConfig,
} = require('./lib/dependency-monitoring-basic')

// Licensing system
const {
  getLicenseInfo,
  showUpgradeMessage,
  showLicenseStatus,
} = require('./lib/licensing')

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

// Input validation and sanitization functions from WFHroulette patterns
const validateAndSanitizeInput = input => {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }
  // Normalize and trim input
  const normalized = input.trim()
  if (normalized.length === 0) {
    return null
  }
  // Basic sanitization - remove potentially dangerous characters
  const sanitized = normalized.replace(/[<>'"&]/g, '')
  return sanitized
}

// CLI argument parsing with validation
const args = process.argv.slice(2)
let sanitizedArgs = args
  .map(arg => validateAndSanitizeInput(arg))
  .filter(Boolean)

// Interactive mode detection - to be handled at execution time
const isInteractiveRequested = sanitizedArgs.includes('--interactive')

const isUpdateMode = sanitizedArgs.includes('--update')
const isValidationMode = sanitizedArgs.includes('--validate')
const isConfigSecurityMode = sanitizedArgs.includes('--security-config')
const isDocsValidationMode = sanitizedArgs.includes('--validate-docs')
const isComprehensiveMode = sanitizedArgs.includes('--comprehensive')
const isDependencyMonitoringMode =
  sanitizedArgs.includes('--deps') ||
  sanitizedArgs.includes('--dependency-monitoring')
const isLicenseStatusMode = sanitizedArgs.includes('--license-status')
const isDryRun = sanitizedArgs.includes('--dry-run')

// Granular tool disable options
const disableNpmAudit = sanitizedArgs.includes('--no-npm-audit')
const disableGitleaks = sanitizedArgs.includes('--no-gitleaks')
const disableActionlint = sanitizedArgs.includes('--no-actionlint')
const disableMarkdownlint = sanitizedArgs.includes('--no-markdownlint')
const disableEslintSecurity = sanitizedArgs.includes('--no-eslint-security')

// Show help if requested
if (sanitizedArgs.includes('--help') || sanitizedArgs.includes('-h')) {
  console.log(`
🚀 Create Quality Automation Setup

Usage: npx create-quality-automation@latest [options]

SETUP OPTIONS:
  (no args)         Run complete quality automation setup
  --interactive     Interactive mode with guided configuration prompts
  --update          Update existing configuration
  --deps            Add basic dependency monitoring (Free Tier)
  --dependency-monitoring  Same as --deps
  --dry-run         Preview changes without modifying files

VALIDATION OPTIONS:
  --validate        Run comprehensive validation (same as --comprehensive)
  --comprehensive   Run all validation checks
  --security-config Run configuration security checks only
  --validate-docs   Run documentation validation only

LICENSE OPTIONS:
  --license-status  Show current license tier and available features

GRANULAR TOOL CONTROL:
  --no-npm-audit       Disable npm audit dependency vulnerability checks
  --no-gitleaks        Disable gitleaks secret scanning
  --no-actionlint      Disable actionlint GitHub Actions workflow validation
  --no-markdownlint    Disable markdownlint markdown formatting checks
  --no-eslint-security Disable ESLint security rule checking

EXAMPLES:
  npx create-quality-automation@latest
    → Set up quality automation with all tools

  npx create-quality-automation@latest --deps
    → Add basic dependency monitoring (Dependabot config + security auto-merge)

  npx create-quality-automation@latest --license-status
    → Show current license tier and upgrade options

  npx create-quality-automation@latest --comprehensive --no-gitleaks
    → Run validation but skip gitleaks secret scanning

  npx create-quality-automation@latest --security-config --no-npm-audit
    → Run security checks but skip npm audit

  npx create-quality-automation@latest --dry-run
    → Preview what files and configurations would be created/modified

HELP:
  --help, -h        Show this help message
`)
  process.exit(0)
}

console.log(
  `🚀 ${isDryRun ? '[DRY RUN] Previewing' : isUpdateMode ? 'Updating' : isDependencyMonitoringMode ? 'Adding dependency monitoring to' : 'Setting up'} Quality Automation...\n`
)

// Handle dry-run mode - preview what would be changed
if (isDryRun) {
  console.log('📋 DRY RUN MODE - No files will be modified\n')
  console.log('The following files would be created/modified:\n')
  console.log('Configuration Files:')
  console.log('  • .prettierrc - Prettier formatting configuration')
  console.log('  • .prettierignore - Files to exclude from formatting')
  console.log('  • eslint.config.cjs - ESLint linting configuration')
  console.log('  • .stylelintrc.json - Stylelint CSS linting configuration')
  console.log(
    '  • .editorconfig - Editor configuration for consistent formatting'
  )
  console.log('  • .nvmrc - Node version specification')
  console.log('  • .npmrc - npm configuration with engine-strict')
  console.log('')
  console.log('Git Hooks (Husky):')
  console.log('  • .husky/pre-commit - Pre-commit hook for lint-staged')
  console.log('')
  console.log('GitHub Actions:')
  console.log('  • .github/workflows/quality.yml - Quality checks workflow')
  console.log('')
  console.log('Package.json Modifications:')
  console.log(
    '  • Add devDependencies: eslint, prettier, stylelint, husky, lint-staged'
  )
  console.log('  • Add scripts: format, lint, prepare')
  console.log('  • Add lint-staged configuration')
  console.log('  • Add engines requirement (Node >=20)')
  console.log('')
  console.log('✅ Dry run complete - no files were modified')
  console.log('')
  console.log('To apply these changes, run without --dry-run flag:')
  console.log('  npx create-quality-automation@latest')
  process.exit(0)
}

// Handle validation-only commands
async function handleValidationCommands() {
  const validationOptions = {
    disableNpmAudit,
    disableGitleaks,
    disableActionlint,
    disableMarkdownlint,
    disableEslintSecurity,
  }
  const validator = new ValidationRunner(validationOptions)

  if (isConfigSecurityMode) {
    try {
      await validator.runConfigSecurity()
      process.exit(0)
    } catch (error) {
      console.error(
        `\n❌ Configuration security validation failed:\n${error.message}`
      )
      process.exit(1)
    }
  }

  if (isDocsValidationMode) {
    try {
      await validator.runDocumentationValidation()
      process.exit(0)
    } catch (error) {
      console.error(`\n❌ Documentation validation failed:\n${error.message}`)
      process.exit(1)
    }
  }

  if (isComprehensiveMode || isValidationMode) {
    try {
      await validator.runComprehensiveCheck()
      process.exit(0)
    } catch (error) {
      console.error(`\n❌ Comprehensive validation failed:\n${error.message}`)
      process.exit(1)
    }
  }
}

// Handle basic dependency monitoring (Free Tier)
async function handleBasicDependencyMonitoring() {
  console.log('🔍 Setting up basic dependency monitoring (Free Tier)...\n')

  const projectPath = process.cwd()
  const license = getLicenseInfo()

  if (!hasNpmProject(projectPath)) {
    console.error(
      '❌ No package.json found. Dependency monitoring requires an npm project.'
    )
    console.log("💡 Make sure you're in a directory with a package.json file.")
    process.exit(1)
  }

  console.log('📦 Detected: npm project')
  console.log(`📋 License tier: ${license.tier.toUpperCase()}`)

  // Generate basic Dependabot configuration
  console.log('⚙️ Generating basic Dependabot configuration...')
  const dependabotConfig = generateBasicDependabotConfig({
    projectPath,
    schedule: 'weekly',
  })

  if (dependabotConfig) {
    const dependabotPath = path.join(projectPath, '.github', 'dependabot.yml')
    writeBasicDependabotConfig(dependabotConfig, dependabotPath)
    console.log('✅ Created .github/dependabot.yml')
  }

  console.log('\n🎉 Basic dependency monitoring setup complete!')
  console.log('\n📋 What was added (Free Tier):')
  console.log('   • Basic Dependabot configuration for npm packages')
  console.log('   • Weekly dependency updates on Monday 9am')
  console.log('   • Auto-merge for security patches only')
  console.log('   • GitHub Actions dependency monitoring')

  // Show upgrade message for premium features
  console.log('\n🔒 Premium features available:')
  console.log('   • Framework-aware package grouping (React, Next.js, Vue)')
  console.log('   • Multi-language support (Python, Rust, Go)')
  console.log('   • Advanced security audit workflows')
  console.log('   • Custom update schedules and notifications')

  showUpgradeMessage('Advanced Dependency Monitoring')

  console.log('\n💡 Next steps:')
  console.log('   • Review and commit .github/dependabot.yml')
  console.log('   • Enable Dependabot alerts in GitHub repository settings')
  console.log(
    '   • Dependabot will start monitoring weekly for security patches'
  )
}

// Handle license status command
if (isLicenseStatusMode) {
  showLicenseStatus()
  process.exit(0)
}

// Handle dependency monitoring command
if (isDependencyMonitoringMode) {
  ;(async () => {
    try {
      await handleBasicDependencyMonitoring()
      process.exit(0)
    } catch (error) {
      console.error('Dependency monitoring setup error:', error.message)
      process.exit(1)
    }
  })()
}

// Run validation commands if requested
if (
  isValidationMode ||
  isConfigSecurityMode ||
  isDocsValidationMode ||
  isComprehensiveMode
) {
  // Handle validation commands and exit
  ;(async () => {
    try {
      await handleValidationCommands()
    } catch (error) {
      console.error('Validation error:', error.message)
      process.exit(1)
    }
  })()
} else {
  // Normal setup flow
  async function runMainSetup() {
    // Check if we're in a git repository
    try {
      execSync('git status', { stdio: 'ignore' })
    } catch {
      console.error('❌ This must be run in a git repository')
      console.log('Run "git init" first, then try again.')
      process.exit(1)
    }

    // Check if package.json exists with validation
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    let packageJson = {}

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
        // Validate JSON content before parsing
        if (packageJsonContent.trim().length === 0) {
          console.error('❌ package.json is empty')
          console.log(
            'Please add valid JSON content to package.json and try again.'
          )
          process.exit(1)
        }

        packageJson = JSON.parse(packageJsonContent)

        // Validate package.json structure
        if (typeof packageJson !== 'object' || packageJson === null) {
          console.error('❌ package.json must contain a valid JSON object')
          console.log('Please fix the package.json structure and try again.')
          process.exit(1)
        }

        // Sanitize package name if present
        if (packageJson.name && typeof packageJson.name === 'string') {
          packageJson.name =
            validateAndSanitizeInput(packageJson.name) || 'my-project'
        }

        console.log('✅ Found existing package.json')
      } catch (error) {
        console.error(`❌ Error parsing package.json: ${error.message}`)
        console.log('Please fix the JSON syntax in package.json and try again.')
        console.log(
          'Common issues: trailing commas, missing quotes, unclosed brackets'
        )
        process.exit(1)
      }
    } else {
      console.log('📦 Creating new package.json')
      const projectName =
        validateAndSanitizeInput(path.basename(process.cwd())) || 'my-project'
      packageJson = {
        name: projectName,
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

    const usesTypeScript = Boolean(
      hasTypeScriptDependency || hasTypeScriptConfig
    )
    if (usesTypeScript) {
      console.log(
        '🔍 Detected TypeScript configuration; enabling TypeScript lint defaults'
      )
    }

    // Python detection
    const pythonCandidates = [
      'pyproject.toml',
      'setup.py',
      'requirements.txt',
      'poetry.lock',
    ]
    const hasPythonConfig = pythonCandidates.some(file =>
      fs.existsSync(path.join(process.cwd(), file))
    )

    const hasPythonFiles = safeReadDir(process.cwd()).some(
      dirent => dirent.isFile() && dirent.name.endsWith('.py')
    )

    const usesPython = Boolean(hasPythonConfig || hasPythonFiles)
    if (usesPython) {
      console.log(
        '🐍 Detected Python project; enabling Python quality automation'
      )
    }

    const stylelintTargets = findStylelintTargets(process.cwd())
    const usingDefaultStylelintTarget =
      stylelintTargets.length === 1 &&
      stylelintTargets[0] === STYLELINT_DEFAULT_TARGET
    if (!usingDefaultStylelintTarget) {
      console.log(
        `🔍 Detected stylelint targets: ${stylelintTargets.join(', ')}`
      )
    }

    // Add quality automation scripts (conservative: do not overwrite existing)
    console.log('📝 Adding quality automation scripts...')
    const defaultScripts = getDefaultScripts({
      typescript: usesTypeScript,
      stylelintTargets,
    })
    packageJson.scripts = mergeScripts(
      packageJson.scripts || {},
      defaultScripts
    )

    // Add devDependencies
    console.log('📦 Adding devDependencies...')
    const defaultDevDependencies = getDefaultDevDependencies({
      typescript: usesTypeScript,
    })
    packageJson.devDependencies = mergeDevDependencies(
      packageJson.devDependencies || {},
      defaultDevDependencies
    )

    // Add lint-staged configuration
    console.log('⚙️ Adding lint-staged configuration...')
    const defaultLintStaged = getDefaultLintStaged({
      typescript: usesTypeScript,
      stylelintTargets,
      python: usesPython,
    })

    const hasExistingCssPatterns = Object.keys(
      packageJson['lint-staged'] || {}
    ).some(patternIncludesStylelintExtension)

    if (hasExistingCssPatterns) {
      console.log(
        'ℹ️ Detected existing lint-staged CSS globs; preserving current CSS targets'
      )
    }

    packageJson['lint-staged'] = mergeLintStaged(
      packageJson['lint-staged'] || {},
      defaultLintStaged,
      { stylelintTargets },
      patternIncludesStylelintExtension
    )

    // Write updated package.json using @npmcli/package-json
    try {
      const PackageJson = checkNodeVersionAndLoadPackageJson()
      let pkgJson
      if (fs.existsSync(packageJsonPath)) {
        // Load existing package.json
        pkgJson = await PackageJson.load(process.cwd())
        // Update with our changes
        Object.assign(pkgJson.content, packageJson)
      } else {
        // Create new package.json
        pkgJson = await PackageJson.create(process.cwd())
        Object.assign(pkgJson.content, packageJson)
      }

      await pkgJson.save()
      console.log('✅ Updated package.json')
    } catch (error) {
      console.error(`❌ Error writing package.json: ${error.message}`)
      process.exit(1)
    }

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

    // Copy Lighthouse CI config if it doesn't exist
    const lighthousercPath = path.join(process.cwd(), '.lighthouserc.js')
    if (!fs.existsSync(lighthousercPath)) {
      const templateLighthouserc = fs.readFileSync(
        path.join(__dirname, 'config', '.lighthouserc.js'),
        'utf8'
      )
      fs.writeFileSync(lighthousercPath, templateLighthouserc)
      console.log('✅ Added Lighthouse CI configuration')
    }

    // Copy ESLint ignore if it doesn't exist
    const eslintignorePath = path.join(process.cwd(), '.eslintignore')
    const templateEslintIgnorePath = path.join(__dirname, '.eslintignore')
    if (
      !fs.existsSync(eslintignorePath) &&
      fs.existsSync(templateEslintIgnorePath)
    ) {
      const templateEslintIgnore = fs.readFileSync(
        templateEslintIgnorePath,
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

    // Ensure .gitignore exists with essential entries
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    if (!fs.existsSync(gitignorePath)) {
      const essentialGitignore = `# Dependencies
node_modules/
.pnpm-store/

# Environment variables
.env*

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build outputs
dist/
build/
.next/
.nuxt/
.output/
.vercel/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Coverage
coverage/
.nyc_output/

# Cache
.cache/
.parcel-cache/
.turbo/
`
      fs.writeFileSync(gitignorePath, essentialGitignore)
      console.log('✅ Added .gitignore with essential entries')
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

    // Ensure engines/volta pins in target package.json (enforce minimums)
    try {
      if (fs.existsSync(packageJsonPath)) {
        const PackageJson = checkNodeVersionAndLoadPackageJson()
        const pkgJson = await PackageJson.load(process.cwd())

        // Preserve existing engines but enforce Node >=20 minimum
        const existingEngines = pkgJson.content.engines || {}
        pkgJson.content.engines = {
          ...existingEngines,
          node: '>=20', // Always enforce our minimum
        }

        // Preserve existing volta but set our pinned versions
        const existingVolta = pkgJson.content.volta || {}
        pkgJson.content.volta = {
          ...existingVolta,
          node: '20.11.1',
          npm: '10.2.4',
        }

        await pkgJson.save()
        console.log(
          '✅ Ensured engines and Volta pins in package.json (Node >=20 enforced)'
        )
      }
    } catch (e) {
      console.warn(
        '⚠️ Could not update engines/volta in package.json:',
        e.message
      )
    }

    // Python quality automation setup
    if (usesPython) {
      console.log('\n🐍 Setting up Python quality automation...')

      // Copy pyproject.toml if it doesn't exist
      const pyprojectPath = path.join(process.cwd(), 'pyproject.toml')
      if (!fs.existsSync(pyprojectPath)) {
        const templatePyproject = fs.readFileSync(
          path.join(__dirname, 'config/pyproject.toml'),
          'utf8'
        )
        fs.writeFileSync(pyprojectPath, templatePyproject)
        console.log(
          '✅ Added pyproject.toml with Black, Ruff, isort, mypy config'
        )
      }

      // Copy pre-commit config
      const preCommitPath = path.join(process.cwd(), '.pre-commit-config.yaml')
      if (!fs.existsSync(preCommitPath)) {
        const templatePreCommit = fs.readFileSync(
          path.join(__dirname, 'config/.pre-commit-config.yaml'),
          'utf8'
        )
        fs.writeFileSync(preCommitPath, templatePreCommit)
        console.log('✅ Added .pre-commit-config.yaml')
      }

      // Copy requirements-dev.txt
      const requirementsDevPath = path.join(
        process.cwd(),
        'requirements-dev.txt'
      )
      if (!fs.existsSync(requirementsDevPath)) {
        const templateRequirements = fs.readFileSync(
          path.join(__dirname, 'config/requirements-dev.txt'),
          'utf8'
        )
        fs.writeFileSync(requirementsDevPath, templateRequirements)
        console.log('✅ Added requirements-dev.txt')
      }

      // Copy Python workflow
      const pythonWorkflowFile = path.join(workflowDir, 'quality-python.yml')
      if (!fs.existsSync(pythonWorkflowFile)) {
        const templatePythonWorkflow = fs.readFileSync(
          path.join(__dirname, 'config/quality-python.yml'),
          'utf8'
        )
        fs.writeFileSync(pythonWorkflowFile, templatePythonWorkflow)
        console.log('✅ Added Python GitHub Actions workflow')
      }

      // Create tests directory if it doesn't exist
      const testsDir = path.join(process.cwd(), 'tests')
      if (!fs.existsSync(testsDir)) {
        fs.mkdirSync(testsDir)
        fs.writeFileSync(path.join(testsDir, '__init__.py'), '')
        console.log('✅ Created tests directory')
      }

      // Add Python helper scripts to package.json if it exists and is a JS/TS project too
      if (fs.existsSync(packageJsonPath)) {
        try {
          const PackageJson = checkNodeVersionAndLoadPackageJson()
          const pkgJson = await PackageJson.load(process.cwd())

          const pythonScripts = {
            'python:format': 'black .',
            'python:format:check': 'black --check .',
            'python:lint': 'ruff check .',
            'python:lint:fix': 'ruff check --fix .',
            'python:type-check': 'mypy .',
            'python:quality':
              'black --check . && ruff check . && isort --check-only . && mypy .',
            'python:test': 'pytest',
          }

          if (!pkgJson.content.scripts) {
            pkgJson.content.scripts = {}
          }
          // Use mergeScripts to preserve existing scripts
          pkgJson.content.scripts = mergeScripts(
            pkgJson.content.scripts,
            pythonScripts
          )
          await pkgJson.save()
          console.log('✅ Added Python helper scripts to package.json')
        } catch (e) {
          console.warn(
            '⚠️ Could not add Python scripts to package.json:',
            e.message
          )
        }
      }
    }

    console.log('\n🎉 Quality automation setup complete!')

    // Dynamic next steps based on detected languages
    console.log('\n📋 Next steps:')

    if (usesPython && fs.existsSync(packageJsonPath)) {
      console.log('JavaScript/TypeScript setup:')
      console.log('1. Run: npm install')
      console.log('2. Run: npm run prepare')
      console.log('\nPython setup:')
      console.log('3. Run: python3 -m pip install -r requirements-dev.txt')
      console.log('4. Run: pre-commit install')
      console.log('\n5. Commit your changes to activate both workflows')
    } else if (usesPython) {
      console.log('Python setup:')
      console.log('1. Run: python3 -m pip install -r requirements-dev.txt')
      console.log('2. Run: pre-commit install')
      console.log('3. Commit your changes to activate the workflow')
    } else {
      console.log('1. Run: npm install')
      console.log('2. Run: npm run prepare')
      console.log('3. Commit your changes to activate the workflow')
    }
    console.log('\n✨ Your project now has:')
    console.log('  • Prettier code formatting')
    console.log('  • Pre-commit hooks via Husky')
    console.log('  • GitHub Actions quality checks')
    console.log('  • Lint-staged for efficient processing')
  } // End of runMainSetup function

  // Handle interactive mode if requested, then run main setup
  ;(async function startSetup() {
    // Check if interactive mode is explicitly requested
    if (isInteractiveRequested) {
      const prompt = new InteractivePrompt()

      // Check TTY availability
      if (!prompt.isTTY()) {
        console.error(
          '❌ Interactive mode requires a TTY environment (interactive terminal).'
        )
        console.error(
          '   For non-interactive use, please specify flags directly.'
        )
        console.error('   Run with --help to see available options.\n')
        process.exit(1)
      }

      // Run interactive flow
      try {
        const interactiveFlags = await runInteractiveFlow(prompt)
        console.log(
          `\n🚀 Running setup with options: ${interactiveFlags.join(' ')}\n`
        )

        // Note: In this initial implementation, we're just showing what flags
        // would be used. A future enhancement could re-parse flags and re-run.
        // For now, interactive mode is informational and guides the user.
        console.log('💡 To run with these options non-interactively, use:')
        console.log(
          `   npx create-quality-automation@latest ${interactiveFlags.join(' ')}\n`
        )
        console.log('Continuing with default setup for now...\n')
      } catch (error) {
        if (error.message.includes('cancelled')) {
          // User cancelled
          process.exit(0)
        }
        console.error(`❌ Interactive mode error: ${error.message}\n`)
        process.exit(1)
      }
    }

    // Run main setup
    await runMainSetup()
  })().catch(error => {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  })
} // End of normal setup flow
