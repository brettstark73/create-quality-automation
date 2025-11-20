#!/usr/bin/env node

/**
 * Comprehensive Tests for Python Parser Fixes
 *
 * Tests the fixes for three critical parser bugs:
 * 1. HIGH: parsePyprojectToml must parse PEP 621 list-style dependencies
 * 2. MEDIUM: Requirements parser must handle dotted package names
 * 3. MEDIUM: Multi-language detection must work in subdirectories
 */

const assert = require('node:assert')
const fs = require('fs')
const path = require('path')
const os = require('os')

console.log('🧪 Testing Python Parser Fixes...\n')

// Import the fixed parser functions
const {
  parsePyprojectToml,
  parsePipRequirements,
  detectPythonFrameworks,
} = require('../lib/dependency-monitoring-premium.js')

/**
 * Test 1: PEP 621 list-style dependencies parsing
 */
function testPEP621DependenciesParsing() {
  console.log('Test 1: PEP 621 list-style dependencies')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pep621-fix-'))

  try {
    // Create modern PEP 621 pyproject.toml with list-style dependencies
    const pyprojectContent = `[project]
name = "modern-python-project"
version = "1.0.0"
dependencies = [
    "fastapi>=0.110.0",
    "pydantic>=2.0.0",
    "django>=4.2.0",
    "scikit-learn>=1.3.0",
    "pytest-cov>=4.0.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "black>=23.0.0"
]

# Old-style dependencies (should still work)
[tool.poetry.dependencies]
requests = "^2.31.0"
`

    const pyprojectPath = path.join(testDir, 'pyproject.toml')
    fs.writeFileSync(pyprojectPath, pyprojectContent)

    const dependencies = parsePyprojectToml(pyprojectPath)

    console.log('  Parsed dependencies:', Object.keys(dependencies))
    console.log('  Total dependencies:', Object.keys(dependencies).length)

    // Must find all dependencies from [project] dependencies array
    assert(
      dependencies['fastapi'],
      'Should parse fastapi from PEP 621 dependencies'
    )
    assert(
      dependencies['pydantic'],
      'Should parse pydantic from PEP 621 dependencies'
    )
    assert(
      dependencies['django'],
      'Should parse django from PEP 621 dependencies'
    )
    assert(
      dependencies['scikit-learn'],
      'Should parse scikit-learn (hyphenated) from PEP 621'
    )
    assert(
      dependencies['pytest-cov'],
      'Should parse pytest-cov (hyphenated) from PEP 621'
    )

    // Should also parse optional-dependencies
    assert(
      dependencies['pytest'],
      'Should parse pytest from optional-dependencies'
    )
    assert(
      dependencies['black'],
      'Should parse black from optional-dependencies'
    )

    // Should still support old-style key=value
    assert(
      dependencies['requests'],
      'Should still parse old-style dependencies'
    )

    // Verify version constraints are preserved
    assert(
      dependencies['fastapi'].includes('0.110'),
      'Should preserve version constraints'
    )

    console.log('  ✅ PEP 621 list-style dependencies parsed correctly')
    return true
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 2: Dotted package names in requirements.txt
 */
function testDottedPackageNames() {
  console.log('\nTest 2: Dotted package names parsing')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotted-fix-'))

  try {
    // Create requirements.txt with real-world dotted packages
    const requirementsContent = `# Zope ecosystem
zope.interface==6.0
zope.component>=5.0.0

# Google Cloud
google.cloud-storage>=2.16.0
google.api-core>=2.15.0

# Backports
backports.zoneinfo>=0.2.1

# YAML parsers
ruamel.yaml>=0.17.0

# Regular packages (should still work)
requests>=2.31.0
numpy>=1.24.0
`

    const reqPath = path.join(testDir, 'requirements.txt')
    fs.writeFileSync(reqPath, requirementsContent)

    const dependencies = parsePipRequirements(reqPath)

    console.log('  Parsed dependencies:', Object.keys(dependencies))
    console.log('  Total dependencies:', Object.keys(dependencies).length)

    // Must preserve dots in package names
    assert(
      dependencies['zope.interface'],
      'Should parse zope.interface with dots'
    )
    assert(
      dependencies['zope.component'],
      'Should parse zope.component with dots'
    )
    assert(
      dependencies['google.cloud-storage'],
      'Should parse google.cloud-storage with dots and hyphens'
    )
    assert(
      dependencies['google.api-core'],
      'Should parse google.api-core with dots and hyphens'
    )
    assert(
      dependencies['backports.zoneinfo'],
      'Should parse backports.zoneinfo with dots'
    )
    assert(dependencies['ruamel.yaml'], 'Should parse ruamel.yaml with dots')

    // Regular packages should still work
    assert(dependencies['requests'], 'Should still parse regular packages')
    assert(dependencies['numpy'], 'Should still parse regular packages')

    // Verify versions
    assert.strictEqual(
      dependencies['zope.interface'],
      '==6.0',
      'Should preserve exact version'
    )
    assert(
      dependencies['google.cloud-storage'].startsWith('>='),
      'Should preserve >= operator'
    )

    console.log('  ✅ Dotted package names parsed correctly')
    return true
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 3: Framework detection with fixed parsers
 */
function testFrameworkDetectionWithFixedParsers() {
  console.log('\nTest 3: Framework detection with fixed parsers')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'framework-fix-'))

  try {
    // Create pyproject.toml with Django framework (PEP 621 format)
    const pyprojectContent = `[project]
name = "django-app"
dependencies = [
    "django>=4.2.0",
    "django-cors-headers>=4.0.0",
    "djangorestframework>=3.14.0"
]
`
    fs.writeFileSync(path.join(testDir, 'pyproject.toml'), pyprojectContent)

    // Detect frameworks
    const result = detectPythonFrameworks(testDir)

    console.log('  Detected frameworks:', Object.keys(result.detected))
    console.log('  Primary framework:', result.primary)

    // Should detect Django framework (framework names are lowercase)
    assert(result.detected['django'], 'Should detect Django framework')
    assert(
      result.detected['django'].packages.includes('django'),
      'Should include django package'
    )
    assert(
      result.detected['django'].packages.includes('djangorestframework'),
      'Should include djangorestframework'
    )
    // Note: django-cors-headers is not in PYTHON_FRAMEWORK_SIGNATURES
    // Only core framework packages are matched (django, djangorestframework)
    assert(
      result.primary === 'django',
      'Should set django as primary framework'
    )

    console.log('  ✅ Framework detection works with PEP 621 dependencies')
    return true
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 4: Complex real-world pyproject.toml
 */
function testRealWorldPyprojectToml() {
  console.log('\nTest 4: Real-world pyproject.toml parsing')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'realworld-'))

  try {
    // Real-world pyproject.toml inspired by FastAPI projects
    const pyprojectContent = `[project]
name = "fastapi-production-app"
version = "0.1.0"
description = "Production FastAPI application"
dependencies = [
    "fastapi[all]>=0.110.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "sqlalchemy>=2.0.0",
    "alembic>=1.12.0",
    "uvicorn[standard]>=0.24.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
    "mypy>=1.6.0",
]

[build-system]
requires = ["setuptools>=68.0.0", "wheel"]
build-backend = "setuptools.build_meta"
`

    const pyprojectPath = path.join(testDir, 'pyproject.toml')
    fs.writeFileSync(pyprojectPath, pyprojectContent)

    const dependencies = parsePyprojectToml(pyprojectPath)

    console.log('  Total dependencies:', Object.keys(dependencies).length)

    // Production dependencies
    assert(dependencies['fastapi'], 'Should parse fastapi with extras')
    assert(dependencies['pydantic'], 'Should parse pydantic')
    assert(
      dependencies['pydantic-settings'],
      'Should parse hyphenated packages'
    )
    assert(dependencies['sqlalchemy'], 'Should parse sqlalchemy')
    assert(dependencies['uvicorn'], 'Should parse uvicorn with extras')

    // Dev dependencies
    assert(dependencies['pytest'], 'Should parse dev dependencies')
    assert(dependencies['pytest-cov'], 'Should parse pytest-cov')
    assert(dependencies['pytest-asyncio'], 'Should parse pytest-asyncio')

    // Should handle [all] and [standard] extras correctly
    assert(
      dependencies['fastapi'].includes('0.110'),
      'Should preserve version from package with extras'
    )

    console.log('  ✅ Real-world pyproject.toml parsed correctly')
    return true
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 5: Hyphenated optional-dependency group names
 */
function testHyphenatedGroupNames() {
  console.log('\nTest 5: Hyphenated optional-dependency group names')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hyphenated-'))

  try {
    const pyprojectContent = `[project]
name = "test-project"
dependencies = ["requests>=2.31.0"]

[project.optional-dependencies]
dev = ["pytest>=7.0.0"]
lint-tools = ["ruff>=0.1.0", "black>=23.0.0"]
test-suite = ["pytest-cov>=4.0.0", "pytest-asyncio>=0.21.0"]
docs-build = ["sphinx>=6.0.0"]
`

    const pyprojectPath = path.join(testDir, 'pyproject.toml')
    fs.writeFileSync(pyprojectPath, pyprojectContent)

    const dependencies = parsePyprojectToml(pyprojectPath)

    console.log('  Parsed dependencies:', Object.keys(dependencies))
    console.log('  Total dependencies:', Object.keys(dependencies).length)

    // Should parse hyphenated group names
    assert(dependencies['ruff'], 'Should parse ruff from lint-tools group')
    assert(dependencies['black'], 'Should parse black from lint-tools group')
    assert(
      dependencies['pytest-cov'],
      'Should parse pytest-cov from test-suite group'
    )
    assert(
      dependencies['pytest-asyncio'],
      'Should parse pytest-asyncio from test-suite group'
    )
    assert(dependencies['sphinx'], 'Should parse sphinx from docs-build group')

    // Should also parse regular groups
    assert(dependencies['pytest'], 'Should parse pytest from dev group')
    assert(
      dependencies['requests'],
      'Should parse requests from main dependencies'
    )

    console.log('  ✅ Hyphenated group names parsed correctly')
    return true
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 6: Inline comments after ] in pyproject.toml
 */
function testInlineCommentsAfterBracket() {
  console.log('\nTest 6: Inline comments after ] in dependencies array')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inline-comment-'))

  try {
    // Real-world case: developers add comments after closing ]
    const pyprojectContent = `[project]
name = "test-project"
dependencies = [
    "requests>=2.31.0",
    "numpy>=1.24.0"
]  # end of dependencies

[tool.poetry]
name = "test"
`

    const pyprojectPath = path.join(testDir, 'pyproject.toml')
    fs.writeFileSync(pyprojectPath, pyprojectContent)

    const dependencies = parsePyprojectToml(pyprojectPath)

    console.log('  Parsed dependencies:', Object.keys(dependencies))

    // Should parse despite inline comment after ]
    assert(
      dependencies['requests'],
      'Should parse requests despite ] # comment'
    )
    assert(dependencies['numpy'], 'Should parse numpy despite ] # comment')
    assert.strictEqual(
      Object.keys(dependencies).length,
      2,
      'Should find exactly 2 dependencies'
    )

    console.log('  ✅ Inline comments after ] handled correctly')
    return true
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 7: Metadata pollution prevention
 */
function testMetadataPollution() {
  console.log('\nTest 7: Metadata pollution prevention')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'metadata-'))

  try {
    // Ensure [project.urls] and other metadata doesn't pollute dependencies
    const pyprojectContent = `[project]
name = "test-project"
version = "1.0.0"
dependencies = ["requests>=2.31.0"]

[project.urls]
homepage = "https://example.com"
repository = "https://github.com/user/repo"

[tool.poetry.dependencies]
python = "^3.8"
pytest = "^7.0.0"
`

    const pyprojectPath = path.join(testDir, 'pyproject.toml')
    fs.writeFileSync(pyprojectPath, pyprojectContent)

    const dependencies = parsePyprojectToml(pyprojectPath)

    console.log('  Parsed dependencies:', Object.keys(dependencies))

    // Should NOT include URLs or metadata
    assert(!dependencies['homepage'], 'Should not include homepage URL')
    assert(!dependencies['repository'], 'Should not include repository URL')
    assert(
      !dependencies['python'],
      'Should not include python version specifier'
    )

    // Should include actual dependencies
    assert(dependencies['requests'], 'Should include requests')
    assert(dependencies['pytest'], 'Should include pytest')

    console.log('  ✅ Metadata correctly excluded from dependencies')
    return true
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test 8: Edge cases and error handling
 */
function testEdgeCases() {
  console.log('\nTest 8: Edge cases and error handling')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cases-'))

  try {
    // Edge case: Comments, blank lines, inline comments
    const requirementsContent = `# Production dependencies
requests>=2.31.0

# Data science (with inline comments)
numpy>=1.24.0  # For numerical computing
pandas>=2.0.0 # Data manipulation

# Dotted packages with comments
zope.interface==6.0  # Interface definitions

# Package with extras
fastapi[all]>=0.110.0

# Git dependencies (should skip or handle gracefully)
# git+https://github.com/user/repo.git@main

# Blank lines and spacing


scipy>=1.11.0
`

    const reqPath = path.join(testDir, 'requirements.txt')
    fs.writeFileSync(reqPath, requirementsContent)

    const dependencies = parsePipRequirements(reqPath)

    console.log('  Parsed dependencies:', Object.keys(dependencies).length)

    // Should handle all valid packages
    assert(dependencies['requests'], 'Should parse packages before comments')
    assert(dependencies['numpy'], 'Should handle inline comments')
    assert(dependencies['pandas'], 'Should handle inline comments')
    assert(dependencies['zope.interface'], 'Should handle dots with comments')
    assert(dependencies['scipy'], 'Should handle blank lines')

    // Should handle extras gracefully (fastapi[all] → fastapi)
    assert(
      dependencies['fastapi'] || dependencies['fastapi[all]'],
      'Should handle package with extras'
    )

    console.log('  ✅ Edge cases handled correctly')
    return true
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

// Run all tests
async function runAllTests() {
  try {
    testPEP621DependenciesParsing()
    testDottedPackageNames()
    testFrameworkDetectionWithFixedParsers()
    testRealWorldPyprojectToml()
    testHyphenatedGroupNames()
    testInlineCommentsAfterBracket()
    testMetadataPollution()
    testEdgeCases()

    console.log('\n' + '='.repeat(60))
    console.log('✅ All Python Parser Fix Tests Passed!')
    console.log('='.repeat(60))
    console.log('\n📊 Test Coverage:')
    console.log('  ✅ PEP 621 list-style dependencies')
    console.log('  ✅ Dotted package names (zope.*, google.*)')
    console.log('  ✅ Framework detection with fixed parsers')
    console.log('  ✅ Real-world pyproject.toml scenarios')
    console.log('  ✅ Hyphenated optional-dependency group names')
    console.log('  ✅ Inline comments after ] bracket')
    console.log('  ✅ Metadata pollution prevention')
    console.log('  ✅ Edge cases (comments, extras, blank lines)')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

if (require.main === module) {
  runAllTests()
}

module.exports = {
  testPEP621DependenciesParsing,
  testDottedPackageNames,
  testFrameworkDetectionWithFixedParsers,
  testRealWorldPyprojectToml,
  testHyphenatedGroupNames,
  testEdgeCases,
}
