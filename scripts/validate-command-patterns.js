#!/usr/bin/env node
'use strict'

/**
 * Validates that command patterns in config/defaults.js
 * don't contain known deprecated patterns
 *
 * This prevents issues like the ESLint --ext bug from being committed
 */

const fs = require('fs')
const path = require('path')

const DEPRECATED_PATTERNS = [
  {
    pattern: /eslint.*--ext\s+\S+/,
    message: 'ESLint --ext flag is deprecated in ESLint 9 flat config',
    file: 'config/defaults.js',
    suggestion: 'Use "eslint ." - file selection is in eslint.config.js',
  },
  {
    pattern: /husky install/,
    message: 'husky install is deprecated in Husky 9+',
    file: 'config/defaults.js',
    suggestion: 'Use just "husky" as the prepare script',
  },
  {
    pattern: /prettier.*--no-semi/,
    message: '--no-semi is deprecated in Prettier 3+',
    file: 'config/defaults.js',
    suggestion: 'Use .prettierrc configuration file',
  },
  {
    pattern: /stylelint.*--config\s+\S+/,
    message: 'Stylelint --config flag should use config file',
    file: 'config/defaults.js',
    suggestion: 'Use .stylelintrc.json instead',
  },
]

const FILES_TO_CHECK = [
  'config/defaults.js',
  'setup.js',
  'lib/package-utils.js',
]

function validateFile(filePath, patterns) {
  const fullPath = path.join(__dirname, '..', filePath)

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found: ${filePath} (skipping)`)
    return []
  }

  const content = fs.readFileSync(fullPath, 'utf8')
  const errors = []

  patterns.forEach(({ pattern, message, file, suggestion }) => {
    // Only check patterns for this file
    if (file && file !== filePath) {
      return
    }

    if (pattern.test(content)) {
      errors.push({
        file: filePath,
        message,
        suggestion,
        pattern: pattern.toString(),
      })
    }
  })

  return errors
}

function main() {
  console.log('🔍 Validating command patterns...\n')

  let totalErrors = 0
  const allErrors = []

  FILES_TO_CHECK.forEach(filePath => {
    const errors = validateFile(filePath, DEPRECATED_PATTERNS)
    totalErrors += errors.length
    allErrors.push(...errors)
  })

  if (totalErrors > 0) {
    console.error(`❌ Found ${totalErrors} deprecated pattern(s):\n`)

    allErrors.forEach(({ file, message, suggestion, pattern }) => {
      console.error(`  ${file}:`)
      console.error(`    ❌ ${message}`)
      console.error(`    💡 ${suggestion}`)
      console.error(`    🔎 Pattern: ${pattern}`)
      console.error('')
    })

    console.error('Fix these before committing!\n')
    process.exit(1)
  }

  console.log('✅ No deprecated command patterns found')
  process.exit(0)
}

if (require.main === module) {
  main()
}

module.exports = { validateFile, DEPRECATED_PATTERNS }
