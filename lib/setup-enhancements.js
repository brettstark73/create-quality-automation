/**
 * Setup Enhancements
 * Critical fixes to prevent production issues that bypassed reviews and tests
 */

const fs = require('fs')
const path = require('path')
const {
  generateTestsTypeScriptConfig,
  getEnhancedTypeScriptScripts,
  getEnhancedLintStaged,
  detectProjectType,
  getProjectQualityConfig,
} = require('./typescript-config-generator')

const {
  applySecurityFirstConfiguration,
  getSecurityScripts,
} = require('./security-enhancements')

/**
 * Apply critical quality fixes that prevent production issues
 * These fixes address gaps that allowed 13+ TypeScript errors to reach production
 */
function applyProductionQualityFixes(projectPath = '.', options = {}) {
  const {
    hasTypeScript = false,
    hasPython = false,
    skipTypeScriptTests = false,
  } = options

  console.log('\n🔧 Applying Critical Quality Fixes...')

  const fixes = []

  // Fix 1: Generate tests/tsconfig.json (CRITICAL)
  if (hasTypeScript && !skipTypeScriptTests) {
    try {
      const testsTsConfigPath = generateTestsTypeScriptConfig(projectPath)
      fixes.push(
        `✅ Created ${testsTsConfigPath} - TypeScript now validates test files`
      )
      console.log('   🎯 Fix: TypeScript errors in tests will now be caught')
    } catch (error) {
      console.warn(
        `⚠️  Could not generate tests TypeScript config: ${error.message}`
      )
    }
  }

  // Fix 2: Enhanced npm scripts with comprehensive quality gates
  const enhancedScripts = getEnhancedTypeScriptScripts()
  fixes.push('✅ Added comprehensive npm scripts:')
  fixes.push('   • type-check:all - validates both src and tests')
  fixes.push('   • quality:check - comprehensive pre-commit gate')
  fixes.push('   • quality:ci - full CI validation')

  // Fix 3: Project-specific quality configuration
  const projectType = detectProjectType(projectPath)
  const qualityConfig = getProjectQualityConfig(projectType)

  fixes.push(`✅ Detected project type: ${projectType}`)
  fixes.push(`   🎯 Applied ${projectType}-specific quality standards`)

  // Fix 4: Enhanced pre-commit hooks
  const enhancedLintStaged = getEnhancedLintStaged(hasPython, hasTypeScript)
  fixes.push('✅ Enhanced pre-commit hooks:')
  if (hasTypeScript) {
    fixes.push('   • TypeScript validation on ALL .ts/.tsx files')
    fixes.push('   • Separate test TypeScript validation')
  }
  fixes.push('   • Comprehensive ESLint + Prettier + Stylelint')

  // Fix 5: Copy quality troubleshooting guide
  copyQualityTroubleshootingGuide(projectPath)
  fixes.push('✅ Added QUALITY_TROUBLESHOOTING.md')
  fixes.push('   🎯 Diagnostic commands for common production issues')

  // Fix 6: Copy integration test templates based on project type
  copyIntegrationTestTemplates(projectPath, projectType)
  fixes.push(`✅ Added ${projectType} integration test templates`)

  // Fix 7: Apply security-first configuration
  const securityFixes = applySecurityFirstConfiguration(projectPath)
  fixes.push('✅ Applied security-first configuration:')
  securityFixes.forEach(fix => fixes.push(`   ${fix}`))

  // Fix 8: Add comprehensive security scripts
  const securityScripts = getSecurityScripts()
  fixes.push('✅ Added comprehensive security scripts:')
  fixes.push('   • security:check - all security validations')
  fixes.push('   • security:secrets - secret scanning')
  fixes.push('   • security:audit - dependency vulnerabilities')

  return {
    enhancedScripts: { ...enhancedScripts, ...securityScripts },
    enhancedLintStaged,
    projectType,
    qualityConfig,
    fixes,
  }
}

/**
 * Copy quality troubleshooting guide to project
 */
function copyQualityTroubleshootingGuide(projectPath) {
  const sourcePath = path.join(
    __dirname,
    '../templates/QUALITY_TROUBLESHOOTING.md'
  )
  const destPath = path.join(projectPath, 'QUALITY_TROUBLESHOOTING.md')

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath)
  }
}

/**
 * Copy integration test templates based on project type
 */
function copyIntegrationTestTemplates(projectPath, projectType) {
  const templatesDir = path.join(__dirname, '../templates/integration-tests')
  const targetTestsDir = path.join(projectPath, 'tests', 'integration')

  // Create integration tests directory
  if (!fs.existsSync(targetTestsDir)) {
    fs.mkdirSync(targetTestsDir, { recursive: true })
  }

  // Copy project-type-specific template
  const templateFile = `${projectType}.test.js`
  const sourcePath = path.join(templatesDir, templateFile)
  const destPath = path.join(targetTestsDir, 'example.test.js')

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath)

    // Add README explaining the template
    const readmePath = path.join(targetTestsDir, 'README.md')
    const readmeContent = `# Integration Tests

This directory contains integration tests for your ${projectType}.

## Getting Started

1. Review \`example.test.js\` for patterns specific to ${projectType} projects
2. Rename and customize the example test for your use case
3. Run integration tests: \`npm run test:integration\`

## Test Types for ${projectType}

${getTestTypesDocumentation(projectType)}

## Troubleshooting

See \`QUALITY_TROUBLESHOOTING.md\` in the project root for common issues.
`
    fs.writeFileSync(readmePath, readmeContent)
  }
}

