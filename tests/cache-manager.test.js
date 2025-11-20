'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const CacheManager = require('../lib/validation/cache-manager')

/**
 * Test validation result caching
 */
function testCacheManager() {
  console.log('🧪 Testing validation result caching...\n')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'))
  const cacheDir = path.join(testDir, '.cache')
  const cache = new CacheManager({ cacheDir })

  try {
    // Test 1: Cache miss (no cached result)
    console.log('🔍 Testing cache miss scenario...')
    const key1 = 'test-validation-key-1'
    const result1 = cache.get(key1)
    if (result1 !== null) {
      throw new Error(`Expected cache miss, got: ${result1}`)
    }
    console.log('  ✅ Cache miss works correctly')

    // Test 2: Cache set and hit
    console.log('🔍 Testing cache set and hit...')
    const validationResult = {
      passed: true,
      issues: [],
      warnings: [],
      timestamp: Date.now(),
    }
    cache.set(key1, validationResult)

    const cached1 = cache.get(key1)
    if (!cached1 || !cached1.passed) {
      throw new Error('Expected cache hit with valid result')
    }
    console.log('  ✅ Cache set and hit works correctly')

    // Test 3: Cache key generation from file content
    console.log('🔍 Testing cache key generation...')
    const testFile = path.join(testDir, 'test.js')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(testFile, 'console.log("test");')

    const key2 = cache.generateKey(testFile)
    if (!key2 || key2.length < 10) {
      throw new Error('Generated key should be a hash string')
    }

    // Same content should generate same key
    const key3 = cache.generateKey(testFile)
    if (key2 !== key3) {
      throw new Error('Same file content should generate same cache key')
    }
    console.log(`  ✅ Cache key generation works: ${key2.substring(0, 16)}...`)

    // Different content should generate different key
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(testFile, 'console.log("modified");')
    const key4 = cache.generateKey(testFile)
    if (key2 === key4) {
      throw new Error('Different file content should generate different key')
    }
    console.log('  ✅ Cache key changes when content changes')

    // Test 4: Cache expiration
    console.log('🔍 Testing cache expiration...')
    const expiringCache = new CacheManager({
      cacheDir,
      ttl: 100, // 100ms expiration for testing
    })

    const key5 = 'expiring-key'
    expiringCache.set(key5, validationResult)

    const immediate = expiringCache.get(key5)
    if (!immediate) {
      throw new Error('Should get cached result immediately')
    }

    // Wait for expiration
    return new Promise(resolve => {
      setTimeout(() => {
        const expired = expiringCache.get(key5)
        if (expired !== null) {
          throw new Error('Cached result should be expired')
        }
        console.log('  ✅ Cache expiration works correctly')

        // Test 5: Cache clear
        console.log('🔍 Testing cache clear...')
        cache.set('key-1', { data: 1 })
        cache.set('key-2', { data: 2 })
        cache.clear()

        if (cache.get('key-1') !== null || cache.get('key-2') !== null) {
          throw new Error('Cache should be empty after clear()')
        }
        console.log('  ✅ Cache clear works correctly')

        console.log('\n✅ All cache manager tests passed!\n')
        resolve()
      }, 150) // Wait longer than TTL
    })
  } finally {
    // Cleanup
    setTimeout(() => {
      fs.rmSync(testDir, { recursive: true, force: true })
    }, 200)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCacheManager().catch(error => {
    console.error('❌ Cache manager tests failed:', error.message)
    process.exit(1)
  })
}

module.exports = { testCacheManager }
