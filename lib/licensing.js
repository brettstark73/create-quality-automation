/**
 * Licensing System for create-quality-automation
 * Handles free/pro/enterprise tier validation
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

// License storage locations
// Support environment variable override for testing (like telemetry/error-reporter)
// Use getter functions to allow env override before module load
function getLicenseDir() {
  return (
    process.env.CQA_LICENSE_DIR ||
    path.join(os.homedir(), '.create-quality-automation')
  )
}

function getLicenseFile() {
  return path.join(getLicenseDir(), 'license.json')
}

// Keep old constants for backward compatibility (but make them dynamic)
Object.defineProperty(exports, 'LICENSE_DIR', {
  get: getLicenseDir,
})
Object.defineProperty(exports, 'LICENSE_FILE', {
  get: getLicenseFile,
})

/**
 * License tiers
 *
 * Standardized to use SCREAMING_SNAKE_CASE for both keys and values
 * for consistency with ErrorCategory and other enums in the codebase.
 */
const LICENSE_TIERS = {
  FREE: 'FREE',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
}

/**
 * Feature definitions by tier
 */
const FEATURES = {
  [LICENSE_TIERS.FREE]: {
    dependencyMonitoring: 'basic',
    languages: ['npm'],
    frameworkGrouping: false,
    customSchedules: false,
    advancedWorkflows: false,
    notifications: false,
    multiRepo: false,
    roadmap: [],
  },
  [LICENSE_TIERS.PRO]: {
    dependencyMonitoring: 'premium', // ✅ PREMIUM-001 IMPLEMENTED
    languages: ['npm'],
    frameworkGrouping: true, // ✅ PREMIUM-001: React, Vue, Angular, Svelte grouping
    customSchedules: false,
    advancedWorkflows: false,
    notifications: false,
    multiRepo: false,
    roadmap: [
      '✅ Framework-aware dependency grouping (React, Next.js, Vue, Angular) - LIVE',
      'Multi-language package monitoring (Python, Rust, Go, more) - Coming Q1 2026',
      'Advanced security audit workflows with custom schedules - Coming Q1 2026',
      'Breaking change detection reports before merging updates - Coming Q2 2026',
    ],
  },
  [LICENSE_TIERS.ENTERPRISE]: {
    dependencyMonitoring: 'premium', // ✅ PREMIUM-001 IMPLEMENTED
    languages: ['npm'],
    frameworkGrouping: true, // ✅ PREMIUM-001: React, Vue, Angular, Svelte grouping
    customSchedules: false,
    advancedWorkflows: false,
    notifications: false,
    multiRepo: false,
    roadmap: [
      '✅ Framework-aware dependency grouping (React, Next.js, Vue, Angular) - LIVE',
      'Multi-language package monitoring (Python, Rust, Go, more) - Coming Q1 2026',
      'Custom notification channels (Slack, Teams, email digests) - Coming Q2 2026',
      'Portfolio-wide dependency analytics and policy enforcement - Coming Q2 2026',
      'Dedicated support response targets with shared runbooks - Coming Q2 2026',
    ],
  },
}

/**
 * Check if user has a valid license file (USER-FACING - NO STRIPE DEPENDENCIES)
 */
function getLicenseInfo() {
  try {
    // Use pure license validator
    const { LicenseValidator } = require('./license-validator')
    const validator = new LicenseValidator()

    const localLicense = validator.getLocalLicense()

    if (!localLicense) {
      return { tier: LICENSE_TIERS.FREE, valid: true }
    }

    // Check if license is valid
    if (!localLicense.valid) {
      return {
        tier: LICENSE_TIERS.FREE,
        valid: true,
        error:
          'License signature verification failed - license may have been tampered with',
      }
    }

    // Check for required fields
    const licenseKey = localLicense.licenseKey || localLicense.key
    if (!licenseKey || !localLicense.email) {
      return {
        tier: LICENSE_TIERS.FREE,
        valid: true,
        error: 'Invalid license format',
      }
    }

    // Check expiration
    if (localLicense.expires && new Date(localLicense.expires) < new Date()) {
      return {
        tier: LICENSE_TIERS.FREE,
        valid: true,
        error: 'License expired',
      }
    }

    // Validate license key format
    if (!validateLicenseKey(licenseKey, localLicense.tier)) {
      return {
        tier: LICENSE_TIERS.FREE,
        valid: true,
        error: 'Invalid license key',
      }
    }

    // Return license info
    return {
      tier: localLicense.tier || LICENSE_TIERS.FREE,
      valid: true,
      email: localLicense.email,
      expires: localLicense.expires,
      isFounder: localLicense.isFounder || false,
      customerId: localLicense.customerId,
    }
  } catch (error) {
    return {
      tier: LICENSE_TIERS.FREE,
      valid: true,
      error: `License read error: ${error.message}`,
    }
  }
}

/**
 * License key validation with Stripe integration
 * Supports both legacy format and new Stripe-generated keys
 */
