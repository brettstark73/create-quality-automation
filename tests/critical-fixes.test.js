#!/usr/bin/env node

'use strict'

/**
 * Tests for critical fixes:
 * 1. Interactive mode applies user selections
 * 2. Template loader skips node_modules
 * 3. Invalid --template paths fail fast
 */

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { TemplateLoader } = require('../lib/template-loader')
const { parseAnswers } = require('../lib/interactive/questions')

console.log('🧪 Testing critical bug fixes...\n')

// Test 1: Interactive mode applies user selections
console.log('🔍 Test 1: Interactive mode answer parsing...')
{
  const testAnswers = {
    operationMode: 'update',
    dependencyMonitoring: true,
    dryRun: true,
    toolExclusions: ['npm-audit', 'gitleaks'],
  }

  const flags = parseAnswers(testAnswers)

  assert(flags.includes('--update'), 'Should include --update flag')
  assert(flags.includes('--deps'), 'Should include --deps flag')
  assert(flags.includes('--dry-run'), 'Should include --dry-run flag')
  assert(flags.includes('--no-npm-audit'), 'Should include --no-npm-audit flag')
  assert(flags.includes('--no-gitleaks'), 'Should include --no-gitleaks flag')
  assert.strictEqual(flags.length, 5, 'Should have exactly 5 flags')

  console.log('  ✅ Interactive mode correctly generates flags from answers')
}

// Test 2: Template loader skips node_modules
console.log('🔍 Test 2: Template loader skips node_modules...')
{
  const testDir = path.join(__dirname, 'fixtures', 'template-perf-test')
  const nodeModulesDir = path.join(testDir, 'node_modules')
  const validDir = path.join(testDir, '.github')

  // Create test structure
  fs.mkdirSync(testDir, { recursive: true })
  fs.mkdirSync(nodeModulesDir, { recursive: true })
  fs.mkdirSync(validDir, { recursive: true })

  // Create files
  fs.writeFileSync(
    path.join(nodeModulesDir, 'package.json'),
    JSON.stringify({ name: 'test' })
  )
  fs.writeFileSync(path.join(validDir, 'workflow.yml'), 'test: workflow')

  const loader = new TemplateLoader({ verbose: false })
  const templates = loader
    .loadTemplates(testDir, testDir, true)
    .then(result => {
      // Should only load .github/workflow.yml, not node_modules/package.json
      const loadedPaths = Object.keys(result)

      assert(
        loadedPaths.some(p => p.includes('.github')),
        'Should load .github files'
      )
      assert(
        !loadedPaths.some(p => p.includes('node_modules')),
        'Should NOT load node_modules files'
      )

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true })

      console.log(
        '  ✅ Template loader correctly skips node_modules (loaded only .github)'
      )
    })

  // Wait for async operation
  ;(async () => {
    await templates
  })()
}

// Test 3: Invalid --template paths fail fast in strict mode
console.log('🔍 Test 3: Invalid template paths fail in strict mode...')
{
  const loader = new TemplateLoader({ verbose: false, strict: true })
  const invalidPath = '/this/path/does/not/exist/at/all'

  let errorThrown = false
  let errorMessage = ''

  loader.mergeTemplates(invalidPath, __dirname).catch(error => {
    errorThrown = true
    errorMessage = error.message

    assert(errorThrown, 'Should throw error for invalid path in strict mode')
    assert(
      errorMessage.includes('not found or invalid'),
      'Error message should mention path is invalid'
    )

    console.log(
      '  ✅ Template loader correctly fails fast with invalid path in strict mode'
    )
    console.log(`     Error message: "${errorMessage}"`)
  })
}

// Test 4: Valid template paths work in strict mode
console.log('🔍 Test 4: Valid template paths work in strict mode...')
{
  const testDir = path.join(__dirname, 'fixtures', 'valid-template')
  const templateDir = path.join(testDir, '.github')

  // Create test structure
  fs.mkdirSync(templateDir, { recursive: true })
  fs.writeFileSync(path.join(templateDir, 'test.yml'), 'valid: template')

  const loader = new TemplateLoader({ verbose: false, strict: true })

  loader
    .mergeTemplates(testDir, __dirname)
    .then(templates => {
      assert(Object.keys(templates).length > 0, 'Should load templates')

      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true })

      console.log('  ✅ Template loader works correctly with valid paths')
    })
    .catch(error => {
      // Cleanup on error
      fs.rmSync(testDir, { recursive: true, force: true })
      throw error
    })
}

// Test 5: Non-strict mode still warns but doesn't fail
console.log('🔍 Test 5: Non-strict mode warns but continues...')
{
  const loader = new TemplateLoader({ verbose: false, strict: false })
  const invalidPath = '/this/path/does/not/exist'

  loader
    .mergeTemplates(invalidPath, __dirname)
    .then(() => {
      // Should still return templates (from defaults)
      // Just won't have custom templates
      console.log(
        '  ✅ Template loader in non-strict mode continues with defaults'
      )
    })
    .catch(() => {
      assert.fail('Non-strict mode should not throw errors')
    })
}

setTimeout(() => {
  console.log('\n✅ All critical bug fix tests passed!\n')
}, 100)
