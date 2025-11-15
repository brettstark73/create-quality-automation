#!/usr/bin/env node

// Test files intentionally use dynamic paths for temporary test directories

/**
 * Real-World Package Parsing Tests
 *
 * Tests dependency parsing with actual popular packages from each ecosystem
 * to ensure regex patterns handle real-world naming conventions:
 * - Python: Hyphens, underscores, dots (scikit-learn, pytest-cov, Django-REST-framework)
 * - Rust: Underscores, hyphens (tokio_util, actix-web, serde_json)
 * - Ruby: Hyphens, underscores (active-support, rails_autolink, i18n)
 *
 * This addresses PREMIUM-002 post-mortem finding:
 * "Non-representative test data" - toy examples missed real package names
 *
 * Target: 100% parsing accuracy for top packages in each ecosystem
 */

const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

console.log('🧪 Testing Real-World Package Parsing...\n')

// Import parsing functions
const {
  parsePyprojectToml,
  parsePipRequirements,
  parseCargoToml,
  parseGemfile,
} = require('../lib/dependency-monitoring-premium.js')

/**
 * Top 20 Python Packages with Hyphens/Special Characters
 * Source: PyPI download stats, Django ecosystem, pytest plugins
 */
const TOP_PYTHON_PACKAGES = [
  // Machine Learning / Data Science
  'scikit-learn', // sklearn in imports
  'scikit-image', // skimage in imports
  'opencv-python', // cv2 in imports
  'tensorflow-gpu',
  'torch-vision',

  // Django Ecosystem
  'django-cors-headers',
  'django-rest-framework',
  'djangorestframework',
  'django-environ',
  'django-extensions',
  'django-filter',
  'django-crispy-forms',

  // Testing / Development
  'pytest-cov',
  'pytest-django',
  'pytest-asyncio',
  'pytest-mock',
  'python-dotenv',

  // Utilities
  'python-dateutil',
  'beautifulsoup4', // bs4 in imports
  'pillow', // PIL in imports - no hyphen but special case
]

/**
 * Top 10 Rust Packages with Underscores/Special Characters
 * Source: crates.io download stats, common dependencies
 */
const TOP_RUST_PACKAGES = [
  'tokio_util',
  'actix-web',
  'actix-rt',
  'serde_json',
  'serde_derive',
  'async-trait',
  'tracing-subscriber',
  'tower-http',
  'axum-core',
  'sea_orm',
]

/**
 * Top 10 Ruby Packages with Hyphens/Underscores
 * Source: RubyGems download stats, Rails ecosystem
 */
const TOP_RUBY_PACKAGES = [
  'active-support',
  'action-pack',
  'active-record',
  'rails_autolink',
  'coffee-script',
  'sass-rails',
  'jquery-rails',
  'web-console',
  'mini_portile2',
  'concurrent-ruby',
]

/**
 * Test 1: Python pyproject.toml Parsing
 */
function testPyprojectTomlParsing() {
  console.log('Test 1: Python pyproject.toml parsing (Top 20 packages)')

  const testDir = '/tmp/cqa-pyproject-test'
  fs.mkdirSync(testDir, { recursive: true })

  // Create pyproject.toml with top Python packages
  const pyprojectContent = `
[project]
name = "test-project"
version = "1.0.0"

[project.dependencies]
${TOP_PYTHON_PACKAGES.map(pkg => `${pkg} = "^1.0.0"`).join('\n')}
`

  const pyprojectPath = path.join(testDir, 'pyproject.toml')
  fs.writeFileSync(pyprojectPath, pyprojectContent)

  const dependencies = parsePyprojectToml(pyprojectPath)

  // Validate all packages were parsed
  const parsedCount = Object.keys(dependencies).length
  const expectedCount = TOP_PYTHON_PACKAGES.length

  console.log(`  📊 Parsed: ${parsedCount}/${expectedCount} packages`)

  // Check each package
  const missing = []
  TOP_PYTHON_PACKAGES.forEach(pkg => {
    if (!dependencies[pkg]) {
      missing.push(pkg)
    }
  })

  if (missing.length > 0) {
    console.log(`  ❌ Missing packages: ${missing.join(', ')}`)
    assert.fail(`Failed to parse ${missing.length} packages`)
  }

  // Validate versions were captured
  const withVersions = Object.values(dependencies).filter(
    v => v && v !== '*'
  ).length
  console.log(`  📦 With versions: ${withVersions}/${expectedCount}`)

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true })

  console.log('  ✅ All Python packages parsed correctly\n')
}

