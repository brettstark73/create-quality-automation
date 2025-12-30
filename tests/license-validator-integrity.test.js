#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const {
  createTestKeyPair,
  setTestPublicKeyEnv,
  buildSignedLicenseEntry,
  buildSignedRegistry,
} = require('./license-test-helpers')
const { LicenseValidator } = require('../lib/license-validator')

console.log('🧪 Testing license database integrity checks...\n')

const TEST_LICENSE_DIR = path.join(
  os.tmpdir(),
  `cqa-license-integrity-${Date.now()}`
)
process.env.QAA_LICENSE_DIR = TEST_LICENSE_DIR
const { publicKey, privateKey } = createTestKeyPair()
setTestPublicKeyEnv(publicKey)

const legitimateDBFile = path.join(TEST_LICENSE_DIR, 'legitimate-licenses.json')

function writeDatabase(database) {
  fs.mkdirSync(TEST_LICENSE_DIR, { recursive: true })
  fs.writeFileSync(legitimateDBFile, JSON.stringify(database, null, 2))
}

function cleanup() {
  if (fs.existsSync(TEST_LICENSE_DIR)) {
    fs.rmSync(TEST_LICENSE_DIR, { recursive: true, force: true })
  }
}

try {
  const validator = new LicenseValidator()

  console.log('Test 1: Reject cached database with invalid signature')
  const badDb = {
    _metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      description: 'Corrupted database',
      registrySignature: 'invalid',
    },
    'QAA-1234-5678-ABCD-EF90': {
      tier: 'PRO',
      isFounder: false,
      issued: new Date().toISOString(),
      signature: 'invalid',
    },
  }

  writeDatabase(badDb)
  const badLoad = validator.loadLegitimateDatabase()
  if (Object.keys(badLoad).length !== 0) {
    console.error('❌ Expected empty database on checksum mismatch')
    process.exit(1)
  }
  console.log('✅ Invalid checksum correctly rejected')

  console.log('\nTest 2: Accept cached database with valid signature')
  const entry = buildSignedLicenseEntry({
    licenseKey: 'QAA-9999-8888-EFGH-1234',
    tier: 'PRO',
    isFounder: true,
    email: 'good@example.com',
    privateKey,
  })
  const goodLicenses = {
    [entry.licenseKey]: {
      tier: entry.tier,
      isFounder: entry.isFounder,
      issued: entry.issued,
      emailHash: entry.emailHash,
      signature: entry.signature,
      keyId: 'test-key',
    },
  }
  const goodDb = buildSignedRegistry(goodLicenses, privateKey)

  writeDatabase(goodDb)
  const goodLoad = validator.loadLegitimateDatabase()
  if (!goodLoad['QAA-9999-8888-EFGH-1234']) {
    console.error('❌ Expected valid database to load')
    process.exit(1)
  }
  console.log('✅ Valid signature loaded successfully')
} catch (error) {
  console.error('❌ License integrity test failed:', error.message)
  process.exit(1)
} finally {
  cleanup()
}
