#!/usr/bin/env node

/**
 * Python Detection Sensitivity Tests
 *
 * Tests that Python detection requires stronger evidence than a single .py file
 * - Config files (pyproject.toml, requirements.txt, setup.py, Pipfile) → DETECTS
 * - Single .py file → NO DETECTION (too sensitive)
 * - Multiple .py files → DETECTS
 * - Main patterns (main.py, app.py, run.py) → DETECTS
 */

const assert = require('node:assert')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

console.log('🧪 Testing Python Detection Sensitivity...\n')

/**
 * Create temporary test directory with git
 */
function createTestDir(name) {
  const testDir = path.join(os.tmpdir(), `cqa-py-detect-${name}-${Date.now()}`)
  fs.mkdirSync(testDir, { recursive: true })

  // Initialize git (required by setup.js)
  execSync('git init', { cwd: testDir, stdio: 'pipe' })
  execSync('git config user.email "test@example.com"', {
    cwd: testDir,
    stdio: 'pipe',
  })
  execSync('git config user.name "Test User"', {
    cwd: testDir,
    stdio: 'pipe',
  })

  return testDir
}

/**
 * Test 1: Single random .py file should NOT trigger Python setup
 */
function testSinglePyFileNoDetection() {
  console.log('Test 1: Single random .py file → NO Python detection')

  const testDir = createTestDir('single-py')

  try {
    // Create JS project with single random Python script
    const packageJsonPath = path.join(testDir, 'package.json')
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({ name: 'js-project', version: '1.0.0' })
    )
    fs.writeFileSync(path.join(testDir, 'index.js'), 'console.log("JS")')
    fs.writeFileSync(path.join(testDir, 'random_script.py'), 'print("utility")')

    // Run setup
    const setupPath = path.resolve(__dirname, '..', 'setup.js')
    const output = execSync(`node "${setupPath}"`, {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    // Should NOT detect Python
    const hasPythonSetup = fs.existsSync(
      path.join(testDir, '.pre-commit-config.yaml')
    )
    assert(
      !hasPythonSetup,
      'Should NOT create Python config for single .py file'
    )

    // Should mention it's a JS project only
    const isJSOnly =
      !output.includes('Python project') && !output.includes('🐍')
    assert(isJSOnly, 'Should detect as JS project only')

    console.log('  ✅ Single .py file correctly ignored (not a Python project)')
  } finally {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 2: Multiple .py files should trigger Python detection
 */
function testMultiplePyFilesDetection() {
  console.log('\nTest 2: Multiple .py files → Python detection')

  const testDir = createTestDir('multiple-py')

  try {
    // Create project with multiple Python files (no config)
    fs.writeFileSync(path.join(testDir, 'app.py'), 'print("app")')
    fs.writeFileSync(path.join(testDir, 'utils.py'), 'print("utils")')
    fs.writeFileSync(path.join(testDir, 'config.py'), 'print("config")')

    // Run setup
    const setupPath = path.resolve(__dirname, '..', 'setup.js')
    const output = execSync(`node "${setupPath}"`, {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    // Should detect Python
    const hasPythonSetup = fs.existsSync(
      path.join(testDir, '.pre-commit-config.yaml')
    )
    assert(hasPythonSetup, 'Should create Python config for multiple .py files')

    // Should mention Python project
    const detectedPython = output.includes('Python') || output.includes('🐍')
    assert(detectedPython, 'Should detect as Python project')

    console.log('  ✅ Multiple .py files correctly detected')
  } finally {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 3: main.py pattern should trigger Python detection
 */
function testMainPatternDetection() {
  console.log('\nTest 3: main.py pattern → Python detection')

  const testDir = createTestDir('main-pattern')

  try {
    // Create project with single main.py (strong indicator)
    fs.writeFileSync(path.join(testDir, 'main.py'), 'print("main")')

    // Run setup
    const setupPath = path.resolve(__dirname, '..', 'setup.js')
    const output = execSync(`node "${setupPath}"`, {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    // Should detect Python
    const hasPythonSetup = fs.existsSync(
      path.join(testDir, '.pre-commit-config.yaml')
    )
    assert(hasPythonSetup, 'Should create Python config for main.py')

    const detectedPython = output.includes('Python') || output.includes('🐍')
    assert(detectedPython, 'Should detect as Python project')

    console.log('  ✅ main.py pattern correctly detected')
  } finally {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 4: app.py pattern should trigger Python detection
 */
function testAppPatternDetection() {
  console.log('\nTest 4: app.py pattern → Python detection')

  const testDir = createTestDir('app-pattern')

  try {
    // Create project with single app.py (Flask/Django pattern)
    fs.writeFileSync(path.join(testDir, 'app.py'), 'from flask import Flask')

    // Run setup
    const setupPath = path.resolve(__dirname, '..', 'setup.js')
    execSync(`node "${setupPath}"`, {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    // Should detect Python
    const hasPythonSetup = fs.existsSync(
      path.join(testDir, '.pre-commit-config.yaml')
    )
    assert(hasPythonSetup, 'Should create Python config for app.py')

    console.log('  ✅ app.py pattern correctly detected')
  } finally {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 5: Config files should still trigger detection
 */
function testConfigFileDetection() {
  console.log('\nTest 5: Python config files → Python detection')

  const testDir = createTestDir('config-file')

  try {
    // Create project with pyproject.toml (no .py files)
    fs.writeFileSync(
      path.join(testDir, 'pyproject.toml'),
      '[project]\nname = "test"'
    )

    // Run setup
    const setupPath = path.resolve(__dirname, '..', 'setup.js')
    execSync(`node "${setupPath}"`, {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    // Should detect Python
    const hasPythonSetup = fs.existsSync(
      path.join(testDir, '.pre-commit-config.yaml')
    )
    assert(hasPythonSetup, 'Should create Python config for pyproject.toml')

    console.log('  ✅ Config file detection still works')
  } finally {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 6: JS project with scripts/ subdirectory containing single .py
 */
function testSubdirectorySinglePy() {
  console.log('\nTest 6: scripts/ with single .py → NO Python detection')

  const testDir = createTestDir('subdir-single-py')

  try {
    // Create JS project
    const packageJsonPath = path.join(testDir, 'package.json')
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({ name: 'js-project', version: '1.0.0' })
    )
    fs.writeFileSync(path.join(testDir, 'index.js'), 'console.log("JS")')

    // Add single Python script in subdirectory
    const scriptsDir = path.join(testDir, 'scripts')
    fs.mkdirSync(scriptsDir)
    fs.writeFileSync(path.join(scriptsDir, 'deploy.py'), 'print("deploy")')

    // Run setup
    const setupPath = path.resolve(__dirname, '..', 'setup.js')
    execSync(`node "${setupPath}"`, {
      cwd: testDir,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    // Should NOT detect as Python project
    const hasPythonSetup = fs.existsSync(
      path.join(testDir, '.pre-commit-config.yaml')
    )
    assert(
      !hasPythonSetup,
      'Should NOT create Python config for single .py in subdirectory'
    )

    console.log('  ✅ Single .py in subdirectory correctly ignored')
  } finally {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

// Run all tests
;(async () => {
  try {
    testSinglePyFileNoDetection()
    testMultiplePyFilesDetection()
    testMainPatternDetection()
    testAppPatternDetection()
    testConfigFileDetection()
    testSubdirectorySinglePy()

    console.log('\n🎉 All Python Detection Sensitivity Tests Passed!\n')
    console.log('✅ Single random .py file → NO detection (correct)')
    console.log('✅ Multiple .py files → Detection (correct)')
    console.log('✅ main.py/app.py/run.py → Detection (correct)')
    console.log('✅ Config files (pyproject.toml, etc.) → Detection (correct)')
    console.log('✅ Subdirectory single .py → NO detection (correct)')
    console.log(
      '\n📊 Detection now requires stronger evidence, preventing false positives'
    )
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
})()