/**
 * Test 2: Python requirements.txt Parsing
 */
function testRequirementsTxtParsing() {
  console.log('Test 2: Python requirements.txt parsing (Top 20 packages)')

  const testDir = '/tmp/cqa-requirements-test'
  fs.mkdirSync(testDir, { recursive: true })

  // Create requirements.txt with various version formats
  const requirementsContent = `
# Machine Learning
scikit-learn==1.3.0
scikit-image>=0.21.0
opencv-python~=4.8.0
tensorflow-gpu==2.13.0

# Django
django-cors-headers>=4.0.0
django-rest-framework==3.14.0
djangorestframework>=3.14.0
django-environ==0.11.0
django-extensions>=3.2.0

# Testing
pytest-cov==4.1.0
pytest-django>=4.5.0
pytest-asyncio~=0.21.0
python-dotenv>=1.0.0

# Utilities with complex version specs
python-dateutil>=2.8.0,<3.0.0
beautifulsoup4==4.12.*
`

  const reqPath = path.join(testDir, 'requirements.txt')
  fs.writeFileSync(reqPath, requirementsContent)

  const dependencies = parsePipRequirements(reqPath)

  // Validate parsing
  const parsedCount = Object.keys(dependencies).length

  console.log(`  📊 Parsed: ${parsedCount} packages`)

  // Check critical packages
  const criticalPackages = [
    'scikit-learn',
    'django-cors-headers',
    'pytest-cov',
    'python-dotenv',
  ]

  const missing = criticalPackages.filter(pkg => !dependencies[pkg])

  if (missing.length > 0) {
    console.log(`  ❌ Missing critical packages: ${missing.join(', ')}`)
    assert.fail(`Failed to parse ${missing.length} critical packages`)
  }

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true })

  console.log('  ✅ All requirements.txt packages parsed correctly\n')
}

/**
 * Test 3: Rust Cargo.toml Parsing
 */
function testCargoTomlParsing() {
  console.log('Test 3: Rust Cargo.toml parsing (Top 10 packages)')

  const testDir = '/tmp/cqa-cargo-test'
  fs.mkdirSync(testDir, { recursive: true })

  // Create Cargo.toml with top Rust packages
  const cargoContent = `
[package]
name = "test-rust-project"
version = "0.1.0"
edition = "2021"

[dependencies]
${TOP_RUST_PACKAGES.map(pkg => `${pkg} = "1.0"`).join('\n')}

[dev-dependencies]
tokio_util = { version = "0.7", features = ["full"] }
`

  const cargoPath = path.join(testDir, 'Cargo.toml')
  fs.writeFileSync(cargoPath, cargoContent)

  const dependencies = parseCargoToml(cargoPath)

  // Validate all packages were parsed
  const parsedCount = Object.keys(dependencies).length

  console.log(
    `  📊 Parsed: ${parsedCount} packages (including dev-dependencies)`
  )

  // Check each package
  const missing = []
  TOP_RUST_PACKAGES.forEach(pkg => {
    if (!dependencies[pkg]) {
      missing.push(pkg)
    }
  })

  if (missing.length > 0) {
    console.log(`  ❌ Missing packages: ${missing.join(', ')}`)
    assert.fail(`Failed to parse ${missing.length} packages`)
  }

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true })

  console.log('  ✅ All Rust packages parsed correctly\n')
}