function validateLicenseKey(key, tier) {
  // New Stripe format: CQA-XXXX-XXXX-XXXX-XXXX
  const stripeFormat = /^CQA-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/

  if (stripeFormat.test(key)) {
    // Stripe-generated key - always valid if properly formatted
    return true
  }

  // Legacy format validation for backward compatibility
  const expectedPrefix = `CQA-${tier.toUpperCase()}-`
  return key.startsWith(expectedPrefix) && key.length > 20
}

/**
 * Verify license signature using the same algorithm as StripeIntegration
 */
function verifyLicenseSignature(payload, signature) {
  try {
    const secret =
      process.env.LICENSE_SIGNING_SECRET || 'cqa-dev-secret-change-in-prod'
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (_error) {
    // If signature verification fails, treat as invalid
    return false
  }
}

/**
 * Check if a specific feature is available for current license
 */
function hasFeature(featureName) {
  const license = getLicenseInfo()
  const tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  return tierFeatures[featureName] || false
}

/**
 * Get the dependency monitoring level for current license
 */
function getDependencyMonitoringLevel() {
  const license = getLicenseInfo()
  const tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  return tierFeatures.dependencyMonitoring
}

/**
 * Get supported languages for current license
 */
function getSupportedLanguages() {
  const license = getLicenseInfo()
  const tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  return tierFeatures.languages
}

/**
 * Display upgrade message for premium features
 */
function showUpgradeMessage(feature) {
  const license = getLicenseInfo()
  const _tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]

  console.log(`\n🔒 ${feature} is a premium feature`)
  console.log(`📊 Current license: ${license.tier.toUpperCase()}`)

  if (license.tier === LICENSE_TIERS.FREE) {
    console.log('\n💎 Upgrade to Pro for premium features:')
    console.log(
      '   • Framework-aware dependency grouping (React, Vue, Angular)'
    )
    console.log('   • Multi-language support (Python, Rust, Ruby)')
    console.log('   • 60%+ reduction in dependency PRs')
    console.log('   • Priority email support')
    console.log('\n💰 Pricing:')
    console.log('   • Pro: $39/month')
    console.log('   • Limited-time founder pricing: $19.50/month')
    console.log('\n🚀 Upgrade now: https://www.aibuilderlab.com/cqa-upgrade')
    console.log(
      '🔑 Activate license: npx create-quality-automation@latest --activate-license'
    )
  } else if (license.tier === LICENSE_TIERS.PRO) {
    console.log('\n🏢 Enterprise tier features:')
    console.log('   • Everything in Pro')
    console.log('   • Advanced security workflows')
    console.log('   • Priority support (24h response)')
    console.log('   • Custom integrations')
    console.log('\n💰 Pricing: $197/month')
    console.log('\n🏢 Upgrade: https://www.aibuilderlab.com/cqa-enterprise')
  }
}

/**
 * Save license information (for testing or license activation)
 */
