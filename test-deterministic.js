// Quick test of the deterministic approach
const crypto = require('crypto')

const TEST_BINARY_CONTENT = Buffer.from(
  'Mock gitleaks v8.28.0 test fixture for deterministic checksum verification\n'
)
const TEST_BINARY_SHA256 = crypto
  .createHash('sha256')
  .update(TEST_BINARY_CONTENT)
  .digest('hex')

console.log('Test content length:', TEST_BINARY_CONTENT.length)
console.log('Test SHA256:', TEST_BINARY_SHA256)
console.log(
  'Content preview:',
  TEST_BINARY_CONTENT.toString().slice(0, 50) + '...'
)

// Verify that different content produces different hash
const differentContent = Buffer.from('Different content with wrong checksum')
const differentSHA256 = crypto
  .createHash('sha256')
  .update(differentContent)
  .digest('hex')
console.log('Different SHA256:', differentSHA256)
console.log('Hashes are different:', TEST_BINARY_SHA256 !== differentSHA256)
