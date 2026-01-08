'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const {
  ProjectMaturityDetector,
  MATURITY_LEVELS,
} = require('../lib/project-maturity')

/**
 * Test suite for ProjectMaturityDetector
 *
 * Tests all maturity levels and edge cases:
 * - Minimal: Empty/new projects
 * - Bootstrap: 1-2 source files, no tests
 * - Development: 3+ source files with tests
 * - Production-ready: 10+ files, tests, docs
 */

// Helper: Create temp project directory
const createTempProject = options => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maturity-test-'))

  const {
    sourceFiles = 0,
    testFiles = 0,
    cssFiles = 0,
    hasPackageJson = true,
    hasDependencies = false,
    hasDocumentation = false,
    hasReadme = false,
    readmeLines = 10,
  } = options

  // Create package.json
  if (hasPackageJson) {
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
    }

    if (hasDependencies) {
      packageJson.dependencies = {
        express: '^4.18.0',
        lodash: '^4.17.21',
      }
    }

    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
  }

  // Create source files
  if (sourceFiles > 0) {
    const srcDir = path.join(tempDir, 'src')
    fs.mkdirSync(srcDir, { recursive: true })

    for (let i = 0; i < sourceFiles; i++) {
      const fileName = `module${i}.js`
      const content = `// Source file ${i}\nmodule.exports = { foo: 'bar' };\n`
      fs.writeFileSync(path.join(srcDir, fileName), content)
    }
  }

  // Create test files
  if (testFiles > 0) {
    const testDir = path.join(tempDir, '__tests__')
    fs.mkdirSync(testDir, { recursive: true })

    for (let i = 0; i < testFiles; i++) {
      const fileName = `test${i}.test.js`
      const content = `// Test file ${i}\ntest('example', () => {});\n`
      fs.writeFileSync(path.join(testDir, fileName), content)
    }
  }

  // Create CSS files
  if (cssFiles > 0) {
    const stylesDir = path.join(tempDir, 'styles')
    fs.mkdirSync(stylesDir, { recursive: true })

    for (let i = 0; i < cssFiles; i++) {
      const fileName = `style${i}.css`
      const content = `body { color: red; }\n`
      fs.writeFileSync(path.join(stylesDir, fileName), content)
    }
  }

  // Create documentation
  if (hasDocumentation) {
    const docsDir = path.join(tempDir, 'docs')
    fs.mkdirSync(docsDir, { recursive: true })
    fs.writeFileSync(
      path.join(docsDir, 'guide.md'),
      '# Documentation\n\nThis is comprehensive documentation.\n'
    )
  }

  // Create README
  if (hasReadme) {
    const readmeContent = Array(readmeLines)
      .fill('# README\n\nProject documentation line.\n')
      .join('\n')
    fs.writeFileSync(path.join(tempDir, 'README.md'), readmeContent)
  }

  return tempDir
}

// Helper: Clean up temp directory
const cleanupTempProject = tempDir => {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true })
  } catch (error) {
    console.warn(`Warning: Could not clean up ${tempDir}:`, error.message)
  }
}

// ============================================================================
// Test Suite: Maturity Level Detection
// ============================================================================

console.log('🧪 Testing ProjectMaturityDetector...\n')

