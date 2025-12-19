#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const { ConfigSecurityScanner } = require('../lib/validation/config-security')

console.log('🧪 Testing Dockerfile secret redaction...\n')

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), 'cqa-dockerfile-redaction-')
)
const originalCwd = process.cwd()

try {
  process.chdir(tempDir)

  const dockerfile = `FROM alpine
ENV API_KEY=supersecret
ENV PASSWORD="anothersecret"
ENV TOKEN='tokensecret'
ENV SECRET value
`
  fs.writeFileSync('Dockerfile', dockerfile)

  const scanner = new ConfigSecurityScanner({ quiet: true })
  scanner.issues = []

  scanner
    .scanDockerSecrets()
    .then(() => {
      const issues = scanner.issues.join('\n')

      if (
        issues.includes('supersecret') ||
        issues.includes('anothersecret') ||
        issues.includes('tokensecret') ||
        issues.includes('SECRET value')
      ) {
        console.error('❌ Secrets were not properly redacted')
        console.error(issues)
        process.exit(1)
      }

      if (!issues.includes('[REDACTED]')) {
        console.error('❌ Redaction marker missing from issues')
        console.error(issues)
        process.exit(1)
      }

      console.log('✅ Dockerfile secrets are redacted in issues')
    })
    .catch(error => {
      console.error('❌ Dockerfile redaction test failed:', error.message)
      process.exit(1)
    })
    .finally(() => {
      process.chdir(originalCwd)
      fs.rmSync(tempDir, { recursive: true, force: true })
    })
} catch (error) {
  process.chdir(originalCwd)
  fs.rmSync(tempDir, { recursive: true, force: true })
  console.error('❌ Test setup failed:', error.message)
  process.exit(1)
}
