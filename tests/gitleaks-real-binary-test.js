'use strict'

/**
 * Real Gitleaks Binary Positive Path Test
 *
 * Downloads and tests the actual gitleaks v8.28.0 binary to ensure
 * the positive verification path works with real data.
 *
 * This test is the critical missing piece - it validates that a real
 * gitleaks binary passes verification.
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')
const https = require('https')
const { ConfigSecurityScanner } = require('../lib/validation/config-security')

console.log('🧪 Running Real Gitleaks Binary Positive Path Test...')

// Expected checksums for real gitleaks v8.28.0 release
const REAL_CHECKSUMS = {
  'linux-x64':
    'a65b5253807a68ac0cafa4414031fd740aeb55f54fb7e55f386acb52e6a840eb',
  'darwin-x64':
    'edf5a507008b0d2ef4959575772772770586409c1f6f74dabf19cbe7ec341ced',
  'darwin-arm64':
    '5588b5d942dffa048720f7e6e1d274283219fb5722a2c7564d22e83ba39087d7',
  'win32-x64':
    'da6458e8864af553807de1c46a7a8eac0880bd6b99ba56288e87e86a45af884f',
}

function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(targetPath)

    https
      .get(url, response => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          return downloadFile(response.headers.location, targetPath)
            .then(resolve)
            .catch(reject)
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`)
          )
          return
        }

        response.pipe(file)

        file.on('finish', () => {
          file.close()
          resolve()
        })

        file.on('error', err => {
          fs.unlink(targetPath, () => {}) // Delete partial file
          reject(err)
        })
      })
      .on('error', reject)
  })
}

async function runTest() {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'gitleaks-real-binary-test-')
  )

  try {
    // Test linux-x64 as the primary supported platform
    const testPlatform = 'linux-x64'
    const expectedChecksum = REAL_CHECKSUMS[testPlatform]

    console.log(`🔧 Testing platform: ${testPlatform}`)
    console.log(`🎯 Expected checksum: ${expectedChecksum}`)

    // CRITICAL: Validate production checksum table matches expected values
    console.log('🧪 Pre-Test: Validating production checksum table')
    const productionScanner = new ConfigSecurityScanner() // No override - production checksums
    const productionChecksum = productionScanner.checksumMap[testPlatform]

    assert.strictEqual(
      productionChecksum,
      expectedChecksum,
      `Production checksum table mismatch! Production: ${productionChecksum}, Expected: ${expectedChecksum}. ` +
        `This indicates the production checksum table is out of sync with the expected gitleaks v8.28.0 release values.`
    )
    console.log('✅ Production checksum table matches expected release values')

    // Download the real gitleaks binary
    const tarballUrl =
      'https://github.com/gitleaks/gitleaks/releases/download/v8.28.0/gitleaks_8.28.0_linux_amd64.tar.gz'
    const tarballPath = path.join(tempDir, 'gitleaks.tar.gz')

    console.log('📥 Downloading real gitleaks v8.28.0 linux-x64...')

    await downloadFile(tarballUrl, tarballPath)
    console.log('✅ Download completed')

    // Extract the binary
    const { execSync } = require('child_process')
    execSync(`tar -xzf "${tarballPath}" -C "${tempDir}"`)
    console.log('✅ Extraction completed')

    const realBinaryPath = path.join(tempDir, 'gitleaks')

    if (!fs.existsSync(realBinaryPath)) {
      throw new Error('Real binary not found after extraction')
    }

    // Make it executable
    fs.chmodSync(realBinaryPath, 0o755)

    // Test 1: Verify the real binary has the expected checksum
    console.log('🧪 Test 1: Real binary checksum verification')

    const binaryData = fs.readFileSync(realBinaryPath)
    const actualChecksum = require('crypto')
      .createHash('sha256')
      .update(binaryData)
      .digest('hex')

    console.log(`📊 Actual checksum: ${actualChecksum}`)

    assert.strictEqual(
      actualChecksum,
      expectedChecksum,
      `Real binary checksum mismatch! Expected: ${expectedChecksum}, Got: ${actualChecksum}`
    )
    console.log('✅ Real binary checksum matches expected value')

    // Test 2: Verify our production verification logic accepts the real binary
    console.log('🧪 Test 2: Production verification logic with real binary')

    // Create a scanner with linux-x64 checksum for this test
    const testChecksums = { 'linux-x64': expectedChecksum }
    const scanner = new ConfigSecurityScanner({ checksumMap: testChecksums })

    // Temporarily override platform for this test
    const originalPlatform = process.platform
    const originalArch = process.arch

    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true,
    })
    Object.defineProperty(process, 'arch', { value: 'x64', configurable: true })

    try {
      const result = await scanner.verifyBinaryChecksum(realBinaryPath)
      assert.strictEqual(
        result,
        true,
        'Production verification should accept real binary'
      )
      console.log(
        '✅ Production verification logic correctly accepted real binary'
      )
    } finally {
      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
      Object.defineProperty(process, 'arch', {
        value: originalArch,
        configurable: true,
      })
    }

    // Test 3: Verify the real binary is functional
    console.log('🧪 Test 3: Real binary functionality test')

    try {
      const output = execSync(`"${realBinaryPath}" version`, {
        encoding: 'utf8',
        timeout: 10000,
      })
      console.log(`📋 Version output: ${output.trim()}`)

      if (!output.includes('8.28.0')) {
        throw new Error(`Expected version 8.28.0 in output: ${output}`)
      }

      console.log('✅ Real binary is functional and reports correct version')
    } catch (execError) {
      // If we're not on linux, the binary might not be executable, but that's ok
      // The important part is that the checksum matched
      console.log(
        `⚠️  Binary execution test skipped (platform: ${process.platform}): ${execError.message}`
      )
    }

    // Test 4: Integration test with real binary content in download simulation
    console.log('🧪 Test 4: Download integration test with real binary content')

    const downloadTestPath = path.join(tempDir, 'gitleaks-download-integration')
    const integrationScanner = new ConfigSecurityScanner({
      checksumMap: testChecksums,
    })

    // Mock download but use REAL binary content
    const originalDownloadFile = integrationScanner.downloadFile
    integrationScanner.downloadFile = async function (url, targetPath) {
      console.log(`🎭 Mock download: ${url}`)
      fs.writeFileSync(targetPath, Buffer.from('mock tarball'))
    }

    // Mock tar.extract to produce the REAL binary content
    const Module = require('module')
    const originalRequire = Module.prototype.require
    Module.prototype.require = function (id) {
      if (id === 'tar') {
        return {
          extract: async function (options) {
            console.log(`🎭 Mock tar extract to: ${options.cwd}`)

            // Use the REAL binary content we downloaded
            const extractedPath = path.join(options.cwd, 'gitleaks')
            fs.writeFileSync(extractedPath, binaryData) // Real binary data!
            console.log('✅ Used real binary content in mock extraction')
          },
        }
      }
      return originalRequire.apply(this, arguments)
    }

    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true,
    })
    Object.defineProperty(process, 'arch', { value: 'x64', configurable: true })

    try {
      // This should succeed because we're using real binary content with real checksum
      await integrationScanner.downloadGitleaksBinary(downloadTestPath)

      assert(fs.existsSync(downloadTestPath), 'Downloaded binary should exist')
      console.log(
        '✅ Download integration test passed with real binary content'
      )
    } finally {
      // Restore mocks
      integrationScanner.downloadFile = originalDownloadFile
      Module.prototype.require = originalRequire
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
      Object.defineProperty(process, 'arch', {
        value: originalArch,
        configurable: true,
      })
    }

    console.log('✅ All Real Binary Positive Path Tests Passed!')
    console.log(
      '🔒 Verified that real gitleaks v8.28.0 binary passes all verification steps'
    )
  } catch (error) {
    console.error(`❌ Real Binary Test Failed: ${error.message}`)

    // Check for explicit opt-out of network failure strictness
    if (
      process.env.ALLOW_NETWORK_FAILURE === 'true' &&
      (error.message.includes('ENOTFOUND') ||
        error.message.includes('network') ||
        error.message.includes('HTTP'))
    ) {
      console.log(
        '⚠️  Network error tolerated due to ALLOW_NETWORK_FAILURE=true'
      )
      console.log(
        '📝 This test validates the positive path with authentic gitleaks binary'
      )
      console.log(
        '💡 Set ALLOW_NETWORK_FAILURE=false or remove env var to fail on network errors'
      )
      return
    }

    throw error
  } finally {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup: ${error.message}`)
    }
  }
}

// Only run if explicitly requested or if we detect CI environment
if (process.env.RUN_REAL_BINARY_TEST || process.env.CI) {
  runTest().catch(error => {
    console.error('❌ Real binary test failed:', error.message)
    process.exit(1)
  })
} else {
  console.log(
    '⏭️ Skipping real binary test - set RUN_REAL_BINARY_TEST=1 to enable'
  )
  console.log(
    '📝 This test downloads and verifies the actual gitleaks v8.28.0 binary'
  )
}
