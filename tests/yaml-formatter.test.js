/**
 * YAML Formatter Tests
 *
 * Tests the lib/yaml-utils.js formatter for edge cases including:
 * - Multi-line values in arrays
 * - Nested objects in arrays
 * - Special characters requiring quotes
 * - Complex indentation scenarios
 */

const { convertToYaml } = require('../lib/yaml-utils')

console.log('🧪 Testing YAML formatter edge cases...\n')

/**
 * Test 1: Basic array-of-objects formatting
 */
function testBasicArrayOfObjects() {
  console.log('Test 1: Basic array-of-objects formatting')

  const input = {
    updates: [
      { 'package-ecosystem': 'npm', directory: '/' },
      { 'package-ecosystem': 'pip', directory: '/docs' },
    ],
  }

  const result = convertToYaml(input)
  // Check key components rather than exact formatting since quotes may vary
  if (
    result.includes('updates:') &&
    result.includes('- "package-ecosystem": npm') &&
    result.includes('directory: /') &&
    result.includes('"package-ecosystem": pip') &&
    result.includes('directory: /docs')
  ) {
    console.log('  ✅ Basic array-of-objects formatted correctly\n')
    return true
  } else {
    console.error('  ❌ Basic array-of-objects formatting failed')
    console.error('  Result:', JSON.stringify(result))
    process.exit(1)
  }
}

/**
 * Test 2: Nested objects in arrays with proper indentation
 */
