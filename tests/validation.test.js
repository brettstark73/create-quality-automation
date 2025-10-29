'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

/**
 * Test the enhanced validation functionality
 */
async function testValidation() {
  console.log('🧪 Testing enhanced validation functionality...\n')

  // Create temporary test directory
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validation-test-'))
  const originalCwd = process.cwd()

  try {
    process.chdir(testDir)

    // Initialize git repository
    execSync('git init', { stdio: 'ignore' })
    execSync('git config user.email "test@example.com"', { stdio: 'ignore' })
    execSync('git config user.name "Test User"', { stdio: 'ignore' })

    await testConfigSecurityScanner(testDir, originalCwd)
    await testDocumentationValidator(testDir, originalCwd)
    await testComprehensiveValidation(testDir, originalCwd)

    console.log('✅ All validation tests passed!\n')
  } finally {
    process.chdir(originalCwd)
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test configuration security scanner
 */
async function testConfigSecurityScanner(testDir, originalCwd) {
  console.log('🔍 Testing configuration security scanner...')

  // Create package.json
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    scripts: {
      test: 'echo "test"',
      format: 'prettier --write .',
    },
  }
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))

  // Test 1: Valid Next.js config (should pass)
  const validNextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig
`
  fs.writeFileSync('next.config.js', validNextConfig)

  try {
    execSync(`node "${path.join(originalCwd, 'setup.js')}" --security-config`, {
      stdio: 'pipe',
    })
    console.log('  ✅ Valid Next.js config passed security check')
  } catch (error) {
    throw new Error(`Valid Next.js config failed: ${error.message}`)
  }

  // Test 2: Insecure Next.js config (should fail)
  const insecureNextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_SECRET: process.env.API_SECRET,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD
  }
}

module.exports = nextConfig
`
  fs.writeFileSync('next.config.js', insecureNextConfig)

  try {
    execSync(`node "${path.join(originalCwd, 'setup.js')}" --security-config`, {
      stdio: 'pipe',
    })
    throw new Error('Insecure Next.js config should have failed but passed')
  } catch (error) {
    if (error.message.includes('should have failed')) {
      throw error
    }
    console.log('  ✅ Insecure Next.js config correctly failed security check')
  }

  // Test 3: Insecure Vite config (should fail)
  fs.unlinkSync('next.config.js')
  const insecureViteConfig = `
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'process.env.VITE_API_SECRET': JSON.stringify(process.env.API_SECRET)
  }
})
`
  fs.writeFileSync('vite.config.js', insecureViteConfig)

  try {
    execSync(`node "${path.join(originalCwd, 'setup.js')}" --security-config`, {
      stdio: 'pipe',
    })
    throw new Error('Insecure Vite config should have failed but passed')
  } catch (error) {
    if (error.message.includes('should have failed')) {
      throw error
    }
    console.log('  ✅ Insecure Vite config correctly failed security check')
  }

  // Clean up for next test
  fs.unlinkSync('vite.config.js')
}

/**
 * Test documentation validator
 */
async function testDocumentationValidator(testDir, originalCwd) {
  console.log('🔍 Testing documentation validator...')

  // Test 1: Valid README (should pass)
  const validReadme = `
# Test Project

## Installation

\`\`\`bash
npm install
\`\`\`

## Scripts

- \`npm run test\` - Run tests
- \`npm run format\` - Format code

## Files

- \`package.json\` - Package configuration
`
  fs.writeFileSync('README.md', validReadme)

  try {
    execSync(`node "${path.join(originalCwd, 'setup.js')}" --validate-docs`, {
      stdio: 'pipe',
    })
    console.log('  ✅ Valid README passed documentation validation')
  } catch (error) {
    throw new Error(`Valid README failed: ${error.message}`)
  }

  // Test 2: README with missing file reference (should fail)
  const invalidReadme = `
# Test Project

## Files

- \`package.json\` - Package configuration
- \`missing-file.js\` - This file doesn't exist
`
  fs.writeFileSync('README.md', invalidReadme)

  try {
    execSync(`node "${path.join(originalCwd, 'setup.js')}" --validate-docs`, {
      stdio: 'pipe',
    })
    throw new Error('README with missing file should have failed but passed')
  } catch (error) {
    if (error.message.includes('should have failed')) {
      throw error
    }
    console.log('  ✅ README with missing file correctly failed validation')
  }

  // Test 3: README with missing script reference (should fail)
  const invalidScriptReadme = `
# Test Project

## Scripts

- \`npm run test\` - Run tests
- \`npm run missing-script\` - This script doesn't exist
`
  fs.writeFileSync('README.md', invalidScriptReadme)

  try {
    execSync(`node "${path.join(originalCwd, 'setup.js')}" --validate-docs`, {
      stdio: 'pipe',
    })
    throw new Error('README with missing script should have failed but passed')
  } catch (error) {
    if (error.message.includes('should have failed')) {
      throw error
    }
    console.log('  ✅ README with missing script correctly failed validation')
  }

  // Clean up for next test
  fs.unlinkSync('README.md')
}

/**
 * Test comprehensive validation
 */
async function testComprehensiveValidation(testDir, originalCwd) {
  console.log('🔍 Testing comprehensive validation...')

  // Create valid project setup
  const validReadme = `
# Test Project

\`\`\`bash
npm run test
\`\`\`

Files: \`package.json\`
`
  fs.writeFileSync('README.md', validReadme)

  try {
    execSync(`node "${path.join(originalCwd, 'setup.js')}" --comprehensive`, {
      stdio: 'pipe',
    })
    console.log('  ✅ Comprehensive validation passed for valid project')
  } catch (error) {
    throw new Error(`Comprehensive validation failed: ${error.message}`)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testValidation().catch(error => {
    console.error('❌ Validation tests failed:', error.message)
    process.exit(1)
  })
}

module.exports = { testValidation }
