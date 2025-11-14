/**
 * Tests for Multi-Language Dependency Monitoring (PREMIUM-002)
 * Python, Rust, and Ruby ecosystem support
 */

const assert = require('assert')
const {
  detectPythonFrameworks,
  detectRustFrameworks,
  detectRubyFrameworks,
  detectAllEcosystems,
  generateDjangoGroups,
  generateFastAPIGroups,
  generateDataScienceGroups,
  generateActixGroups,
  generateSerdeGroups,
  generateRailsGroups,
  generatePipGroups,
  generateCargoGroups,
  generateBundlerGroups,
  PYTHON_FRAMEWORK_SIGNATURES,
  RUST_FRAMEWORK_SIGNATURES,
  RUBY_FRAMEWORK_SIGNATURES,
} = require('../lib/dependency-monitoring-premium')
const fs = require('fs')
const path = require('path')
const os = require('os')

console.log('\n🧪 Testing Multi-Language Dependency Monitoring...\n')

// Helper to create temporary project directory
function createTempProject(files) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ml-'))
  Object.entries(files).forEach(([filename, content]) => {
    const filePath = path.join(tempDir, filename)
    const fileDir = path.dirname(filePath)
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(fileDir)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.mkdirSync(fileDir, { recursive: true })
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(filePath, content)
  })
  return tempDir
}

// Helper to clean up temp directory
function cleanupTempProject(tempDir) {
  fs.rmSync(tempDir, { recursive: true, force: true })
}

// =============================================================================
// PYTHON/PIP TESTS
// =============================================================================

