'use strict'
/* eslint-disable security/detect-non-literal-fs-filename */

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const {
  isTelemetryEnabled,
  TelemetrySession,
  getTelemetryStats,
  clearTelemetry,
  TELEMETRY_FILE,
} = require('../lib/telemetry')

console.log('\n🧪 Testing telemetry module...\n')

// Store original env
const originalEnv = process.env.CQA_TELEMETRY

// Helper to clean up telemetry file
const cleanup = () => {
  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      fs.unlinkSync(TELEMETRY_FILE)
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Test 1: Telemetry disabled by default
console.log('🔍 Test 1: Telemetry disabled by default...')
delete process.env.CQA_TELEMETRY
assert.strictEqual(isTelemetryEnabled(), false)
console.log('  ✅ Telemetry correctly disabled by default')

// Test 2: Telemetry enabled with env var
console.log('🔍 Test 2: Telemetry enabled with env var...')
process.env.CQA_TELEMETRY = 'true'
assert.strictEqual(isTelemetryEnabled(), true)
process.env.CQA_TELEMETRY = '1'
assert.strictEqual(isTelemetryEnabled(), true)
process.env.CQA_TELEMETRY = 'false'
assert.strictEqual(isTelemetryEnabled(), false)
process.env.CQA_TELEMETRY = '0'
assert.strictEqual(isTelemetryEnabled(), false)
console.log('  ✅ Telemetry opt-in via env var works correctly')

// Test 3: Session creation
console.log('🔍 Test 3: Session creation...')
const session = new TelemetrySession()
assert.ok(session.sessionId)
assert.strictEqual(typeof session.sessionId, 'string')
assert.ok(session.startTime)
console.log('  ✅ Session creation works correctly')

// Test 4: No events recorded when disabled
console.log('🔍 Test 4: No events recorded when disabled...')
delete process.env.CQA_TELEMETRY
cleanup()
const disabledSession = new TelemetrySession()
disabledSession.recordStart({ test: 'data' })
disabledSession.recordComplete({ test: 'data' })
assert.strictEqual(fs.existsSync(TELEMETRY_FILE), false)
console.log('  ✅ No events recorded when telemetry disabled')

// Test 5: Events recorded when enabled
console.log('🔍 Test 5: Events recorded when enabled...')
process.env.CQA_TELEMETRY = 'true'
cleanup()
const enabledSession = new TelemetrySession()
enabledSession.recordStart({ mode: 'test' })
enabledSession.recordComplete({ mode: 'test' })

assert.ok(fs.existsSync(TELEMETRY_FILE))
const data = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'))
assert.strictEqual(data.version, 1)
assert.ok(Array.isArray(data.events))
assert.strictEqual(data.events.length, 2)
assert.strictEqual(data.events[0].eventType, 'setup_started')
assert.strictEqual(data.events[1].eventType, 'setup_completed')
console.log('  ✅ Events correctly recorded when telemetry enabled')

// Test 6: Failure events include error info
console.log('🔍 Test 6: Failure events include error info...')
cleanup()
const failureSession = new TelemetrySession()
const error = new Error('Test error')
failureSession.recordFailure(error, { context: 'test' })

const failureData = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'))
assert.strictEqual(failureData.events.length, 1)
assert.strictEqual(failureData.events[0].eventType, 'setup_failed')
assert.strictEqual(failureData.events[0].metadata.errorType, 'Error')
assert.strictEqual(failureData.events[0].metadata.errorMessage, 'Test error')
console.log('  ✅ Failure events include error information')

// Test 7: Events include system metadata
console.log('🔍 Test 7: Events include system metadata...')
cleanup()
const metadataSession = new TelemetrySession()
metadataSession.recordStart()

const metadataData = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'))
const event = metadataData.events[0]
assert.ok(event.metadata.nodeVersion)
assert.ok(event.metadata.platform)
assert.ok(event.metadata.arch)
assert.strictEqual(event.metadata.platform, os.platform())
console.log('  ✅ Events include Node version and platform metadata')

// Test 8: Event rotation
console.log('🔍 Test 8: Event rotation (max 100 events)...')
cleanup()
const rotationSession = new TelemetrySession()
for (let i = 0; i < 110; i++) {
  rotationSession.recordStart({ iteration: i })
}

const rotationData = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'))
assert.ok(rotationData.events.length <= 100)
console.log(
  `  ✅ Event rotation works (kept ${rotationData.events.length}/110 events)`
)

// Test 9: getTelemetryStats
console.log('🔍 Test 9: Telemetry stats aggregation...')
cleanup()
const statsSession = new TelemetrySession()
statsSession.recordStart()
statsSession.recordComplete()
statsSession.recordStart()

const stats = getTelemetryStats()
assert.strictEqual(stats.totalEvents, 3)
assert.strictEqual(stats.eventTypes.setup_started, 2)
assert.strictEqual(stats.eventTypes.setup_completed, 1)
assert.ok(stats.platforms)
assert.ok(stats.nodeVersions)
assert.ok(Array.isArray(stats.recentEvents))
console.log('  ✅ Telemetry stats aggregation works correctly')

// Test 10: clearTelemetry
console.log('🔍 Test 10: Clear telemetry...')
const cleared = clearTelemetry()
assert.strictEqual(cleared, true)
assert.strictEqual(fs.existsSync(TELEMETRY_FILE), false)
console.log('  ✅ Clear telemetry works correctly')

// Test 11: Privacy - no personal information
console.log('🔍 Test 11: Privacy - no personal information collected...')
cleanup()
const privacySession = new TelemetrySession()
privacySession.recordStart({ mode: 'test' })

const privacyData = JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'))
const eventStr = JSON.stringify(privacyData.events[0])

// Check that no personal info is in the event
assert.ok(!eventStr.includes(os.homedir()))
assert.ok(!eventStr.includes(process.cwd()))
assert.ok(!eventStr.includes(os.userInfo().username))
console.log('  ✅ No personal information collected')

// Test 12: Telemetry file location
console.log('🔍 Test 12: Telemetry file location...')
assert.ok(TELEMETRY_FILE.includes(os.homedir()))
assert.ok(TELEMETRY_FILE.includes('.create-quality-automation'))
console.log('  ✅ Telemetry stored in user home directory')

// Test 13: Silent failures
console.log('🔍 Test 13: Silent failures (never throws)...')
delete process.env.CQA_TELEMETRY
assert.doesNotThrow(() => {
  const safeSession = new TelemetrySession()
  safeSession.recordStart()
  safeSession.recordComplete()
  safeSession.recordFailure(new Error('test'))
})
console.log('  ✅ Telemetry never throws errors')

// Cleanup
cleanup()

// Restore original env
if (originalEnv) {
  process.env.CQA_TELEMETRY = originalEnv
} else {
  delete process.env.CQA_TELEMETRY
}

console.log('\n✅ All telemetry tests passed!\n')
