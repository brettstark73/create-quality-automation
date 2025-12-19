#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const { LicenseValidator } = require('../lib/license-validator')

console.log('🧪 Testing license database integrity checks...\n')

const TEST_LICENSE_DIR = path.join(
  os.tmpdir(),
  `cqa-license-integrity-${Date.now()}`
)
process.env.QAA_LICENSE_DIR = TEST_LICENSE_DIR

const legitimateDBFile = path.join(TEST_LICENSE_DIR, 'legitimate-licenses.json')

function writeDatabase(database) {
  fs.mkdirSync(TEST_LICENSE_DIR, { recursive: true })
  fs.writeFileSync(legitimateDBFile, JSON.stringify(database, null, 2))
}

function computeSha(licenses) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(licenses))
    .digest('hex')
}

function cleanup() {
  if (fs.existsSync(TEST_LICENSE_DIR)) {
    fs.rmSync(TEST_LICENSE_DIR, { recursive: true, force: true })
  }
}

try {
  const validator = new LicenseValidator()

  console.log('Test 1: Reject cached database with invalid checksum')
  const badDb = {
    _metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      description: 'Corrupted database',
      sha256: 'invalid',
    },
    'QAA-1234-5678-ABCD-EF90': {
      customerId: 'cus_bad',
      tier: 'PRO',
      isFounder: false,
      email: 'bad@example.com',
    },
  }

  writeDatabase(badDb)
  const badLoad = validator.loadLegitimateDatabase()
  if (Object.keys(badLoad).length !== 0) {
    console.error('❌ Expected empty database on checksum mismatch')
    process.exit(1)
  }
  console.log('✅ Invalid checksum correctly rejected')

  console.log('\nTest 2: Accept cached database with valid checksum')
  const goodLicenses = {
    'QAA-9999-8888-EFGH-1234': {
      customerId: 'cus_good',
      tier: 'PRO',
      isFounder: true,
      email: 'good@example.com',
    },
  }
  const goodDb = {
    _metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      description: 'Valid database',
      sha256: computeSha(goodLicenses),
    },
    ...goodLicenses,
  }

  writeDatabase(goodDb)
  const goodLoad = validator.loadLegitimateDatabase()
  if (!goodLoad['QAA-9999-8888-EFGH-1234']) {
    console.error('❌ Expected valid database to load')
    process.exit(1)
  }
  console.log('✅ Valid checksum loaded successfully')
} catch (error) {
  console.error('❌ License integrity test failed:', error.message)
  process.exit(1)
} finally {
  cleanup()
}