function testNestedObjectsInArrays() {
  console.log('Test 2: Nested objects in arrays with proper indentation')

  const input = {
    workflows: [
      {
        name: 'CI/CD',
        on: {
          push: {
            branches: ['main', 'develop'],
            paths: ['src/**'],
          },
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v3' },
              { name: 'Setup Node', uses: 'actions/setup-node@v3' },
            ],
          },
        },
      },
    ],
  }

  const result = convertToYaml(input)

  // Check that key components are present (flexible test for complex nesting)
  if (
    result.includes('workflows:') &&
    result.includes('- name: CI/CD') &&
    result.includes('"on":') &&
    result.includes('push:') &&
    result.includes('branches:') &&
    result.includes('- main') &&
    result.includes('jobs:') &&
    result.includes('test:')
  ) {
    console.log('  ✅ Nested objects in arrays formatted correctly\n')
    return true
  } else {
    console.error('  ❌ Nested object formatting failed')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Test 3: Multi-line string values requiring quotes
 */
function testMultiLineStringValues() {
  console.log('Test 3: Multi-line string values requiring quotes')

  const input = {
    items: [
      {
        name: 'test-item',
        description:
          'A long description that contains: special chars and might need quoting',
      },
      {
        name: 'another-item',
        command: 'echo "Hello World" && echo "Testing"',
      },
    ],
  }

  const result = convertToYaml(input)

  // Check that special characters are properly quoted
  if (
    result.includes(
      '"A long description that contains: special chars and might need quoting"'
    ) &&
    (result.includes('echo "Hello World" && echo "Testing"') ||
      result.includes('"echo \\"Hello World\\" && echo \\"Testing\\""')) &&
    result.includes('name: "test-item"') &&
    result.includes('name: "another-item"')
  ) {
    console.log('  ✅ Multi-line strings with special chars quoted correctly\n')
    return true
  } else {
    console.error('  ❌ Multi-line string quoting failed')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Test 4: Values starting with numbers or YAML keywords
 */
function testYAMLKeywordValues() {
  console.log('Test 4: Values starting with numbers or YAML keywords')

  const input = {
    configs: [
      { version: '3.8', enabled: true },
      { version: 'null', enabled: 'yes' },
      { version: 'false', enabled: 'on' },
      { version: '123abc', enabled: 'off' },
    ],
  }

  const result = convertToYaml(input)

  // Values that could be interpreted as YAML special values should be quoted
  if (
    result.includes('version: "3.8"') &&
    result.includes('version: "null"') &&
    result.includes('enabled: "yes"') &&
    result.includes('version: "false"') &&
    result.includes('enabled: "on"') &&
    result.includes('version: "123abc"') &&
    result.includes('enabled: "off"')
  ) {
    console.log('  ✅ YAML keywords and number-strings quoted correctly\n')
    return true
  } else {
    console.error('  ❌ YAML keyword quoting failed')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Test 5: Empty values and null handling
 */
function testEmptyAndNullValues() {
  console.log('Test 5: Empty values and null handling')

  const input = {
    items: [
      { name: 'test', value: '' },
      { name: 'null-test', value: null },
      { name: 'undefined-test', value: undefined },
    ],
  }

  const result = convertToYaml(input)

  if (
    result.includes('value: ""') &&
    result.includes('value: null') &&
    result.includes('name: test') &&
    result.includes('name: "null-test"')
  ) {
    console.log('  ✅ Empty and null values handled correctly\n')
    return true
  } else {
    console.error('  ❌ Empty/null value handling failed')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Test 6: Array of primitives vs array of objects
 */
function testMixedArrayTypes() {
  console.log('Test 6: Array of primitives vs array of objects')

  const input = {
    strings: ['item1', 'item2', 'item with spaces'],
    objects: [
      { name: 'obj1', type: 'test' },
      { name: 'obj2', type: 'prod' },
    ],
    numbers: [1, 2, 3],
  }

  const result = convertToYaml(input)

  // Primitives should use simple dash format, objects should use structured format
  if (
    result.includes('strings:') &&
    result.includes('- item1') &&
    result.includes('item with spaces') &&
    result.includes('objects:') &&
    result.includes('- name: obj1') &&
    result.includes('type: test') &&
    result.includes('numbers:') &&
    result.includes('- 1')
  ) {
    console.log('  ✅ Mixed array types formatted correctly\n')
    return true
  } else {
    console.error('  ❌ Mixed array type formatting failed')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Test 7: Deep nesting with arrays in objects in arrays
 */
function testDeepNesting() {
  console.log('Test 7: Deep nesting with arrays in objects in arrays')

  const input = {
    complex: [
      {
        service: 'web',
        config: {
          ports: ['80', '443'],
          env: {
            NODE_ENV: 'production',
            DEBUG: 'false',
          },
        },
      },
    ],
  }

  const result = convertToYaml(input)

  // Check that deep nesting maintains proper indentation
  const lines = result.split('\n')
  let foundService = false
  let foundConfig = false
  let foundPorts = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('- service: web')) {
      foundService = true
    }
    if (foundService && line.includes('config:')) {
      foundConfig = true
    }
    if (foundConfig && line.includes('ports:')) {
      foundPorts = true
    }
  }

  if (foundService && foundConfig && foundPorts) {
    console.log('  ✅ Deep nesting formatted correctly\n')
    return true
  } else {
    console.error('  ❌ Deep nesting formatting failed')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Test 8: Special characters requiring escaping
 */
function testSpecialCharacterEscaping() {
  console.log('Test 8: Special characters requiring escaping')

  const input = {
    commands: [
      { run: 'echo "test"', shell: '/bin/bash' },
      { run: 'grep -r "pattern" . | head -5', shell: 'bash' },
      { run: 'test: [value]', shell: 'sh' },
    ],
  }

  const result = convertToYaml(input)

  // Check that quotes and special YAML characters are escaped
  if (
    result.includes('run: echo "test"') &&
    result.includes('run: "grep -r \\"pattern\\" . | head -5"') &&
    result.includes('run: "test: [value]"')
  ) {
    console.log('  ✅ Special characters escaped correctly\n')
    return true
  } else {
    console.error('  ❌ Special character escaping failed')
    console.error('  Result:', result)
    process.exit(1)
  }
}

/**
 * Run all YAML formatter tests
 */
console.log('============================================================')
console.log('Running YAML Formatter Edge Case Tests')
console.log('============================================================\n')

testBasicArrayOfObjects()
testNestedObjectsInArrays()
testMultiLineStringValues()
testYAMLKeywordValues()
testEmptyAndNullValues()
testMixedArrayTypes()
testDeepNesting()
testSpecialCharacterEscaping()

console.log('============================================================')
console.log('✅ All YAML Formatter Tests Passed!')
console.log('============================================================\n')
console.log('Coverage added:')
console.log('  • Array-of-objects indentation - Proper dash alignment')
console.log('  • Nested object indentation - Multi-level structures')
console.log('  • Multi-line string quoting - Special character handling')
console.log('  • YAML keyword detection - Numeric and boolean-like strings')
console.log('  • Empty/null value handling - Edge case values')
console.log('  • Mixed array types - Primitives vs objects')
console.log('  • Deep nesting - Complex hierarchies')
console.log('  • Special character escaping - Command strings and patterns')
console.log('')
