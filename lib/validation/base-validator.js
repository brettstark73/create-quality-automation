'use strict'

/**
 * Base Validator Class
 * Provides common error handling, state management, and validation patterns
 * for all validator implementations
 */
class BaseValidator {
  constructor(options = {}) {
    this.options = options
    this.issues = []
    this.warnings = []
    this.validationComplete = false
  }

  /**
   * Check if validation has been run
   */
  hasRun() {
    return this.validationComplete
  }

  /**
   * Get all issues found
   */
  getIssues() {
    return this.issues
  }

  /**
   * Get all warnings found
   */
  getWarnings() {
    return this.warnings
  }

  /**
   * Check if validation passed (no issues)
   */
  passed() {
    return this.hasRun() && this.issues.length === 0
  }

  /**
   * Reset validation state
   */
  reset() {
    this.issues = []
    this.warnings = []
    this.validationComplete = false
  }

  /**
   * Safe async operation wrapper with error handling
   * @param {Function} operation - Async operation to execute
   * @param {string} errorContext - Context for error messages
   */
  async safeExecute(operation, errorContext) {
    try {
      await operation()
    } catch (error) {
      this.handleError(error, errorContext)
    }
  }

  /**
   * Centralized error handling
   * @param {Error} error - The error that occurred
   * @param {string} context - Context where the error occurred
   */
  handleError(error, context) {
    // Log detailed error for debugging
    if (this.options.verbose) {
      console.error(`Error in ${context}:`, error)
    }

    // Add user-friendly error message
    const errorMessage = this.formatErrorMessage(error, context)
    this.issues.push(errorMessage)
  }

  /**
   * Format error message for user
   * @param {Error} error - The error object
   * @param {string} context - The context
   * @returns {string} Formatted error message
   */
  formatErrorMessage(error, context) {
    // Handle common error types
    if (error.code === 'ENOENT') {
      return `${context}: File or command not found - ${error.message}`
    }

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return `${context}: Permission denied - ${error.message}`
    }

    if (error.code === 'MODULE_NOT_FOUND') {
      return `${context}: Required module not installed - ${error.message}`
    }

    if (error.name === 'SyntaxError') {
      return `${context}: Syntax error - ${error.message}`
    }

    // Default error message
    return `${context}: ${error.message}`
  }

  /**
   * Add an issue to the issues list
   * @param {string} message - Issue message
   */
  addIssue(message) {
    this.issues.push(message)
  }

  /**
   * Add a warning to the warnings list
   * @param {string} message - Warning message
   */
  addWarning(message) {
    this.warnings.push(message)
  }

  /**
   * Validate - must be implemented by subclasses
   */
  async validate() {
    throw new Error('validate() must be implemented by subclass')
  }

  /**
   * Print validation results
   */
  printResults() {
    if (this.issues.length > 0) {
      console.error(`❌ Found ${this.issues.length} issue(s):`)
      this.issues.forEach(issue => console.error(`   ${issue}`))
    }

    if (this.warnings.length > 0) {
      console.warn(`⚠️  Found ${this.warnings.length} warning(s):`)
      this.warnings.forEach(warning => console.warn(`   ${warning}`))
    }

    if (this.passed()) {
      console.log('✅ Validation passed')
    }
  }
}

module.exports = BaseValidator
