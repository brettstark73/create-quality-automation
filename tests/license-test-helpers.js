const crypto = require('crypto')
const {
  buildLicensePayload,
  signPayload,
  hashEmail,
  stableStringify,
} = require('../lib/license-signing')

function createTestKeyPair() {
  return crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
}

function setTestPublicKeyEnv(publicKey) {
  process.env.QAA_LICENSE_PUBLIC_KEY = publicKey
}

function buildSignedLicenseEntry({
  licenseKey,
  tier,
  isFounder = false,
  email,
  issued = new Date().toISOString(),
  privateKey,
}) {
  const emailHash = hashEmail(email)
  const payload = buildLicensePayload({
    licenseKey,
    tier,
    isFounder,
    emailHash,
    issued,
  })
  const signature = signPayload(payload, privateKey)
  return {
    licenseKey,
    tier,
    isFounder,
    issued,
    emailHash,
    payload,
    signature,
  }
}

function buildSignedRegistry(licenses, privateKey) {
  const registrySignature = signPayload(licenses, privateKey)
  const hash = crypto
    .createHash('sha256')
    .update(stableStringify(licenses))
    .digest('hex')
  return {
    _metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      algorithm: 'ed25519',
      keyId: 'test-key',
      registrySignature,
      hash,
    },
    ...licenses,
  }
}

module.exports = {
  createTestKeyPair,
  setTestPublicKeyEnv,
  buildSignedLicenseEntry,
  buildSignedRegistry,
}
