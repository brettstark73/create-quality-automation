/**
 * Global Constants Configuration
 *
 * Centralized configuration values used throughout the quality automation system.
 * Extracting these magic numbers improves maintainability and provides a single
 * source of truth for all configuration thresholds and limits.
 */

/**
 * Node.js version requirements
 */
const NODE_VERSION = {
  /** Minimum supported Node.js major version */
  MIN_MAJOR: 20,
}

/**
 * File scanning and directory traversal limits
 */
const SCAN_LIMITS = {
  /** Maximum depth for Stylelint directory scanning */
  STYLELINT_MAX_DEPTH: 4,

  /** Maximum depth for project maturity file counting */
  FILE_COUNT_MAX_DEPTH: 5,
}

/**
 * Error reporting and telemetry limits
 */
const REPORTING_LIMITS = {
  /** Maximum number of error reports to store */
  MAX_ERROR_REPORTS: 50,

  /** Maximum number of telemetry events to buffer */
  MAX_TELEMETRY_EVENTS: 100,
}

/**
 * Project maturity assessment thresholds
 */
const MATURITY_THRESHOLDS = {
  /** Minimum README line count for "documented" status */
  README_MIN_LINES_FOR_DOCS: 100,

  /** Minimum files for "bootstrap" maturity level */
  MIN_BOOTSTRAP_FILES: 3,

  /** Minimum files for "production" maturity level */
  MIN_PRODUCTION_FILES: 10,

  /** Minimum test files for "production" status */
  MIN_PRODUCTION_TESTS: 3,
}

/**
 * Dependency monitoring configuration
 */
const DEPENDENCY_MONITORING = {
  /** Maximum size of regex pattern cache */
  MAX_PATTERN_CACHE_SIZE: 1000,

  /** Maximum file size for requirements.txt parsing (10MB) */
  MAX_REQUIREMENTS_FILE_SIZE: 10 * 1024 * 1024,
}

module.exports = {
  NODE_VERSION,
  SCAN_LIMITS,
  REPORTING_LIMITS,
  MATURITY_THRESHOLDS,
  DEPENDENCY_MONITORING,
}
