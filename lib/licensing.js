/**
 * Licensing System for create-qa-architect
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
    process.env.QAA_LICENSE_DIR ||
    path.join(os.homedir(), '.create-qa-architect')
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
 *
 * Pricing (effective Jan 15, 2026 - founder pricing retired):
 * - FREE: $0 (Hobby/OSS - capped)
 * - PRO: $59/mo or $590/yr (Solo Devs/Small Teams)
 * - TEAM: $15/user/mo, 5-seat minimum (Organizations)
 * - ENTERPRISE: $249/mo annual + $499 onboarding (Large Orgs)
 */
const LICENSE_TIERS = {
  FREE: 'FREE',
  PRO: 'PRO',
  TEAM: 'TEAM',
  ENTERPRISE: 'ENTERPRISE',
}

/**
 * Feature definitions by tier
 *
 * FREE: Hobby/OSS - capped usage, basic quality automation
 * PRO: Solo devs/small teams - unlimited, full features
 * TEAM: Organizations - per-seat, shared policies
 * ENTERPRISE: Large orgs - SSO, compliance, SLA
 */
const FEATURES = {
  [LICENSE_TIERS.FREE]: {
    // Caps (enforced in setup.js and CLI)
    maxPrivateRepos: 1,
    maxDependencyPRsPerMonth: 10,
    maxPrePushRunsPerMonth: 50,
    // Features
    dependencyMonitoring: 'basic',
    languages: ['npm'], // JS/TS only
    frameworkGrouping: false,
    smartTestStrategy: false, // ❌ PRO feature
    typescriptProtection: false, // ❌ PRO feature (moved from FREE)
    securityScanning: false, // ❌ PRO feature - Gitleaks, ESLint security
    projectTypeDetection: false,
    customSchedules: false,
    advancedWorkflows: false,
    notifications: false,
    multiRepo: false,
    roadmap: [
      '✅ ESLint, Prettier, Stylelint configuration',
      '✅ Basic Husky pre-commit hooks',
      '✅ Basic npm dependency monitoring (10 PRs/month)',
      '⚠️ Limited: 1 private repo, JS/TS only',
      '❌ No security scanning (Gitleaks, ESLint security)',
      '❌ No Smart Test Strategy',
    ],
  },
  [LICENSE_TIERS.PRO]: {
    // No caps - unlimited
    maxPrivateRepos: Infinity,
    maxDependencyPRsPerMonth: Infinity,
    maxPrePushRunsPerMonth: Infinity,
    // Features
    dependencyMonitoring: 'premium',
    languages: ['npm', 'python', 'rust', 'ruby'], // Multi-language
    frameworkGrouping: true, // React, Vue, Angular, Svelte grouping
    smartTestStrategy: true, // ✅ KEY DIFFERENTIATOR: 70% faster pre-push
    typescriptProtection: true, // ✅ tests/tsconfig.json generation
    securityScanning: true, // ✅ Gitleaks + ESLint security rules
    projectTypeDetection: true, // CLI, Web, SaaS, API, Library, Docs
    advancedSecurity: true, // Rate limits, stricter audits
    customSchedules: false,
    advancedWorkflows: false,
    notifications: false,
    multiRepo: false,
    roadmap: [
      '✅ Unlimited repos and runs',
      '✅ Smart Test Strategy (70% faster pre-push validation)',
      '✅ Security scanning (Gitleaks + ESLint security rules)',
      '✅ TypeScript production protection',
      '✅ Multi-language (Python, Rust, Ruby)',
      '✅ Framework-aware dependency grouping',
      '✅ Email support (24-48h response)',
      '🔄 Performance budgets - Coming Q1 2026',
    ],
  },
  [LICENSE_TIERS.TEAM]: {
    // Per-seat model (5-seat minimum)
    minSeats: 5,
    maxPrivateRepos: Infinity,
    maxDependencyPRsPerMonth: Infinity,
    maxPrePushRunsPerMonth: Infinity,
    // All PRO features plus:
    dependencyMonitoring: 'premium',
    languages: ['npm', 'python', 'rust', 'ruby'],
    frameworkGrouping: true,
    smartTestStrategy: true,
    typescriptProtection: true,
    securityScanning: true,
    projectTypeDetection: true,
    advancedSecurity: true,
    // Team-specific
    perSeatLicensing: true,
    sharedOrgQuota: true,
    teamPolicies: true, // Team-wide config policies
    roleBasedAccess: true,
    teamAuditLog: true, // Local audit log
    slackAlerts: true, // Slack/email alerts for failures
    customSchedules: true,
    advancedWorkflows: true,
    notifications: true,
    multiRepo: true,
    roadmap: [
      '✅ All PRO features included',
      '✅ Per-seat licensing (5-seat minimum)',
      '✅ Shared org quota & usage reporting',
      '✅ Team-wide configuration policies',
      '✅ Slack/email alerts for failures',
      '✅ Team audit log',
      '✅ Priority support (business hours)',
    ],
  },
  [LICENSE_TIERS.ENTERPRISE]: {
    // Annual only + onboarding
    annualOnly: true,
    onboardingFee: 499,
    maxPrivateRepos: Infinity,
    maxDependencyPRsPerMonth: Infinity,
    maxPrePushRunsPerMonth: Infinity,
    // All TEAM features plus:
    dependencyMonitoring: 'enterprise',
    languages: ['npm', 'python', 'rust', 'ruby', 'go', 'java'],
    frameworkGrouping: true,
    smartTestStrategy: true,
    typescriptProtection: true,
    securityScanning: true,
    projectTypeDetection: true,
    advancedSecurity: true,
    perSeatLicensing: true,
    sharedOrgQuota: true,
    teamPolicies: true,
    roleBasedAccess: true,
    teamAuditLog: true,
    slackAlerts: true,
    customSchedules: true,
    advancedWorkflows: true,
    notifications: true,
    multiRepo: true,
    // Enterprise-specific
    ssoIntegration: true, // SSO/SAML
    scimReady: true,
    customRiskPatterns: true, // Custom Smart Test Strategy patterns
    customDependencyPolicies: true, // Deny/allow lists, license classes
    webhookBilling: true,
    auditLogsExport: true,
    dataRetentionControls: true,
    compliancePack: true,
    dedicatedTAM: true,
    incidentSLA: true, // 24×5 support
    onPremOption: true, // Optional on-prem license server
    roadmap: [
      '✅ All TEAM features included',
      '✅ SSO/SAML integration',
      '✅ Custom risk patterns for Smart Test Strategy',
      '✅ Custom dependency policies (deny/allow, license classes)',
      '✅ Audit logs export & data retention controls',
      '✅ Compliance pack (SOC2, GDPR ready)',
      '✅ Dedicated TAM + 24×5 support with SLA',
      '✅ Optional on-prem license server',
    ],
  },
}

