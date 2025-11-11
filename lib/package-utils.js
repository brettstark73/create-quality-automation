'use strict'

/**
 * Package.json merge utilities
 * Shared between setup script and tests to avoid duplication
 */

/**
 * Merge scripts into package.json, preserving existing ones
 * @param {Object} initialScripts - Existing scripts object
 * @param {Object} defaultScripts - Default scripts to add
 * @returns {Object} Merged scripts object
 */
function mergeScripts(initialScripts = {}, defaultScripts) {
  const scripts = { ...initialScripts }
  Object.entries(defaultScripts).forEach(([name, command]) => {
    // eslint-disable-next-line security/detect-object-injection
    if (!scripts[name]) {
      // eslint-disable-next-line security/detect-object-injection
      scripts[name] = command
    }
  })

  // Ensure husky command is present in prepare script
  const prepareScript = scripts.prepare
  if (!prepareScript) {
    scripts.prepare = 'husky'
  } else if (prepareScript.includes('husky install')) {
    scripts.prepare = prepareScript.replace(/husky install/g, 'husky')
  } else if (!prepareScript.includes('husky')) {
    scripts.prepare = `${prepareScript} && husky`
  }

  return scripts
}

/**
 * Merge devDependencies into package.json, preserving existing ones
 * @param {Object} initialDevDeps - Existing devDependencies object
 * @param {Object} defaultDevDeps - Default devDependencies to add
 * @returns {Object} Merged devDependencies object
 */
function mergeDevDependencies(initialDevDeps = {}, defaultDevDeps) {
  const devDeps = { ...initialDevDeps }
  Object.entries(defaultDevDeps).forEach(([dependency, version]) => {
    // eslint-disable-next-line security/detect-object-injection
    if (!devDeps[dependency]) {
      // eslint-disable-next-line security/detect-object-injection
      devDeps[dependency] = version
    }
  })
  return devDeps
}

/**
 * Merge lint-staged configuration, preserving existing patterns
 * @param {Object} existing - Existing lint-staged config
 * @param {Object} defaults - Default lint-staged config
 * @param {Object} options - Merge options
 * @param {Function} patternChecker - Function to check if a pattern matches certain criteria
 * @returns {Object} Merged lint-staged config
 */
function mergeLintStaged(
  existing = {},
  defaults,
  options = {},
  patternChecker = null
) {
  const merged = { ...existing }
  const stylelintTargets = options.stylelintTargets || []
  const stylelintTargetSet = new Set(stylelintTargets)

  // Check if existing config has CSS patterns
  const hasExistingCssPatterns =
    patternChecker && Object.keys(existing).some(patternChecker)

  Object.entries(defaults).forEach(([pattern, commands]) => {
    const isStylelintPattern = stylelintTargetSet.has(pattern)
    if (isStylelintPattern && hasExistingCssPatterns) {
      return // Skip stylelint patterns if existing CSS patterns exist
    }

    // eslint-disable-next-line security/detect-object-injection
    if (!merged[pattern]) {
      // eslint-disable-next-line security/detect-object-injection
      merged[pattern] = commands
      return
    }

    // Merge commands for existing patterns
    // eslint-disable-next-line security/detect-object-injection
    const existingCommands = Array.isArray(merged[pattern])
      ? // eslint-disable-next-line security/detect-object-injection
        [...merged[pattern]]
      : // eslint-disable-next-line security/detect-object-injection
        [merged[pattern]]

    const newCommands = [...existingCommands]
    commands.forEach(command => {
      if (!newCommands.includes(command)) {
        newCommands.push(command)
      }
    })
    // eslint-disable-next-line security/detect-object-injection
    merged[pattern] = newCommands
  })

  return merged
}

module.exports = {
  mergeScripts,
  mergeDevDependencies,
  mergeLintStaged,
}
