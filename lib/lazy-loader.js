/**
 * Lazy Module Loader
 *
 * Performance optimization: Defer loading of heavy modules until actually needed.
 * This reduces startup time for simple commands like --help, --version, etc.
 *
 * Usage:
 *   const { getLicensing } = require('./lib/lazy-loader')
 *   const { getLicenseInfo } = getLicensing() // Loads on first call
 */

class LazyModuleCache {
  constructor() {
    this.cache = new Map()
  }

  /**
   * Load a module on-demand with caching
   * @param {string} name - Module identifier
   * @param {string} modulePath - Require path
   * @returns {any} Module exports
   */
  load(name, modulePath) {
    if (!this.cache.has(name)) {
      // eslint-disable-next-line security/detect-non-literal-require -- Safe: modulePath is hardcoded in lazy loader functions, not user input
      this.cache.set(name, require(modulePath))
    }
    return this.cache.get(name)
  }

  /**
   * Clear cache for testing
   */
  clear() {
    this.cache.clear()
  }
}

const lazyCache = new LazyModuleCache()

/**
 * Lazy loaders for heavy modules
 * These modules are only loaded when their features are actually used
 */

function getLicensing() {
  return lazyCache.load('licensing', './licensing')
}

function getSmartStrategy() {
  return lazyCache.load('smart-strategy', './smart-strategy-generator')
}

function getQualityTools() {
  return lazyCache.load('quality-tools', './quality-tools-generator')
}

function getPrelaunchValidator() {
  return lazyCache.load('prelaunch', './prelaunch-validator')
}

function getDependencyMonitoringPremium() {
  return lazyCache.load('deps-premium', './dependency-monitoring-premium')
}

function getTelemetry() {
  return lazyCache.load('telemetry', './telemetry')
}

function getErrorReporter() {
  return lazyCache.load('error-reporter', './error-reporter')
}

function getSetupEnhancements() {
  return lazyCache.load('setup-enhancements', './setup-enhancements')
}

module.exports = {
  LazyModuleCache,
  lazyCache,
  getLicensing,
  getSmartStrategy,
  getQualityTools,
  getPrelaunchValidator,
  getDependencyMonitoringPremium,
  getTelemetry,
  getErrorReporter,
  getSetupEnhancements,
}
