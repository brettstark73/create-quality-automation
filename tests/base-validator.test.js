/**
 * Comprehensive BaseValidator test suite
 * Target: >90% coverage
 */

const BaseValidator = require('../lib/validation/base-validator')

console.log('🧪 Testing BaseValidator...\n')

// Mock console methods to capture output
let consoleOutput = []
let consoleErrors = []
let consoleWarnings = []
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

function mockConsole() {
  console.log = (...args) => consoleOutput.push(args.join(' '))
  console.error = (...args) => consoleErrors.push(args.join(' '))
  console.warn = (...args) => consoleWarnings.push(args.join(' '))
}

function restoreConsole() {
  console.log = originalLog
  console.error = originalError
  console.warn = originalWarn
}

function resetConsole() {
  consoleOutput = []
  consoleErrors = []
  consoleWarnings = []
}

/**
 * Test 1: Constructor and initial state
 */
function testConstructorAndInitialState() {
  console.log('Test 1: Constructor and initial state')

  const validator = new BaseValidator()

  if (
    validator.issues.length === 0 &&
    validator.warnings.length === 0 &&
    validator.validationComplete === false &&
    validator.hasRun() === false
  ) {
    console.log('  ✅ Initial state is correct\n')
    return true
  } else {
    console.error('  ❌ Initial state incorrect')
    process.exit(1)
  }
}

/**
 * Test 2: Constructor with options
 */
function testConstructorWithOptions() {
  console.log('Test 2: Constructor with options')

  const validator = new BaseValidator({ verbose: true, customOption: 'test' })

  if (
    validator.options.verbose === true &&
    validator.options.customOption === 'test'
  ) {
    console.log('  ✅ Options stored correctly\n')
    return true
  } else {
    console.error('  ❌ Options not stored')
    process.exit(1)
  }
}

/**
 * Test 3: addIssue() and getIssues()
 */
function testAddIssueAndGetIssues() {
  console.log('Test 3: addIssue() and getIssues()')

  const validator = new BaseValidator()
  validator.addIssue('Issue 1')
  validator.addIssue('Issue 2')

  const issues = validator.getIssues()

  if (
    issues.length === 2 &&
    issues[0] === 'Issue 1' &&
    issues[1] === 'Issue 2'
  ) {
    console.log('  ✅ Issues added and retrieved correctly\n')
    return true
  } else {
    console.error('  ❌ Issue management failed')
    process.exit(1)
  }
}

/**
 * Test 4: addWarning() and getWarnings()
 */
function testAddWarningAndGetWarnings() {
  console.log('Test 4: addWarning() and getWarnings()')

  const validator = new BaseValidator()
  validator.addWarning('Warning 1')
  validator.addWarning('Warning 2')

  const warnings = validator.getWarnings()

  if (
    warnings.length === 2 &&
    warnings[0] === 'Warning 1' &&
    warnings[1] === 'Warning 2'
  ) {
    console.log('  ✅ Warnings added and retrieved correctly\n')
    return true
  } else {
    console.error('  ❌ Warning management failed')
    process.exit(1)
  }
}

/**
 * Test 5: passed() when no issues
 */
function testPassedWithNoIssues() {
  console.log('Test 5: passed() when no issues')

  const validator = new BaseValidator()
  validator.validationComplete = true

  if (validator.passed() === true) {
    console.log('  ✅ passed() returns true with no issues\n')
    return true
  } else {
    console.error('  ❌ passed() should return true')
    process.exit(1)
  }
}

/**
 * Test 6: passed() when validation not complete
 */
function testPassedWhenNotComplete() {
  console.log('Test 6: passed() when validation not complete')

  const validator = new BaseValidator()
  // validationComplete is false by default

  if (validator.passed() === false) {
    console.log('  ✅ passed() returns false when validation not complete\n')
    return true
  } else {
    console.error('  ❌ passed() should return false')
    process.exit(1)
  }
}

