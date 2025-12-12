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

// Expected SHA256 checksums for EXTRACTED BINARIES from gitleaks v8.28.0 release
// Note: These are checksums of the binary itself, not the tarball/zip archives
const EXPECTED_GITLEAKS_CHECKSUMS = {
  'linux-x64':
    '5fd1b3b0073269484d40078662e921d07427340ab9e6ed526ccd215a565b3298',
  'darwin-x64':
    'cf09ad7a85683d90221db8324f036f23c8c29107145e1fc4a0dffbfa9e89c09a',
  'darwin-arm64':
    '5588b5d942dffa048720f7e6e1d274283219fb5722a2c7564d22e83ba39087d7',
  'win32-x64':
    '54230c22688d19939f316cd3e2e040cd067ece40a3a8c5b684e5110c62ecbf52',
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
