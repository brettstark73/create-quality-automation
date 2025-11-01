'use strict'

const { ConfigSecurityScanner } = require('./config-security')
const { DocumentationValidator } = require('./documentation')
const { WorkflowValidator } = require('./workflow-validation')

/**
 * Enhanced Validation Runner
 * Coordinates all validation checks
 */
class ValidationRunner {
  constructor(options = {}) {
    this.options = options
    this.configScanner = new ConfigSecurityScanner(options)
    this.docValidator = new DocumentationValidator(options)
    this.workflowValidator = new WorkflowValidator(options)
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
   * Run workflow validation checks
   */
  async runWorkflowValidation() {
    return await this.workflowValidator.validateAll()
  }

  /**
   * Run comprehensive validation
   */
  async runComprehensiveCheck() {
    console.log('🔍 Running comprehensive validation...\n')

    const results = {
      configSecurity: null,
      documentation: null,
      workflows: null,
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

    try {
      results.workflows = await this.runWorkflowValidation()
    } catch (error) {
      results.workflows = { passed: false, error: error.message }
      results.overall.passed = false
      results.overall.issues.push(`Workflows: ${error.message}`)
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
  WorkflowValidator,
}
