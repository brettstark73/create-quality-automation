'use strict'

const crypto = require('crypto')

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`
  }
  const keys = Object.keys(value).sort()
  const entries = keys.map(
    key => `${JSON.stringify(key)}:${stableStringify(value[key])}`
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

function buildLicensePayload({
  licenseKey,
  tier,
  isFounder,
  emailHash,
  issued,
}) {
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
  stableStringify,
  normalizeEmail,
  hashEmail,
  buildLicensePayload,
  signPayload,
  verifyPayload,
  loadKeyFromEnv,
}
