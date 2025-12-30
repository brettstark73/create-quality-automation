/**
 * Validation command handlers
 *
 * Extracted from setup.js to improve maintainability.
 * Handles --validate, --comprehensive, --security-config, --validate-docs commands.
 */

const { ValidationRunner } = require('../validation')

/**
 * Handle validation-only commands
 *
 * @param {Object} options - Validation options
 * @param {boolean} options.isConfigSecurityMode - Run config security check only
 * @param {boolean} options.isDocsValidationMode - Run docs validation only
 * @param {boolean} options.isComprehensiveMode - Run comprehensive validation
 * @param {boolean} options.isValidationMode - Run validation mode
 * @param {boolean} options.disableNpmAudit - Skip npm audit
 * @param {boolean} options.disableGitleaks - Skip gitleaks
 * @param {boolean} options.disableActionlint - Skip actionlint
 * @param {boolean} options.disableMarkdownlint - Skip markdownlint
 * @param {boolean} options.disableEslintSecurity - Skip ESLint security
 * @param {boolean} options.allowLatestGitleaks - Allow latest gitleaks version
 */
async function handleValidationCommands(options) {
  const {
    isConfigSecurityMode,
    isDocsValidationMode,
    isComprehensiveMode,
    isValidationMode,
    disableNpmAudit,
    disableGitleaks,
    disableActionlint,
    disableMarkdownlint,
    disableEslintSecurity,
    allowLatestGitleaks,
  } = options

  const validationOptions = {
    disableNpmAudit,
    disableGitleaks,
    disableActionlint,
    disableMarkdownlint,
    disableEslintSecurity,
    allowLatestGitleaks,
  }
  const validator = new ValidationRunner(validationOptions)

  if (isConfigSecurityMode) {
    try {
      await validator.runConfigSecurity()
      process.exit(0)
    } catch (error) {
      console.error(
        `\n❌ Configuration security validation failed:\n${error.message}`
      )
      process.exit(1)
    }
  }

  if (isDocsValidationMode) {
    try {
      await validator.runDocumentationValidation()
      process.exit(0)
    } catch (error) {
      console.error(`\n❌ Documentation validation failed:\n${error.message}`)
      process.exit(1)
    }
  }

  if (isComprehensiveMode || isValidationMode) {
    try {
      // Use parallel validation for 3-5x speedup (runs checks concurrently)
      await validator.runComprehensiveCheckParallel()
      process.exit(0)
    } catch (error) {
      console.error(`\n❌ Comprehensive validation failed:\n${error.message}`)
      process.exit(1)
    }
  }
}

module.exports = {
  handleValidationCommands,
}
