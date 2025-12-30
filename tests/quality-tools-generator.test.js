'use strict'

/**
 * Quality Tools Generator Tests
 * Tests for Lighthouse CI, size-limit, axe-core, commitlint, and coverage threshold generation
 */

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execSync } = require('child_process')

const {
  generateLighthouseConfig,
  generateSizeLimitConfig,
  generateCommitlintConfig,
  generateCommitMsgHook,
  generateCoverageThresholds,
  generateAxeTestSetup,
  writeLighthouseConfig,
  writeCommitlintConfig,
  writeCommitMsgHook,
  getQualityToolsDependencies,
  getQualityToolsScripts,
} = require('../lib/quality-tools-generator')

console.log('🧪 Testing Quality Tools Generator...\n')

// Test 1: Lighthouse CI config generation (basic - Free tier)
console.log('Test 1: Lighthouse CI config generation (basic)')
const basicLighthouseConfig = generateLighthouseConfig({ hasThresholds: false })
assert(basicLighthouseConfig.includes("target: 'temporary-public-storage'"))
assert(basicLighthouseConfig.includes('numberOfRuns: 3'))
assert(basicLighthouseConfig.includes("'categories:accessibility': ['warn'"))
console.log('  ✅ Basic Lighthouse config generated correctly\n')

// Test 2: Lighthouse CI config generation (with thresholds - Pro tier)
console.log('Test 2: Lighthouse CI config generation (with thresholds)')
const proLighthouseConfig = generateLighthouseConfig({ hasThresholds: true })
assert(proLighthouseConfig.includes("preset: 'lighthouse:recommended'"))
assert(proLighthouseConfig.includes("'first-contentful-paint':"))
assert(
  proLighthouseConfig.includes(
    "'categories:performance': ['warn', { minScore: 0.8 }]"
  )
)
console.log('  ✅ Pro Lighthouse config with thresholds generated correctly\n')

// Test 3: size-limit config generation
console.log('Test 3: size-limit config generation')
const sizeLimitConfig = generateSizeLimitConfig({})
assert(Array.isArray(sizeLimitConfig))
assert(sizeLimitConfig.length > 0)
assert(sizeLimitConfig[0].limit !== undefined)
console.log('  ✅ size-limit config generated correctly\n')

// Test 4: commitlint config generation
console.log('Test 4: commitlint config generation')
const commitlintConfig = generateCommitlintConfig()
assert(
  commitlintConfig.includes("extends: ['@commitlint/config-conventional']")
)
assert(commitlintConfig.includes("'type-enum':"))
assert(commitlintConfig.includes("'feat'"))
assert(commitlintConfig.includes("'fix'"))
console.log('  ✅ commitlint config generated correctly\n')

// Test 5: commit-msg hook generation
console.log('Test 5: commit-msg hook generation')
const commitMsgHook = generateCommitMsgHook()
assert(commitMsgHook.includes('#!/bin/sh'))
assert(commitMsgHook.includes('commitlint'))
console.log('  ✅ commit-msg hook generated correctly\n')

// Test 6: coverage thresholds generation
console.log('Test 6: coverage thresholds generation')
const thresholds = generateCoverageThresholds()
assert.strictEqual(thresholds.lines, 70)
assert.strictEqual(thresholds.functions, 70)
assert.strictEqual(thresholds.branches, 60)
assert.strictEqual(thresholds.statements, 70)
console.log('  ✅ coverage thresholds generated with correct defaults\n')

// Test 7: custom coverage thresholds
console.log('Test 7: custom coverage thresholds')
const customThresholds = generateCoverageThresholds({
  lines: 80,
  functions: 85,
  branches: 75,
  statements: 80,
})
assert.strictEqual(customThresholds.lines, 80)
assert.strictEqual(customThresholds.functions, 85)
console.log('  ✅ custom coverage thresholds applied correctly\n')

