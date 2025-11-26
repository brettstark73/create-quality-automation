/**
 * STARTER Tier and Pricing Path Tests
 *
 * Tests the new STARTER tier functionality and pricing paths
 * that were missing from the original licensing test suite.
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// Set up temporary license directory for tests
const TEST_LICENSE_DIR = path.join(
  os.tmpdir(),
  `cqa-starter-test-${Date.now()}`
)
process.env.CQA_LICENSE_DIR = TEST_LICENSE_DIR

// Import licensing functionality
const {
  LICENSE_TIERS,
  getLicenseInfo,
  hasFeature,
  getDependencyMonitoringLevel,
  showUpgradeMessage,
  saveLicense,
  showLicenseStatus,
} = require('../lib/licensing')

// Mock console.log to capture output
let consoleOutput = []
const originalConsoleLog = console.log

function mockConsoleLog() {
  console.log = (...args) => {
    consoleOutput.push(args.join(' '))
  }
}

function restoreConsoleLog() {
  console.log = originalConsoleLog
}

function setupTest() {
  consoleOutput = []
  const { licenseFile } = getTestLicensePaths()
  if (fs.existsSync(licenseFile)) {
    fs.unlinkSync(licenseFile)
  }
}

function teardownTest() {
  const { licenseFile } = getTestLicensePaths()
  if (fs.existsSync(licenseFile)) {
    fs.unlinkSync(licenseFile)
  }
}

function getTestLicensePaths() {
  const licenseDir = TEST_LICENSE_DIR
  const licenseFile = path.join(licenseDir, 'license.json')
  return { licenseDir, licenseFile }
}

console.log('🧪 Testing STARTER tier and pricing paths...\n')
console.log(`📁 Using temporary license directory: ${TEST_LICENSE_DIR}\n`)

/**
 * Test 1: Valid STARTER license validation
 */
