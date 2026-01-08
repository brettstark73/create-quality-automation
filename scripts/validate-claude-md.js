#!/usr/bin/env node
'use strict'

/**
 * Validates CLAUDE.md consistency with package.json
 * Checks that package name and version are correctly referenced
 */

const fs = require('fs')
const path = require('path')

function validateClaudeMd() {
  console.log('🔍 Validating CLAUDE.md...\n')

  // Read package.json
  const packagePath = path.join(__dirname, '..', 'package.json')
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found')
    process.exit(1)
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  const packageName = pkg.name
  const packageVersion = pkg.version

  // Read CLAUDE.md
  const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md')
  if (!fs.existsSync(claudeMdPath)) {
    console.error('❌ CLAUDE.md not found')
    process.exit(1)
  }

  const claudeMd = fs.readFileSync(claudeMdPath, 'utf8')

  let errors = 0

  // Check for package name reference
  if (!claudeMd.includes(packageName)) {
    console.error(
      `❌ CLAUDE.md does not reference package name: ${packageName}`
    )
    errors++
  } else {
    console.log(`✅ Package name referenced: ${packageName}`)
  }

  // Check for version reference (optional - just warn)
  if (!claudeMd.includes(packageVersion)) {
    console.warn(
      `⚠️  CLAUDE.md does not reference current version: ${packageVersion}`
    )
    console.warn('   This is not a critical error, but consider updating.')
  } else {
    console.log(`✅ Version referenced: ${packageVersion}`)
  }

  // Basic content checks
  const requiredSections = ['Project Overview', 'Commands', 'Architecture']

  requiredSections.forEach(section => {
    if (!claudeMd.includes(section)) {
      console.error(`❌ Missing required section: ${section}`)
      errors++
    } else {
      console.log(`✅ Section found: ${section}`)
    }
  })

  console.log()

  if (errors > 0) {
    console.error(`❌ CLAUDE.md validation failed with ${errors} error(s)`)
    process.exit(1)
  } else {
    console.log('✅ CLAUDE.md validation passed!')
    process.exit(0)
  }
}

validateClaudeMd()