/**
 * Check if developer/owner mode is enabled
 * Allows the tool creator to use all features without a license
 */
function isDeveloperMode() {
  // Check environment variable
  if (process.env.QAA_DEVELOPER === 'true') {
    return true
  }

  // Check for marker file in license directory
  try {
    const developerMarkerFile = path.join(getLicenseDir(), '.cqa-developer')
    if (fs.existsSync(developerMarkerFile)) {
      return true
    }
  } catch {
    // Ignore errors checking for marker file
  }

  return false
}

/**
 * Check if user has a valid license file (USER-FACING - NO STRIPE DEPENDENCIES)
 */
function getLicenseInfo() {
  try {
    // Developer/owner bypass - full PRO access without license
    if (isDeveloperMode()) {
      return {
        tier: LICENSE_TIERS.PRO,
        valid: true,
        email: 'developer@localhost',
        isDeveloper: true,
      }
    }

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
  // New Stripe format: QAA-XXXX-XXXX-XXXX-XXXX
  const stripeFormat = /^QAA-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/

  if (stripeFormat.test(key)) {
    // Stripe-generated key - always valid if properly formatted
    return true
  }

  // Legacy format validation for backward compatibility
  const expectedPrefix = `QAA-${tier.toUpperCase()}-`
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
  } catch {
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
    console.log('\n🚀 Upgrade to PRO')
    console.log('')
    console.log('   💰 $59/month  or  $590/year (save $118)')
    console.log('')
    console.log('   ✅ Unlimited repos, LOC, and runs')
    console.log('   ✅ Smart Test Strategy (70% faster pre-push)')
    console.log('   ✅ Security scanning (Gitleaks + ESLint security)')
    console.log('   ✅ TypeScript production protection')
    console.log('   ✅ Multi-language (Python, Rust, Ruby)')
    console.log('   ✅ Framework-aware dependency grouping')
    console.log('   ✅ Email support (24-48h response)')
    console.log('')
    console.log('   🎁 Start 14-day free trial - no credit card required')
    console.log('')
    console.log('🚀 Upgrade: https://vibebuildlab.com/qaa')
    console.log(
      '🔑 Activate: npx create-qa-architect@latest --activate-license'
    )
  } else if (license.tier === LICENSE_TIERS.PRO) {
    console.log('\n👥 Upgrade to TEAM')
    console.log('')
    console.log(
      '   💰 $15/user/month (5-seat min)  or  $150/user/year (save $30/user)'
    )
    console.log('')
    console.log('   ✅ All PRO features included')
    console.log('   ✅ Per-seat licensing for your org')
    console.log('   ✅ Shared quota & usage reporting')
    console.log('   ✅ Team-wide configuration policies')
    console.log('   ✅ Slack/email alerts for failures')
    console.log('   ✅ Priority support (business hours)')
    console.log('')
    console.log('👥 Upgrade: https://vibebuildlab.com/qaa/team')
  } else if (license.tier === LICENSE_TIERS.TEAM) {
    console.log('\n🏢 Upgrade to ENTERPRISE - $249/month (annual) + onboarding')
    console.log('')
    console.log('   ✅ All TEAM features included')
    console.log('   ✅ SSO/SAML integration')
    console.log('   ✅ Custom risk patterns & dependency policies')
    console.log('   ✅ Audit logs export & compliance pack')
    console.log('   ✅ Dedicated TAM + 24×5 support with SLA')
    console.log('')
    console.log('🏢 Contact: enterprise@vibebuildlab.com')
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
      process.env.QAA_LICENSE_DIR ||
      path.join(os.homedir(), '.create-qa-architect')
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
      } catch {
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

    rl.question('License key (QAA-XXXX-XXXX-XXXX-XXXX): ', licenseKey => {
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
 * Enable developer mode by creating the marker file
 */
function enableDeveloperMode() {
  try {
    const licenseDir = getLicenseDir()
    const developerMarkerFile = path.join(licenseDir, '.cqa-developer')

    if (!fs.existsSync(licenseDir)) {
      fs.mkdirSync(licenseDir, { recursive: true })
    }

    fs.writeFileSync(
      developerMarkerFile,
      `# QAA Developer Mode\n# Created: ${new Date().toISOString()}\n# This file grants full PRO access for development purposes.\n`
    )

    console.log('✅ Developer mode enabled')
    console.log(`   Marker file: ${developerMarkerFile}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Disable developer mode by removing the marker file
 */
function disableDeveloperMode() {
  try {
    const developerMarkerFile = path.join(getLicenseDir(), '.cqa-developer')

    if (fs.existsSync(developerMarkerFile)) {
      fs.unlinkSync(developerMarkerFile)
    }

    console.log('✅ Developer mode disabled')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// FREE TIER CAP ENFORCEMENT
// ============================================================================

/**
 * Get the path to the usage tracking file
 */
function getUsageFile() {
  return path.join(getLicenseDir(), 'usage.json')
}

/**
 * Load current usage data
 */
function loadUsage() {
  try {
    const usageFile = getUsageFile()
    if (fs.existsSync(usageFile)) {
      const data = JSON.parse(fs.readFileSync(usageFile, 'utf8'))

      // Check if we need to reset monthly counters
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      if (data.month !== currentMonth) {
        // New month - reset monthly counters
        return {
          month: currentMonth,
          prePushRuns: 0,
          dependencyPRs: 0,
          repos: data.repos || [],
        }
      }

      return data
    }
  } catch {
    // Ignore errors reading usage file
  }

  // Default usage data
  const now = new Date()
  return {
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    prePushRuns: 0,
    dependencyPRs: 0,
    repos: [],
  }
}

/**
 * Save usage data
 */
function saveUsage(usage) {
  try {
    const licenseDir = getLicenseDir()
    if (!fs.existsSync(licenseDir)) {
      fs.mkdirSync(licenseDir, { recursive: true })
    }
    fs.writeFileSync(getUsageFile(), JSON.stringify(usage, null, 2))
    return true
  } catch {
    return false
  }
}

/**
 * Check if usage is within FREE tier caps
 * Returns { allowed: boolean, reason?: string, usage: object, caps: object }
 */
function checkUsageCaps(operation = 'general') {
  const license = getLicenseInfo()

  // Non-FREE tiers have no caps
  if (license.tier !== LICENSE_TIERS.FREE) {
    return { allowed: true, usage: {}, caps: {} }
  }

  const caps = FEATURES[LICENSE_TIERS.FREE]
  const usage = loadUsage()

  const result = {
    allowed: true,
    usage: {
      prePushRuns: usage.prePushRuns,
      dependencyPRs: usage.dependencyPRs,
      repos: usage.repos || [],
      repoCount: (usage.repos || []).length,
    },
    caps: {
      maxPrePushRunsPerMonth: caps.maxPrePushRunsPerMonth,
      maxDependencyPRsPerMonth: caps.maxDependencyPRsPerMonth,
      maxPrivateRepos: caps.maxPrivateRepos,
    },
  }

  // Check specific cap based on operation
  if (operation === 'pre-push') {
    if (usage.prePushRuns >= caps.maxPrePushRunsPerMonth) {
      result.allowed = false
      result.reason = `FREE tier limit reached: ${usage.prePushRuns}/${caps.maxPrePushRunsPerMonth} pre-push runs this month`
    }
  } else if (operation === 'dependency-pr') {
    if (usage.dependencyPRs >= caps.maxDependencyPRsPerMonth) {
      result.allowed = false
      result.reason = `FREE tier limit reached: ${usage.dependencyPRs}/${caps.maxDependencyPRsPerMonth} dependency PRs this month`
    }
  } else if (operation === 'repo') {
    if (usage.repos.length >= caps.maxPrivateRepos) {
      result.allowed = false
      result.reason = `FREE tier limit reached: ${usage.repos.length}/${caps.maxPrivateRepos} private repos`
    }
  }

  return result
}

/**
 * Increment usage counter for an operation
 */
function incrementUsage(operation, amount = 1, repoId = null) {
  const license = getLicenseInfo()

  // Non-FREE tiers don't track usage
  if (license.tier !== LICENSE_TIERS.FREE) {
    return { success: true }
  }

  const usage = loadUsage()

  if (operation === 'pre-push') {
    usage.prePushRuns += amount
  } else if (operation === 'dependency-pr') {
    usage.dependencyPRs += amount
  } else if (operation === 'repo' && repoId) {
    if (!usage.repos.includes(repoId)) {
      usage.repos.push(repoId)
    }
  }

  saveUsage(usage)
  return { success: true, usage }
}

/**
 * Get usage summary for display
 */
function getUsageSummary() {
  const license = getLicenseInfo()
  const usage = loadUsage()
  const caps = FEATURES[LICENSE_TIERS.FREE]

  if (license.tier !== LICENSE_TIERS.FREE) {
    return {
      tier: license.tier,
      unlimited: true,
    }
  }

  return {
    tier: license.tier,
    unlimited: false,
    month: usage.month,
    prePushRuns: {
      used: usage.prePushRuns,
      limit: caps.maxPrePushRunsPerMonth,
      remaining: Math.max(0, caps.maxPrePushRunsPerMonth - usage.prePushRuns),
    },
    dependencyPRs: {
      used: usage.dependencyPRs,
      limit: caps.maxDependencyPRsPerMonth,
      remaining: Math.max(
        0,
        caps.maxDependencyPRsPerMonth - usage.dependencyPRs
      ),
    },
    repos: {
      used: usage.repos.length,
      limit: caps.maxPrivateRepos,
      remaining: Math.max(0, caps.maxPrivateRepos - usage.repos.length),
    },
  }
}

/**
 * Display current license status
 */
function showLicenseStatus() {
  const license = getLicenseInfo()

  console.log('\n📋 License Status:')
  if (license.isDeveloper) {
    console.log('   Mode: 🛠️  DEVELOPER (full PRO access)')
  }
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

  // Show caps and current usage for FREE tier
  if (license.tier === LICENSE_TIERS.FREE) {
    const usage = getUsageSummary()
    console.log('\n📊 Usage This Month:')
    console.log(
      `   Pre-push Runs: ${usage.prePushRuns.used}/${usage.prePushRuns.limit} (${usage.prePushRuns.remaining} remaining)`
    )
    console.log(
      `   Dependency PRs: ${usage.dependencyPRs.used}/${usage.dependencyPRs.limit} (${usage.dependencyPRs.remaining} remaining)`
    )
    console.log(`   Private Repos: ${usage.repos.used}/${usage.repos.limit}`)
  } else {
    console.log(`   Repos/Runs: Unlimited`)
  }

  console.log(`   Dependency Monitoring: ${features.dependencyMonitoring}`)
  console.log(`   Languages: ${features.languages.join(', ')}`)
  console.log(
    `   Security Scanning: ${features.securityScanning ? '✅' : '❌'}`
  )
  console.log(
    `   Smart Test Strategy: ${features.smartTestStrategy ? '✅' : '❌'}`
  )
  console.log(
    `   Framework Grouping: ${features.frameworkGrouping ? '✅' : '❌'}`
  )
  console.log(
    `   Advanced Workflows: ${features.advancedWorkflows ? '✅' : '❌'}`
  )

  if (features.roadmap && features.roadmap.length) {
    console.log('\n📦 Your Plan Features:')
    features.roadmap.forEach(item => console.log(`   ${item}`))
  }

  // Show upgrade path
  if (license.tier === LICENSE_TIERS.FREE) {
    console.log('\n💡 Upgrade to PRO for unlimited access + security scanning')
    console.log('   → https://vibebuildlab.com/qaa')
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
  // Developer mode functions
  isDeveloperMode,
  enableDeveloperMode,
  disableDeveloperMode,
  // Usage tracking and cap enforcement (FREE tier)
  checkUsageCaps,
  incrementUsage,
  getUsageSummary,
}
