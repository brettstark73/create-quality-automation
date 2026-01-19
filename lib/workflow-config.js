/**
 * Workflow configuration utilities
 * Handles workflow tier detection and mode injection
 */

'use strict'

const fs = require('fs')
const path = require('path')

/**
 * Detect existing workflow mode from quality.yml
 * @param {string} projectPath - Path to project
 * @returns {string|null} Detected mode or null
 */
function detectExistingWorkflowMode(projectPath) {
  const workflowPath = path.join(
    projectPath,
    '.github',
    'workflows',
    'quality.yml'
  )

  if (!fs.existsSync(workflowPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(workflowPath, 'utf8')

    if (content.includes('# WORKFLOW_MODE: minimal')) {
      return 'minimal'
    }
    if (content.includes('# WORKFLOW_MODE: standard')) {
      return 'standard'
    }
    if (content.includes('# WORKFLOW_MODE: comprehensive')) {
      return 'comprehensive'
    }

    const hasSecurityJob = /jobs:\s*\n\s*security:/m.test(content)
    const hasMatrixInTests = /tests:[\s\S]*?strategy:[\s\S]*?matrix:/m.test(
      content
    )
    const hasScheduledSecurity = /on:\s*\n\s*schedule:[\s\S]*?- cron:/m.test(
      content
    )

    if (hasSecurityJob && hasMatrixInTests && !hasScheduledSecurity) {
      return 'comprehensive'
    }
    if (hasMatrixInTests && hasScheduledSecurity) {
      return 'standard'
    }
    if (!hasMatrixInTests) {
      return 'minimal'
    }

    return 'comprehensive'
  } catch (error) {
    console.warn(
      `⚠️  Could not detect existing workflow mode: ${error.message}`
    )
    return null
  }
}

/**
 * Inject workflow mode-specific configuration into quality.yml
 * @param {string} workflowContent - Template content
 * @param {'minimal'|'standard'|'comprehensive'} mode - Selected mode
 * @returns {string} Modified workflow content
 */
function injectWorkflowMode(workflowContent, mode) {
  let updated = workflowContent

  const versionMarker = `# WORKFLOW_MODE: ${mode}`
  if (updated.includes('# WORKFLOW_MODE:')) {
    // Replace existing marker with new mode
    updated = updated.replace(
      /# WORKFLOW_MODE: (minimal|standard|comprehensive)/,
      versionMarker
    )
  } else {
    // Add marker before jobs:
    updated = updated.replace(/(\n\njobs:)/, `\n${versionMarker}\n$1`)
  }

  // Controlled regexes for YAML workflow template matching - these patterns match static
  // template content, not user input. Safe from ReDoS as they match known structure.

  // Handle mode-specific transformations
  if (mode === 'standard') {
    // Standard: Add main branch condition to tests job
    // Match the tests job's if condition and add main branch check
    updated = updated.replace(
      /(\s+tests:\s+runs-on:[^\n]+\s+needs:[^\n]+\s+)if: fromJSON\(needs\.detect-maturity\.outputs\.test-count\) > 0/,
      "$1if: github.ref == 'refs/heads/main' && fromJSON(needs.detect-maturity.outputs.test-count) > 0"
    )

    // Standard: Change matrix to [20, 22]
    updated = updated.replace(/node-version: \[22\]/g, 'node-version: [20, 22]')
  } else if (mode === 'comprehensive') {
    // Comprehensive: Remove paths-ignore blocks from push and pull_request
    updated = updated.replace(
      /(\s+push:\s+branches:[^\n]+)\s+paths-ignore:\s+- '\*\*\.md'\s+- 'docs\/\*\*'\s+- 'LICENSE'\s+- '\.gitignore'\s+- '\.editorconfig'/g,
      '$1'
    )
    updated = updated.replace(
      /(\s+pull_request:\s+branches:[^\n]+)\s+paths-ignore:\s+- '\*\*\.md'\s+- 'docs\/\*\*'\s+- 'LICENSE'\s+- '\.gitignore'\s+- '\.editorconfig'/g,
      '$1'
    )

    // Comprehensive: Remove schedule trigger (security runs inline)
    updated = updated.replace(/\s+schedule:\s+- cron:[^\n]+[^\n]*\n?/g, '\n')

    // Comprehensive: Remove schedule condition from security job
    updated = updated.replace(
      /if: \(github\.event_name == 'schedule' \|\| github\.event_name == 'workflow_dispatch'\) && /g,
      'if: '
    )

    // Comprehensive: Change matrix to [20, 22]
    updated = updated.replace(/node-version: \[22\]/g, 'node-version: [20, 22]')
  }
  // Minimal mode: keep as-is (template is already in minimal mode)

  return updated
}

module.exports = {
  detectExistingWorkflowMode,
  injectWorkflowMode,
}
