#!/usr/bin/env node

/**
 * Tier Enforcement Tests
 *
 * Tests FREE tier cap enforcement and TEAM tier access paths
 * Validates the monetization restructure works correctly
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// Test directory for isolated license testing
const TEST_LICENSE_DIR = path.join(os.tmpdir(), `cqa-tier-test-${Date.now()}`)

// Set environment before requiring licensing module
process.env.QAA_LICENSE_DIR = TEST_LICENSE_DIR
process.env.LICENSE_SIGNING_SECRET = 'cqa-test-secret-for-unit-tests'
process.env.QAA_DEVELOPER = 'false'

// Now require the module
const {
  LICENSE_TIERS,
  FEATURES,
  checkUsageCaps,
  incrementUsage,
  getUsageSummary,
  saveLicense,
  removeLicense,
} = require('../lib/licensing')

console.log('🧪 Testing Tier Enforcement...\n')

/**
 * Helper: Clean test environment
 */
function cleanTestEnv() {
  if (fs.existsSync(TEST_LICENSE_DIR)) {
    fs.rmSync(TEST_LICENSE_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(TEST_LICENSE_DIR, { recursive: true })
}

/**
 * Helper: Set up a specific tier for testing
 */
function setTier(tier) {
  if (tier === 'FREE') {
    removeLicense()
  } else {
    const tierKeys = {
      PRO: 'QAA-AAAA-BBBB-CCCC-DDDD',
      TEAM: 'QAA-BBBB-CCCC-DDDD-EEEE',
      ENTERPRISE: 'QAA-CCCC-DDDD-EEEE-FFFF',
    }
    saveLicense(tier, tierKeys[tier], 'test@example.com')
  }
}

/**
 * Test 1: FREE tier has correct caps defined
 */
function testFreeTierCaps() {
  console.log('Test 1: FREE tier has correct caps defined')

  const freeCaps = FEATURES[LICENSE_TIERS.FREE]

  if (
    freeCaps.maxPrivateRepos === 1 &&
    freeCaps.maxDependencyPRsPerMonth === 10 &&
    freeCaps.maxPrePushRunsPerMonth === 50
  ) {
    console.log('  ✅ FREE tier caps correctly defined\n')
    return true
  } else {
    console.error('  ❌ FREE tier caps incorrect')
    console.error('  Expected: 1 repo, 10 PRs, 50 runs')
    console.error('  Got:', freeCaps)
    process.exit(1)
  }
}

/**
 * Test 2: PRO/TEAM/ENTERPRISE tiers have unlimited caps
 */
function testPaidTiersUnlimited() {
  console.log('Test 2: PRO/TEAM/ENTERPRISE tiers have unlimited caps')

  const paidTiers = ['PRO', 'TEAM', 'ENTERPRISE']

  for (const tier of paidTiers) {
    const features = FEATURES[LICENSE_TIERS[tier]]
    if (
      features.maxPrivateRepos !== Infinity ||
      features.maxDependencyPRsPerMonth !== Infinity ||
      features.maxPrePushRunsPerMonth !== Infinity
    ) {
      console.error(`  ❌ ${tier} tier should have unlimited caps`)
      process.exit(1)
    }
  }

  console.log('  ✅ All paid tiers have unlimited caps\n')
  return true
}

/**
 * Test 3: checkUsageCaps allows operation when under limit
 */
function testCheckUsageCapsUnderLimit() {
  cleanTestEnv()
  console.log('Test 3: checkUsageCaps allows operation when under limit')

  setTier('FREE')

  const result = checkUsageCaps('pre-push')

  if (result.allowed === true) {
    console.log('  ✅ Operation allowed when under limit\n')
    return true
  } else {
    console.error('  ❌ Operation should be allowed')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Test 4: incrementUsage tracks pre-push runs
 */
function testIncrementUsagePrePush() {
  cleanTestEnv()
  console.log('Test 4: incrementUsage tracks pre-push runs')

  setTier('FREE')

  // Increment multiple times
  incrementUsage('pre-push')
  incrementUsage('pre-push')
  incrementUsage('pre-push')

  const summary = getUsageSummary()

  if (summary.prePushRuns.used === 3) {
    console.log('  ✅ Pre-push runs tracked correctly (3 runs)\n')
    return true
  } else {
    console.error('  ❌ Pre-push tracking incorrect')
    console.error('  Expected: 3, Got:', summary.prePushRuns.used)
    process.exit(1)
  }
}

/**
 * Test 5: checkUsageCaps blocks when limit reached
 */
function testCheckUsageCapsAtLimit() {
  cleanTestEnv()
  console.log('Test 5: checkUsageCaps blocks when limit reached')

  setTier('FREE')

  // Increment to limit (50)
  for (let i = 0; i < 50; i++) {
    incrementUsage('pre-push')
  }

  const result = checkUsageCaps('pre-push')

  if (result.allowed === false && result.reason.includes('limit reached')) {
    console.log('  ✅ Operation blocked at limit\n')
    return true
  } else {
    console.error('  ❌ Operation should be blocked at limit')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Test 6: Paid tiers bypass cap checks
 */
function testPaidTiersBypassCaps() {
  cleanTestEnv()
  console.log('Test 6: Paid tiers bypass cap checks')

  const paidTiers = ['PRO', 'TEAM', 'ENTERPRISE']

  for (const tier of paidTiers) {
    setTier(tier)

    // Increment way past FREE limit
    for (let i = 0; i < 100; i++) {
      incrementUsage('pre-push')
    }

    const result = checkUsageCaps('pre-push')

    if (result.allowed !== true) {
      console.error(`  ❌ ${tier} tier should bypass caps`)
      process.exit(1)
    }
  }

  console.log('  ✅ All paid tiers bypass cap checks\n')
  return true
}

/**
 * Test 7: TEAM tier gets premium features
 */
function testTeamTierFeatures() {
  cleanTestEnv()
  console.log('Test 7: TEAM tier gets premium features')

  const teamFeatures = FEATURES[LICENSE_TIERS.TEAM]

  if (
    teamFeatures.dependencyMonitoring === 'premium' &&
    teamFeatures.smartTestStrategy === true &&
    teamFeatures.securityScanning === true &&
    teamFeatures.frameworkGrouping === true &&
    teamFeatures.teamPolicies === true
  ) {
    console.log('  ✅ TEAM tier has all premium features\n')
    return true
  } else {
    console.error('  ❌ TEAM tier missing premium features')
    console.error('  Features:', teamFeatures)
    process.exit(1)
  }
}

/**
 * Test 8: Usage summary shows correct remaining
 */
function testUsageSummaryRemaining() {
  cleanTestEnv()
  console.log('Test 8: Usage summary shows correct remaining')

  setTier('FREE')

  // Use 30 of 50 pre-push runs
  for (let i = 0; i < 30; i++) {
    incrementUsage('pre-push')
  }

  const summary = getUsageSummary()

  if (
    summary.prePushRuns.used === 30 &&
    summary.prePushRuns.limit === 50 &&
    summary.prePushRuns.remaining === 20
  ) {
    console.log('  ✅ Usage summary correctly shows 20 remaining\n')
    return true
  } else {
    console.error('  ❌ Usage summary incorrect')
    console.error('  Expected: 30 used, 50 limit, 20 remaining')
    console.error('  Got:', summary.prePushRuns)
    process.exit(1)
  }
}

/**
 * Test 9: Dependency PR cap tracking
 */
function testDependencyPRCap() {
  cleanTestEnv()
  console.log('Test 9: Dependency PR cap tracking')

  setTier('FREE')

  // Use 10 of 10 dependency PRs
  for (let i = 0; i < 10; i++) {
    incrementUsage('dependency-pr')
  }

  const result = checkUsageCaps('dependency-pr')

  if (result.allowed === false && result.reason.includes('dependency PRs')) {
    console.log('  ✅ Dependency PR cap enforced\n')
    return true
  } else {
    console.error('  ❌ Dependency PR cap not enforced')
    console.error('  Result:', result)
    process.exit(1)
  }
}

// Run all tests
try {
  testFreeTierCaps()
  testPaidTiersUnlimited()
  testCheckUsageCapsUnderLimit()
  testIncrementUsagePrePush()
  testCheckUsageCapsAtLimit()
  testPaidTiersBypassCaps()
  testTeamTierFeatures()
  testUsageSummaryRemaining()
  testDependencyPRCap()

  // Cleanup
  if (fs.existsSync(TEST_LICENSE_DIR)) {
    fs.rmSync(TEST_LICENSE_DIR, { recursive: true, force: true })
  }

  console.log('🎉 All Tier Enforcement Tests Passed!\n')
  console.log('✅ FREE tier caps defined correctly')
  console.log('✅ Paid tiers have unlimited access')
  console.log('✅ Usage tracking works for all operation types')
  console.log('✅ Cap enforcement blocks operations at limit')
  console.log('✅ TEAM tier has all premium features')
  console.log('')
} catch (error) {
  console.error('❌ Test failed:', error.message)
  process.exit(1)
}
