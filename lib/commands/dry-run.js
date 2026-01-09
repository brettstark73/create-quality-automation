/**
 * Dry-run command handler
 * Previews what files would be created/modified without making changes
 */

'use strict'

/**
 * Handle dry-run mode - preview what would be changed
 * @param {Object} options - Configuration options
 * @param {boolean} options.isDryRun - Whether in dry-run mode
 * @param {boolean} options.isUpdateMode - Whether in update mode
 * @param {boolean} options.isDependencyMonitoringMode - Whether in dependency monitoring mode
 * @returns {void}
 */
function handleDryRun(options) {
  const { isDryRun, isUpdateMode, isDependencyMonitoringMode } = options

  const modeText = isDryRun
    ? '[DRY RUN] Previewing'
    : isUpdateMode
      ? 'Updating'
      : isDependencyMonitoringMode
        ? 'Adding dependency monitoring to'
        : 'Setting up'

  console.log(`🚀 ${modeText} Quality Automation...\n`)

  if (!isDryRun) {
    return
  }

  console.log('📋 DRY RUN MODE - No files will be modified\n')
  console.log('The following files would be created/modified:\n')

  console.log('Configuration Files:')
  console.log('  • .prettierrc - Prettier formatting configuration')
  console.log('  • .prettierignore - Files to exclude from formatting')
  console.log('  • eslint.config.cjs - ESLint linting configuration')
  console.log('  • .stylelintrc.json - Stylelint CSS linting configuration')
  console.log(
    '  • .editorconfig - Editor configuration for consistent formatting'
  )
  console.log('  • .nvmrc - Node version specification')
  console.log('  • .npmrc - npm configuration with engine-strict')
  console.log('')

  console.log('Git Hooks (Husky):')
  console.log('  • .husky/pre-commit - Pre-commit hook for lint-staged')
  console.log('  • .husky/pre-push - Pre-push validation (lint, format, tests)')
  console.log('')

  console.log('GitHub Actions:')
  console.log('  • .github/workflows/quality.yml - Quality checks workflow')
  console.log('')

  console.log('Package.json Modifications:')
  console.log(
    '  • Add devDependencies: eslint, prettier, stylelint, husky, lint-staged'
  )
  console.log('  • Add scripts: format, lint, prepare')
  console.log('  • Add lint-staged configuration')
  console.log('  • Add engines requirement (Node >=20)')
  console.log('')

  console.log('✅ Dry run complete - no files were modified')
  console.log('')
  console.log('To apply these changes, run without --dry-run flag:')
  console.log('  npx create-qa-architect@latest')

  process.exit(0)
}

module.exports = { handleDryRun }
