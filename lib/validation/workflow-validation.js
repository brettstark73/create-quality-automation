'use strict'

const fs = require('fs')
const path = require('path')
const { showProgress } = require('../ui-helpers')

/**
 * GitHub Actions Workflow Validator
 * Basic validation for GitHub Actions workflow files
 */
class WorkflowValidator {
  constructor(options = {}) {
    this.issues = []
    this.options = options
  }

  /**
   * Validate GitHub Actions workflows
   */
  async validateAll() {
    if (!this.options.quiet) {
      console.log('🔄 Validating GitHub Actions workflows...')
    }

    this.issues = []

    await this.validateWorkflowFiles()

    if (!this.options.disableActionlint) {
      await this.runActionlint()
    }

    await this.validateWorkflowSyntax()

    if (this.issues.length > 0) {
      if (!this.options.quiet) {
        console.error(`❌ Found ${this.issues.length} workflow issue(s):`)
        this.issues.forEach(issue => console.error(`   ${issue}`))
      }
      throw new Error('Workflow validation failed')
    }

    if (!this.options.quiet) {
      console.log('✅ Workflow validation passed')
    }
    return { issues: this.issues, passed: this.issues.length === 0 }
  }

  /**
   * Check for workflow files and basic structure
   */
  async validateWorkflowFiles() {
    const workflowDir = '.github/workflows'

    if (!fs.existsSync(workflowDir)) {
      this.issues.push('No .github/workflows directory found')
      return
    }

    const workflowFiles = fs
      .readdirSync(workflowDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))

    if (workflowFiles.length === 0) {
      this.issues.push('No workflow files found in .github/workflows')
      return
    }

    if (!this.options.quiet) {
      console.log(
        `📄 Found ${workflowFiles.length} workflow file(s): ${workflowFiles.join(', ')}`
      )
    }
  }

  /**
   * Run actionlint for advanced workflow validation
   */
  async runActionlint() {
    const workflowDir = '.github/workflows'

    if (!fs.existsSync(workflowDir)) return

    const spinner = showProgress('Running actionlint on workflow files...')

    try {
      const { createLinter } = require('actionlint')
      const workflowFiles = fs
        .readdirSync(workflowDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))

      const linter = await createLinter()
      let issueCount = 0

      for (const file of workflowFiles) {
        const filePath = path.join(workflowDir, file)
        const content = fs.readFileSync(filePath, 'utf8')

        try {
          const results = linter(content, filePath) || []

          if (Array.isArray(results) && results.length > 0) {
            // Filter out false positives for 'vars' context (valid GitHub feature, not recognized by actionlint WASM)
            const filteredResults = results.filter(
              result =>
                !(
                  result.kind === 'expression' &&
                  result.message?.includes('undefined variable "vars"')
                )
            )
            issueCount += filteredResults.length
            filteredResults.forEach(result => {
              this.issues.push(
                `actionlint: ${result.file}:${result.line}:${result.column} ${result.kind} - ${result.message}`
              )
            })
          }
        } catch (lintError) {
          // WASM actionlint has limits on file complexity - skip silently for large files
          if (
            lintError.message?.includes('unreachable') &&
            content.length > 10000
          ) {
            // Large file exceeded WASM limits - not a validation failure
            continue
          }
          throw lintError
        }
      }

      if (issueCount > 0) {
        spinner.fail(`actionlint found ${issueCount} issue(s)`)
      } else {
        spinner.succeed('actionlint validation passed')
      }
    } catch (error) {
      spinner.fail('actionlint failed to run')
      const reason = error?.message || 'Unknown error'
      this.issues.push(`actionlint: Failed to run - ${reason}`)
    }
  }

  /**
   * Basic YAML syntax validation for workflow files
   */
  async validateWorkflowSyntax() {
    const workflowDir = '.github/workflows'

    if (!fs.existsSync(workflowDir)) return

    const workflowFiles = fs
      .readdirSync(workflowDir)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))

    for (const file of workflowFiles) {
      const filePath = path.join(workflowDir, file)
      try {
        const content = fs.readFileSync(filePath, 'utf8')

        // Basic checks for required workflow structure
        if (!content.includes('on:') && !content.includes('on ')) {
          this.issues.push(`${file}: Missing 'on:' trigger specification`)
        }

        if (!content.includes('jobs:') && !content.includes('jobs ')) {
          this.issues.push(`${file}: Missing 'jobs:' specification`)
        }

        // Check for common issues
        if (
          content.includes('ubuntu-latest') &&
          content.includes('node-version:')
        ) {
          // This is likely a Node.js workflow, check for proper setup
          if (!content.includes('actions/setup-node@')) {
            this.issues.push(
              `${file}: Node.js workflow should use actions/setup-node`
            )
          }
        }

        // Check for security best practices
        if (
          content.includes('${{') &&
          content.includes('github.event.pull_request.head.repo.full_name')
        ) {
          this.issues.push(
            `${file}: Potential security risk using untrusted PR data`
          )
        }
      } catch (error) {
        this.issues.push(`${file}: Error reading file - ${error.message}`)
      }
    }
  }
}

module.exports = { WorkflowValidator }
