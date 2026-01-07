#!/usr/bin/env node

/**
 * Tests for GitHub Actions workflow tier system
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

console.log('🧪 Testing workflow tier system...\n')

// Helper to create a temp git repo
function createTempGitRepo() {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cqa-workflow-test-'))
  execSync('git init', { cwd: testDir, stdio: 'ignore' })
  execSync('git config user.email "test@example.com"', {
    cwd: testDir,
    stdio: 'ignore',
  })
  execSync('git config user.name "Test User"', {
    cwd: testDir,
    stdio: 'ignore',
  })

  // Create minimal package.json
  fs.writeFileSync(
    path.join(testDir, 'package.json'),
    JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
  )

  // Create test files to trigger development maturity
  fs.mkdirSync(path.join(testDir, 'src'), { recursive: true })
  fs.writeFileSync(path.join(testDir, 'src', 'index.js'), 'console.log("test")')
  fs.mkdirSync(path.join(testDir, 'tests'), { recursive: true })
  fs.writeFileSync(
    path.join(testDir, 'tests', 'test.js'),
    'const assert = require("assert")'
  )

  return testDir
}

// Test 1: Default setup creates minimal workflow
;(() => {
  console.log('Test 1: Default setup creates minimal workflow')
  const testDir = createTempGitRepo()

  try {
    const setupPath = path.join(__dirname, '../setup.js')
    execSync(`QAA_DEVELOPER=true node ${setupPath}`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    assert(fs.existsSync(workflowPath), 'Workflow file should exist')

    const workflowContent = fs.readFileSync(workflowPath, 'utf8')

    // Check for minimal mode marker
    assert(
      workflowContent.includes('# WORKFLOW_MODE: minimal'),
      'Should have minimal mode marker'
    )

    // Check for path filters
    assert(
      workflowContent.includes('paths-ignore:'),
      'Should have path filters'
    )
    assert(
      workflowContent.includes("- '**.md'"),
      'Should ignore markdown files'
    )

    // Check for weekly security schedule
    assert(
      workflowContent.includes('schedule:'),
      'Should have schedule trigger'
    )
    assert(
      workflowContent.includes("cron: '0 0 * * 0'"),
      'Should have weekly cron'
    )

    // Check for single Node version
    assert(
      workflowContent.includes('node-version: [22]'),
      'Should use single Node version'
    )

    // Check for security condition
    assert(
      workflowContent.includes("github.event_name == 'schedule'"),
      'Security should only run on schedule'
    )

    console.log('✅ PASS\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 2: --workflow-standard creates standard workflow
;(() => {
  console.log('Test 2: --workflow-standard creates standard workflow')
  const testDir = createTempGitRepo()

  try {
    const setupPath = path.join(__dirname, '../setup.js')
    execSync(`QAA_DEVELOPER=true node ${setupPath} --workflow-standard`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    const workflowContent = fs.readFileSync(workflowPath, 'utf8')

    // Check for standard mode marker
    assert(
      workflowContent.includes('# WORKFLOW_MODE: standard'),
      'Should have standard mode marker'
    )

    // Check for path filters
    assert(
      workflowContent.includes('paths-ignore:'),
      'Should have path filters'
    )

    // Check for weekly security schedule
    assert(
      workflowContent.includes('schedule:'),
      'Should have schedule trigger'
    )

    // Check for matrix on main branch only
    assert(
      workflowContent.includes("if: github.ref == 'refs/heads/main'"),
      'Matrix should only run on main'
    )
    assert(
      workflowContent.includes('node-version: [20, 22]'),
      'Should have Node 20 and 22 matrix'
    )

    console.log('✅ PASS\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 3: --workflow-comprehensive creates comprehensive workflow
;(() => {
  console.log('Test 3: --workflow-comprehensive creates comprehensive workflow')
  const testDir = createTempGitRepo()

  try {
    const setupPath = path.join(__dirname, '../setup.js')
    execSync(`QAA_DEVELOPER=true node ${setupPath} --workflow-comprehensive`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    const workflowContent = fs.readFileSync(workflowPath, 'utf8')

    // Check for comprehensive mode marker
    assert(
      workflowContent.includes('# WORKFLOW_MODE: comprehensive'),
      'Should have comprehensive mode marker'
    )

    // Check NO path filters
    assert(
      !workflowContent.includes('paths-ignore:'),
      'Should NOT have path filters'
    )

    // Check NO security schedule (runs inline)
    assert(
      !workflowContent.includes('schedule:'),
      'Should NOT have schedule trigger'
    )

    // Check for matrix on every push
    assert(
      workflowContent.includes('node-version: [20, 22]'),
      'Should have Node 20 and 22 matrix'
    )

    console.log('✅ PASS\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 4: Update preserves existing mode
;(() => {
  console.log('Test 4: Update preserves existing workflow mode')
  const testDir = createTempGitRepo()

  try {
    const setupPath = path.join(__dirname, '../setup.js')
    // First setup with standard mode
    execSync(`QAA_DEVELOPER=true node ${setupPath} --workflow-standard`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    let workflowContent = fs.readFileSync(workflowPath, 'utf8')
    assert(
      workflowContent.includes('# WORKFLOW_MODE: standard'),
      'Initial setup should be standard'
    )

    // Run update without specifying mode
    execSync(`QAA_DEVELOPER=true node ${setupPath} --update`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    workflowContent = fs.readFileSync(workflowPath, 'utf8')
    assert(
      workflowContent.includes('# WORKFLOW_MODE: standard'),
      'Update should preserve standard mode'
    )

    console.log('✅ PASS\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 5: Update can override mode
;(() => {
  console.log('Test 5: Update can override workflow mode')
  const testDir = createTempGitRepo()

  try {
    const setupPath = path.join(__dirname, '../setup.js')
    // First setup with comprehensive mode
    execSync(`QAA_DEVELOPER=true node ${setupPath} --workflow-comprehensive`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    let workflowContent = fs.readFileSync(workflowPath, 'utf8')
    assert(
      workflowContent.includes('# WORKFLOW_MODE: comprehensive'),
      'Initial setup should be comprehensive'
    )
    assert(
      !workflowContent.includes('paths-ignore:'),
      'Comprehensive should not have path filters'
    )

    // Update to minimal mode
    execSync(
      `QAA_DEVELOPER=true node ${setupPath} --update --workflow-minimal`,
      {
        cwd: testDir,
        stdio: 'pipe',
      }
    )

    workflowContent = fs.readFileSync(workflowPath, 'utf8')
    assert(
      workflowContent.includes('# WORKFLOW_MODE: minimal'),
      'Update should change to minimal mode'
    )
    assert(
      workflowContent.includes('paths-ignore:'),
      'Minimal should have path filters'
    )
    assert(
      workflowContent.includes('node-version: [22]'),
      'Minimal should have single Node version'
    )

    console.log('✅ PASS\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 6: Legacy workflow detection
;(() => {
  console.log('Test 6: Legacy workflow detection (no version marker)')
  const testDir = createTempGitRepo()

  try {
    // Create legacy comprehensive workflow (no version marker)
    fs.mkdirSync(path.join(testDir, '.github', 'workflows'), {
      recursive: true,
    })
    const legacyWorkflow = `name: Quality Checks

on:
  push:
    branches: [main]
  pull_request:

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5

  tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - name: Test
        run: npm test
`
    fs.writeFileSync(
      path.join(testDir, '.github', 'workflows', 'quality.yml'),
      legacyWorkflow
    )

    const setupPath = path.join(__dirname, '../setup.js')
    // Run update without specifying mode (should detect comprehensive)
    execSync(`QAA_DEVELOPER=true node ${setupPath} --update`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowContent = fs.readFileSync(
      path.join(testDir, '.github', 'workflows', 'quality.yml'),
      'utf8'
    )

    // Should preserve comprehensive characteristics
    assert(
      workflowContent.includes('matrix'),
      'Should preserve matrix strategy'
    )

    console.log('✅ PASS\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

console.log('✅ All workflow tier tests passed!\n')
