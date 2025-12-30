/**
 * License Validator (user-side)
 *
 * - No Stripe dependencies (secrets stay server-side)
 * - Fetches a signed license registry from a configurable HTTPS endpoint
 * - Caches locally for offline use with graceful fallback
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const {
  buildLicensePayload,
  hashEmail,
  verifyPayload,
  stableStringify,
  loadKeyFromEnv,
} = require('./license-signing')

class LicenseValidator {
  constructor() {
    // Support environment variable override for testing (like telemetry/error-reporter)
    this.licenseDir =
      process.env.QAA_LICENSE_DIR ||
      path.join(os.homedir(), '.create-qa-architect')
    this.licenseFile = path.join(this.licenseDir, 'license.json')
    this.legitimateDBFile = path.join(
      this.licenseDir,
      'legitimate-licenses.json'
    )

    // Allow enterprises to host their own registry
    this.licenseDbUrl =
      process.env.QAA_LICENSE_DB_URL ||
      'https://vibebuildlab.com/api/licenses/qa-architect.json'

    this.licensePublicKey = loadKeyFromEnv(
      process.env.QAA_LICENSE_PUBLIC_KEY,
      process.env.QAA_LICENSE_PUBLIC_KEY_PATH
    )
  }

  normalizeLicenseKey(key) {
    if (typeof key !== 'string') return ''
    return key.trim().toUpperCase()
  }

  ensureLicenseDir() {
    if (!fs.existsSync(this.licenseDir)) {
      fs.mkdirSync(this.licenseDir, { recursive: true })
    }
  }

  /**
   * Initialize license directory and database if needed
   */
  initialize() {
    try {
      this.ensureLicenseDir()

      // Initialize legitimate license database if it doesn't exist
      if (!fs.existsSync(this.legitimateDBFile)) {
        const initialDB = {
          _metadata: {
            version: '1.0',
            created: new Date().toISOString(),
            description:
              'Legitimate license database - populated by webhook/admin',
          },
        }
        fs.writeFileSync(
          this.legitimateDBFile,
          JSON.stringify(initialDB, null, 2)
        )
      }

      return true
    } catch (error) {
      console.error('Failed to initialize license directory:', error.message)
      return false
    }
  }

  /**
   * Load legitimate licenses from the cached database
   */
  loadLegitimateDatabase() {
    try {
      if (fs.existsSync(this.legitimateDBFile)) {
        const data = fs.readFileSync(this.legitimateDBFile, 'utf8')
        const parsed = JSON.parse(data)

        try {
          this.verifyRegistrySignature(parsed)
        } catch (error) {
          console.warn(`⚠️  Cached license database invalid: ${error.message}`)
          return {}
        }

        // Remove metadata for license lookup
        const { _metadata, ...licenses } = parsed
        return licenses
      }
    } catch (error) {
      console.error('Error loading legitimate license database:', error.message)
    }
    return {}
  }

  /**
   * Compute SHA256 hash for integrity checks
   */
  computeSha256(json) {
    return crypto.createHash('sha256').update(json).digest('hex')
  }

  /**
   * Fetch latest legitimate licenses from server (if available)
   */
  async fetchLegitimateDatabase() {
    try {
      this.ensureLicenseDir()
      console.log(
        `🔄 Fetching latest license database from ${this.licenseDbUrl} ...`
      )

      const parsedUrl = new URL(this.licenseDbUrl)
      const isTest = process.argv.join(' ').includes('test')
      if (
        parsedUrl.protocol !== 'https:' &&
        !process.env.QAA_ALLOW_INSECURE_LICENSE_DB &&
        !isTest
      ) {
        throw new Error(
          'license database URL must use HTTPS (set QAA_ALLOW_INSECURE_LICENSE_DB=1 to override)'
        )
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(this.licenseDbUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'create-qa-architect-cli' },
      })
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const database = await response.json()

      if (!database || typeof database !== 'object' || !database._metadata) {
        throw new Error('invalid database format')
      }

      this.verifyRegistrySignature(database)

      // Cache locally for offline use
      fs.writeFileSync(this.legitimateDBFile, JSON.stringify(database, null, 2))
      console.log('✅ License database updated and cached')

      // Remove metadata for license lookup
      const { _metadata, ...licenses } = database
      return licenses
    } catch (error) {
      const isTest = process.argv.join(' ').includes('test')
      const prefix = isTest ? '📋 TEST SCENARIO:' : '⚠️'
      console.log(`${prefix} Database fetch failed: ${error.message}`)
      return this.loadLegitimateDatabase()
    }
  }

  /**
   * Validate license key (fetches latest database, then validates locally)
   */
  async validateLicense(licenseKey, userEmail) {
    try {
      const normalizedKey = this.normalizeLicenseKey(licenseKey)
      // Check if already activated locally
      const localLicense = this.getLocalLicense()
      if (
        localLicense &&
        localLicense.licenseKey === normalizedKey &&
        localLicense.valid
      ) {
        return {
          valid: true,
          tier: localLicense.tier,
          isFounder: localLicense.isFounder || false,
          email: localLicense.email,
          source: 'local_file',
        }
      }

      // Fetch latest legitimate database from server
      const legitimateDB = await this.fetchLegitimateDatabase()

      // If database is empty (no licenses), fail with actionable message
      const licenseInfo = legitimateDB[normalizedKey]
      const hasLicenses = Object.keys(legitimateDB || {}).length > 0

      if (!hasLicenses) {
        return {
          valid: false,
          error:
            'License registry is empty. Please connect to the internet and retry, or ask support to populate your license.',
        }
      }

      if (!licenseInfo) {
        return {
          valid: false,
          error:
            'License key not found. Verify the key and email, or contact support if this was a purchase.',
        }
      }

      // Verify email matches (if specified in database)
      const emailHash = hashEmail(userEmail)
      if (
        emailHash &&
        licenseInfo.emailHash &&
        licenseInfo.emailHash !== emailHash
      ) {
        return {
          valid: false,
          error:
            'Email address does not match the license registration. Please use the email associated with your purchase.',
        }
      }

      const payload = buildLicensePayload({
        licenseKey: normalizedKey,
        tier: licenseInfo.tier,
        isFounder: licenseInfo.isFounder,
        emailHash: licenseInfo.emailHash,
        issued: licenseInfo.issued,
      })

      if (!licenseInfo.signature) {
        return {
          valid: false,
          error: 'License entry missing signature. Please contact support.',
        }
      }

      if (!this.verifySignature(payload, licenseInfo.signature)) {
        return {
          valid: false,
          error:
            'License entry signature verification failed. Please contact support.',
        }
      }

      // License is valid
      console.log(
        `✅ License validated: ${licenseInfo.tier} ${licenseInfo.isFounder ? '(Founder)' : ''}`
      )

      return {
        valid: true,
        tier: licenseInfo.tier,
        isFounder: licenseInfo.isFounder || false,
        customerId: licenseInfo.customerId,
        email: userEmail,
        signature: licenseInfo.signature,
        payload,
        source: 'legitimate_database',
      }
    } catch (error) {
      console.error('License validation error:', error.message)
      return {
        valid: false,
        error:
          'License validation failed due to an internal error. Please try again or contact support.',
      }
    }
  }

  /**
   * Get local license file if it exists
   */
  getLocalLicense() {
    if (fs.existsSync(this.licenseFile)) {
      // Let JSON parse errors propagate to caller for proper error handling
      const license = JSON.parse(fs.readFileSync(this.licenseFile, 'utf8'))
      const normalizedKey = this.normalizeLicenseKey(
        license.licenseKey || license.key
      )

      if (license.payload && license.signature) {
        const isValid = this.verifySignature(license.payload, license.signature)
        return {
          ...license,
          licenseKey: normalizedKey,
          valid: isValid,
        }
      }

      // Legacy format (unsigned) is no longer trusted
      return {
        ...license,
        licenseKey: normalizedKey,
        valid: false,
        tier: license.tier,
        email: license.email,
      }
    }
    return null
  }

  /**
   * Save license locally after successful validation
   */
  saveLicense(licenseData) {
    try {
      this.initialize()

      const licenseRecord = {
        licenseKey: licenseData.licenseKey,
        tier: licenseData.tier,
        isFounder: licenseData.isFounder,
        email: licenseData.email,
        activated: new Date().toISOString(),
        payload: licenseData.payload,
        signature: licenseData.signature,
        source: licenseData.source || 'legitimate_database',
        verifiedAt: new Date().toISOString(),
      }

      if (!licenseRecord.payload || !licenseRecord.signature) {
        return {
          success: false,
          error:
            'Missing license signature payload. Please re-activate online.',
        }
      }

      fs.writeFileSync(this.licenseFile, JSON.stringify(licenseRecord, null, 2))

      console.log('✅ License activated successfully!')
      console.log(`📋 Tier: ${licenseData.tier}`)
      console.log(`🎁 Founder: ${licenseData.isFounder ? 'Yes' : 'No'}`)
      console.log(`📧 Email: ${licenseData.email}`)

      return { success: true }
    } catch (error) {
      console.error('Failed to save license:', error.message)
      return { success: false, error: error.message }
    }
  }

  verifySignature(payload, signature) {
    if (!this.licensePublicKey) {
      return process.env.QAA_DEVELOPER === 'true'
    }
    try {
      return verifyPayload(payload, signature, this.licensePublicKey)
    } catch {
      return false
    }
  }

  verifyRegistrySignature(database) {
    if (process.env.QAA_DEVELOPER === 'true') {
      return true
    }
    if (!this.licensePublicKey) {
      throw new Error('license public key not configured')
    }
    const signature = database?._metadata?.registrySignature
    if (!signature) {
      throw new Error('license database missing registry signature')
    }
    const { _metadata, ...licenses } = database
    const isValid = verifyPayload(licenses, signature, this.licensePublicKey)
    if (!isValid) {
      throw new Error('license database signature verification failed')
    }
    const expectedHash = database?._metadata?.hash
    if (expectedHash) {
      const computed = this.computeSha256(stableStringify(licenses))
      if (computed !== expectedHash) {
        throw new Error('license database hash mismatch')
      }
    }
    return true
  }

  /**
   * Activate license (main user entry point)
   */
  async activateLicense(licenseKey, userEmail) {
    try {
      const normalizedKey = this.normalizeLicenseKey(licenseKey)
      // Validate license key format
      if (
        !normalizedKey.match(
          /^QAA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
        )
      ) {
        return {
          success: false,
          error:
            'Invalid license key format. Expected format: QAA-XXXX-XXXX-XXXX-XXXX',
        }
      }

      // Validate email format
      if (!userEmail || !userEmail.includes('@')) {
        return {
          success: false,
          error: 'Valid email address required for license activation',
        }
      }

      console.log('🔍 Validating license key...')

      // Validate against database
      const validation = await this.validateLicense(licenseKey, userEmail)

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'License validation failed',
        }
      }

      // Save locally
      const saveResult = this.saveLicense({
        licenseKey: normalizedKey,
        tier: validation.tier,
        isFounder: validation.isFounder,
        email: userEmail,
        customerId: validation.customerId,
        source: validation.source,
        payload: validation.payload,
        signature: validation.signature,
      })

      if (saveResult.success) {
        return {
          success: true,
          tier: validation.tier,
          isFounder: validation.isFounder,
        }
      } else {
        return {
          success: false,
          error: 'License validation succeeded but failed to save locally',
        }
      }
    } catch (error) {
      console.error('License activation failed:', error.message)
      return {
        success: false,
        error: `License activation failed: ${error.message}`,
      }
    }
  }

  /**
   * Remove license (for testing)
   */
  removeLicense() {
    try {
      if (fs.existsSync(this.licenseFile)) {
        fs.unlinkSync(this.licenseFile)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

module.exports = { LicenseValidator }
