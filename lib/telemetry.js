#!/usr/bin/env node

/**
 * Telemetry module for usage tracking (opt-in only)
 *
 * Privacy principles:
 * - Completely opt-in (ENV var or explicit flag)
 * - No personal information collected (no paths, usernames, IPs)
 * - Local storage only (no network calls)
 * - Easy to inspect and delete
 * - Anonymous session IDs
 *
 * Data collected:
 * - Event types (setup_started, setup_completed, setup_failed)
 * - Timestamps
 * - Template selection (custom vs default)
 * - Features used (validate, deps, dry-run, interactive)
 * - Node version and OS platform
 * - Error types (if failed)
 * - Setup duration
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const { REPORTING_LIMITS } = require('../config/constants')

const getTelemetryDir = () =>
  process.env.QAA_TELEMETRY_DIR ||
  path.join(os.homedir(), '.create-qa-architect')
const getTelemetryFile = () => path.join(getTelemetryDir(), 'telemetry.json')
const TELEMETRY_FILE = getTelemetryFile()
const MAX_EVENTS = REPORTING_LIMITS.MAX_TELEMETRY_EVENTS

/**
 * Check if telemetry is enabled
 * Opt-in via environment variable or explicit flag
 */
function isTelemetryEnabled() {
  // Check environment variable
  const envEnabled =
    process.env.QAA_TELEMETRY === 'true' || process.env.QAA_TELEMETRY === '1'

  // Check config file (future: allow persistent opt-in)
  // For now, only ENV var

  return envEnabled
}

/**
 * Generate anonymous session ID
 */
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Ensure telemetry directory exists
 */
function ensureTelemetryDir() {
  const dir = getTelemetryDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  }
}

/**
 * Load existing telemetry data
 */
function loadTelemetryData() {
  try {
    const file = getTelemetryFile()
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    // If corrupted or inaccessible, start fresh
    // Log details for debugging permission or corruption issues
    const errorType =
      error.code === 'EACCES'
        ? 'Permission denied'
        : error.code === 'ENOENT'
          ? 'File not found'
          : error.name === 'SyntaxError'
            ? 'Invalid JSON'
            : 'Read error'

    console.warn(`⚠️  Telemetry data issue (${errorType}), starting fresh`)

    // Provide specific recovery steps for common errors
    if (error.code === 'EACCES') {
      const file = getTelemetryFile()
      console.warn(`   Fix: chmod 600 ${file} or sudo chown $USER ${file}`)
    } else if (error.code === 'ENOSPC') {
      console.warn('   Fix: Free up disk space and try again')
    }

    if (process.env.QAA_DEBUG || process.env.NODE_ENV === 'test') {
      console.log(`Debug: ${error.message}`)
    }
  }

  return {
    version: 1,
    events: [],
  }
}

/**
 * Save telemetry data (with rotation)
 */
function saveTelemetryData(data) {
  try {
    ensureTelemetryDir()
    const file = getTelemetryFile()

    // Rotate: keep only last MAX_EVENTS
    if (data.events.length > MAX_EVENTS) {
      data.events = data.events.slice(-MAX_EVENTS)
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2), {
      mode: 0o600, // Owner read/write only
    })
  } catch (error) {
    // Warn user but don't break the tool - telemetry should never block the main operation
    const file = getTelemetryFile()
    console.warn(`⚠️  Failed to save telemetry data to ${file}`)

    // Provide specific recovery steps for common errors
    if (error.code === 'EACCES') {
      console.warn(
        `   Fix: chmod 600 ${file} or sudo chown $USER ${path.dirname(file)}`
      )
    } else if (error.code === 'ENOSPC') {
      console.warn('   Fix: Free up disk space and try again')
    } else if (error.code === 'EROFS') {
      console.warn('   Fix: File system is read-only. Ensure it is writable.')
    }

    // Only log full error in debug mode
    if (process.env.DEBUG || process.env.QAA_DEBUG) {
      console.error('Telemetry save error:', error.message)
    }
  }
}

/**
 * Record a telemetry event
 *
 * @param {string} eventType - Event type (setup_started, setup_completed, setup_failed)
 * @param {object} metadata - Additional event metadata
 * @param {string} sessionId - Session ID for grouping related events
 */
