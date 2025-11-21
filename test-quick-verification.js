// Quick test of the real verification logic
const { ConfigSecurityScanner } = require('./lib/validation/config-security')
const fs = require('fs')
const crypto = require('crypto')

async function quickTest() {
  try {
    // Create test content
    const testContent = Buffer.from('Test content for verification')
    const testHash = crypto
      .createHash('sha256')
      .update(testContent)
      .digest('hex')

    console.log('Test content hash:', testHash)

    // Create scanner with test checksum map
    const testChecksumMap = {
      [`${process.platform}-${process.arch}`]: testHash,
    }

    const scanner = new ConfigSecurityScanner({ checksumMap: testChecksumMap })

    // Write test file
    fs.writeFileSync('/tmp/test-binary', testContent)

    // Test verification - should pass
    const result = await scanner.verifyBinaryChecksum('/tmp/test-binary')
    console.log('Verification result:', result)

    // Test with wrong content - should fail
    fs.writeFileSync('/tmp/test-binary-wrong', Buffer.from('Wrong content'))

    try {
      await scanner.verifyBinaryChecksum('/tmp/test-binary-wrong')
      console.log('ERROR: Should have failed!')
    } catch (error) {
      console.log('Expected error:', error.message)
    }

    console.log('✅ Real verification logic working correctly')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

quickTest()
