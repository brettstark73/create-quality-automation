#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const { PassThrough } = require('stream')
const https = require('https')
const { ConfigSecurityScanner } = require('../lib/validation/config-security')

console.log('🧪 Testing gitleaks download redirect handling...\n')

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cqa-gitleaks-redirect-'))
const targetPath = path.join(tempDir, 'gitleaks-redirect-test')

const originalGet = https.get
let callCount = 0

https.get = (url, callback) => {
  callCount += 1
  const response = new PassThrough()

  if (callCount === 1) {
    response.statusCode = 302
    response.headers = { location: 'https://example.com/redirected' }
    process.nextTick(() => {
      callback(response)
      response.end()
    })
  } else {
    response.statusCode = 200
    response.headers = {}
    process.nextTick(() => {
      callback(response)
      response.end('redirected-binary')
    })
  }

  return {
    on: () => {},
  }
}

async function runTest() {
  try {
    const scanner = new ConfigSecurityScanner({ quiet: true })
    await scanner.downloadFile('https://example.com/original', targetPath)

    if (!fs.existsSync(targetPath)) {
      console.error('❌ Expected downloaded file to exist')
      process.exit(1)
    }

    const content = fs.readFileSync(targetPath, 'utf8')
    if (content !== 'redirected-binary') {
      console.error('❌ Downloaded content did not match expected data')
      process.exit(1)
    }

    console.log('✅ Redirects handled and content downloaded correctly')
  } catch (error) {
    console.error('❌ Redirect handling test failed:', error.message)
    process.exit(1)
  } finally {
    https.get = originalGet
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

runTest()
