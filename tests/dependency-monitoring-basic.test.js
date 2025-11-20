/**
 * Comprehensive dependency-monitoring-basic.js test suite
 * Target: >75% coverage
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const {
  hasNpmProject,
  generateBasicDependabotConfig,
  writeBasicDependabotConfig,
} = require('../lib/dependency-monitoring-basic')

console.log('🧪 Testing dependency-monitoring-basic.js...\n')

// Test directories
const TEST_DIR = path.join(os.tmpdir(), `cqa-dep-basic-test-${Date.now()}`)

/**
 * Setup and teardown
 */
function setupTest() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true })
  }
}

function teardownTest() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  }
}

/**
 * Test 1: hasNpmProject() returns true when package.json exists
 */
function testHasNpmProjectTrue() {
  setupTest()
  console.log('Test 1: hasNpmProject() returns true when package.json exists')

  // Create package.json
  fs.writeFileSync(path.join(TEST_DIR, 'package.json'), '{}')

  const result = hasNpmProject(TEST_DIR)

  if (result === true) {
    console.log('  ✅ Correctly detects npm project\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Failed to detect npm project')
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 2: hasNpmProject() returns false when no package.json
 */
function testHasNpmProjectFalse() {
  setupTest()
  console.log('Test 2: hasNpmProject() returns false when no package.json')

  // Don't create package.json
  const result = hasNpmProject(TEST_DIR)

  if (result === false) {
    console.log('  ✅ Correctly returns false for non-npm project\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Should return false')
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 3: generateBasicDependabotConfig() with npm project
 */
function testGenerateBasicConfigWithNpm() {
  setupTest()
  console.log('Test 3: generateBasicDependabotConfig() with npm project')

  // Create package.json
  fs.writeFileSync(path.join(TEST_DIR, 'package.json'), '{}')

  const config = generateBasicDependabotConfig({ projectPath: TEST_DIR })

  if (
    config &&
    config.version === 2 &&
    config.updates.length === 2 &&
    config.updates[0]['package-ecosystem'] === 'npm' &&
    config.updates[1]['package-ecosystem'] === 'github-actions'
  ) {
    console.log('  ✅ Generated basic config correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Config generation failed')
    console.error('  Config:', config)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 4: generateBasicDependabotConfig() without npm project
 */
function testGenerateBasicConfigWithoutNpm() {
  setupTest()
  console.log('Test 4: generateBasicDependabotConfig() without npm project')

  // Don't create package.json
  const config = generateBasicDependabotConfig({ projectPath: TEST_DIR })

  if (config === null) {
    console.log('  ✅ Returns null for non-npm projects\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Should return null')
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 5: generateBasicDependabotConfig() with custom schedule
 */
function testGenerateBasicConfigCustomSchedule() {
  setupTest()
  console.log('Test 5: generateBasicDependabotConfig() with custom schedule')

  // Create package.json
  fs.writeFileSync(path.join(TEST_DIR, 'package.json'), '{}')

  const config = generateBasicDependabotConfig({
    projectPath: TEST_DIR,
    schedule: 'daily',
    day: 'friday',
    time: '14:00',
  })

  if (
    config &&
    config.updates[0].schedule.interval === 'daily' &&
    config.updates[0].schedule.day === 'friday' &&
    config.updates[0].schedule.time === '14:00'
  ) {
    console.log('  ✅ Custom schedule applied correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Custom schedule not applied')
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 6: writeBasicDependabotConfig() creates file
 */
function testWriteBasicConfig() {
  setupTest()
  console.log('Test 6: writeBasicDependabotConfig() creates file')

  const config = {
    version: 2,
    updates: [
      {
        'package-ecosystem': 'npm',
        directory: '/',
        schedule: { interval: 'weekly' },
      },
    ],
  }

  const outputPath = path.join(TEST_DIR, '.github', 'dependabot.yml')
  writeBasicDependabotConfig(config, outputPath)

  if (fs.existsSync(outputPath)) {
    const content = fs.readFileSync(outputPath, 'utf8')
    if (
      content.includes('Basic Dependabot configuration') &&
      content.includes('version: 2') &&
      content.includes('package-ecosystem: npm')
    ) {
      console.log('  ✅ Config file created correctly\n')
      teardownTest()
      return true
    } else {
      console.error('  ❌ Config content incorrect')
      console.error('  Content:', content)
      teardownTest()
      process.exit(1)
    }
  } else {
    console.error('  ❌ Config file not created')
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 7: writeBasicDependabotConfig() creates directory if needed
 */
function testWriteBasicConfigCreatesDir() {
  setupTest()
  console.log(
    'Test 7: writeBasicDependabotConfig() creates directory if needed'
  )

  const config = { version: 2, updates: [] }
  const outputPath = path.join(TEST_DIR, 'nested', 'dir', 'config.yml')

  writeBasicDependabotConfig(config, outputPath)

  if (fs.existsSync(path.dirname(outputPath))) {
    console.log('  ✅ Created nested directories\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Failed to create directories')
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 8: YAML conversion for basic object
 */
function testYamlConversionObject() {
  setupTest()
  console.log('Test 8: YAML conversion for basic object')

  const config = {
    version: 2,
    name: 'test',
  }

  const outputPath = path.join(TEST_DIR, 'test.yml')
  writeBasicDependabotConfig(config, outputPath)

  const content = fs.readFileSync(outputPath, 'utf8')

  if (content.includes('version: 2') && content.includes('name: test')) {
    console.log('  ✅ Object converted to YAML correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ YAML conversion failed')
    console.error('  Content:', content)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 9: YAML conversion for array
 */
function testYamlConversionArray() {
  setupTest()
  console.log('Test 9: YAML conversion for array')

  const config = {
    items: ['item1', 'item2'],
  }

  const outputPath = path.join(TEST_DIR, 'array.yml')
  writeBasicDependabotConfig(config, outputPath)

  const content = fs.readFileSync(outputPath, 'utf8')

  if (content.includes('- item1') && content.includes('- item2')) {
    console.log('  ✅ Array converted to YAML correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Array YAML conversion failed')
    console.error('  Content:', content)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 10: YAML conversion for nested objects
 */
function testYamlConversionNested() {
  setupTest()
  console.log('Test 10: YAML conversion for nested objects')

  const config = {
    outer: {
      inner: {
        value: 'test',
      },
    },
  }

  const outputPath = path.join(TEST_DIR, 'nested.yml')
  writeBasicDependabotConfig(config, outputPath)

  const content = fs.readFileSync(outputPath, 'utf8')

  if (
    content.includes('outer:') &&
    content.includes('inner:') &&
    content.includes('value: test')
  ) {
    console.log('  ✅ Nested objects converted correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Nested object conversion failed')
    console.error('  Content:', content)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Test 11: Full config with all features
 */
function testFullConfigGeneration() {
  setupTest()
  console.log('Test 11: Full config with all features')

  // Create package.json
  fs.writeFileSync(path.join(TEST_DIR, 'package.json'), '{}')

  const config = generateBasicDependabotConfig({
    projectPath: TEST_DIR,
    schedule: 'monthly',
    day: 'sunday',
    time: '03:00',
  })

  const outputPath = path.join(TEST_DIR, '.github', 'dependabot.yml')
  writeBasicDependabotConfig(config, outputPath)

  const content = fs.readFileSync(outputPath, 'utf8')

  if (
    content.includes('Free Tier') &&
    content.includes('monthly') &&
    content.includes('npm') &&
    content.includes('github-actions') &&
    content.includes('labels:') &&
    content.includes('commit-message:')
  ) {
    console.log('  ✅ Full configuration generated correctly\n')
    teardownTest()
    return true
  } else {
    console.error('  ❌ Full config generation failed')
    console.error('  Content:', content)
    teardownTest()
    process.exit(1)
  }
}

/**
 * Run all tests
 */
console.log('============================================================')
console.log('Running Comprehensive Dependency Monitoring Basic Tests')
console.log('============================================================\n')

testHasNpmProjectTrue()
testHasNpmProjectFalse()
testGenerateBasicConfigWithNpm()
testGenerateBasicConfigWithoutNpm()
testGenerateBasicConfigCustomSchedule()
testWriteBasicConfig()
testWriteBasicConfigCreatesDir()
testYamlConversionObject()
testYamlConversionArray()
testYamlConversionNested()
testFullConfigGeneration()

console.log('============================================================')
console.log('✅ All Dependency Monitoring Basic Tests Passed!')
console.log('============================================================\n')
console.log('Coverage targets:')
console.log('  • hasNpmProject() - Both true/false paths')
console.log(
  '  • generateBasicDependabotConfig() - With/without npm, custom options'
)
console.log(
  '  • writeBasicDependabotConfig() - File creation, directory creation'
)
console.log('  • YAML conversion - Objects, arrays, nested structures')
console.log('')
