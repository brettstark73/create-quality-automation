'use strict'

const crypto = require('crypto')

// TD15 fix: Single source of truth for license key format validation
const LICENSE_KEY_PATTERN =
  /^QAA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

/**
 * Deterministic JSON stringify with sorted keys for signature verification.
 * TD13 fix: Added circular reference protection using WeakSet.
 */
function stableStringify(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  // TD13 fix: Detect circular references to prevent stack overflow
  if (seen.has(value)) {
    throw new Error('Circular reference detected in payload - cannot serialize')
  }
  seen.add(value)

  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item, seen)).join(',')}]`
  }
  const keys = Object.keys(value).sort()
  const entries = keys.map(
    key => `${JSON.stringify(key)}:${stableStringify(value[key], seen)}`
  )
  return `{${entries.join(',')}}`
}

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null
  const normalized = email.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function hashEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

/**
 * Build a license payload for signing/verification.
 * TD14 fix: Added input validation to prevent signature mismatches from invalid data.
 */
function buildLicensePayload({
  licenseKey,
  tier,
  isFounder,
  emailHash,
  issued,
}) {
  // TD14 fix: Validate required fields to catch issues early
  if (!licenseKey || typeof licenseKey !== 'string') {
    throw new Error('licenseKey is required and must be a string')
  }
  if (!tier || typeof tier !== 'string') {
    throw new Error('tier is required and must be a string')
  }
  if (!issued || typeof issued !== 'string') {
    throw new Error('issued is required and must be a string')
  }

  const payload = {
    licenseKey,
    tier,
    isFounder: Boolean(isFounder),
    issued,
  }
  if (emailHash) {
    payload.emailHash = emailHash
  }
  return payload
}

function signPayload(payload, privateKey) {
  const data = Buffer.from(stableStringify(payload))
  const signature = crypto.sign(null, data, privateKey)
  return signature.toString('base64')
}

function verifyPayload(payload, signature, publicKey) {
  const data = Buffer.from(stableStringify(payload))
  return crypto.verify(null, data, publicKey, Buffer.from(signature, 'base64'))
}

function loadKeyFromEnv(envValue, envPathValue) {
  if (envValue) return envValue
  if (envPathValue) {
    const fs = require('fs')
    if (fs.existsSync(envPathValue)) {
      return fs.readFileSync(envPathValue, 'utf8')
    }
  }
  return null
}

module.exports = {
  LICENSE_KEY_PATTERN,
  stableStringify,
  normalizeEmail,
  hashEmail,
  buildLicensePayload,
  signPayload,
  verifyPayload,
  loadKeyFromEnv,
}