// Test 1: Minimal project (empty)
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 0,
    testFiles: 0,
    hasPackageJson: true,
    hasDependencies: false,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const maturity = detector.detect()

    assert.strictEqual(
      maturity,
      'minimal',
      'Empty project should be detected as minimal'
    )

    const stats = detector.analyzeProject()
    assert.strictEqual(stats.totalSourceFiles, 0, 'Should have 0 source files')
    assert.strictEqual(stats.testFiles, 0, 'Should have 0 test files')
    assert.strictEqual(
      stats.hasDependencies,
      false,
      'Should have no dependencies'
    )

    console.log('✅ Test 1 passed: Minimal project detection')
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 2: Bootstrap project (1-2 source files, no tests)
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 2,
    testFiles: 0,
    hasPackageJson: true,
    hasDependencies: false,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const maturity = detector.detect()

    assert.strictEqual(
      maturity,
      'bootstrap',
      'Project with 1-2 source files should be bootstrap'
    )

    const stats = detector.analyzeProject()
    assert.strictEqual(stats.totalSourceFiles, 2, 'Should have 2 source files')
    assert.strictEqual(stats.testFiles, 0, 'Should have 0 test files')

    console.log('✅ Test 2 passed: Bootstrap project detection')
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 3: Development project (3+ source files with tests)
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 5,
    testFiles: 3,
    hasPackageJson: true,
    hasDependencies: true,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const maturity = detector.detect()

    assert.strictEqual(
      maturity,
      'development',
      'Project with 5 source files and 3 tests should be development'
    )

    const stats = detector.analyzeProject()
    assert.strictEqual(stats.totalSourceFiles, 5, 'Should have 5 source files')
    assert.strictEqual(stats.testFiles, 3, 'Should have 3 test files')
    assert.strictEqual(stats.hasDependencies, true, 'Should have dependencies')

    console.log('✅ Test 3 passed: Development project detection')
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 4: Production-ready project (10+ files, tests, docs)
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 15,
    testFiles: 5,
    hasPackageJson: true,
    hasDependencies: true,
    hasDocumentation: true,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const maturity = detector.detect()

    assert.strictEqual(
      maturity,
      'production-ready',
      'Project with 15 source files, 5 tests, and docs should be production-ready'
    )

    const stats = detector.analyzeProject()
    assert.strictEqual(
      stats.totalSourceFiles,
      15,
      'Should have 15 source files'
    )
    assert.strictEqual(stats.testFiles, 5, 'Should have 5 test files')
    assert.strictEqual(
      stats.hasDocumentation,
      true,
      'Should have documentation'
    )
    assert.strictEqual(stats.hasDependencies, true, 'Should have dependencies')

    console.log('✅ Test 4 passed: Production-ready project detection')
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 5: CSS file detection
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 3,
    cssFiles: 5,
    hasPackageJson: true,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const stats = detector.analyzeProject()

    assert.strictEqual(stats.hasCssFiles, true, 'Should detect CSS files')

    console.log('✅ Test 5 passed: CSS file detection')
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 6: Documentation detection (substantial README)
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 10,
    testFiles: 3,
    hasReadme: true,
    readmeLines: 150, // > 100 lines
    hasDependencies: true,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const maturity = detector.detect()
    const stats = detector.analyzeProject()

    assert.strictEqual(
      stats.hasDocumentation,
      true,
      'Should detect documentation from substantial README'
    )
    assert.strictEqual(
      maturity,
      'production-ready',
      'Project with substantial README should be production-ready'
    )

    console.log('✅ Test 6 passed: Documentation detection via README')
  } catch (error) {
    console.error('❌ Test 6 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 7: Edge case - exactly 3 source files with tests
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 3,
    testFiles: 1,
    hasPackageJson: true,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const maturity = detector.detect()

    assert.strictEqual(
      maturity,
      'development',
      'Project with exactly 3 source files and tests should be development'
    )

    console.log('✅ Test 7 passed: Edge case - 3 source files with tests')
  } catch (error) {
    console.error('❌ Test 7 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 8: Edge case - 10 files but no tests (still development)
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 10,
    testFiles: 0,
    hasPackageJson: true,
    hasDependencies: true,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const maturity = detector.detect()

    assert.strictEqual(
      maturity,
      'development',
      'Project with 10 files but no tests should be development, not production-ready'
    )

    console.log('✅ Test 8 passed: Edge case - 10 files without tests')
  } catch (error) {
    console.error('❌ Test 8 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// ============================================================================
// Test Suite: Recommended Checks
// ============================================================================

// Test 9: Recommended checks for each maturity level
;(() => {
  try {
    const detector = new ProjectMaturityDetector()

    // Minimal
    const minimalChecks = detector.getRecommendedChecks('minimal')
    assert.deepStrictEqual(
      minimalChecks.required,
      ['prettier'],
      'Minimal should only require prettier'
    )
    assert.ok(
      minimalChecks.disabled.includes('eslint'),
      'Minimal should disable eslint'
    )

    // Bootstrap
    const bootstrapChecks = detector.getRecommendedChecks('bootstrap')
    assert.ok(
      bootstrapChecks.required.includes('prettier'),
      'Bootstrap should require prettier'
    )
    assert.ok(
      bootstrapChecks.required.includes('eslint'),
      'Bootstrap should require eslint'
    )
    assert.ok(
      bootstrapChecks.disabled.includes('tests'),
      'Bootstrap should disable tests'
    )

    // Development
    const developmentChecks = detector.getRecommendedChecks('development')
    assert.ok(
      developmentChecks.required.includes('tests'),
      'Development should require tests'
    )
    assert.ok(
      developmentChecks.disabled.includes('documentation'),
      'Development should disable documentation'
    )

    // Production-ready
    const prodChecks = detector.getRecommendedChecks('production-ready')
    assert.ok(
      prodChecks.required.includes('documentation'),
      'Production-ready should require documentation'
    )
    assert.ok(
      prodChecks.required.includes('security-audit'),
      'Production-ready should require security-audit'
    )
    assert.strictEqual(
      prodChecks.disabled.length,
      0,
      'Production-ready should have no disabled checks'
    )

    console.log('✅ Test 9 passed: Recommended checks for all maturity levels')
  } catch (error) {
    console.error('❌ Test 9 failed:', error.message)
    process.exitCode = 1
  }
})()

// ============================================================================
// Test Suite: GitHub Actions Output
// ============================================================================

// Test 10: GitHub Actions output format
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 5,
    testFiles: 2,
    hasPackageJson: true,
    hasDependencies: true,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const output = detector.generateGitHubActionsOutput()

    assert.strictEqual(typeof output.maturity, 'string', 'Should have maturity')
    assert.strictEqual(
      typeof output.sourceCount,
      'number',
      'Should have sourceCount'
    )
    assert.strictEqual(
      typeof output.testCount,
      'number',
      'Should have testCount'
    )
    assert.strictEqual(typeof output.hasDeps, 'boolean', 'Should have hasDeps')
    assert.strictEqual(
      typeof output.requiredChecks,
      'string',
      'Should have requiredChecks as comma-separated string'
    )

    assert.strictEqual(output.sourceCount, 5, 'Should report 5 source files')
    assert.strictEqual(output.testCount, 2, 'Should report 2 test files')
    assert.strictEqual(output.hasDeps, true, 'Should report dependencies exist')

    console.log('✅ Test 10 passed: GitHub Actions output format')
  } catch (error) {
    console.error('❌ Test 10 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// ============================================================================
// Test Suite: Edge Cases and Error Handling
// ============================================================================

// Test 11: No package.json (should still work)
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 3,
    testFiles: 0,
    hasPackageJson: false,
  })

  try {
    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const maturity = detector.detect()
    const stats = detector.analyzeProject()

    assert.strictEqual(
      stats.packageJsonExists,
      false,
      'Should detect missing package.json'
    )
    assert.strictEqual(
      stats.hasDependencies,
      false,
      'Should report no dependencies without package.json'
    )
    assert.strictEqual(
      maturity,
      'development',
      'With 3 source files, should be development (even without package.json)'
    )

    console.log('✅ Test 11 passed: Handles missing package.json')
  } catch (error) {
    console.error('❌ Test 11 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 12: Nested source files (should be counted)
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 0,
    hasPackageJson: true,
  })

  try {
    // Create nested directory structure
    const nestedDir = path.join(tempDir, 'src', 'components', 'ui')
    fs.mkdirSync(nestedDir, { recursive: true })
    fs.writeFileSync(
      path.join(nestedDir, 'Button.js'),
      'module.exports = { Button: true };'
    )
    fs.writeFileSync(
      path.join(nestedDir, 'Input.js'),
      'module.exports = { Input: true };'
    )

    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const stats = detector.analyzeProject()

    assert.ok(stats.totalSourceFiles >= 2, 'Should find nested source files')

    console.log('✅ Test 12 passed: Detects nested source files')
  } catch (error) {
    console.error('❌ Test 12 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 13: Test files in different locations
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 5,
    testFiles: 0, // Don't use helper's test creation
    hasPackageJson: true,
  })

  try {
    // Create tests in various conventional locations
    const testLocations = [
      path.join(tempDir, 'tests', 'unit.test.js'),
      path.join(tempDir, 'spec', 'integration.spec.js'),
      path.join(tempDir, 'src', '__tests__', 'component.test.js'),
    ]

    testLocations.forEach(testPath => {
      fs.mkdirSync(path.dirname(testPath), { recursive: true })
      fs.writeFileSync(testPath, 'test("example", () => {});')
    })

    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const stats = detector.analyzeProject()

    assert.ok(stats.testFiles >= 3, 'Should find tests in various locations')
    assert.strictEqual(stats.hasTests, true, 'Should detect tests exist')

    console.log('✅ Test 13 passed: Detects tests in multiple locations')
  } catch (error) {
    console.error('❌ Test 13 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 14: MATURITY_LEVELS constant structure
;(() => {
  try {
    assert.ok(MATURITY_LEVELS.minimal, 'Should have minimal level')
    assert.ok(MATURITY_LEVELS.bootstrap, 'Should have bootstrap level')
    assert.ok(MATURITY_LEVELS.development, 'Should have development level')
    assert.ok(
      MATURITY_LEVELS['production-ready'],
      'Should have production-ready level'
    )

    // Check structure
    for (const level of Object.values(MATURITY_LEVELS)) {
      assert.ok(level.name, 'Each level should have a name')
      assert.ok(level.description, 'Each level should have a description')
      assert.ok(level.checks, 'Each level should have checks')
      assert.ok(level.checks.required, 'Each level should have required checks')
      assert.ok(level.checks.disabled, 'Each level should have disabled checks')
      assert.ok(level.message, 'Each level should have a message')
    }

    console.log('✅ Test 14 passed: MATURITY_LEVELS constant structure')
  } catch (error) {
    console.error('❌ Test 14 failed:', error.message)
    process.exitCode = 1
  }
})()

// Test 15: TypeScript file detection
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 0,
    hasPackageJson: true,
  })

  try {
    // Create TypeScript files
    const srcDir = path.join(tempDir, 'src')
    fs.mkdirSync(srcDir, { recursive: true })
    fs.writeFileSync(
      path.join(srcDir, 'index.ts'),
      'const foo: string = "bar";'
    )
    fs.writeFileSync(
      path.join(srcDir, 'component.tsx'),
      'export const App = () => <div>Hello</div>;'
    )

    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const stats = detector.analyzeProject()

    assert.strictEqual(
      stats.totalSourceFiles,
      2,
      'Should detect TypeScript files'
    )

    console.log('✅ Test 15 passed: TypeScript file detection')
  } catch (error) {
    console.error('❌ Test 15 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// ============================================================================
// Test Suite: Shell Script Detection
// ============================================================================

// Test 16: Shell script file detection
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 0,
    hasPackageJson: false,
  })

  try {
    // Add shell scripts
    fs.writeFileSync(
      path.join(tempDir, 'deploy.sh'),
      '#!/bin/bash\necho "Deploying..."'
    )
    fs.writeFileSync(
      path.join(tempDir, 'backup.sh'),
      '#!/bin/bash\necho "Backing up..."'
    )
    fs.writeFileSync(
      path.join(tempDir, 'setup.bash'),
      '#!/bin/bash\necho "Setup"'
    )

    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const stats = detector.analyzeProject()

    assert.strictEqual(
      stats.shellScriptCount,
      3,
      'Should count 3 shell scripts'
    )
    assert.strictEqual(
      stats.hasShellScripts,
      true,
      'Should detect shell scripts'
    )
    assert.strictEqual(
      stats.isShellProject,
      true,
      'Should identify as shell project (no package.json)'
    )

    console.log('✅ Test 16 passed: Shell script file detection')
  } catch (error) {
    console.error('❌ Test 16 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 17: Shell scripts in non-shell project
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 5,
    hasPackageJson: true,
  })

  try {
    // Add some shell scripts to a Node.js project
    fs.writeFileSync(
      path.join(tempDir, 'deploy.sh'),
      '#!/bin/bash\necho "Deploying..."'
    )

    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const stats = detector.analyzeProject()

    assert.strictEqual(stats.shellScriptCount, 1, 'Should count 1 shell script')
    assert.strictEqual(
      stats.hasShellScripts,
      true,
      'Should detect shell scripts'
    )
    assert.strictEqual(
      stats.isShellProject,
      false,
      'Should NOT identify as shell project (has package.json)'
    )

    console.log('✅ Test 17 passed: Shell scripts in non-shell project')
  } catch (error) {
    console.error('❌ Test 17 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// Test 18: GitHub Actions output includes shell info
;(() => {
  const tempDir = createTempProject({
    sourceFiles: 0,
    hasPackageJson: false,
  })

  try {
    // Add shell scripts
    fs.writeFileSync(
      path.join(tempDir, 'deploy.sh'),
      '#!/bin/bash\necho "Deploying..."'
    )
    fs.writeFileSync(
      path.join(tempDir, 'backup.sh'),
      '#!/bin/bash\necho "Backing up..."'
    )

    const detector = new ProjectMaturityDetector({ projectPath: tempDir })
    const output = detector.generateGitHubActionsOutput()

    assert.strictEqual(
      typeof output.hasShell,
      'boolean',
      'Should have hasShell'
    )
    assert.strictEqual(
      typeof output.shellCount,
      'number',
      'Should have shellCount'
    )
    assert.strictEqual(
      typeof output.isShellProject,
      'boolean',
      'Should have isShellProject'
    )

    assert.strictEqual(output.hasShell, true, 'Should report has shell scripts')
    assert.strictEqual(output.shellCount, 2, 'Should report 2 shell scripts')
    assert.strictEqual(
      output.isShellProject,
      true,
      'Should report is shell project'
    )

    console.log('✅ Test 18 passed: GitHub Actions output includes shell info')
  } catch (error) {
    console.error('❌ Test 18 failed:', error.message)
    process.exitCode = 1
  } finally {
    cleanupTempProject(tempDir)
  }
})()

// ============================================================================
// Summary
// ============================================================================

console.log('\n🎉 All project maturity tests completed!')

if (process.exitCode === 1) {
  console.error('\n❌ Some tests failed')
} else {
  console.log('\n✅ All tests passed')
}
