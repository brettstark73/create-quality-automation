/**
 * Tests for Premium Dependency Monitoring (PREMIUM-001)
 * Framework-aware dependency grouping functionality
 */

const assert = require('assert')
const {
  detectFrameworks,
  generateReactGroups,
  generateVueGroups,
  generateAngularGroups,
  generateTestingGroups,
  generateBuildToolGroups,
  NPM_FRAMEWORK_SIGNATURES,
} = require('../lib/dependency-monitoring-premium')

console.log('\n🧪 Testing Premium Dependency Monitoring...\n')

// Test fixtures
const reactPackageJson = {
  name: 'react-app',
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    'react-router-dom': '^6.8.0',
    zustand: '^4.3.0',
    '@tanstack/react-query': '^4.24.0',
  },
  devDependencies: {
    '@testing-library/react': '^13.4.0',
    jest: '^29.4.0',
    vite: '^4.1.0',
  },
}

const vuePackageJson = {
  name: 'vue-app',
  dependencies: {
    vue: '^3.2.47',
    'vue-router': '^4.1.6',
    pinia: '^2.0.30',
  },
  devDependencies: {
    '@vue/test-utils': '^2.3.0',
    vitest: '^0.28.5',
    vite: '^4.1.0',
  },
}

const angularPackageJson = {
  name: 'angular-app',
  dependencies: {
    '@angular/core': '^15.1.0',
    '@angular/common': '^15.1.0',
    '@angular/router': '^15.1.0',
    '@ngrx/store': '^15.0.0',
  },
  devDependencies: {
    '@angular/cli': '^15.1.0',
  },
}

const mixedPackageJson = {
  name: 'monorepo',
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
  },
  devDependencies: {
    jest: '^29.4.0',
    '@testing-library/react': '^13.4.0',
    '@storybook/react': '^6.5.16',
    vite: '^4.1.0',
    turbo: '^1.8.0',
  },
}

// Test 1: Framework Detection - React
function testReactDetection() {
  console.log('Test 1: Framework Detection - React')

  const result = detectFrameworks(reactPackageJson)

  assert.strictEqual(
    result.primary,
    'react',
    'Should detect React as primary framework'
  )
  assert.strictEqual(
    result.detected.react.present,
    true,
    'Should detect React presence'
  )
  assert.strictEqual(
    result.detected.react.version,
    '^18.2.0',
    'Should extract React version'
  )
  assert(
    result.detected.react.packages.includes('react'),
    'Should include react in detected packages'
  )
  assert(
    result.detected.react.packages.includes('react-dom'),
    'Should include react-dom in detected packages'
  )
  assert(
    result.detected.react.packages.includes('zustand'),
    'Should detect state management library'
  )

  console.log('✅ React detection working correctly\n')
}

// Test 2: Framework Detection - Vue
function testVueDetection() {
  console.log('Test 2: Framework Detection - Vue')

  const result = detectFrameworks(vuePackageJson)

  assert.strictEqual(
    result.primary,
    'vue',
    'Should detect Vue as primary framework'
  )
  assert.strictEqual(
    result.detected.vue.present,
    true,
    'Should detect Vue presence'
  )
  assert(
    result.detected.vue.packages.includes('vue'),
    'Should include vue in detected packages'
  )
  assert(
    result.detected.vue.packages.includes('pinia'),
    'Should detect state management'
  )

  console.log('✅ Vue detection working correctly\n')
}

// Test 3: Framework Detection - Angular
function testAngularDetection() {
  console.log('Test 3: Framework Detection - Angular')

  const result = detectFrameworks(angularPackageJson)

  assert.strictEqual(
    result.primary,
    'angular',
    'Should detect Angular as primary framework'
  )
  assert.strictEqual(
    result.detected.angular.present,
    true,
    'Should detect Angular presence'
  )
  assert(
    result.detected.angular.packages.includes('@angular/core'),
    'Should include @angular/core'
  )
  assert(
    result.detected.angular.packages.includes('@ngrx/store'),
    'Should detect state management'
  )

  console.log('✅ Angular detection working correctly\n')
}

// Test 4: Multiple Framework Detection
function testMultipleFrameworkDetection() {
  console.log('Test 4: Multiple Framework Detection (Monorepo)')

  const result = detectFrameworks(mixedPackageJson)

  assert.strictEqual(
    result.primary,
    'react',
    'Should detect React as primary framework'
  )
  assert.strictEqual(result.detected.react.present, true, 'Should detect React')
  assert.strictEqual(
    result.detected.testing.present,
    true,
    'Should detect testing frameworks'
  )
  assert.strictEqual(
    result.detected.build.present,
    true,
    'Should detect build tools'
  )
  assert.strictEqual(
    result.detected.storybook.present,
    true,
    'Should detect Storybook'
  )

  console.log('✅ Multiple framework detection working correctly\n')
}