function saveLicense(tier, key, email, expires = null) {
  try {
    const licenseDir = getLicenseDir()
    const licenseFile = getLicenseFile()

    if (!fs.existsSync(licenseDir)) {
      fs.mkdirSync(licenseDir, { recursive: true })
    }

    const licenseData = {
      tier,
      key,
      email,
      expires,
      activated: new Date().toISOString(),
    }

    fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Save license information with signature validation data
 */
function saveLicenseWithSignature(tier, key, email, validation) {
  try {
    const licenseDir = getLicenseDir()
    const licenseFile = getLicenseFile()

    if (!fs.existsSync(licenseDir)) {
      fs.mkdirSync(licenseDir, { recursive: true })
    }

    const licenseData = {
      tier,
      licenseKey: key, // ✅ Changed from 'key' to 'licenseKey' to match StripeIntegration
      email,
      expires: validation.expires,
      activated: new Date().toISOString(),
      customerId: validation.customerId,
      isFounder: validation.isFounder,
      // Include validation payload and signature for security
      payload: validation.payload, // ✅ Changed from 'validationPayload' to 'payload'
      signature: validation.signature, // ✅ Changed from 'validationSignature' to 'signature'
      issued: validation.issued,
    }

    fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Remove license (for testing)
 */
function removeLicense() {
  try {
    const licenseFile = getLicenseFile()

    if (fs.existsSync(licenseFile)) {
      fs.unlinkSync(licenseFile)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Activate license (USER-FACING - NO STRIPE DEPENDENCIES)
 */
async function activateLicense(licenseKey, email) {
  try {
    // Use pure license validator (no Stripe dependencies)
    const { LicenseValidator } = require('./license-validator')
    const validator = new LicenseValidator()

    // Initialize license directory/database
    validator.initialize()

    // Activate license using local database validation only
    return await validator.activateLicense(licenseKey, email)
  } catch (error) {
    return {
      success: false,
      error: `License activation failed: ${error.message}. Please contact support if the issue persists.`,
    }
  }
}

/**
 * Add a legitimate license key (admin function - uses local database)
 */
async function addLegitimateKey(
  licenseKey,
  customerId,
  tier,
  isFounder = false,
  purchaseEmail = null
) {
  try {
    // Use the same license directory as the CLI
    const licenseDir =
      process.env.CQA_LICENSE_DIR ||
      path.join(os.homedir(), '.create-quality-automation')
    const legitimateDBFile = path.join(licenseDir, 'legitimate-licenses.json')

    // Ensure directory exists
    if (!fs.existsSync(licenseDir)) {
      fs.mkdirSync(licenseDir, { recursive: true })
    }

    // Load existing database
    let database = {}
    if (fs.existsSync(legitimateDBFile)) {
      try {
        database = JSON.parse(fs.readFileSync(legitimateDBFile, 'utf8'))
      } catch (_error) {
        console.error(
          'Warning: Could not parse existing database, creating new one'
        )
      }
    }

    // Initialize metadata if needed
    if (!database._metadata) {
      database._metadata = {
        version: '1.0',
        created: new Date().toISOString(),
        description: 'Legitimate license database - populated by admin/webhook',
      }
    }

    // Add license
    database[licenseKey] = {
      customerId,
      tier,
      isFounder,
      email: purchaseEmail,
      addedDate: new Date().toISOString(),
      addedBy: 'admin_tool',
    }

    // Update metadata
    database._metadata.lastUpdate = new Date().toISOString()
    database._metadata.totalLicenses = Object.keys(database).length - 1 // Exclude metadata

    // Calculate SHA256 checksum for integrity verification (MANDATORY)
    const { _metadata, ...licensesOnly } = database
    const sha256 = crypto
      .createHash('sha256')
      .update(JSON.stringify(licensesOnly))
      .digest('hex')
    database._metadata.sha256 = sha256

    // Save database
    fs.writeFileSync(legitimateDBFile, JSON.stringify(database, null, 2))

    console.log(`✅ Added legitimate license: ${licenseKey}`)
    console.log(`   Customer: ${customerId}`)
    console.log(`   Tier: ${tier}`)
    console.log(`   Founder: ${isFounder ? 'Yes' : 'No'}`)
    if (purchaseEmail) {
      console.log(`   Purchase Email: ${purchaseEmail}`)
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Interactive license activation prompt
 */
async function promptLicenseActivation() {
  const readline = require('readline')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    console.log('\n🔑 License Activation')
    console.log(
      'Enter your license key from the purchase confirmation email.\n'
    )

    rl.question('License key (CQA-XXXX-XXXX-XXXX-XXXX): ', licenseKey => {
      if (!licenseKey.trim()) {
        console.log('❌ License key required')
        rl.close()
        resolve({ success: false })
        return
      }

      rl.question('Email address: ', async email => {
        if (!email.trim()) {
          console.log('❌ Email address required')
          rl.close()
          resolve({ success: false })
          return
        }

        rl.close()

        const result = await activateLicense(licenseKey.trim(), email.trim())

        if (
          !result.success &&
          result.error &&
          result.error.includes('not found')
        ) {
          console.log('\n📞 License activation assistance:')
          console.log(
            '   If you purchased this license, please contact support at:'
          )
          console.log('   Email: support@aibuilderlab.com')
          console.log(
            '   Include your license key and purchase email for verification.'
          )
        }

        resolve(result)
      })
    })
  })
}

/**
 * Display current license status
 */
function showLicenseStatus() {
  const license = getLicenseInfo()

  console.log('\n📋 License Status:')
  console.log(`   Tier: ${license.tier.toUpperCase()}`)

  if (license.email) {
    console.log(`   Email: ${license.email}`)
  }

  if (license.expires) {
    console.log(`   Expires: ${license.expires}`)
  }

  if (license.error) {
    console.log(`   ⚠️  Issue: ${license.error}`)
  }

  console.log('\n🎯 Available Features:')
  const features = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  console.log(`   Dependency Monitoring: ${features.dependencyMonitoring}`)
  console.log(`   Languages: ${features.languages.join(', ')}`)
  console.log(
    `   Framework Grouping: ${features.frameworkGrouping ? '✅' : '❌'}`
  )
  console.log(
    `   Advanced Workflows: ${features.advancedWorkflows ? '✅' : '❌'}`
  )

  if (features.roadmap && features.roadmap.length) {
    console.log('\n🛠️ Upcoming (beta roadmap):')
    features.roadmap.forEach(item => console.log(`   - ${item}`))
  }
}

module.exports = {
  LICENSE_TIERS,
  FEATURES,
  getLicenseInfo,
  hasFeature,
  getDependencyMonitoringLevel,
  getSupportedLanguages,
  showUpgradeMessage,
  saveLicense,
  saveLicenseWithSignature,
  removeLicense,
  showLicenseStatus,
  activateLicense,
  promptLicenseActivation,
  verifyLicenseSignature,
  LicenseValidator: require('./license-validator').LicenseValidator,
  addLegitimateKey,
}