// Test 1: Django Detection
function testPythonDjangoDetection() {
  console.log('Test 1: Python Django Detection')

  const requirementsContent = `
django==4.2.0
djangorestframework==3.14.0
django-cors-headers==4.0.0
gunicorn==20.1.0
pytest==7.3.0
`

  const tempDir = createTempProject({
    'requirements.txt': requirementsContent,
  })

  try {
    const result = detectPythonFrameworks(tempDir)

    assert.strictEqual(
      result.primary,
      'django',
      'Should detect Django as primary'
    )
    assert.ok(result.detected.django, 'Should detect Django framework')
    assert.ok(
      result.detected.django.packages.includes('django'),
      'Should include django package'
    )
    assert.ok(
      result.detected.django.packages.includes('djangorestframework'),
      'Should include DRF'
    )
    assert.ok(result.detected.testing, 'Should detect testing frameworks')

    console.log('✅ Django detection working correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 2: FastAPI Detection
function testPythonFastAPIDetection() {
  console.log('Test 2: Python FastAPI Detection')

  const pyprojectContent = `
[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.95.0"
uvicorn = "^0.21.0"
pydantic = "^1.10.0"
pytest = "^7.2.0"
`

  const tempDir = createTempProject({
    'pyproject.toml': pyprojectContent,
  })

  try {
    const result = detectPythonFrameworks(tempDir)

    assert.strictEqual(
      result.primary,
      'fastapi',
      'Should detect FastAPI as primary'
    )
    assert.ok(result.detected.fastapi, 'Should detect FastAPI framework')
    assert.ok(
      result.detected.fastapi.packages.includes('fastapi'),
      'Should include fastapi'
    )
    assert.ok(
      result.detected.fastapi.packages.includes('uvicorn'),
      'Should include uvicorn'
    )
    assert.ok(
      result.detected.fastapi.packages.includes('pydantic'),
      'Should include pydantic'
    )

    console.log('✅ FastAPI detection working correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 3: Data Science Detection
function testPythonDataScienceDetection() {
  console.log('Test 3: Python Data Science Detection')

  const requirementsContent = `
numpy==1.24.0
pandas==1.5.3
scipy==1.10.0
scikit-learn==1.2.1
matplotlib==3.7.0
seaborn==0.12.2
`

  const tempDir = createTempProject({
    'requirements.txt': requirementsContent,
  })

  try {
    const result = detectPythonFrameworks(tempDir)

    assert.ok(result.detected.datascience, 'Should detect data science stack')
    assert.ok(
      result.detected.datascience.packages.includes('numpy'),
      'Should include numpy'
    )
    assert.ok(
      result.detected.datascience.packages.includes('pandas'),
      'Should include pandas'
    )
    assert.ok(
      result.detected.datascience.packages.includes('scikit-learn'),
      'Should include sklearn'
    )
    assert.ok(
      result.detected.datascience.packages.includes('matplotlib'),
      'Should include matplotlib'
    )

    console.log('✅ Data Science detection working correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 4: Python Dependency Groups
function testPythonDependencyGroups() {
  console.log('Test 4: Python Dependency Groups Generation')

  const djangoGroups = generateDjangoGroups({})
  assert.ok(djangoGroups['django-core'], 'Should generate django-core group')
  assert.ok(
    djangoGroups['django-core'].patterns.includes('django'),
    'Should include django'
  )

  const fastApiGroups = generateFastAPIGroups({})
  assert.ok(fastApiGroups['fastapi-core'], 'Should generate fastapi-core group')
  assert.ok(
    fastApiGroups['fastapi-core'].patterns.includes('fastapi'),
    'Should include fastapi'
  )

  const dataGroups = generateDataScienceGroups({})
  assert.ok(dataGroups['data-core'], 'Should generate data-core group')
  assert.ok(dataGroups['ml-frameworks'], 'Should generate ml-frameworks group')

  console.log('✅ Python dependency groups generated correctly\n')
}

// =============================================================================
// RUST/CARGO TESTS
// =============================================================================

// Test 5: Rust Actix Detection
function testRustActixDetection() {
  console.log('Test 5: Rust Actix Detection')

  const cargoContent = `
[package]
name = "my-api"
version = "0.1.0"

[dependencies]
actix-web = "4.3"
actix-rt = "2.8"
tokio = { version = "1.28", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
`

  const tempDir = createTempProject({
    'Cargo.toml': cargoContent,
  })

  try {
    const result = detectRustFrameworks(tempDir)

    assert.strictEqual(
      result.primary,
      'actix',
      'Should detect Actix as primary'
    )
    assert.ok(result.detected.actix, 'Should detect Actix framework')
    assert.ok(
      result.detected.actix.packages.includes('actix-web'),
      'Should include actix-web'
    )
    assert.ok(result.detected.async, 'Should detect async runtime')
    assert.ok(result.detected.serde, 'Should detect serde')

    console.log('✅ Rust Actix detection working correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 6: Rust Dependency Groups
function testRustDependencyGroups() {
  console.log('Test 6: Rust Dependency Groups Generation')

  const actixGroups = generateActixGroups({})
  assert.ok(actixGroups['actix-core'], 'Should generate actix-core group')
  assert.ok(
    actixGroups['actix-core'].patterns.includes('actix-web'),
    'Should include actix-web'
  )

  const serdeGroups = generateSerdeGroups({})
  assert.ok(
    serdeGroups['serde-ecosystem'],
    'Should generate serde-ecosystem group'
  )
  assert.ok(
    serdeGroups['serde-ecosystem'].patterns.includes('serde'),
    'Should include serde'
  )

  console.log('✅ Rust dependency groups generated correctly\n')
}

// =============================================================================
// RUBY/BUNDLER TESTS
// =============================================================================

// Test 7: Ruby Rails Detection
function testRubyRailsDetection() {
  console.log('Test 7: Ruby Rails Detection')

  const gemfileContent = `
source 'https://rubygems.org'

gem 'rails', '~> 7.0'
gem 'pg', '~> 1.5'
gem 'puma', '~> 6.0'
gem 'rspec-rails'
gem 'factory_bot_rails'
`

  const tempDir = createTempProject({
    Gemfile: gemfileContent,
  })

  try {
    const result = detectRubyFrameworks(tempDir)

    assert.strictEqual(
      result.primary,
      'rails',
      'Should detect Rails as primary'
    )
    assert.ok(result.detected.rails, 'Should detect Rails framework')
    assert.ok(
      result.detected.rails.packages.includes('rails'),
      'Should include rails'
    )
    assert.ok(
      result.detected.rails.packages.includes('pg'),
      'Should include pg'
    )
    assert.ok(result.detected.testing, 'Should detect testing frameworks')

    console.log('✅ Ruby Rails detection working correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 8: Ruby Dependency Groups
function testRubyDependencyGroups() {
  console.log('Test 8: Ruby Dependency Groups Generation')

  const railsGroups = generateRailsGroups({})
  assert.ok(railsGroups['rails-core'], 'Should generate rails-core group')
  assert.ok(
    railsGroups['rails-core'].patterns.includes('rails'),
    'Should include rails'
  )
  assert.ok(
    railsGroups['rails-ecosystem'],
    'Should generate rails-ecosystem group'
  )

  console.log('✅ Ruby dependency groups generated correctly\n')
}

// =============================================================================
// MULTI-LANGUAGE TESTS
// =============================================================================

// Test 9: Polyglot Project Detection
function testPolyglotProjectDetection() {
  console.log(
    'Test 9: Polyglot Project Detection (npm + pip + cargo + bundler)'
  )

  const tempDir = createTempProject({
    'package.json': JSON.stringify({ dependencies: { react: '^18.0.0' } }),
    'requirements.txt': 'django==4.2.0\ndjangores\ntframework==3.14.0',
    'Cargo.toml': '[dependencies]\nactix-web = "4.3"\ntokio = "1.28"',
    Gemfile: "gem 'rails', '~> 7.0'",
  })

  try {
    const ecosystems = detectAllEcosystems(tempDir)

    assert.ok(ecosystems.npm, 'Should detect npm ecosystem')
    assert.ok(ecosystems.pip, 'Should detect pip ecosystem')
    assert.ok(ecosystems.cargo, 'Should detect cargo ecosystem')
    assert.ok(ecosystems.bundler, 'Should detect bundler ecosystem')

    console.log('✅ Polyglot project detection working correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 10: Python + JavaScript Mix
function testPythonJavaScriptMix() {
  console.log('Test 10: Python + JavaScript Mixed Project')

  const tempDir = createTempProject({
    'package.json': JSON.stringify({
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
      },
    }),
    'requirements.txt': 'fastapi==0.95.0\nuvicorn==0.21.0',
  })

  try {
    const ecosystems = detectAllEcosystems(tempDir)

    assert.ok(ecosystems.npm, 'Should detect npm')
    assert.ok(ecosystems.pip, 'Should detect pip')
    assert.strictEqual(
      ecosystems.npm.primary,
      'react',
      'npm primary should be React'
    )
    assert.strictEqual(
      ecosystems.pip.primary,
      'fastapi',
      'pip primary should be FastAPI'
    )

    console.log('✅ Python + JavaScript detection working correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 11: Multi-Language Group Generation
function testMultiLanguageGroupGeneration() {
  console.log('Test 11: Multi-Language Dependency Group Generation')

  const tempDir = createTempProject({
    'package.json': JSON.stringify({ dependencies: { react: '^18.0.0' } }),
    'requirements.txt': 'django==4.2.0',
    'Cargo.toml': '[dependencies]\nactix-web = "4.3"',
    Gemfile: "gem 'rails', '~> 7.0'",
  })

  try {
    const ecosystems = detectAllEcosystems(tempDir)

    const npmGroups = generatePipGroups(ecosystems.npm || { detected: {} })
    const pipGroups = generatePipGroups(ecosystems.pip || { detected: {} })
    const cargoGroups = generateCargoGroups(
      ecosystems.cargo || { detected: {} }
    )
    const bundlerGroups = generateBundlerGroups(
      ecosystems.bundler || { detected: {} }
    )

    // At least one ecosystem should have groups
    const totalGroups =
      Object.keys(npmGroups).length +
      Object.keys(pipGroups).length +
      Object.keys(cargoGroups).length +
      Object.keys(bundlerGroups).length

    assert.ok(totalGroups > 0, 'Should generate groups for multiple ecosystems')

    console.log(
      `✅ Generated ${totalGroups} dependency groups across all languages\n`
    )
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 12: Framework Signature Completeness
function testFrameworkSignatureCompleteness() {
  console.log('Test 12: Framework Signature Completeness')

  // Python signatures
  assert.ok(PYTHON_FRAMEWORK_SIGNATURES.django, 'Should have Django signatures')
  assert.ok(PYTHON_FRAMEWORK_SIGNATURES.flask, 'Should have Flask signatures')
  assert.ok(
    PYTHON_FRAMEWORK_SIGNATURES.fastapi,
    'Should have FastAPI signatures'
  )
  assert.ok(
    PYTHON_FRAMEWORK_SIGNATURES.datascience,
    'Should have Data Science signatures'
  )

  // Rust signatures
  assert.ok(RUST_FRAMEWORK_SIGNATURES.actix, 'Should have Actix signatures')
  assert.ok(
    RUST_FRAMEWORK_SIGNATURES.async,
    'Should have Async runtime signatures'
  )
  assert.ok(RUST_FRAMEWORK_SIGNATURES.serde, 'Should have Serde signatures')

  // Ruby signatures
  assert.ok(RUBY_FRAMEWORK_SIGNATURES.rails, 'Should have Rails signatures')
  assert.ok(
    RUBY_FRAMEWORK_SIGNATURES.testing,
    'Should have Ruby testing signatures'
  )

  console.log('✅ Framework signatures are complete\n')
}

// Test 13: Empty Project Handling
function testEmptyProjectHandling() {
  console.log('Test 13: Empty Project Handling')

  const tempDir = createTempProject({})

  try {
    const ecosystems = detectAllEcosystems(tempDir)

    assert.strictEqual(
      Object.keys(ecosystems).length,
      0,
      'Should detect no ecosystems'
    )

    console.log('✅ Empty project handled correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 14: Dependency File Parsing Edge Cases
function testDependencyFileParsing() {
  console.log('Test 14: Dependency File Parsing Edge Cases')

  // Test requirements.txt with comments and empty lines
  const requirementsContent = `
# Core dependencies
django==4.2.0

# API framework
djangorestframework>=3.14.0

# Comments only
# pytest

# Empty lines above and below

gunicorn~=20.1.0
`

  const tempDir = createTempProject({
    'requirements.txt': requirementsContent,
  })

  try {
    const result = detectPythonFrameworks(tempDir)

    assert.ok(result.detected.django, 'Should handle comments and empty lines')
    assert.ok(
      result.detected.django.packages.includes('django'),
      'Should parse django'
    )
    assert.ok(
      result.detected.django.packages.includes('djangorestframework'),
      'Should parse DRF'
    )
    assert.ok(
      result.detected.web.packages.includes('gunicorn'),
      'Should parse gunicorn'
    )

    console.log('✅ Dependency file parsing handles edge cases correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Test 15: Pattern Matching Validation
function testPatternMatching() {
  console.log('Test 15: Pattern Matching for Multi-Language Dependencies')

  // Test wildcard patterns work across languages
  const tempDir = createTempProject({
    'requirements.txt':
      'pytest==7.3.0\npytest-cov==4.0.0\npytest-django==4.5.0',
  })

  try {
    const result = detectPythonFrameworks(tempDir)

    assert.ok(result.detected.testing, 'Should detect testing frameworks')
    // Should match pytest-* pattern
    assert.ok(
      result.detected.testing.packages.includes('pytest-cov'),
      'Should match pytest-* wildcard'
    )
    assert.ok(
      result.detected.testing.packages.includes('pytest-django'),
      'Should match pytest-* wildcard'
    )

    console.log('✅ Pattern matching working correctly\n')
  } finally {
    cleanupTempProject(tempDir)
  }
}

// Run all tests
function runAllTests() {
  try {
    // Python tests
    testPythonDjangoDetection()
    testPythonFastAPIDetection()
    testPythonDataScienceDetection()
    testPythonDependencyGroups()

    // Rust tests
    testRustActixDetection()
    testRustDependencyGroups()

    // Ruby tests
    testRubyRailsDetection()
    testRubyDependencyGroups()

    // Multi-language tests
    testPolyglotProjectDetection()
    testPythonJavaScriptMix()
    testMultiLanguageGroupGeneration()
    testFrameworkSignatureCompleteness()
    testEmptyProjectHandling()
    testDependencyFileParsing()
    testPatternMatching()

    console.log('🎉 All Multi-Language Dependency Monitoring tests passed!\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

runAllTests()