// Test 5: React Dependency Groups
function testReactGroups() {
  console.log('Test 5: React Dependency Groups Generation')

  const frameworks = detectFrameworks(reactPackageJson)
  const groups = generateReactGroups(frameworks.detected.react)

  assert(groups['react-core'], 'Should generate react-core group')
  assert(groups['react-ecosystem'], 'Should generate react-ecosystem group')
  assert(
    groups['react-core'].patterns.includes('react'),
    'Should include react in core group'
  )
  assert(
    groups['react-ecosystem'].patterns.includes('zustand'),
    'Should include state management in ecosystem'
  )
  assert.strictEqual(
    groups['react-core']['dependency-type'],
    'production',
    'Core should be production dependency'
  )

  console.log('✅ React groups generated correctly\n')
}

// Test 6: Vue Dependency Groups
function testVueGroups() {
  console.log('Test 6: Vue Dependency Groups Generation')

  const frameworks = detectFrameworks(vuePackageJson)
  const groups = generateVueGroups(frameworks.detected.vue)

  assert(groups['vue-core'], 'Should generate vue-core group')
  assert(groups['vue-ecosystem'], 'Should generate vue-ecosystem group')
  assert(
    groups['vue-core'].patterns.includes('vue'),
    'Should include vue in core group'
  )
  assert(
    groups['vue-core'].patterns.includes('pinia'),
    'Should include pinia in core group'
  )

  console.log('✅ Vue groups generated correctly\n')
}

// Test 7: Angular Dependency Groups
function testAngularGroups() {
  console.log('Test 7: Angular Dependency Groups Generation')

  const frameworks = detectFrameworks(angularPackageJson)
  const groups = generateAngularGroups(frameworks.detected.angular)

  assert(groups['angular-core'], 'Should generate angular-core group')
  assert(groups['angular-ecosystem'], 'Should generate angular-ecosystem group')
  assert(
    groups['angular-core'].patterns.includes('@angular/core'),
    'Should include @angular/core'
  )

  console.log('✅ Angular groups generated correctly\n')
}

// Test 8: Testing Framework Groups
function testTestingGroups() {
  console.log('Test 8: Testing Framework Groups')

  const frameworks = detectFrameworks(reactPackageJson)
  const groups = generateTestingGroups(frameworks.detected.testing)

  assert(
    groups['testing-frameworks'],
    'Should generate testing-frameworks group'
  )
  assert(
    groups['testing-frameworks'].patterns.includes('jest'),
    'Should include jest'
  )
  assert(
    groups['testing-frameworks'].patterns.includes('@testing-library/*'),
    'Should include testing library pattern'
  )
  assert.strictEqual(
    groups['testing-frameworks']['dependency-type'],
    'development',
    'Testing should be development dependency'
  )

  console.log('✅ Testing groups generated correctly\n')
}

// Test 9: Build Tool Groups
function testBuildToolGroups() {
  console.log('Test 9: Build Tool Groups')

  const frameworks = detectFrameworks(mixedPackageJson)
  const groups = generateBuildToolGroups(frameworks.detected.build)

  assert(groups['build-tools'], 'Should generate build-tools group')
  assert(groups['build-tools'].patterns.includes('vite'), 'Should include vite')
  assert(
    groups['build-tools'].patterns.includes('turbo'),
    'Should include turbo'
  )

  console.log('✅ Build tool groups generated correctly\n')
}

// Test 10: Pattern Matching with Wildcards
function testPatternMatching() {
  console.log('Test 10: Wildcard Pattern Matching')

  const testPackageJson = {
    dependencies: {
      '@tanstack/react-query': '^4.0.0',
      '@tanstack/react-table': '^8.0.0',
      '@radix-ui/react-dialog': '^1.0.0',
      '@radix-ui/react-dropdown-menu': '^2.0.0',
    },
  }

  const result = detectFrameworks(testPackageJson)

  // Should match @tanstack/* pattern
  assert(
    result.detected.react.packages.some(pkg => pkg.startsWith('@tanstack/')),
    'Should match @tanstack/* wildcard pattern'
  )

  // Should match @radix-ui/react-* pattern
  assert(
    result.detected.react.packages.some(pkg => pkg.startsWith('@radix-ui/')),
    'Should match @radix-ui/react-* wildcard pattern'
  )

  console.log('✅ Wildcard pattern matching working correctly\n')
}

// Test 11: Empty Package.json
function testEmptyPackageJson() {
  console.log('Test 11: Empty Package.json Handling')

  const emptyPackageJson = {
    name: 'empty-project',
    dependencies: {},
    devDependencies: {},
  }

  const result = detectFrameworks(emptyPackageJson)

  assert.strictEqual(result.primary, null, 'Should have no primary framework')
  assert.strictEqual(
    Object.keys(result.detected).length,
    0,
    'Should detect no frameworks'
  )

  console.log('✅ Empty package.json handled correctly\n')
}

