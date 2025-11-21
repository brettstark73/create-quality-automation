'use strict'

/**
 * Production Gitleaks Checksums Validation Test
 *
 * Validates that the production GITLEAKS_CHECKSUMS table contains the correct
 * SHA256 hashes for the actual gitleaks v8.28.0 release from GitHub.
 *
 * This ensures that if someone updates the checksum table incorrectly,
 * tests will fail fast instead of giving false confidence.
 */

const assert = require('assert')
const { ConfigSecurityScanner } = require('../lib/validation/config-security')

console.log('🧪 Running Production Checksums Validation Test...')

// Expected real SHA256 checksums for gitleaks v8.28.0 release
// These are the actual checksums from: https://github.com/gitleaks/gitleaks/releases/tag/v8.28.0
const EXPECTED_GITLEAKS_CHECKSUMS = {
  'linux-x64':
    'a65b5253807a68ac0cafa4414031fd740aeb55f54fb7e55f386acb52e6a840eb',
  'darwin-x64':
    'edf5a507008b0d2ef4959575772772770586409c1f6f74dabf19cbe7ec341ced',
  'darwin-arm64':
    '5588b5d942dffa048720f7e6e1d274283219fb5722a2c7564d22e83ba39087d7',
  'win32-x64':
    'da6458e8864af553807de1c46a7a8eac0880bd6b99ba56288e87e86a45af884f',
}

async function runTest() {
  try {
    // Get the production checksums from the scanner
    const scanner = new ConfigSecurityScanner()
    const productionChecksums = scanner.checksumMap

    console.log('🔍 Validating production checksum table...')

    // Validate each expected platform checksum
    Object.entries(EXPECTED_GITLEAKS_CHECKSUMS).forEach(
      ([platform, expectedChecksum]) => {
        console.log(`📋 Checking ${platform}...`)

        const productionChecksum = productionChecksums[platform]

        assert(
          productionChecksum !== undefined,
          `Missing checksum for platform ${platform} in production table`
        )

        assert.strictEqual(
          productionChecksum,
          expectedChecksum,
          `Production checksum mismatch for ${platform}:\n` +
            `  Expected (real release): ${expectedChecksum}\n` +
            `  Actual (in code):       ${productionChecksum}`
        )

        console.log(
          `✅ ${platform} checksum verified: ${productionChecksum.slice(0, 16)}...`
        )
      }
    )

    // Validate no unexpected platforms in production table
    Object.keys(productionChecksums).forEach(platform => {
      if (!EXPECTED_GITLEAKS_CHECKSUMS[platform]) {
        console.warn(
          `⚠️  Production table has unexpected platform: ${platform}`
        )
      }
    })

    // Validate current platform is supported
    const currentPlatform = `${process.platform}-${process.arch}`
    if (EXPECTED_GITLEAKS_CHECKSUMS[currentPlatform]) {
      console.log(`✅ Current platform ${currentPlatform} is supported`)
    } else {
      console.warn(
        `⚠️  Current platform ${currentPlatform} not in release checksums`
      )
    }

    console.log('✅ All Production Checksum Validations Passed!')
    console.log(
      '🔒 Production checksum table matches real gitleaks v8.28.0 release'
    )
  } catch (error) {
    console.error(`❌ Production Checksum Validation Failed: ${error.message}`)
    console.error(
      '🚨 CRITICAL: Production checksum table does not match real release!'
    )
    console.error('This could indicate:')
    console.error(
      '  - Incorrect checksums in lib/validation/config-security.js'
    )
    console.error('  - Tampering with release assets')
    console.error('  - Version mismatch in GITLEAKS_VERSION constant')
    throw error
  }
}

// Run the test
runTest().catch(() => {
  process.exit(1)
})