function recordEvent(eventType, metadata = {}, sessionId = null) {
  if (!isTelemetryEnabled()) {
    return
  }

  try {
    const data = loadTelemetryData()

    const event = {
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || generateSessionId(),
      metadata: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        ...metadata,
      },
    }

    data.events.push(event)
    saveTelemetryData(data)
  } catch (error) {
    // Warn user but don't break the tool - telemetry should never block the main operation
    console.warn(`⚠️  Failed to record telemetry event: ${eventType}`)

    // Provide specific recovery steps for common errors
    if (error.code === 'EACCES') {
      const file = getTelemetryFile()
      console.warn(
        `   Fix: chmod 600 ${file} or sudo chown $USER ${path.dirname(file)}`
      )
    } else if (error.code === 'ENOSPC') {
      console.warn('   Fix: Free up disk space and try again')
    }

    // Only log full error in debug mode
    if (process.env.DEBUG || process.env.QAA_DEBUG) {
      console.error('Telemetry record error:', error.message)
    }
  }
}

/**
 * Create a telemetry session for tracking related events
 */
class TelemetrySession {
  constructor() {
    this.sessionId = generateSessionId()
    this.startTime = Date.now()
    this.enabled = isTelemetryEnabled()
    this.telemetryFile = getTelemetryFile()
  }

  /**
   * Record setup start event
   */
  recordStart(metadata = {}) {
    if (!this.enabled) return

    recordEvent(
      'setup_started',
      {
        ...metadata,
        timestamp: new Date(this.startTime).toISOString(),
      },
      this.sessionId
    )
  }

  /**
   * Record setup completion event
   */
  recordComplete(metadata = {}) {
    if (!this.enabled) return

    const duration = Date.now() - this.startTime

    recordEvent(
      'setup_completed',
      {
        ...metadata,
        durationMs: duration,
        durationSec: Math.round(duration / 1000),
      },
      this.sessionId
    )
  }

  /**
   * Record setup failure event
   */
  recordFailure(error, metadata = {}) {
    if (!this.enabled) return

    const duration = Date.now() - this.startTime

    recordEvent(
      'setup_failed',
      {
        ...metadata,
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: error?.message || 'Unknown error',
        durationMs: duration,
      },
      this.sessionId
    )
  }

  /**
   * Record validation event
   */
  recordValidation(validationType, passed, metadata = {}) {
    if (!this.enabled) return

    recordEvent(
      'validation',
      {
        ...metadata,
        validationType,
        passed,
      },
      this.sessionId
    )
  }
}

/**
 * Get telemetry statistics (for debugging/testing)
 */
function getTelemetryStats() {
  const data = loadTelemetryData()

  const stats = {
    totalEvents: data.events.length,
    eventTypes: {},
    platforms: {},
    nodeVersions: {},
    recentEvents: data.events.slice(-10),
  }

  data.events.forEach(event => {
    // Count event types
    stats.eventTypes[event.eventType] =
      (stats.eventTypes[event.eventType] || 0) + 1

    // Count platforms
    const platform = event.metadata?.platform || 'unknown'
    stats.platforms[platform] = (stats.platforms[platform] || 0) + 1

    // Count Node versions
    const nodeVersion = event.metadata?.nodeVersion || 'unknown'
    stats.nodeVersions[nodeVersion] = (stats.nodeVersions[nodeVersion] || 0) + 1
  })

  return stats
}

/**
 * Clear all telemetry data
 */
function clearTelemetry() {
  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      fs.unlinkSync(TELEMETRY_FILE)
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to clear telemetry:', error.message)
    return false
  }
}

/**
 * Show telemetry status and opt-in instructions
 */
function showTelemetryStatus() {
  const enabled = isTelemetryEnabled()

  console.log('\n📊 Telemetry Status')
  console.log('─'.repeat(50))
  console.log(
    `Status: ${enabled ? '✅ Enabled' : '❌ Disabled (opt-in required)'}`
  )

  if (enabled) {
    const stats = getTelemetryStats()
    console.log(`Events collected: ${stats.totalEvents}`)
    console.log(`Storage: ${TELEMETRY_FILE}`)
  } else {
    console.log('\nTo enable telemetry (opt-in):')
    console.log('  export QAA_TELEMETRY=true')
    console.log('  # or add to ~/.bashrc or ~/.zshrc')
    console.log('\nWhy enable telemetry?')
    console.log('  - Helps improve the tool based on real usage patterns')
    console.log('  - All data stays local (no network calls)')
    console.log('  - No personal information collected')
    console.log(
      '  - Easy to inspect: cat ~/.create-qa-architect/telemetry.json'
    )
    console.log('  - Easy to delete: rm ~/.create-qa-architect/telemetry.json')
  }

  console.log('─'.repeat(50))
}

module.exports = {
  isTelemetryEnabled,
  recordEvent,
  TelemetrySession,
  getTelemetryStats,
  clearTelemetry,
  showTelemetryStatus,
  TELEMETRY_FILE,
}