/**
 * Test 7: passed() when there are issues
 */
function testPassedWithIssues() {
  console.log('Test 7: passed() when there are issues')

  const validator = new BaseValidator()
  validator.validationComplete = true
  validator.addIssue('Test issue')

  if (validator.passed() === false) {
    console.log('  ✅ passed() returns false with issues\n')
    return true
  } else {
    console.error('  ❌ passed() should return false')
    process.exit(1)
  }
}

/**
 * Test 8: reset() clears state
 */
function testReset() {
  console.log('Test 8: reset() clears state')

  const validator = new BaseValidator()
  validator.addIssue('Issue')
  validator.addWarning('Warning')
  validator.validationComplete = true

  validator.reset()

  if (
    validator.issues.length === 0 &&
    validator.warnings.length === 0 &&
    validator.validationComplete === false
  ) {
    console.log('  ✅ reset() clears all state\n')
    return true
  } else {
    console.error('  ❌ reset() did not clear state')
    process.exit(1)
  }
}

/**
 * Test 9: formatErrorMessage() for ENOENT
 */
function testFormatErrorMessageENOENT() {
  console.log('Test 9: formatErrorMessage() for ENOENT')

  const validator = new BaseValidator()
  const error = new Error('file.txt not found')
  error.code = 'ENOENT'

  const message = validator.formatErrorMessage(error, 'Test Context')

  if (
    message.includes('ENOENT') === false &&
    message.includes('File or command not found') &&
    message.includes('💡 Suggestion')
  ) {
    console.log('  ✅ ENOENT error formatted correctly\n')
    return true
  } else {
    console.error('  ❌ ENOENT formatting failed')
    console.error('  Message:', message)
    process.exit(1)
  }
}

/**
 * Test 10: formatErrorMessage() for EACCES
 */
function testFormatErrorMessageEACCES() {
  console.log('Test 10: formatErrorMessage() for EACCES')

  const validator = new BaseValidator()
  const error = new Error('Permission denied')
  error.code = 'EACCES'

  const message = validator.formatErrorMessage(error, 'Test Context')

  if (message.includes('Permission denied') && message.includes('chmod')) {
    console.log('  ✅ EACCES error formatted correctly\n')
    return true
  } else {
    console.error('  ❌ EACCES formatting failed')
    process.exit(1)
  }
}

/**
 * Test 11: formatErrorMessage() for EPERM
 */
function testFormatErrorMessageEPERM() {
  console.log('Test 11: formatErrorMessage() for EPERM')

  const validator = new BaseValidator()
  const error = new Error('Operation not permitted')
  error.code = 'EPERM'

  const message = validator.formatErrorMessage(error, 'Test Context')

  if (
    message.includes('Permission denied') &&
    message.includes('Administrator')
  ) {
    console.log('  ✅ EPERM error formatted correctly\n')
    return true
  } else {
    console.error('  ❌ EPERM formatting failed')
    process.exit(1)
  }
}

/**
 * Test 12: formatErrorMessage() for MODULE_NOT_FOUND
 */
function testFormatErrorMessageModuleNotFound() {
  console.log('Test 12: formatErrorMessage() for MODULE_NOT_FOUND')

  const validator = new BaseValidator()
  const error = new Error("Cannot find module 'express'")
  error.code = 'MODULE_NOT_FOUND'

  const message = validator.formatErrorMessage(error, 'Test Context')

  if (message.includes('npm install express')) {
    console.log('  ✅ MODULE_NOT_FOUND error formatted correctly\n')
    return true
  } else {
    console.error('  ❌ MODULE_NOT_FOUND formatting failed')
    console.error('  Message:', message)
    process.exit(1)
  }
}

/**
 * Test 13: formatErrorMessage() for SyntaxError
 */
