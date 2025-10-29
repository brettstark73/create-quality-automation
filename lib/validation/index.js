'use strict'

const { ConfigSecurityScanner } = require('./config-security')
const { DocumentationValidator } = require('./documentation')

/**
 * Enhanced Validation Runner
 * Coordinates all validation checks
 */
class ValidationRunner {
  constructor() {
    this.configScanner = new ConfigSecurityScanner()
    this.docValidator = new DocumentationValidator()
  }

  /**
   * Run configuration security checks
   */
  async runConfigSecurity() {
    return await this.configScanner.scanAll()
  }

  /**
   * Run documentation accuracy checks
   */
  async runDocumentationValidation() {
    return await this.docValidator.validateAll()
  }

  /**
   * Run comprehensive validation
   */
  async runComprehensiveCheck() {
    console.log('🔍 Running comprehensive validation...\n')

    const results = {
      configSecurity: null,
      documentation: null,
      overall: { passed: true, issues: [] },
    }

    try {
      results.configSecurity = await this.runConfigSecurity()
    } catch (error) {
      results.configSecurity = { passed: false, error: error.message }
      results.overall.passed = false
      results.overall.issues.push(`Configuration Security: ${error.message}`)
    }

    console.log('') // Add spacing between checks

    try {
      results.documentation = await this.runDocumentationValidation()
    } catch (error) {
      results.documentation = { passed: false, error: error.message }
      results.overall.passed = false
      results.overall.issues.push(`Documentation: ${error.message}`)
    }

    console.log('') // Add spacing

    if (results.overall.passed) {
      console.log('✅ All validation checks passed!')
    } else {
      console.error('❌ Validation failed with issues:')
      results.overall.issues.forEach(issue => console.error(`   - ${issue}`))
      throw new Error('Comprehensive validation failed')
    }

    return results
  }
}

module.exports = {
  ValidationRunner,
  ConfigSecurityScanner,
  DocumentationValidator,
}