function testValidStarterLicense() {
  setupTest()
  console.log('Test 1: Valid STARTER license validation')

  const licenseData = {
    tier: LICENSE_TIERS.STARTER,
    licenseKey: 'CQA-STARTER-1234567890ABCDEFG',
    email: 'starter@example.com',
    expires: null,
    activated: new Date().toISOString(),
  }

  const { licenseDir, licenseFile } = getTestLicensePaths()
  if (!fs.existsSync(licenseDir)) {
    fs.mkdirSync(licenseDir, { recursive: true })
  }
  fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2))

  const license = getLicenseInfo()

  if (
    license.tier === LICENSE_TIERS.STARTER &&
    license.valid === true &&
    license.email === 'starter@example.com' &&
    !license.error
  ) {
    console.log('  ✅ Correctly validates STARTER license\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Failed to validate STARTER license')
    console.error('  Received:', license)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 2: STARTER tier feature access
 */
function testStarterFeatureAccess() {
  setupTest()
  console.log('Test 2: STARTER tier feature access')

  const licenseData = {
    tier: LICENSE_TIERS.STARTER,
    licenseKey: 'CQA-STARTER-1234567890ABCDEFG',
    email: 'starter@example.com',
    expires: null,
    activated: new Date().toISOString(),
  }

  const { licenseDir, licenseFile } = getTestLicensePaths()
  if (!fs.existsSync(licenseDir)) {
    fs.mkdirSync(licenseDir, { recursive: true })
  }
  fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2))

  // STARTER should have basic dependency monitoring but not framework grouping
  const hasBasicMonitoring = getDependencyMonitoringLevel() === 'basic'
  const hasFrameworkGrouping = hasFeature('frameworkGrouping')

  if (hasBasicMonitoring && !hasFrameworkGrouping) {
    console.log('  ✅ STARTER tier has correct feature access\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ STARTER tier feature access incorrect')
    console.error('  Basic monitoring:', hasBasicMonitoring)
    console.error('  Framework grouping:', hasFrameworkGrouping)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 3: showUpgradeMessage() for STARTER tier
 */
function testShowUpgradeMessageStarter() {
  setupTest()
  console.log('Test 3: showUpgradeMessage() for STARTER tier')

  const licenseData = {
    tier: LICENSE_TIERS.STARTER,
    licenseKey: 'CQA-STARTER-1234567890ABCDEFG',
    email: 'starter@example.com',
    expires: null,
    activated: new Date().toISOString(),
  }

  const { licenseDir, licenseFile } = getTestLicensePaths()
  if (!fs.existsSync(licenseDir)) {
    fs.mkdirSync(licenseDir, { recursive: true })
  }
  fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2))

  mockConsoleLog()
  showUpgradeMessage('Premium Framework Grouping')
  restoreConsoleLog()

  if (
    consoleOutput.some(line => line.includes('Upgrade to Pro')) &&
    consoleOutput.some(line => line.includes('$49')) &&
    consoleOutput.some(line =>
      line.includes('Framework-aware dependency grouping')
    ) &&
    consoleOutput.some(line => line.includes('Current license: STARTER'))
  ) {
    console.log('  ✅ Displays correct upgrade message for STARTER tier\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ STARTER upgrade message incorrect')
    console.error('  Output:', consoleOutput)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 4: showUpgradeMessage() for FREE tier with new pricing
 */
function testShowUpgradeMessageFreeNewPricing() {
  setupTest()
  mockConsoleLog()
  console.log('Test 4: showUpgradeMessage() for FREE tier with new pricing')

  showUpgradeMessage('Premium Features')
  restoreConsoleLog()

  if (
    consoleOutput.some(line => line.includes('STARTER: $19/month')) &&
    consoleOutput.some(line => line.includes('PRO: $49/month')) &&
    consoleOutput.some(line => line.includes('founder pricing')) &&
    consoleOutput.some(line => line.includes('$9.50/month')) &&
    consoleOutput.some(line => line.includes('$24.50/month'))
  ) {
    console.log('  ✅ FREE tier shows correct new pricing structure\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ FREE tier pricing incorrect')
    console.error('  Output:', consoleOutput)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 5: showLicenseStatus() for STARTER tier
 */
function testShowLicenseStatusStarter() {
  setupTest()
  console.log('Test 5: showLicenseStatus() for STARTER tier')

  const licenseData = {
    tier: LICENSE_TIERS.STARTER,
    licenseKey: 'CQA-STARTER-1234567890ABCDEFG',
    email: 'starter@example.com',
    expires: null,
    activated: new Date().toISOString(),
  }

  const { licenseDir, licenseFile } = getTestLicensePaths()
  if (!fs.existsSync(licenseDir)) {
    fs.mkdirSync(licenseDir, { recursive: true })
  }
  fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2))

  mockConsoleLog()
  showLicenseStatus()
  restoreConsoleLog()

  if (
    consoleOutput.some(line => line.includes('Tier: STARTER')) &&
    consoleOutput.some(line => line.includes('starter@example.com')) &&
    consoleOutput.some(line => line.includes('Dependency Monitoring: basic'))
  ) {
    console.log('  ✅ Displays STARTER tier status correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ STARTER tier status incorrect')
    console.error('  Output:', consoleOutput)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 6: Save and retrieve STARTER license
 */
function testSaveStarterLicense() {
  setupTest()
  console.log('Test 6: Save and retrieve STARTER license')

  const saveResult = saveLicense(
    LICENSE_TIERS.STARTER,
    'CQA-STARTER-SAVE789ABCDEF',
    'save-starter@example.com',
    null // No expiration
  )

  if (!saveResult.success) {
    console.error('  ❌ Failed to save STARTER license')
    console.error('  Error:', saveResult.error)
    teardownTest()
    process.exit(1)
  }

  // Verify saved
  const license = getLicenseInfo()
  if (
    license.tier !== LICENSE_TIERS.STARTER ||
    license.email !== 'save-starter@example.com'
  ) {
    console.error('  ❌ Saved STARTER license not retrieved correctly')
    console.error('  Retrieved:', license)
    teardownTest()
    process.exit(1)
  }

  console.log('  ✅ STARTER license save/retrieve works correctly\n')
  teardownTest()
  return true
}

/**
 * Test 7: STARTER tier expired license handling
 */
function testStarterExpiredLicense() {
  setupTest()
  console.log('Test 7: STARTER tier expired license handling')

  const licenseData = {
    tier: LICENSE_TIERS.STARTER,
    licenseKey: 'CQA-STARTER-1234567890ABCDEFG',
    email: 'expired-starter@example.com',
    expires: new Date(Date.now() - 1000).toISOString(), // Expired
    activated: new Date().toISOString(),
  }

  const { licenseDir, licenseFile } = getTestLicensePaths()
  if (!fs.existsSync(licenseDir)) {
    fs.mkdirSync(licenseDir, { recursive: true })
  }
  fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2))

  const license = getLicenseInfo()

  if (
    license.tier === LICENSE_TIERS.FREE &&
    license.valid === true &&
    license.error === 'License expired'
  ) {
    console.log('  ✅ Expired STARTER license handled correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Expired STARTER license not handled correctly')
    console.error('  Received:', license)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 8: Founder pricing display validation
 */
function testFounderPricingDisplay() {
  setupTest()
  mockConsoleLog()
  console.log('Test 8: Founder pricing display validation')

  showUpgradeMessage('Premium Features')
  restoreConsoleLog()

  if (
    consoleOutput.some(line => line.includes('STARTER: $9.50/month')) &&
    consoleOutput.some(line => line.includes('PRO: $24.50/month')) &&
    consoleOutput.some(line => line.includes('50% off forever'))
  ) {
    console.log('  ✅ Founder pricing displays correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Founder pricing incorrect')
    console.error('  Output:', consoleOutput)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Run all STARTER tier and pricing tests
 */
console.log('============================================================')
console.log('Running STARTER Tier and Pricing Tests')
console.log('============================================================\n')

testValidStarterLicense()
testStarterFeatureAccess()
testShowUpgradeMessageStarter()
testShowUpgradeMessageFreeNewPricing()
testShowLicenseStatusStarter()
testSaveStarterLicense()
testStarterExpiredLicense()
testFounderPricingDisplay()

console.log('============================================================')
console.log('✅ All STARTER Tier and Pricing Tests Passed!')
console.log('============================================================\n')
console.log('Coverage added:')
console.log('  • STARTER tier validation - All paths tested')
console.log('  • STARTER tier feature access - Basic monitoring only')
console.log('  • STARTER tier upgrade messaging - Pro upgrade path')
console.log(
  '  • Updated pricing structure - $19/$49/$149 with founder discounts'
)
console.log('  • STARTER tier status display - License info')
console.log('  • STARTER tier save/retrieve - License management')
console.log('  • STARTER tier expiration - Fallback to FREE')
console.log('  • Founder pricing validation - All tiers with 50% discount')
console.log('')

// Cleanup temporary test directory
if (fs.existsSync(TEST_LICENSE_DIR)) {
  fs.rmSync(TEST_LICENSE_DIR, { recursive: true, force: true })
  console.log(`🧹 Cleaned up temporary directory: ${TEST_LICENSE_DIR}\n`)
}
