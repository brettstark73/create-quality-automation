'use strict'

const { ValidationRunner } = require('../lib/validation/index')

/**
 * Test parallel validation execution
 */
async function testParallelValidation() {
  console.log('🧪 Testing parallel validation execution...\n')

  // Test 1: Verify parallel execution is faster than sequential
  console.log('🔍 Testing parallel vs sequential performance...')

  const runner = new ValidationRunner({ verbose: false })

  // Mock delays to simulate real validation work
  const originalConfigSecurity = runner.runConfigSecurity.bind(runner)
  const originalDocValidation = runner.runDocumentationValidation.bind(runner)
  const originalWorkflowValidation = runner.runWorkflowValidation.bind(runner)

  // Add artificial delays to make timing measurable
  runner.runConfigSecurity = async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return { passed: true, issues: [] }
  }

  runner.runDocumentationValidation = async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return { passed: true, issues: [] }
  }

  runner.runWorkflowValidation = async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return { passed: true, issues: [] }
  }

  // Measure parallel execution time
  const parallelStart = Date.now()
  await runner.runComprehensiveCheckParallel()
  const parallelTime = Date.now() - parallelStart

  console.log(`  Parallel execution time: ${parallelTime}ms`)

  // Parallel execution of 3 × 100ms tasks should take ~100-150ms (not 300ms)
  if (parallelTime > 200) {
    throw new Error(
      `Parallel execution too slow (${parallelTime}ms). Expected ~100-150ms for 3 concurrent 100ms tasks.`
    )
  }

  console.log('  ✅ Parallel execution is significantly faster')

  // Restore original methods
  runner.runConfigSecurity = originalConfigSecurity
  runner.runDocumentationValidation = originalDocValidation
  runner.runWorkflowValidation = originalWorkflowValidation

  // Test 2: Verify parallel execution handles errors correctly
  console.log('🔍 Testing parallel execution error handling...')

  const errorRunner = new ValidationRunner({ verbose: false })

  errorRunner.runConfigSecurity = async () => {
    await new Promise(resolve => setTimeout(resolve, 50))
    throw new Error('Config security failed')
  }

  errorRunner.runDocumentationValidation = async () => {
    await new Promise(resolve => setTimeout(resolve, 50))
    return { passed: true, issues: [] }
  }

  errorRunner.runWorkflowValidation = async () => {
    await new Promise(resolve => setTimeout(resolve, 50))
    return { passed: true, issues: [] }
  }

  try {
    await errorRunner.runComprehensiveCheckParallel()
    throw new Error('Should have thrown error for failed validation')
  } catch (error) {
    if (!error.message.includes('Comprehensive validation failed')) {
      throw new Error(
        `Unexpected error message: ${error.message}. Expected "Comprehensive validation failed"`
      )
    }
    console.log('  ✅ Parallel execution handles errors correctly')
  }

  // Test 3: Verify all validations run even if one fails early
  console.log('🔍 Testing all validations complete despite early failure...')

  let configRan = false
  let docRan = false
  let workflowRan = false

  const completeRunner = new ValidationRunner({ verbose: false })

  completeRunner.runConfigSecurity = async () => {
    configRan = true
    throw new Error('Config failed')
  }

  completeRunner.runDocumentationValidation = async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    docRan = true
    return { passed: true, issues: [] }
  }

  completeRunner.runWorkflowValidation = async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    workflowRan = true
    return { passed: true, issues: [] }
  }

  try {
    await completeRunner.runComprehensiveCheckParallel()
  } catch {
    // Expected to fail
  }

  if (!configRan || !docRan || !workflowRan) {
    throw new Error(
      `Not all validations completed. Config: ${configRan}, Doc: ${docRan}, Workflow: ${workflowRan}`
    )
  }

  console.log('  ✅ All validations complete despite early failures')

  console.log('\n✅ All parallel validation tests passed!\n')
}

// Run tests if this file is executed directly
if (require.main === module) {
  testParallelValidation().catch(error => {
    console.error('❌ Parallel validation tests failed:', error.message)
    process.exit(1)
  })
}

module.exports = { testParallelValidation }