// Test 11b: Missing Dependencies Fields (undefined)
function testMissingDependencies() {
  console.log('Test 11b: Missing Dependencies Fields (undefined)')

  // Fresh app might only have dependencies
  const onlyDependencies = {
    name: 'fresh-app',
    dependencies: {
      react: '^18.0.0',
    },
    // devDependencies is undefined
  }

  const result1 = detectFrameworks(onlyDependencies)
  assert.strictEqual(
    result1.primary,
    'react',
    'Should handle missing devDependencies'
  )

  // Or only devDependencies
  const onlyDevDependencies = {
    name: 'tool-project',
    devDependencies: {
      vite: '^5.0.0',
    },
    // dependencies is undefined
  }

  const result2 = detectFrameworks(onlyDevDependencies)
  assert.ok(result2.detected.build, 'Should handle missing dependencies')

  // Or both missing (edge case)
  const noDependencies = {
    name: 'minimal-project',
    // No dependencies or devDependencies fields at all
  }

  const result3 = detectFrameworks(noDependencies)
  assert.strictEqual(
    result3.primary,
    null,
    'Should handle missing both dependency fields'
  )
  assert.strictEqual(
    Object.keys(result3.detected).length,
    0,
    'Should detect no frameworks when both fields missing'
  )

  console.log('✅ Missing dependencies fields (undefined) handled correctly\n')
}

// Test 12: Update Types Configuration
function testUpdateTypes() {
  console.log('Test 12: Update Types Configuration')

  const frameworks = detectFrameworks(reactPackageJson)
  const groups = generateReactGroups(frameworks.detected.react)

  // Core packages should allow minor and patch
  assert(
    groups['react-core']['update-types'].includes('minor'),
    'Core should allow minor updates'
  )
  assert(
    groups['react-core']['update-types'].includes('patch'),
    'Core should allow patch updates'
  )

  // Ecosystem should be more conservative (patch only)
  assert.strictEqual(
    groups['react-ecosystem']['update-types'].length,
    1,
    'Ecosystem should only allow one update type'
  )
  assert(
    groups['react-ecosystem']['update-types'].includes('patch'),
    'Ecosystem should only allow patch updates'
  )

  console.log('✅ Update types configured correctly\n')
}

// Test 13: Framework Signature Completeness
function testFrameworkSignatures() {
  console.log('Test 13: Framework Signature Completeness')

  assert(
    NPM_FRAMEWORK_SIGNATURES.react,
    'Should have React signature definitions'
  )
  assert(NPM_FRAMEWORK_SIGNATURES.vue, 'Should have Vue signature definitions')
  assert(
    NPM_FRAMEWORK_SIGNATURES.angular,
    'Should have Angular signature definitions'
  )
  assert(
    NPM_FRAMEWORK_SIGNATURES.testing,
    'Should have testing framework signatures'
  )
  assert(NPM_FRAMEWORK_SIGNATURES.build, 'Should have build tool signatures')

  // Check React completeness
  assert(NPM_FRAMEWORK_SIGNATURES.react.core, 'React should have core packages')
  assert(
    NPM_FRAMEWORK_SIGNATURES.react.routing,
    'React should have routing packages'
  )
  assert(
    NPM_FRAMEWORK_SIGNATURES.react.state,
    'React should have state packages'
  )
  assert(
    NPM_FRAMEWORK_SIGNATURES.react.metaFrameworks,
    'React should have meta-frameworks'
  )

  console.log('✅ Framework signatures are complete\n')
}

// Test 14: Group Count Validation
function testGroupCount() {
  console.log('Test 14: Dependency Group Count Validation')

  const frameworks = detectFrameworks(mixedPackageJson)

  let totalGroups = 0

  if (frameworks.detected.react) {
    totalGroups += Object.keys(
      generateReactGroups(frameworks.detected.react)
    ).length
  }

  if (frameworks.detected.testing) {
    totalGroups += Object.keys(
      generateTestingGroups(frameworks.detected.testing)
    ).length
  }

  if (frameworks.detected.build) {
    totalGroups += Object.keys(
      generateBuildToolGroups(frameworks.detected.build)
    ).length
  }

  if (frameworks.detected.storybook) {
    const storybookGroups = {
      storybook: {
        patterns: ['@storybook/*'],
        'update-types': ['minor', 'patch'],
      },
    }
    totalGroups += Object.keys(storybookGroups).length
  }

  assert(
    totalGroups >= 3,
    `Should generate multiple groups (got ${totalGroups})`
  )
  assert(
    totalGroups <= 10,
    `Should not generate too many groups (got ${totalGroups})`
  )

  console.log(`✅ Generated ${totalGroups} dependency groups\n`)
}

// Run all tests
function runAllTests() {
  try {
    testReactDetection()
    testVueDetection()
    testAngularDetection()
    testMultipleFrameworkDetection()
    testReactGroups()
    testVueGroups()
    testAngularGroups()
    testTestingGroups()
    testBuildToolGroups()
    testPatternMatching()
    testEmptyPackageJson()
    testMissingDependencies()
    testUpdateTypes()
    testFrameworkSignatures()
    testGroupCount()

    console.log('🎉 All Premium Dependency Monitoring tests passed!\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

runAllTests()
