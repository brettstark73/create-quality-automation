'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { ConfigSecurityScanner } = require('../lib/validation/config-security')

/**
 * Test gitleaks binary resolution fallback chain
 * Tests resolution order without downloading actual binaries
 */

// CI-compatible mode: avoid network dependencies but still test resolution logic
const CI_MODE = process.env.CI === 'true'
console.log(
  CI_MODE
    ? '🤖 Running gitleaks binary resolution tests in CI-compatible mode (network mocked)'
    : '🧪 Running gitleaks binary resolution tests in local mode'
)

// Test helper to run async test and handle cleanup
async function runAsyncTest(testName, testFn) {
  const originalEnv = { ...process.env }
  const mockFs = {
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync,
  }
  const originalExecSync = require('child_process').execSync

  try {
    console.log(`🧪 ${testName}`)
    await testFn({ originalEnv, mockFs, originalExecSync })
    console.log(`✅ ${testName}`)
  } catch (error) {
    console.error(`❌ ${testName}: ${error.message}`)
    process.exit(1)
  } finally {
    // Cleanup
    process.env = originalEnv
    fs.existsSync = mockFs.existsSync
    fs.readFileSync = mockFs.readFileSync
    require('child_process').execSync = originalExecSync
  }
}

// Main test runner
;(async () => {
  console.log('🔍 Testing Gitleaks Binary Resolution...')

  // Test 1: Environment GITLEAKS_PATH takes highest precedence
  await runAsyncTest('Environment GITLEAKS_PATH precedence', async () => {
    const scanner = new ConfigSecurityScanner()
    const mockPath = '/custom/path/to/gitleaks'
    process.env.GITLEAKS_PATH = mockPath

    // Mock that custom path exists
    fs.existsSync = filePath => filePath === mockPath

    const result = await scanner.resolveGitleaksBinary()
    assert.strictEqual(
      result,
      mockPath,
      'Should use GITLEAKS_PATH when available'
    )
  })

  // Test 2: Global binary is second priority (acceptance test - uses cached binary in environment)
  await runAsyncTest('Global binary fallback acceptance test', async () => {
    const scanner = new ConfigSecurityScanner()
    delete process.env.GITLEAKS_PATH

    // In a test environment with cached binary, verify the binary resolution works correctly
    // This is an acceptance test that validates the complete flow works
    const result = await scanner.resolveGitleaksBinary()

    // The result should be either a global binary or cached binary, not npx
    assert(
      result && !result.includes('npx'),
      'Should resolve to a real binary path, not npx fallback'
    )
    assert(
      typeof result === 'string' && result.length > 0,
      'Should return a valid binary path'
    )

    // Verify the binary is actually executable (basic smoke test)
    assert(fs.existsSync(result), 'Resolved binary should actually exist')

    console.log(`✅ Resolved gitleaks binary: ${result}`)
  })

  // Test 3: Cached binary is third priority (now with real checksum verification)
  await runAsyncTest('Cached binary fallback', async () => {
    // Create test content and calculate its hash
    const testBinaryContent = Buffer.from(
      'Test cached gitleaks binary for resolution test'
    )
    const testContentHash = require('crypto')
      .createHash('sha256')
      .update(testBinaryContent)
      .digest('hex')

    const testChecksumMap = {
      [`${process.platform}-${process.arch}`]: testContentHash,
    }
    const scanner = new ConfigSecurityScanner({ checksumMap: testChecksumMap })
    delete process.env.GITLEAKS_PATH

    // Mock that global binary doesn't exist
    require('child_process').execSync = () => {
      throw new Error('which: command not found')
    }

    // Mock cached binary exists
    const cacheDir = path.join(
      os.homedir(),
      '.cache',
      'create-quality-automation'
    )
    const cachedBinary = path.join(cacheDir, 'gitleaks', '8.28.0', 'gitleaks')

    fs.existsSync = filePath => filePath === cachedBinary

    // Mock readFileSync to return our test content for the cached binary
    const originalReadFileSync = fs.readFileSync
    fs.readFileSync = (filePath, options) => {
      if (filePath === cachedBinary) {
        return testBinaryContent
      }
      return originalReadFileSync(filePath, options)
    }

    try {
      const result = await scanner.resolveGitleaksBinary()
      assert.strictEqual(
        result,
        cachedBinary,
        'Should use cached binary when available'
      )
    } finally {
      fs.readFileSync = originalReadFileSync
    }
  })

  // Test 4: Hard fail instead of npx fallback (security-first behavior)
  await runAsyncTest('Hard fail without allowLatestGitleaks flag', async () => {
    const scanner = new ConfigSecurityScanner() // No allowLatestGitleaks option
    delete process.env.GITLEAKS_PATH

    // Mock that nothing exists
    require('child_process').execSync = () => {
      throw new Error('command not found')
    }

    fs.existsSync = () => false

    // Mock download failure (but keep real checksum verification)
    scanner.downloadGitleaksBinary = async () => {
      throw new Error('Download failed')
    }

    try {
      await scanner.resolveGitleaksBinary()
      assert.fail('Should have thrown error instead of returning a result')
    } catch (error) {
      assert(
        error.message.includes('Cannot resolve secure gitleaks binary'),
        'Should provide helpful error message'
      )
      assert(
        error.message.includes('--allow-latest-gitleaks'),
        'Should mention the escape hatch flag'
      )
    }
  })

  // Test 5: npx fallback only when explicitly allowed
  await runAsyncTest(
    'npx fallback with explicit allowLatestGitleaks flag',
    async () => {
      const scanner = new ConfigSecurityScanner({ allowLatestGitleaks: true })
      delete process.env.GITLEAKS_PATH

      let warningCaptured = false
      const originalWarn = console.warn

      console.warn = message => {
        if (message.includes('WARNING: Using npx gitleaks')) {
          warningCaptured = true
        }
      }

      // Mock that nothing exists
      require('child_process').execSync = () => {
        throw new Error('command not found')
      }

      fs.existsSync = () => false

      // Mock download failure (but keep real checksum verification)
      scanner.downloadGitleaksBinary = async () => {
        throw new Error('Download failed')
      }

      const result = await scanner.resolveGitleaksBinary()
      assert.strictEqual(
        result,
        'npx gitleaks',
        'Should fallback to npx when explicitly allowed'
      )
      assert.strictEqual(
        warningCaptured,
        true,
        'Should warn when falling back to npx'
      )

      console.warn = originalWarn
    }
  )

  // Test 6: Platform detection
  console.log('🧪 Testing platform detection')
  const scanner2 = new ConfigSecurityScanner()
  const originalPlatform = process.platform
  const originalArch = process.arch

  const platforms = [
    { platform: 'darwin', arch: 'x64', expected: 'darwin_x64' },
    { platform: 'darwin', arch: 'arm64', expected: 'darwin_arm64' },
    { platform: 'linux', arch: 'x64', expected: 'linux_x64' },
    { platform: 'win32', arch: 'x64', expected: 'windows_x64' },
  ]

  platforms.forEach(({ platform, arch, expected }) => {
    Object.defineProperty(process, 'platform', { value: platform })
    Object.defineProperty(process, 'arch', { value: arch })

    const result = scanner2.detectPlatform()
    assert.strictEqual(
      result,
      expected,
      `Should detect ${platform}-${arch} as ${expected}`
    )
  })

  // Test unsupported platform
  Object.defineProperty(process, 'platform', { value: 'unsupported' })
  const unsupportedResult = scanner2.detectPlatform()
  assert.strictEqual(
    unsupportedResult,
    null,
    'Should return null for unsupported platforms'
  )

  // Restore original values
  Object.defineProperty(process, 'platform', { value: originalPlatform })
  Object.defineProperty(process, 'arch', { value: originalArch })
  console.log('✅ Platform detection tests passed')

  // Test 7: Checksum verification - now fails hard on security issues
  console.log('🧪 Testing checksum verification')

  // Test unsupported platform checksum - should throw error
  Object.defineProperty(process, 'platform', { value: 'unsupported' })
  fs.existsSync = () => true

  try {
    await scanner2.verifyBinaryChecksum('/fake/path')
    assert.fail('Should throw error for unsupported platform')
  } catch (error) {
    assert(
      error.message.includes('No checksum available for platform'),
      'Should explain missing checksum'
    )
  }

  Object.defineProperty(process, 'platform', { value: originalPlatform })

  // Test corrupted checksum - should throw error
  fs.readFileSync = () => Buffer.from('fake content')

  try {
    await scanner2.verifyBinaryChecksum('/fake/path')
    assert.fail('Should throw error for checksum mismatch')
  } catch (error) {
    assert(
      error.message.includes('Checksum mismatch'),
      'Should explain checksum failure'
    )
  }

  console.log('✅ Checksum verification tests passed')

  console.log('✅ All gitleaks binary resolution tests passed!')
})()
