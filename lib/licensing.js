/**
 * Licensing System for create-quality-automation
 * Handles free/pro/enterprise tier validation
 */

/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-object-injection */

const fs = require('fs')
const path = require('path')
const os = require('os')

// License storage locations
const LICENSE_DIR = path.join(os.homedir(), '.create-quality-automation')
const LICENSE_FILE = path.join(LICENSE_DIR, 'license.json')

/**
 * License tiers
 */
const LICENSE_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
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
  },
  [LICENSE_TIERS.PRO]: {
    dependencyMonitoring: 'advanced',
    languages: ['npm', 'pip', 'cargo'],
    frameworkGrouping: true,
    customSchedules: true,
    advancedWorkflows: true,
    notifications: false,
    multiRepo: false,
  },
  [LICENSE_TIERS.ENTERPRISE]: {
    dependencyMonitoring: 'enterprise',
    languages: ['npm', 'pip', 'cargo', 'gomod', 'composer'],
    frameworkGrouping: true,
    customSchedules: true,
    advancedWorkflows: true,
    notifications: true,
    multiRepo: true,
  },
}

/**
 * Check if user has a valid license file
 */
function getLicenseInfo() {
  try {
    if (!fs.existsSync(LICENSE_FILE)) {
      return { tier: LICENSE_TIERS.FREE, valid: true }
    }

    const licenseData = JSON.parse(fs.readFileSync(LICENSE_FILE, 'utf8'))

    // Validate license structure
    if (!licenseData.tier || !licenseData.key || !licenseData.email) {
      return {
        tier: LICENSE_TIERS.FREE,
        valid: true,
        error: 'Invalid license format',
      }
    }

    // Check expiration
    if (licenseData.expires && new Date(licenseData.expires) < new Date()) {
      return { tier: LICENSE_TIERS.FREE, valid: true, error: 'License expired' }
    }

    // Basic key validation (in real implementation, this would call a license server)
    if (validateLicenseKey(licenseData.key, licenseData.tier)) {
      return {
        tier: licenseData.tier,
        valid: true,
        email: licenseData.email,
        expires: licenseData.expires,
      }
    } else {
      return {
        tier: LICENSE_TIERS.FREE,
        valid: true,
        error: 'Invalid license key',
      }
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
 * Basic license key validation (simplified for demo)
 * In production, this would validate against a license server
 */
function validateLicenseKey(key, tier) {
  // Simplified validation - in production use proper cryptographic verification
  const expectedPrefix = `CQA-${tier.toUpperCase()}-`
  return key.startsWith(expectedPrefix) && key.length > 20
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

  console.log(`\n🔒 ${feature} is a premium feature`)
  console.log(`📊 Current license: ${license.tier.toUpperCase()}`)

  if (license.tier === LICENSE_TIERS.FREE) {
    console.log('💰 Upgrade to Pro for advanced dependency monitoring:')
    console.log('   • Framework-aware package grouping (React, Next.js, Vue)')
    console.log('   • Multi-language support (Python, Rust, Go)')
    console.log('   • Advanced security workflows')
    console.log('   • Custom update schedules')
    console.log('\n🚀 Get Pro: https://create-quality-automation.dev/pro')
  } else if (license.tier === LICENSE_TIERS.PRO) {
    console.log('💼 Upgrade to Enterprise for:')
    console.log('   • Custom notification channels (Slack, Teams)')
    console.log('   • Multi-repository management')
    console.log('   • Advanced reporting and analytics')
    console.log('   • Priority support')
    console.log(
      '\n🏢 Get Enterprise: https://create-quality-automation.dev/enterprise'
    )
  }
}

/**
 * Save license information (for testing or license activation)
 */
function saveLicense(tier, key, email, expires = null) {
  try {
    if (!fs.existsSync(LICENSE_DIR)) {
      fs.mkdirSync(LICENSE_DIR, { recursive: true })
    }

    const licenseData = {
      tier,
      key,
      email,
      expires,
      activated: new Date().toISOString(),
    }

    fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData, null, 2))
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
    if (fs.existsSync(LICENSE_FILE)) {
      fs.unlinkSync(LICENSE_FILE)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
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
  removeLicense,
  showLicenseStatus,
}
