/**
 * Code review command - uses Claude Code pr-review-toolkit agents if available
 */

const chalk = require('chalk')

/**
 * Handle code review command
 * @param {string[]} args - Command arguments
 */
async function handleCodeReview(args) {
  console.log('🔍 Starting code review...')
  console.log('')

  // Parse arguments
  const scope = args.includes('--all') ? 'all' : 'branch'

  console.log(
    `📁 Scope: ${scope === 'all' ? 'Entire project' : 'Current branch changes'}`
  )
  console.log('')

  // Check if Claude Code is available
  const hasClaudeCode = await checkClaudeCodeAvailable()

  if (!hasClaudeCode) {
    console.log(chalk.yellow('⚠️  Claude Code not detected'))
    console.log('')
    console.log('Code review requires Claude Code CLI.')
    console.log('Install: https://claude.ai/code')
    console.log('')
    console.log('Alternative: Manual review checklist:')
    console.log('  • Run: npm run lint')
    console.log('  • Run: npm run test')
    console.log('  • Run: npm run build')
    console.log('  • Check for security issues: npm audit')
    console.log('  • Review changed files manually')
    return
  }

  console.log('✅ Claude Code detected')
  console.log('')
  console.log('🤖 Launching autonomous code review agents...')
  console.log('')
  console.log('This will run comprehensive quality checks using:')
  console.log('  • pr-review-toolkit:code-reviewer')
  console.log('  • pr-review-toolkit:silent-failure-hunter')
  console.log('  • pr-review-toolkit:type-design-analyzer')
  console.log('')
  console.log(chalk.yellow('Note: This requires an active Claude Code session'))
  console.log('')
  console.log('To use code review:')
  console.log('1. Open Claude Code in your terminal')
  console.log('2. Run: /pr-review-toolkit:review-pr')
  console.log('3. Or use the Task tool with pr-review-toolkit agents')
  console.log('')
  console.log(
    chalk.dim('Automated agent invocation from CLI coming in future release')
  )
}

/**
 * Check if Claude Code CLI is available
 * @returns {Promise<boolean>}
 */
async function checkClaudeCodeAvailable() {
  const { exec } = require('child_process')
  const util = require('util')
  const execAsync = util.promisify(exec)

  try {
    await execAsync('claude --version')
    return true
  } catch (_error) {
    return false
  }
}

module.exports = {
  handleCodeReview,
}
