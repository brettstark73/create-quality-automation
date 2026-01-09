/**
 * Project maturity check command handler
 */

'use strict'

/**
 * Handle project maturity check command
 * @returns {void}
 */
function handleMaturityCheck() {
  const { ProjectMaturityDetector } = require('../project-maturity')
  const detector = new ProjectMaturityDetector({
    projectPath: process.cwd(),
    verbose: true,
  })
  detector.printReport()
  process.exit(0)
}

module.exports = { handleMaturityCheck }