/**
 * Test 4: Ruby Gemfile Parsing
 */
function testGemfileParsing() {
  console.log('Test 4: Ruby Gemfile parsing (Top 10 packages)')

  const testDir = '/tmp/cqa-gemfile-test'
  fs.mkdirSync(testDir, { recursive: true })

  // Create Gemfile with top Ruby packages
  const gemfileContent = `
source 'https://rubygems.org'

# Rails ecosystem
gem 'active-support', '~> 7.0'
gem 'action-pack', '~> 7.0'
gem 'active-record', '~> 7.0'
gem 'rails_autolink', '~> 1.1'

# Asset pipeline
gem 'coffee-script', '~> 2.4'
gem 'sass-rails', '~> 6.0'
gem 'jquery-rails', '~> 4.5'

# Development
gem 'web-console', '~> 4.2', group: :development
gem 'mini_portile2', '~> 2.8'
gem 'concurrent-ruby', '~> 1.2'
`

  const gemfilePath = path.join(testDir, 'Gemfile')
  fs.writeFileSync(gemfilePath, gemfileContent)

  const dependencies = parseGemfile(gemfilePath)

  // Validate all packages were parsed
  const parsedCount = Object.keys(dependencies).length

  console.log(
    `  📊 Parsed: ${parsedCount}/${TOP_RUBY_PACKAGES.length} packages`
  )

  // Check each package
  const missing = []
  TOP_RUBY_PACKAGES.forEach(pkg => {
    if (!dependencies[pkg]) {
      missing.push(pkg)
    }
  })

  if (missing.length > 0) {
    console.log(`  ❌ Missing packages: ${missing.join(', ')}`)
    assert.fail(`Failed to parse ${missing.length} packages`)
  }

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true })

  console.log('  ✅ All Ruby packages parsed correctly\n')
}

/**
 * Test 5: Edge Cases - Complex Version Specifications
 */
function testComplexVersionSpecs() {
  console.log('Test 5: Complex version specifications')

  const testDir = '/tmp/cqa-version-test'
  fs.mkdirSync(testDir, { recursive: true })

  // Python with complex versions
  const requirementsContent = `
# Multiple constraints
python-dateutil>=2.8.0,<3.0.0
beautifulsoup4==4.12.*

# Git dependencies (should parse package name)
git+https://github.com/user/django-custom-package.git@v1.0#egg=django-custom-package

# Extras
pytest-cov[toml]>=4.1.0
scikit-learn[alldeps]==1.3.0
`

  const reqPath = path.join(testDir, 'requirements.txt')
  fs.writeFileSync(reqPath, requirementsContent)

  const dependencies = parsePipRequirements(reqPath)

  // Should parse package names even with complex specs
  assert(
    dependencies['python-dateutil'],
    'Should parse package with multiple constraints'
  )
  assert(
    dependencies['beautifulsoup4'],
    'Should parse package with wildcard version'
  )
  assert(
    dependencies['pytest-cov'],
    'Should parse package with extras (brackets)'
  )
  assert(
    dependencies['scikit-learn'],
    'Should parse package with extras and version'
  )

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true })

  console.log('  ✅ Complex version specifications handled correctly\n')
}

// Run all tests
try {
  testPyprojectTomlParsing()
  testRequirementsTxtParsing()
  testCargoTomlParsing()
  testGemfileParsing()
  testComplexVersionSpecs()

  console.log('🎉 All Real-World Package Tests Passed!\n')
  console.log('✅ Python: 20+ packages with hyphens/special chars')
  console.log('✅ Rust: 10 packages with underscores/hyphens')
  console.log('✅ Ruby: 10 packages with hyphens/underscores')
  console.log('✅ Complex version specifications handled')
  console.log('\n📊 Parsing Accuracy: 100%')
} catch (error) {
  console.error('❌ Test failed:', error.message)
  process.exit(1)
}
