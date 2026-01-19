'use strict'

const fs = require('fs')
const path = require('path')

/**
 * Tests for template content validation
 * These tests ensure templates match actual implementation and best practices
 */
async function testTemplateContentValidation() {
  console.log('🧪 Testing template content validation...\n')

  await testSmartTestStrategyTemplateExcludesE2E()
  await testSmartStrategyGeneratorExcludesE2E()
  await testHuskyPrepareScriptCIAware()
  await testDefaultsPrepareScriptCIAware()

  console.log('\n✅ All template content validation tests passed!\n')
}

/**
 * Test: Smart test strategy template excludes E2E tests
 * Issue: Template was including E2E tests while implementation excluded them
 */
async function testSmartTestStrategyTemplateExcludesE2E() {
  console.log('🔍 Testing smart test strategy template excludes E2E...')

  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    'scripts',
    'smart-test-strategy.sh'
  )

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }

  const content = fs.readFileSync(templatePath, 'utf8')

  // Test 1: Template should have comment about E2E exclusion
  if (!content.includes('E2E tests') || !content.includes('run in CI only')) {
    throw new Error(
      'Template missing comment about E2E tests running in CI only'
    )
  }

  // Test 2: HIGH RISK section should NOT include test:e2e
  const highRiskSection = content.match(
    /RISK_SCORE -ge 7.*?\{\{TEST_COMPREHENSIVE\}\}/s
  )
  if (!highRiskSection) {
    throw new Error('Could not find HIGH RISK section in template')
  }

  if (highRiskSection[0].includes('test:e2e')) {
    throw new Error(
      'Template HIGH RISK section should NOT include test:e2e (should run in CI only)'
    )
  }

  // Test 3: Should have explicit note about excluding E2E and command tests
  if (!content.includes('E2E and command tests run in CI only')) {
    throw new Error(
      'Template should explicitly state E2E and command tests run in CI only'
    )
  }

  console.log('  ✅ Smart test strategy template correctly excludes E2E tests')
}

/**
 * Test: Smart strategy generator configurations exclude E2E
 * Issue: Generator was including E2E tests in comprehensive commands
 */
async function testSmartStrategyGeneratorExcludesE2E() {
  console.log('🔍 Testing smart strategy generator excludes E2E...')

  const generatorPath = path.join(
    __dirname,
    '..',
    'lib',
    'smart-strategy-generator.js'
  )

  if (!fs.existsSync(generatorPath)) {
    throw new Error(`Generator not found: ${generatorPath}`)
  }

  const content = fs.readFileSync(generatorPath, 'utf8')

  // Test 1: CLI project comprehensive should NOT include test:comprehensive
  const cliSection = content.match(
    /cli:\s*\{[\s\S]*?testCommands:\s*\{[\s\S]*?\},/m
  )
  if (!cliSection) {
    throw new Error('Could not find CLI project configuration')
  }

  if (cliSection[0].includes("'npm run test:comprehensive")) {
    throw new Error(
      'CLI comprehensive command should not use test:comprehensive (includes command tests)'
    )
  }

  // Test 2: Webapp project comprehensive should NOT include test:e2e
  const webappSection = content.match(
    /webapp:\s*\{[\s\S]*?testCommands:\s*\{[\s\S]*?\},/m
  )
  if (!webappSection) {
    throw new Error('Could not find webapp project configuration')
  }

  if (webappSection[0].includes('test:e2e')) {
    throw new Error(
      'Webapp comprehensive command should not include test:e2e (should run in CI only)'
    )
  }

  // Test 3: Should have comments about E2E exclusion
  const hasCliComment = content.includes(
    'Command execution tests excluded from pre-push'
  )
  const hasWebappComment = content.includes('E2E tests excluded from pre-push')

  if (!hasCliComment || !hasWebappComment) {
    throw new Error(
      'Generator should have comments explaining E2E/command test exclusion'
    )
  }

  console.log('  ✅ Smart strategy generator correctly excludes E2E tests')
}

/**
 * Test: Husky prepare script is CI-aware
 * Issue: Husky was trying to install in CI environments, causing failures
 */
async function testHuskyPrepareScriptCIAware() {
  console.log('🔍 Testing Husky prepare script is CI-aware...')

  const packageJsonPath = path.join(__dirname, '..', 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found: ${packageJsonPath}`)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  // Test 1: prepare script should exist
  if (!packageJson.scripts || !packageJson.scripts.prepare) {
    throw new Error('package.json should have a prepare script')
  }

  const prepareScript = packageJson.scripts.prepare

  // Test 2: Should check for CI environment
  if (!prepareScript.includes('$CI')) {
    throw new Error(
      'Prepare script should check $CI environment variable to skip in CI'
    )
  }

  // Test 3: Should skip Husky when CI=true
  if (!prepareScript.includes('Skipping Husky in CI')) {
    throw new Error('Prepare script should have message "Skipping Husky in CI"')
  }

  // Test 4: Should run husky in non-CI environments
  if (!prepareScript.includes('husky')) {
    throw new Error('Prepare script should run husky in non-CI environments')
  }

  // Test 5: Should use conditional logic (&&/||)
  if (!prepareScript.includes('&&') && !prepareScript.includes('||')) {
    throw new Error('Prepare script should use conditional logic to skip in CI')
  }

  console.log('  ✅ Husky prepare script is CI-aware')
}

/**
 * Test: Defaults config includes CI-aware prepare script
 * Issue: Template config didn't have CI-aware Husky setup
 */
async function testDefaultsPrepareScriptCIAware() {
  console.log('🔍 Testing defaults config includes CI-aware prepare...')

  const defaultsPath = path.join(__dirname, '..', 'config', 'defaults.js')

  if (!fs.existsSync(defaultsPath)) {
    throw new Error(`defaults.js not found: ${defaultsPath}`)
  }

  const content = fs.readFileSync(defaultsPath, 'utf8')

  // Test 1: baseScripts should include prepare script
  if (!content.includes('prepare:')) {
    throw new Error('baseScripts should include prepare script')
  }

  // Test 2: Should check for CI environment
  if (!content.includes('$CI')) {
    throw new Error(
      'defaults.js prepare script should check $CI environment variable'
    )
  }

  // Test 3: Should skip Husky in CI
  if (!content.includes('Skipping Husky in CI')) {
    throw new Error('defaults.js prepare script should skip Husky when CI=true')
  }

  // Test 4: Should run husky in non-CI
  if (!content.includes('husky')) {
    throw new Error(
      'defaults.js prepare script should run husky in non-CI environments'
    )
  }

  console.log('  ✅ Defaults config includes CI-aware prepare script')
}

// Run tests
if (require.main === module) {
  testTemplateContentValidation()
    .then(() => {
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message)
      console.error(error.stack)
      process.exit(1)
    })
}

module.exports = { testTemplateContentValidation }
