#!/usr/bin/env node

/**
 * CLAUDE.md Validation Script
 *
 * Validates the CLAUDE.md file for consistency and completeness.
 * Part of the automated CLAUDE.md maintenance system.
 *
 * Checks:
 * - File exists
 * - Has required sections
 * - Package name matches package.json
 * - Version references are current
 * - Command references are valid
 * - No outdated patterns
 */

const fs = require('fs')
const path = require('path')

const REQUIRED_SECTIONS = [
  'Project Information',
  'Project-Specific Commands',
  'Development Workflow',
  'Quality Automation Features',
  'Development Notes',
]

const OUTDATED_PATTERNS = [
  { pattern: /ESLint 8/i, message: 'References ESLint 8 (should be ESLint 9)' },
  { pattern: /Husky 8/i, message: 'References Husky 8 (should be Husky 9)' },
  {
    pattern: /Node\.js \d{1,2}\.x/i,
    message: 'Uses outdated Node.js version format',
  },
]

function readPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(packagePath)) {
    throw new Error('package.json not found')
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'))
}

function readClaudeMd() {
  const claudePath = path.join(process.cwd(), 'CLAUDE.md')
  if (!fs.existsSync(claudePath)) {
    throw new Error('CLAUDE.md not found')
  }
  return fs.readFileSync(claudePath, 'utf8')
}

function validateSections(content) {
  const errors = []

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      errors.push(`Missing required section: ${section}`)
    }
  }

  return errors
}

function validatePackageReferences(content, pkg) {
  const errors = []

  // Check package name
  if (!content.includes(pkg.name)) {
    errors.push(`Package name "${pkg.name}" not mentioned in CLAUDE.md`)
  }

  // Check CLI command if it exists
  if (pkg.bin) {
    const cliCommand = Object.keys(pkg.bin)[0]
    if (!content.includes(cliCommand)) {
      errors.push(`CLI command "${cliCommand}" not documented in CLAUDE.md`)
    }
  }

  return errors
}

function validateScriptReferences(content, pkg) {
  const errors = []
  const warnings = []

  // Get all npm scripts
  const scripts = pkg.scripts || {}

  // Critical scripts that should be documented
  const criticalScripts = ['lint', 'format', 'test', 'setup']

  for (const scriptName of criticalScripts) {
    if (scripts[scriptName] && !content.includes(`npm run ${scriptName}`)) {
      warnings.push(
        `Critical script "npm run ${scriptName}" not documented in CLAUDE.md`
      )
    }
  }

  return { errors, warnings }
}

function checkOutdatedPatterns(content) {
  const warnings = []

  for (const { pattern, message } of OUTDATED_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`Outdated pattern detected: ${message}`)
    }
  }

  return warnings
}

function validateNodeVersion(content, pkg) {
  const warnings = []

  if (pkg.engines && pkg.engines.node) {
    const nodeVersion = pkg.engines.node
    // Extract major version (e.g., ">=20" -> "20")
    const majorVersion = nodeVersion.match(/\d+/)?.[0]

    if (majorVersion && !content.includes(`Node.js ≥${majorVersion}`)) {
      warnings.push(
        `Node.js version requirement (${nodeVersion}) not clearly documented`
      )
    }
  }

  return warnings
}

function main() {
  console.log('🔍 Validating CLAUDE.md...\n')

  try {
    const pkg = readPackageJson()
    const content = readClaudeMd()

    let hasErrors = false
    let hasWarnings = false

    // Run all validations
    const sectionErrors = validateSections(content)
    const packageErrors = validatePackageReferences(content, pkg)
    const { errors: scriptErrors, warnings: scriptWarnings } =
      validateScriptReferences(content, pkg)
    const outdatedWarnings = checkOutdatedPatterns(content)
    const versionWarnings = validateNodeVersion(content, pkg)

    // Collect all errors
    const allErrors = [...sectionErrors, ...packageErrors, ...scriptErrors]
    const allWarnings = [
      ...scriptWarnings,
      ...outdatedWarnings,
      ...versionWarnings,
    ]

    // Display errors
    if (allErrors.length > 0) {
      hasErrors = true
      console.error('❌ ERRORS:\n')
      allErrors.forEach(error => console.error(`  - ${error}`))
      console.error('')
    }

    // Display warnings
    if (allWarnings.length > 0) {
      hasWarnings = true
      console.warn('⚠️  WARNINGS:\n')
      allWarnings.forEach(warning => console.warn(`  - ${warning}`))
      console.warn('')
    }

    // Summary
    if (!hasErrors && !hasWarnings) {
      console.log('✅ CLAUDE.md validation passed!\n')
      process.exit(0)
    } else if (hasErrors) {
      console.error(
        `❌ CLAUDE.md validation failed with ${allErrors.length} error(s) and ${allWarnings.length} warning(s)\n`
      )
      process.exit(1)
    } else {
      console.warn(
        `⚠️  CLAUDE.md validation passed with ${allWarnings.length} warning(s)\n`
      )
      process.exit(0)
    }
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}\n`)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { main }