function testFormatErrorMessageSyntaxError() {
  console.log('Test 13: formatErrorMessage() for SyntaxError')

  const validator = new BaseValidator()
  const error = new SyntaxError('Unexpected token }')

  const message = validator.formatErrorMessage(error, 'Test Context')

  if (message.includes('Syntax error') && message.includes('JSON linter')) {
    console.log('  ✅ SyntaxError formatted correctly\n')
    return true
  } else {
    console.error('  ❌ SyntaxError formatting failed')
    process.exit(1)
  }
}

/**
 * Test 14: formatErrorMessage() for generic error
 */
function testFormatErrorMessageGeneric() {
  console.log('Test 14: formatErrorMessage() for generic error')

  const validator = new BaseValidator()
  const error = new Error('Something went wrong')

  const message = validator.formatErrorMessage(error, 'Test Context')

  if (
    message.includes('Test Context') &&
    message.includes('Something went wrong')
  ) {
    console.log('  ✅ Generic error formatted correctly\n')
    return true
  } else {
    console.error('  ❌ Generic error formatting failed')
    process.exit(1)
  }
}

/**
 * Test 15: handleError() adds issue
 */
function testHandleError() {
  console.log('Test 15: handleError() adds issue')

  mockConsole()
  const validator = new BaseValidator()
  const error = new Error('Test error')

  validator.handleError(error, 'Error Context')

  restoreConsole()

  if (
    validator.issues.length === 1 &&
    validator.issues[0].includes('Test error')
  ) {
    console.log('  ✅ handleError() adds issue correctly\n')
    resetConsole()
    return true
  } else {
    console.error('  ❌ handleError() failed')
    restoreConsole()
    resetConsole()
    process.exit(1)
  }
}

/**
 * Test 16: handleError() with verbose option
 */
function testHandleErrorVerbose() {
  console.log('Test 16: handleError() with verbose option')

  mockConsole()
  const validator = new BaseValidator({ verbose: true })
  const error = new Error('Verbose test error')

  validator.handleError(error, 'Verbose Context')

  const hadConsoleError = consoleErrors.length > 0
  restoreConsole()
  resetConsole()

  if (hadConsoleError && validator.issues.length === 1) {
    console.log('  ✅ handleError() logs in verbose mode\n')
    return true
  } else {
    console.error('  ❌ Verbose logging failed')
    restoreConsole()
    resetConsole()
    process.exit(1)
  }
}

/**
 * Test 17: safeExecute() handles successful operation
 */
async function testSafeExecuteSuccess() {
  console.log('Test 17: safeExecute() handles successful operation')

  const validator = new BaseValidator()
  let executed = false

  await validator.safeExecute(async () => {
    executed = true
  }, 'Test Operation')

  if (executed && validator.issues.length === 0) {
    console.log('  ✅ safeExecute() executes successfully\n')
    return true
  } else {
    console.error('  ❌ safeExecute() failed')
    process.exit(1)
  }
}

/**
 * Test 18: safeExecute() handles errors
 */
async function testSafeExecuteError() {
  console.log('Test 18: safeExecute() handles errors')

  mockConsole()
  const validator = new BaseValidator()

  await validator.safeExecute(async () => {
    throw new Error('Async operation failed')
  }, 'Async Context')

  restoreConsole()
  resetConsole()

  if (
    validator.issues.length === 1 &&
    validator.issues[0].includes('Async operation failed')
  ) {
    console.log('  ✅ safeExecute() handles errors correctly\n')
    return true
  } else {
    console.error('  ❌ safeExecute() error handling failed')
    restoreConsole()
    resetConsole()
    process.exit(1)
  }
}

/**
 * Test 19: validate() throws error (must be implemented by subclass)
 */
async function testValidateThrows() {
  console.log('Test 19: validate() throws error')

  const validator = new BaseValidator()
  let threwError = false

  try {
    await validator.validate()
  } catch (error) {
    threwError = error.message.includes('must be implemented by subclass')
  }

  if (threwError) {
    console.log('  ✅ validate() throws error correctly\n')
    return true
  } else {
    console.error('  ❌ validate() should throw error')
    process.exit(1)
  }
}

