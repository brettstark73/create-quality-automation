/**
 * Command handlers index
 *
 * Centralizes CLI command handlers for better maintainability.
 * Each command has its own module with focused functionality.
 */

const { handleValidationCommands } = require('./validate')
const {
  handleDependencyMonitoring,
  detectPythonProject,
  detectRustProject,
  detectRubyProject,
} = require('./deps')

module.exports = {
  // Validation commands
  handleValidationCommands,

  // Dependency monitoring commands
  handleDependencyMonitoring,
  detectPythonProject,
  detectRustProject,
  detectRubyProject,
}
