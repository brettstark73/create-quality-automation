#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const childProcess = require('child_process')

console.log('🧪 Testing npm audit parsing (high/critical only)...\n')

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cqa-audit-parse-'))
const originalCwd = process.cwd()
const originalExecSync = childProcess.execSync

try {
  process.chdir(tempDir)
  fs.writeFileSync(
    'package.json',
    JSON.stringify({ name: 'audit-test', version: '1.0.0' }, null, 2)
  )

  // @ts-ignore - Mocking execSync for test purposes
  childProcess.execSync = () => {
    /** @type {Error & { stdout?: Buffer }} */
    const error = new Error('npm audit found vulnerabilities')
    error.stdout = Buffer.from(
      JSON.stringify({
        metadata: {
          vulnerabilities: { high: 0, critical: 0, moderate: 5 },
        },
      })
    )
    throw error
  }

  delete require.cache[require.resolve('../lib/validation/config-security')]
  const { ConfigSecurityScanner } = require('../lib/validation/config-security')

  const scanner = new ConfigSecurityScanner({ quiet: true })
  scanner.issues = []

  scanner
    .runNpmAudit()
    .then(() => {
      if (scanner.issues.length !== 0) {
        console.error('❌ Moderate vulnerabilities should not fail the scan')
        process.exit(1)
      }
      console.log('✅ Moderate-only findings do not trigger failure')
    })
    .catch(error => {
      console.error('❌ npm audit parsing test failed:', error.message)
      process.exit(1)
    })
    .finally(() => {
      process.chdir(originalCwd)
      childProcess.execSync = originalExecSync
      fs.rmSync(tempDir, { recursive: true, force: true })
    })
} catch (error) {
  process.chdir(originalCwd)
  childProcess.execSync = originalExecSync
  fs.rmSync(tempDir, { recursive: true, force: true })
  console.error('❌ Test setup failed:', error.message)
  process.exit(1)
}