/**
 * Test 20: printResults() with no issues or warnings
 */
function testPrintResultsPass() {
  console.log('Test 20: printResults() with no issues or warnings')

  mockConsole()
  const validator = new BaseValidator()
  validator.validationComplete = true

  validator.printResults()

  const hasPassMessage = consoleOutput.some(line =>
    line.includes('✅ Validation passed')
  )
  restoreConsole()
  resetConsole()

  if (hasPassMessage) {
    console.log('  ✅ printResults() shows pass message\n')
    return true
  } else {
    console.error('  ❌ Pass message not displayed')
    restoreConsole()
    resetConsole()
    process.exit(1)
  }
}

/**
 * Test 21: printResults() with issues
 */
function testPrintResultsWithIssues() {
  console.log('Test 21: printResults() with issues')

  mockConsole()
  const validator = new BaseValidator()
  validator.validationComplete = true
  validator.addIssue('Issue 1')
  validator.addIssue('Issue 2')

  validator.printResults()

  const hasIssueCount = consoleErrors.some(line =>
    line.includes('Found 2 issue(s)')
  )
  const hasIssue1 = consoleErrors.some(line => line.includes('Issue 1'))
  restoreConsole()
  resetConsole()

  if (hasIssueCount && hasIssue1) {
    console.log('  ✅ printResults() displays issues\n')
    return true
  } else {
    console.error('  ❌ Issues not displayed correctly')
    restoreConsole()
    resetConsole()
    process.exit(1)
  }
}

/**
 * Test 22: printResults() with warnings
 */
function testPrintResultsWithWarnings() {
  console.log('Test 22: printResults() with warnings')

  mockConsole()
  const validator = new BaseValidator()
  validator.validationComplete = true
  validator.addWarning('Warning 1')

  validator.printResults()

  const hasWarningCount = consoleWarnings.some(line =>
    line.includes('Found 1 warning(s)')
  )
  const hasWarning1 = consoleWarnings.some(line => line.includes('Warning 1'))
  restoreConsole()
  resetConsole()

  if (hasWarningCount && hasWarning1) {
    console.log('  ✅ printResults() displays warnings\n')
    return true
  } else {
    console.error('  ❌ Warnings not displayed correctly')
    restoreConsole()
    resetConsole()
    process.exit(1)
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('============================================================')
  console.log('Running Comprehensive BaseValidator Tests')
  console.log('============================================================\n')

  testConstructorAndInitialState()
  testConstructorWithOptions()
  testAddIssueAndGetIssues()
  testAddWarningAndGetWarnings()
  testPassedWithNoIssues()
  testPassedWhenNotComplete()
  testPassedWithIssues()
  testReset()
  testFormatErrorMessageENOENT()
  testFormatErrorMessageEACCES()
  testFormatErrorMessageEPERM()
  testFormatErrorMessageModuleNotFound()
  testFormatErrorMessageSyntaxError()
  testFormatErrorMessageGeneric()
  testHandleError()
  testHandleErrorVerbose()
  await testSafeExecuteSuccess()
  await testSafeExecuteError()
  await testValidateThrows()
  testPrintResultsPass()
  testPrintResultsWithIssues()
  testPrintResultsWithWarnings()

  console.log('============================================================')
  console.log('✅ All BaseValidator Tests Passed!')
  console.log('============================================================\n')
  console.log('Coverage targets:')
  console.log('  • All constructor paths')
  console.log('  • All state management methods')
  console.log(
    '  • All error formatting paths (ENOENT, EACCES, EPERM, MODULE_NOT_FOUND, SyntaxError, generic)'
  )
  console.log('  • Error handling with/without verbose')
  console.log('  • safeExecute success and error paths')
  console.log('  • validate() throws requirement')
  console.log('  • printResults() all scenarios')
  console.log('')
}

runAllTests()
