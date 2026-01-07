'use strict'

const { ConfigSecurityScanner } = require('./config-security')
const { DocumentationValidator } = require('./documentation')
const { WorkflowValidator } = require('./workflow-validation')

/**
 * Validation check configuration
 */
const VALIDATION_CHECKS = [
  {
    name: 'configSecurity',
    label: 'Configuration security',
    method: 'runConfigSecurity',
  },
  {
    name: 'documentation',
    label: 'Documentation validation',
    method: 'runDocumentationValidation',
  },
  {
    name: 'workflows',
    label: 'Workflow validation',
    method: 'runWorkflowValidation',
  },
]

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

    const results = this._initResults()
    const total = VALIDATION_CHECKS.length

    for (let i = 0; i < VALIDATION_CHECKS.length; i++) {
      const check = VALIDATION_CHECKS[i]
      const stepNum = i + 1

      console.log(
        `⏳ [${stepNum}/${total}] Running ${check.label.toLowerCase()}...`
      )

      try {
        results[check.name] = await this[check.method]()
        console.log(`✅ [${stepNum}/${total}] ${check.label} complete`)
      } catch (error) {
        console.log(`❌ [${stepNum}/${total}] ${check.label} failed`)
        results[check.name] = { passed: false, error: error.message }
        results.overall.passed = false
        results.overall.issues.push(`${check.label}: ${error.message}`)
      }

      console.log('')
    }

    this._reportResults(results)
    return results
  }

  /**
   * Run comprehensive validation with parallel execution
   * Runs all validations concurrently for better performance
   */
  async runComprehensiveCheckParallel() {
    console.log('🔍 Running comprehensive validation (parallel)...\n')

    const results = this._initResults()

    const validationPromises = VALIDATION_CHECKS.map(check =>
      this[check.method]()
        .then(result => {
          results[check.name] = result
          console.log(`✅ ${check.label} complete`)
        })
        .catch(error => {
          console.log(`❌ ${check.label} failed`)
          results[check.name] = { passed: false, error: error.message }
          results.overall.passed = false
          results.overall.issues.push(`${check.label}: ${error.message}`)
        })
    )

    await Promise.all(validationPromises)
    console.log('')

    this._reportResults(results)
    return results
  }

  /**
   * Initialize results object
   */
  _initResults() {
    const results = { overall: { passed: true, issues: [] } }
    VALIDATION_CHECKS.forEach(check => {
      results[check.name] = null
    })
    return results
  }

  /**
   * Report validation results
   */
  _reportResults(results) {
    if (results.overall.passed) {
      console.log('✅ All validation checks passed!')
    } else {
      const isTest = process.argv.join(' ').includes('test')
      const prefix = isTest ? '📋 TEST SCENARIO:' : '❌'
      console.error(`${prefix} Validation failed with issues:`)
      results.overall.issues.forEach(issue => console.error(`   - ${issue}`))
      throw new Error('Comprehensive validation failed')
    }
  }
}

module.exports = {
  ValidationRunner,
  ConfigSecurityScanner,
  DocumentationValidator,
  WorkflowValidator,
}