// Test 8: axe test setup generation
console.log('Test 8: axe test setup generation')
const axeSetup = generateAxeTestSetup()
assert(axeSetup.includes('axe-core'))
assert(axeSetup.includes('import { describe, it, expect'))
assert(axeSetup.includes('accessibility violations'))
console.log('  ✅ axe test setup generated correctly\n')

// Test 9: quality tools dependencies
console.log('Test 9: quality tools dependencies')
const allDeps = getQualityToolsDependencies({
  lighthouse: true,
  sizeLimit: true,
  commitlint: true,
  axeCore: true,
})
assert(allDeps['@lhci/cli'])
assert(allDeps['size-limit'])
assert(allDeps['@commitlint/cli'])
assert(allDeps['axe-core'])
console.log('  ✅ all quality tools dependencies included\n')

// Test 10: quality tools scripts
console.log('Test 10: quality tools scripts')
const allScripts = getQualityToolsScripts({
  lighthouse: true,
  sizeLimit: true,
  axeCore: true,
  coverage: true,
})
assert(allScripts['lighthouse:ci'])
assert(allScripts['size'])
assert(allScripts['test:a11y'])
assert(allScripts['test:coverage:check'])
console.log('  ✅ all quality tools scripts included\n')

// Test 11: File writing - Lighthouse config
console.log('Test 11: File writing - Lighthouse config')
const tempDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'qta-test-'))
writeLighthouseConfig(tempDir1, { hasThresholds: true })
const lighthousePath = path.join(tempDir1, 'lighthouserc.js')
assert(fs.existsSync(lighthousePath))
const writtenConfig = fs.readFileSync(lighthousePath, 'utf8')
assert(writtenConfig.includes('module.exports'))
fs.rmSync(tempDir1, { recursive: true, force: true })
console.log('  ✅ Lighthouse config written to file correctly\n')

// Test 12: File writing - commitlint + hook
console.log('Test 12: File writing - commitlint + hook')
const tempDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'qta-test-'))
execSync('git init', { cwd: tempDir2, stdio: 'ignore' })
writeCommitlintConfig(tempDir2)
writeCommitMsgHook(tempDir2)
const commitlintPath = path.join(tempDir2, 'commitlint.config.js')
const hookPath = path.join(tempDir2, '.husky', 'commit-msg')
assert(fs.existsSync(commitlintPath))
assert(fs.existsSync(hookPath))
// Check hook is executable
const hookStats = fs.statSync(hookPath)
assert((hookStats.mode & 0o111) !== 0, 'commit-msg hook should be executable')
fs.rmSync(tempDir2, { recursive: true, force: true })
console.log('  ✅ commitlint config and hook written correctly\n')

// Test 13: Selective dependencies
console.log('Test 13: Selective dependencies')
const lighthouseOnlyDeps = getQualityToolsDependencies({ lighthouse: true })
assert(lighthouseOnlyDeps['@lhci/cli'])
assert(!lighthouseOnlyDeps['size-limit'])
assert(!lighthouseOnlyDeps['@commitlint/cli'])
console.log('  ✅ selective dependencies work correctly\n')

// Test 14: Selective scripts
console.log('Test 14: Selective scripts')
const coverageOnlyScripts = getQualityToolsScripts({ coverage: true })
assert(coverageOnlyScripts['test:coverage'])
assert(coverageOnlyScripts['test:coverage:check'])
assert(!coverageOnlyScripts['lighthouse:ci'])
console.log('  ✅ selective scripts work correctly\n')

console.log('🎉 All Quality Tools Generator Tests Passed!\n')
console.log('✅ Lighthouse CI config generation (basic + Pro)')
console.log('✅ size-limit config generation')
console.log('✅ commitlint config generation')
console.log('✅ commit-msg hook generation')
console.log('✅ Coverage thresholds (default + custom)')
console.log('✅ axe-core test setup generation')
console.log('✅ Dependencies and scripts helpers')
console.log('✅ File writing functions')