/**
 * Get test types documentation for project type
 */
function getTestTypesDocumentation(projectType) {
  const docs = {
    'api-service': `
- **Unit Tests**: Individual functions and modules
- **Integration Tests**: Database operations, API endpoints
- **E2E Tests**: Full request/response cycles
- **Performance Tests**: Load testing, concurrency
`,
    'frontend-app': `
- **Unit Tests**: Components, utilities, hooks
- **Integration Tests**: Component interactions, forms
- **E2E Tests**: Browser automation, user flows
- **Accessibility Tests**: Screen reader, keyboard navigation
`,
    'cli-tool': `
- **Unit Tests**: Individual commands and utilities
- **Integration Tests**: File operations, command execution
- **Command Tests**: CLI argument parsing, exit codes
- **Cross-platform Tests**: Windows, macOS, Linux compatibility
`,
    library: `
- **Unit Tests**: Public API methods
- **Integration Tests**: Module interactions
- **Type Tests**: TypeScript definitions
- **Bundle Tests**: Distribution package validation
`,
  }

  return (
    docs[projectType] ||
    `
- **Unit Tests**: Individual functions and modules
- **Integration Tests**: System component interactions
- **E2E Tests**: Full application workflows
`
  )
}

/**
 * Generate comprehensive pre-commit hook
 * This replaces the narrow CLAUDE.md-only validation
 */
function generateEnhancedPreCommitHook(hasTypeScript, _hasPython) {
  let hook = `#!/usr/bin/env sh
# Enhanced pre-commit hook - prevents production issues

echo "🔍 Running comprehensive quality checks..."

# Run lint-staged (file-specific checks)
npx lint-staged

# Critical: TypeScript validation on ALL files
`

  if (hasTypeScript) {
    hook += `echo "🔧 Checking TypeScript..."
if ! npm run type-check:all; then
  echo "❌ TypeScript validation failed"
  echo "💡 Run: npm run type-check:all to see errors"
  echo "📖 See QUALITY_TROUBLESHOOTING.md for help"
  exit 1
fi

`
  }

  hook += `# Fast test suite for immediate feedback
echo "🧪 Running fast tests..."
if ! npm run test:fast --if-present; then
  echo "❌ Fast tests failed"
  echo "💡 Run: npm test for details"
  echo "📖 See QUALITY_TROUBLESHOOTING.md for help"
  exit 1
fi

echo "✅ All quality checks passed"
`

  return hook
}

/**
 * Validate project setup for common gaps
 * This catches configuration issues that cause production problems
 */
function validateProjectSetup(projectPath = '.') {
  const warnings = []
  const errors = []

  // Check 1: TypeScript configuration completeness
  const tsConfigPath = path.join(projectPath, 'tsconfig.json')
  const testsTsConfigPath = path.join(projectPath, 'tests/tsconfig.json')

  if (fs.existsSync(tsConfigPath) && !fs.existsSync(testsTsConfigPath)) {
    errors.push(
      '❌ CRITICAL: TypeScript config exists but tests/tsconfig.json missing'
    )
    errors.push(
      '   🎯 This allows TypeScript errors in tests to reach production'
    )
    errors.push(
      '   💡 Fix: create-quality-automation will generate tests/tsconfig.json'
    )
  }

  // Check 2: Pre-commit hook comprehensiveness
  const preCommitPath = path.join(projectPath, '.husky/pre-commit')
  if (fs.existsSync(preCommitPath)) {
    const preCommitContent = fs.readFileSync(preCommitPath, 'utf8')

    if (!preCommitContent.includes('type-check')) {
      warnings.push('⚠️  Pre-commit hook missing TypeScript validation')
      warnings.push('   💡 Add: npm run type-check:all to .husky/pre-commit')
    }

    if (!preCommitContent.includes('test')) {
      warnings.push('⚠️  Pre-commit hook missing test validation')
      warnings.push('   💡 Add: npm run test:fast to .husky/pre-commit')
    }
  }

  // Check 3: Quality gate scripts
  const packageJsonPath = path.join(projectPath, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const scripts = packageJson.scripts || {}

    if (!scripts['type-check:all']) {
      warnings.push('⚠️  Missing comprehensive TypeScript validation script')
      warnings.push(
        '   💡 Add: "type-check:all": "npm run type-check && npm run type-check:tests"'
      )
    }

    if (!scripts['quality:check']) {
      warnings.push('⚠️  Missing comprehensive quality check script')
      warnings.push(
        '   💡 Add: "quality:check": "npm run type-check:all && npm run lint && npm test"'
      )
    }
  }

  return { warnings, errors }
}

module.exports = {
  applyProductionQualityFixes,
  copyQualityTroubleshootingGuide,
  copyIntegrationTestTemplates,
  generateEnhancedPreCommitHook,
  validateProjectSetup,
}
