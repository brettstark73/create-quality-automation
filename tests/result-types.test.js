/**
 * Tests for result-types module
 * Comprehensive coverage for standard result type helpers
 */

'use strict'

const assert = require('assert')
const {
  success,
  failure,
  valid,
  invalid,
  isSuccess,
  isFailure,
} = require('../lib/result-types')

console.log('🧪 Testing Result Types Module...\n')

// Test success() function
console.log('Test 1: success() with no data')
const successNoData = success()
assert.strictEqual(successNoData.success, true)
assert.strictEqual(successNoData.data, undefined)
console.log('  ✅ success() returns { success: true } without data field\n')

console.log('Test 2: success() with data')
const successWithData = success({ foo: 'bar' })
assert.strictEqual(successWithData.success, true)
assert.deepStrictEqual(successWithData.data, { foo: 'bar' })
console.log('  ✅ success() includes data field when provided\n')

console.log('Test 3: success() with null data (should not include data field)')
const successNullData = success(null)
assert.strictEqual(successNullData.success, true)
assert.strictEqual(successNullData.data, undefined)
console.log('  ✅ success(null) omits data field\n')

console.log(
  'Test 4: success() with undefined data (should not include data field)'
)
const successUndefinedData = success(undefined)
assert.strictEqual(successUndefinedData.success, true)
assert.strictEqual(successUndefinedData.data, undefined)
console.log('  ✅ success(undefined) omits data field\n')

// Test failure() function
console.log('Test 5: failure() with error message only')
const failureNoDetails = failure('Something went wrong')
assert.strictEqual(failureNoDetails.success, false)
assert.strictEqual(failureNoDetails.error, 'Something went wrong')
assert.strictEqual(failureNoDetails.details, undefined)
console.log(
  '  ✅ failure() returns { success: false, error } without details\n'
)

console.log('Test 6: failure() with error and details')
const failureWithDetails = failure('Invalid input', { field: 'email' })
assert.strictEqual(failureWithDetails.success, false)
assert.strictEqual(failureWithDetails.error, 'Invalid input')
assert.deepStrictEqual(failureWithDetails.details, { field: 'email' })
console.log('  ✅ failure() includes details field when provided\n')

console.log(
  'Test 7: failure() with null details (should not include details field)'
)
const failureNullDetails = failure('Error', null)
assert.strictEqual(failureNullDetails.success, false)
assert.strictEqual(failureNullDetails.details, undefined)
console.log('  ✅ failure(error, null) omits details field\n')

// Test valid() function
console.log('Test 8: valid() with no data')
const validNoData = valid()
assert.strictEqual(validNoData.valid, true)
assert.strictEqual(validNoData.data, undefined)
console.log('  ✅ valid() returns { valid: true } without data field\n')

console.log('Test 9: valid() with data')
const validWithData = valid({ validated: true })
assert.strictEqual(validWithData.valid, true)
assert.deepStrictEqual(validWithData.data, { validated: true })
console.log('  ✅ valid() includes data field when provided\n')

// Test invalid() function
console.log('Test 10: invalid() with error message only')
const invalidNoDetails = invalid('Validation failed')
assert.strictEqual(invalidNoDetails.valid, false)
assert.strictEqual(invalidNoDetails.error, 'Validation failed')
assert.strictEqual(invalidNoDetails.details, undefined)
console.log('  ✅ invalid() returns { valid: false, error } without details\n')

console.log('Test 11: invalid() with error and details')
const invalidWithDetails = invalid('Schema mismatch', { expected: 'string' })
assert.strictEqual(invalidWithDetails.valid, false)
assert.strictEqual(invalidWithDetails.error, 'Schema mismatch')
assert.deepStrictEqual(invalidWithDetails.details, { expected: 'string' })
console.log('  ✅ invalid() includes details field when provided\n')

// Test isSuccess() function
console.log('Test 12: isSuccess() with success result')
assert.strictEqual(isSuccess(success()), true)
console.log('  ✅ isSuccess() returns true for success result\n')

console.log('Test 13: isSuccess() with valid result')
assert.strictEqual(isSuccess(valid()), true)
console.log('  ✅ isSuccess() returns true for valid result\n')

console.log('Test 14: isSuccess() with failure result')
assert.strictEqual(isSuccess(failure('error')), false)
console.log('  ✅ isSuccess() returns false for failure result\n')

console.log('Test 15: isSuccess() with invalid result')
assert.strictEqual(isSuccess(invalid('error')), false)
console.log('  ✅ isSuccess() returns false for invalid result\n')

console.log('Test 16: isSuccess() with null')
assert.strictEqual(!!isSuccess(null), false)
console.log('  ✅ isSuccess() returns falsy for null\n')

console.log('Test 17: isSuccess() with undefined')
assert.strictEqual(!!isSuccess(undefined), false)
console.log('  ✅ isSuccess() returns falsy for undefined\n')

// Test isFailure() function
console.log('Test 18: isFailure() with failure result')
assert.strictEqual(isFailure(failure('error')), true)
console.log('  ✅ isFailure() returns true for failure result\n')

console.log('Test 19: isFailure() with invalid result')
assert.strictEqual(isFailure(invalid('error')), true)
console.log('  ✅ isFailure() returns true for invalid result\n')

console.log('Test 20: isFailure() with success result')
assert.strictEqual(isFailure(success()), false)
console.log('  ✅ isFailure() returns false for success result\n')

console.log('Test 21: isFailure() with valid result')
assert.strictEqual(isFailure(valid()), false)
console.log('  ✅ isFailure() returns false for valid result\n')

console.log('Test 22: isFailure() with null')
assert.strictEqual(!!isFailure(null), false)
console.log('  ✅ isFailure() returns falsy for null\n')

console.log('Test 23: isFailure() with undefined')
assert.strictEqual(!!isFailure(undefined), false)
console.log('  ✅ isFailure() returns falsy for undefined\n')

console.log('🎉 All Result Types Tests Passed!\n')
console.log('✅ success() builder tested (with/without data)')
console.log('✅ failure() builder tested (with/without details)')
console.log('✅ valid() builder tested (with/without data)')
console.log('✅ invalid() builder tested (with/without details)')
console.log('✅ isSuccess() checker tested (all cases)')
console.log('✅ isFailure() checker tested (all cases)')
