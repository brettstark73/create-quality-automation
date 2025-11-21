'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execSync } = require('child_process')

const validateScript = path.join(
  __dirname,
  '..',
  'scripts',
  'validate-claude-md.js'
)

/**
 * Test suite for scripts/validate-claude-md.js
 *
 * Tests CLAUDE.md validation:
 * - Required sections detection
 * - Package name validation
 * - Script documentation validation
 * - Deprecated pattern detection
 * - Exit codes
 */

const createTempProject = config => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'validate-claude-test-')
  )

  // Create package.json
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(
      config.packageJson || {
        name: 'test-package',
        version: '1.0.0',
        scripts: {},
      },
      null,
      2
    )
  )

  // Create CLAUDE.md if provided
  if (config.claudeMd !== undefined) {
    fs.writeFileSync(path.join(tempDir, 'CLAUDE.md'), config.claudeMd)
  }

  return tempDir
}

const cleanupTempDir = tempDir => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

const runValidation = (cwd, shouldSucceed = true) => {
  try {
    const result = execSync(`node "${validateScript}" 2>&1`, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    if (!shouldSucceed) {
      throw new Error(
        `Expected validation to fail but it succeeded with output: ${result}`
      )
    }
    return { success: true, output: result, exitCode: 0 }
  } catch (error) {
    if (shouldSucceed) {
      throw new Error(
        `Expected validation to succeed but it failed: ${error.message}\nOutput: ${error.stdout}\nError: ${error.stderr}`
      )
    }
    return {
      success: false,
      output: (error.stdout || '') + (error.stderr || ''),
      error: error.stderr || '',
      exitCode: error.status || 1,
    }
  }
}

// Test 1: Missing CLAUDE.md file
console.log('Test 1: Missing CLAUDE.md file')
{
  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    // No CLAUDE.md created
  })

  try {
    const result = runValidation(tempDir, false)
    assert.strictEqual(
      result.success,
      false,
      'Should fail when CLAUDE.md missing'
    )
    assert.strictEqual(result.exitCode, 1, 'Should exit with code 1')
    assert.ok(
      result.output.includes('CLAUDE.md not found') ||
        result.error.includes('CLAUDE.md not found'),
      'Should show CLAUDE.md not found error'
    )
    console.log('✓ Test 1 passed: Missing CLAUDE.md detected')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 2: All required sections present
console.log('Test 2: All required sections present')
{
  const claudeMd = `
# Test Package - Claude Code Configuration

## Project Information

- **Package:** test-package
- **Version:** 1.0.0

## Project-Specific Commands

\`\`\`bash
npm run lint
\`\`\`

## Development Workflow

Standard workflow applies.

## Quality Automation Features

- ESLint 9 flat config
- Husky 9 pre-commit hooks

## Development Notes

Run tests before committing.
`

  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    assert.strictEqual(result.success, true, 'Should succeed with all sections')
    assert.ok(
      result.output.includes('CLAUDE.md validation passed'),
      'Should show success message'
    )
    console.log('✓ Test 2 passed: All required sections accepted')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 3: Missing required section
console.log('Test 3: Missing required section - Project Information')
{
  const claudeMd = `
# Test Package

## Project-Specific Commands

Commands here.

## Development Workflow

Workflow here.

## Quality Automation Features

Features here.

## Development Notes

Notes here.
`

  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, false)
    assert.strictEqual(
      result.success,
      false,
      'Should fail with missing section'
    )
    assert.ok(
      result.output.includes('Missing required section: Project Information') ||
        result.error.includes('Missing required section: Project Information'),
      'Should show missing section error'
    )
    console.log('✓ Test 3 passed: Missing required section detected')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 4: Package name validation - name present
console.log('Test 4: Package name validation - name present')
{
  const claudeMd = `
# test-package

## Project Information

Package: test-package

## Project-Specific Commands

Commands

## Development Workflow

Workflow

## Quality Automation Features

Features

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    assert.strictEqual(
      result.success,
      true,
      'Should succeed when package name present'
    )
    console.log('✓ Test 4 passed: Package name found')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 5: Package name validation - name missing
console.log('Test 5: Package name validation - name missing')
{
  const claudeMd = `
# Different Package

## Project Information

Some info

## Project-Specific Commands

Commands

## Development Workflow

Workflow

## Quality Automation Features

Features

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, false)
    assert.strictEqual(
      result.success,
      false,
      'Should fail when package name missing'
    )
    assert.ok(
      result.output.includes('Package name "test-package" not mentioned') ||
        result.error.includes('Package name "test-package" not mentioned'),
      'Should show package name error'
    )
    console.log('✓ Test 5 passed: Missing package name detected')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 6: CLI command validation - command present
console.log('Test 6: CLI command validation - command documented')
{
  const claudeMd = `
# test-cli

## Project Information

CLI: test-cli

## Project-Specific Commands

Commands

## Development Workflow

Workflow

## Quality Automation Features

Features

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: {
      name: 'test-cli',
      version: '1.0.0',
      bin: {
        'test-cli': './cli.js',
      },
    },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    assert.strictEqual(
      result.success,
      true,
      'Should succeed when CLI command documented'
    )
    console.log('✓ Test 6 passed: CLI command documented')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 7: CLI command validation - command missing
console.log('Test 7: CLI command validation - command not documented')
{
  const claudeMd = `
# My Package

## Project Information

Package: my-package-cli

## Project-Specific Commands

Commands

## Development Workflow

Workflow

## Quality Automation Features

Features

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: {
      name: 'my-package-cli',
      version: '1.0.0',
      bin: {
        'awesome-cli-tool': './cli.js',
      },
    },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, false)
    assert.strictEqual(
      result.success,
      false,
      'Should fail when CLI command missing'
    )
    assert.ok(
      result.output.includes('CLI command "awesome-cli-tool" not documented') ||
        result.error.includes('CLI command "awesome-cli-tool" not documented'),
      'Should show CLI command error'
    )
    console.log('✓ Test 7 passed: Missing CLI command detected')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 8: Script documentation - critical scripts documented
console.log('Test 8: Script documentation - critical scripts present')
{
  const claudeMd = `
# test-package

## Project Information

Package info

## Project-Specific Commands

\`npm run lint\` - Run linting
\`npm run format\` - Format code
\`npm run test\` - Run tests
\`npm run setup\` - Setup project

## Development Workflow

Workflow

## Quality Automation Features

Features

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: {
      name: 'test-package',
      version: '1.0.0',
      scripts: {
        lint: 'eslint .',
        format: 'prettier --write .',
        test: 'node test.js',
        setup: 'node setup.js',
      },
    },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    assert.strictEqual(
      result.success,
      true,
      'Should succeed when critical scripts documented'
    )
    console.log('✓ Test 8 passed: Critical scripts documented')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 9: Script documentation - missing critical script
console.log('Test 9: Script documentation - missing critical script warning')
{
  const claudeMd = `
# test-package

## Project Information

Package info

## Project-Specific Commands

Some commands

## Development Workflow

Workflow

## Quality Automation Features

Features

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: {
      name: 'test-package',
      version: '1.0.0',
      scripts: {
        lint: 'eslint .',
        format: 'prettier --write .',
        test: 'node test.js',
      },
    },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    // Should succeed but with warnings
    assert.strictEqual(result.success, true, 'Should succeed with warnings')
    assert.ok(
      result.output.includes('WARNINGS') || result.output.includes('warning'),
      'Should show warnings'
    )
    console.log('✓ Test 9 passed: Missing script warnings shown')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 10: Deprecated pattern detection - ESLint 8
console.log('Test 10: Deprecated pattern - ESLint 8')
{
  const claudeMd = `
# test-package

## Project Information

Package: test-package

## Project-Specific Commands

Commands

## Development Workflow

Workflow

## Quality Automation Features

- ESLint 8 flat config

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    // Should succeed with warning
    assert.strictEqual(result.success, true, 'Should succeed with warning')
    assert.ok(
      result.output.includes('ESLint 8') ||
        result.output.includes('should be ESLint 9'),
      'Should warn about ESLint 8'
    )
    console.log('✓ Test 10 passed: ESLint 8 warning shown')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 11: Deprecated pattern detection - Husky 8
console.log('Test 11: Deprecated pattern - Husky 8')
{
  const claudeMd = `
# test-package

## Project Information

Package: test-package

## Project-Specific Commands

Commands

## Development Workflow

Workflow

## Quality Automation Features

- Husky 8 hooks

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    // Should succeed with warning
    assert.strictEqual(result.success, true, 'Should succeed with warning')
    assert.ok(
      result.output.includes('Husky 8') ||
        result.output.includes('should be Husky 9'),
      'Should warn about Husky 8'
    )
    console.log('✓ Test 11 passed: Husky 8 warning shown')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 12: Node version documentation
console.log('Test 12: Node version documentation')
{
  const claudeMd = `
# test-package

## Project Information

Package: test-package
Node.js ≥20

## Project-Specific Commands

Commands

## Development Workflow

Workflow

## Quality Automation Features

Features

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: {
      name: 'test-package',
      version: '1.0.0',
      engines: {
        node: '>=20',
      },
    },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    assert.strictEqual(
      result.success,
      true,
      'Should succeed with Node version documented'
    )
    console.log('✓ Test 12 passed: Node version documented')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 13: Multiple errors combined
console.log('Test 13: Multiple errors detected')
{
  const claudeMd = `
# Wrong Package Name

## Development Workflow

Only one section here.
`

  const tempDir = createTempProject({
    packageJson: {
      name: 'test-package',
      version: '1.0.0',
      scripts: {
        lint: 'eslint .',
        test: 'node test.js',
      },
    },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, false)
    assert.strictEqual(
      result.success,
      false,
      'Should fail with multiple errors'
    )
    assert.ok(
      result.output.includes('ERRORS') || result.error.includes('error'),
      'Should show errors'
    )
    console.log('✓ Test 13 passed: Multiple errors detected')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 14: Exit code - success
console.log('Test 14: Exit code - success')
{
  const claudeMd = `
# test-package

## Project Information

Package: test-package

## Project-Specific Commands

Commands

## Development Workflow

Workflow

## Quality Automation Features

Features

## Development Notes

Notes
`

  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, true)
    assert.strictEqual(result.exitCode, 0, 'Should exit with code 0')
    console.log('✓ Test 14 passed: Exit code 0 on success')
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Test 15: Exit code - failure
console.log('Test 15: Exit code - failure with errors')
{
  const claudeMd = `
# Incomplete CLAUDE.md

Only partial content.
`

  const tempDir = createTempProject({
    packageJson: { name: 'test-package', version: '1.0.0' },
    claudeMd,
  })

  try {
    const result = runValidation(tempDir, false)
    assert.strictEqual(result.exitCode, 1, 'Should exit with code 1')
    console.log('✓ Test 15 passed: Exit code 1 on failure')
  } finally {
    cleanupTempDir(tempDir)
  }
}

console.log('\n✅ All validate-claude-md.js tests passed! (15 tests)')
