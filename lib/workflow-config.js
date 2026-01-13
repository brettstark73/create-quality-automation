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
  if (!updated.includes('# WORKFLOW_MODE:')) {
    updated = updated.replace(/(\n\njobs:)/, `\n${versionMarker}\n$1`)
  }

  if (updated.includes('# PATH_FILTERS_PLACEHOLDER')) {
    if (mode === 'minimal' || mode === 'standard') {
      const pathsIgnore = `paths-ignore:
      - '**.md'
      - 'docs/**'
      - 'LICENSE'
      - '.gitignore'
      - '.editorconfig'`
      updated = updated.replace('# PATH_FILTERS_PLACEHOLDER', pathsIgnore)
    } else {
      updated = updated.replace(/\s*# PATH_FILTERS_PLACEHOLDER\n?/, '')
    }
  }

  if (updated.includes('# SECURITY_SCHEDULE_PLACEHOLDER')) {
    if (mode === 'minimal' || mode === 'standard') {
      const scheduleConfig = `schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday (security scans)
  workflow_dispatch:       # Manual trigger`
      updated = updated.replace(
        '# SECURITY_SCHEDULE_PLACEHOLDER',
        scheduleConfig
      )
    } else {
      updated = updated.replace(/\s*# SECURITY_SCHEDULE_PLACEHOLDER\n?/, '')
    }
  }

  if (updated.includes('# SECURITY_CONDITION_PLACEHOLDER')) {
    if (mode === 'minimal' || mode === 'standard') {
      updated = updated.replace(
        /# SECURITY_CONDITION_PLACEHOLDER\n\s*if: needs\.detect-maturity\.outputs\.has-deps == 'true'/,
        `if: (github.event_name == 'schedule' || github.event_name == 'workflow_dispatch') && needs.detect-maturity.outputs.has-deps == 'true'`
      )
    } else {
      updated = updated.replace(/\s*# SECURITY_CONDITION_PLACEHOLDER\n?/, '')
    }
  }

  // eslint-disable security/detect-unsafe-regex -- Controlled regexes for YAML workflow template matching (known safe patterns)
  if (updated.includes('# MATRIX_PLACEHOLDER')) {
    if (mode === 'minimal') {
      updated = updated.replace(
        /# MATRIX_PLACEHOLDER\n\s*strategy:\n\s*fail-fast: false(\n\s*matrix:\n\s*node-version: \[[\d, ]+\])?/,
        `
    strategy:
      fail-fast: false
      matrix:
        node-version: [22]`
      )
    } else if (mode === 'standard') {
      updated = updated.replace(
        /if: fromJSON\(needs\.detect-maturity\.outputs\.test-count\) > 0\n\s*# TESTS_CONDITION_PLACEHOLDER/,
        `if: github.ref == 'refs/heads/main' && fromJSON(needs.detect-maturity.outputs.test-count) > 0
    # TESTS_CONDITION_PLACEHOLDER`
      )
      updated = updated.replace(
        /# MATRIX_PLACEHOLDER\n\s*strategy:\n\s*fail-fast: false(\n\s*matrix:\n\s*node-version: \[[\d, ]+\])?/,
        `
    strategy:
      fail-fast: false
      matrix:
        node-version: [20, 22]`
      )
    } else {
      updated = updated.replace(
        /# MATRIX_PLACEHOLDER\n\s*strategy:\n\s*fail-fast: false(\n\s*matrix:\n\s*node-version: \[[\d, ]+\])?/,
        `
    strategy:
      fail-fast: false
      matrix:
        node-version: [20, 22]`
      )
    }
  }
  // eslint-enable security/detect-unsafe-regex

  if (updated.includes('# TESTS_CONDITION_PLACEHOLDER')) {
    updated = updated.replace(/\s*# TESTS_CONDITION_PLACEHOLDER\n?/, '')
  }

  return updated
}

module.exports = {
  detectExistingWorkflowMode,
  injectWorkflowMode,
}
