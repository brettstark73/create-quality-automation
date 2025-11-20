'use strict'

const BaseValidator = require('../lib/validation/base-validator')

/**
 * Test enhanced error messages with actionable suggestions
 */
function testErrorMessages() {
  console.log('🧪 Testing enhanced error messages...\n')

  const validator = new BaseValidator({ verbose: false })

  // Test ENOENT error
  console.log('🔍 Testing ENOENT error message...')
  const enoentError = new Error('File not found')
  enoentError.code = 'ENOENT'
  const enoentMessage = validator.formatErrorMessage(
    enoentError,
    'Configuration validation'
  )
  if (
    !enoentMessage.includes('not found') ||
    !enoentMessage.includes('💡 Suggestion:')
  ) {
    throw new Error(
      `ENOENT error message should include suggestion: ${enoentMessage}`
    )
  }
  console.log(`  ✅ ENOENT: ${enoentMessage}`)

  // Test EACCES error
  console.log('🔍 Testing EACCES error message...')
  const eaccesError = new Error('Permission denied')
  eaccesError.code = 'EACCES'
  const eaccesMessage = validator.formatErrorMessage(
    eaccesError,
    'File operation'
  )
  if (
    !eaccesMessage.includes('Permission denied') ||
    !eaccesMessage.includes('💡 Suggestion:')
  ) {
    throw new Error(
      `EACCES error message should include suggestion: ${eaccesMessage}`
    )
  }
  console.log(`  ✅ EACCES: ${eaccesMessage}`)

  // Test MODULE_NOT_FOUND error
  console.log('🔍 Testing MODULE_NOT_FOUND error message...')
  const moduleError = new Error("Cannot find module 'eslint'")
  moduleError.code = 'MODULE_NOT_FOUND'
  const moduleMessage = validator.formatErrorMessage(
    moduleError,
    'ESLint validation'
  )
  if (
    !moduleMessage.includes('not installed') ||
    !moduleMessage.includes('💡 Suggestion:')
  ) {
    throw new Error(
      `MODULE_NOT_FOUND error message should include suggestion: ${moduleMessage}`
    )
  }
  if (!moduleMessage.includes('npm install')) {
    throw new Error(
      `MODULE_NOT_FOUND should suggest npm install: ${moduleMessage}`
    )
  }
  console.log(`  ✅ MODULE_NOT_FOUND: ${moduleMessage}`)

  // Test SyntaxError
  console.log('🔍 Testing SyntaxError message...')
  const syntaxError = new SyntaxError('Unexpected token')
  const syntaxMessage = validator.formatErrorMessage(
    syntaxError,
    'JSON parsing'
  )
  if (
    !syntaxMessage.includes('Syntax error') ||
    !syntaxMessage.includes('💡 Suggestion:')
  ) {
    throw new Error(
      `SyntaxError message should include suggestion: ${syntaxMessage}`
    )
  }
  console.log(`  ✅ SyntaxError: ${syntaxMessage}`)

  // Test EPERM error
  console.log('🔍 Testing EPERM error message...')
  const epermError = new Error('Operation not permitted')
  epermError.code = 'EPERM'
  const epermMessage = validator.formatErrorMessage(epermError, 'File deletion')
  if (
    !epermMessage.includes('Permission denied') ||
    !epermMessage.includes('💡 Suggestion:')
  ) {
    throw new Error(
      `EPERM error message should include suggestion: ${epermMessage}`
    )
  }
  console.log(`  ✅ EPERM: ${epermMessage}`)

  // Test generic error (should still work)
  console.log('🔍 Testing generic error message...')
  const genericError = new Error('Something went wrong')
  const genericMessage = validator.formatErrorMessage(
    genericError,
    'General operation'
  )
  if (!genericMessage.includes('Something went wrong')) {
    throw new Error(`Generic error should preserve message: ${genericMessage}`)
  }
  console.log(`  ✅ Generic: ${genericMessage}`)

  console.log('\n✅ All error message tests passed!\n')
}

// Run tests if this file is executed directly
if (require.main === module) {
  try {
    testErrorMessages()
  } catch (error) {
    console.error('❌ Error message tests failed:', error.message)
    process.exit(1)
  }
}

module.exports = { testErrorMessages }
