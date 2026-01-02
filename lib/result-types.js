/**
 * DR25 fix: Standard result type helpers for consistent API across modules
 *
 * This module provides standard result builders to ensure consistency across
 * all modules in the codebase. Use these instead of ad-hoc result objects.
 *
 * STANDARD PATTERNS:
 *
 * 1. Success/failure operations (file I/O, validation, etc.):
 *    { success: true, data?: any }
 *    { success: false, error: string, details?: any }
 *
 * 2. Validation results:
 *    { valid: true, data?: any }
 *    { valid: false, error: string, details?: any }
 *
 * 3. Query results:
 *    - Found: return data directly or { found: true, data }
 *    - Not found: return null or { found: false }
 *
 * MIGRATION STATUS:
 * - lib/licensing.js: Uses mixed patterns (being migrated)
 * - lib/license-validator.js: Uses valid/error pattern
 * - webhook-handler.js: Uses success/error pattern
 * - lib/error-reporter.js: Uses success/error pattern
 * - lib/template-loader.js: Uses success/errors array pattern
 *
 * @module result-types
 */

'use strict'

/**
 * Create a successful operation result
 * @param {any} data - Optional data to include
 * @returns {{ success: true, data?: any }}
 */
function success(data = null) {
  const result = { success: true }
  if (data !== null && data !== undefined) {
    result.data = data
  }
  return result
}

/**
 * Create a failed operation result
 * @param {string} error - Error message
 * @param {any} details - Optional error details
 * @returns {{ success: false, error: string, details?: any }}
 */
function failure(error, details = null) {
  const result = { success: false, error }
  if (details !== null && details !== undefined) {
    result.details = details
  }
  return result
}

/**
 * Create a successful validation result
 * @param {any} data - Optional validated data
 * @returns {{ valid: true, data?: any }}
 */
function valid(data = null) {
  const result = { valid: true }
  if (data !== null && data !== undefined) {
    result.data = data
  }
  return result
}

/**
 * Create a failed validation result
 * @param {string} error - Validation error message
 * @param {any} details - Optional error details
 * @returns {{ valid: false, error: string, details?: any }}
 */
function invalid(error, details = null) {
  const result = { valid: false, error }
  if (details !== null && details !== undefined) {
    result.details = details
  }
  return result
}

/**
 * Check if a result indicates success (works with both patterns)
 * @param {object} result - Result object to check
 * @returns {boolean} True if successful or valid
 */
function isSuccess(result) {
  return result && (result.success === true || result.valid === true)
}

/**
 * Check if a result indicates failure (works with both patterns)
 * @param {object} result - Result object to check
 * @returns {boolean} True if failed or invalid
 */
function isFailure(result) {
  return result && (result.success === false || result.valid === false)
}

module.exports = {
  success,
  failure,
  valid,
  invalid,
  isSuccess,
  isFailure,
}
