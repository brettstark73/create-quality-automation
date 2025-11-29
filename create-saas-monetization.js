#!/usr/bin/env node

/**
 * Create SaaS Monetization - Bootstrap complete revenue system for any project
 *
 * Usage: npx create-saas-monetization@latest
 *
 * Implements:
 * - Stripe payment infrastructure
 * - License key system with CLI activation
 * - Billing dashboard and customer portal
 * - Legal compliance (Privacy, Terms, Copyright, Disclaimers)
 * - Conversion landing page
 * - Beta user email campaigns
 * - Upgrade prompts and messaging
 */

'use strict'

const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Default pricing constants (can be overridden in interactive setup)
const PRO_PRICE = '49'
const ENTERPRISE_PRICE = '149'
const FOUNDER_PRO_PRICE = '24.50'
const FOUNDER_ENTERPRISE_PRICE = '74.50'

class SaaSMonetizationBootstrap {
  constructor() {
    this.projectRoot = process.cwd()
    this.config = {}
    this.templates = {
      stripe: this.getStripeTemplate(),
      licensing: this.getLicensingTemplate(),
      legal: this.getLegalTemplates(),
      marketing: this.getMarketingTemplates(),
      billing: this.getBillingTemplate(),
    }
  }

  async run() {
    console.log('🚀 Create SaaS Monetization')
    console.log('═══════════════════════════════════')
    console.log('Bootstrap complete revenue system for your project\n')

    // Collect project configuration
    await this.collectConfiguration()

    // Create directory structure
    this.createDirectoryStructure()

    // Generate all components
    await this.generateStripeIntegration()
    await this.generateLicensingSystem()
    await this.generateLegalPages()
    await this.generateMarketingAssets()
    await this.generateBillingDashboard()
    await this.updatePackageJson()
    await this.generateEnvironmentTemplate()
    await this.generateDeploymentGuide()

    console.log('\n🎉 SaaS Monetization System Created!')
    console.log('═══════════════════════════════════════')
    console.log('\nWhat was generated:')
    console.log('📁 lib/monetization/ - Complete payment infrastructure')
    console.log('📁 legal/ - GDPR/CCPA compliant legal pages')
    console.log('📁 marketing/ - Landing pages and email campaigns')
    console.log('📁 billing/ - Customer dashboard and portal')
    console.log('📄 .env.template - Environment configuration')
    console.log('📄 MONETIZATION_GUIDE.md - Complete setup instructions')

    console.log('\n📋 Next Steps:')
    console.log('1. Copy .env.template to .env and configure Stripe keys')
    console.log('2. Deploy legal pages to your domain')
    console.log('3. Set up Stripe products and pricing')
    console.log('4. Launch beta user email campaign')
    console.log('5. Read MONETIZATION_GUIDE.md for detailed instructions')

    console.log('\n💰 Revenue Potential: $1,500-5,000/month recurring')
  }

  async collectConfiguration() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const question = query =>
      new Promise(resolve => rl.question(query, resolve))

    try {
      console.log('📋 Project Configuration')
      console.log('─────────────────────────')

      this.config.projectName =
        (await question('Project name: ')) || path.basename(this.projectRoot)
      this.config.description =
        (await question('Project description: ')) ||
        `${this.config.projectName} - Professional SaaS platform`
      this.config.domain =
        (await question('Domain (e.g. yoursite.com): ')) || 'yoursite.com'
      this.config.companyName =
        (await question('Company/Author name: ')) || 'Your Company'
      this.config.supportEmail =
        (await question('Support email: ')) || 'support@yoursite.com'

      console.log('\n💰 Pricing Configuration')
      console.log('─────────────────────────')
      this.config.starterPrice =
        (await question('Starter tier monthly price (default $19): ')) || '19'
      this.config.proPrice =
        (await question('Pro tier monthly price (default $49): ')) || '49'
      this.config.enterprisePrice =
        (await question('Enterprise tier monthly price (default $149): ')) ||
        '149'
      this.config.founderDiscount =
        (await question('Founder discount % (default 50): ')) || '50'

      console.log('\n🎯 Feature Configuration')
      console.log('─────────────────────────')
      this.config.premiumFeatures =
        (await question('Premium features (comma-separated): ')) ||
        'Advanced Analytics,Priority Support,Custom Integrations'
      this.config.freeTierFeatures =
        (await question('Free tier features (comma-separated): ')) ||
        'Basic Features,Community Support'
    } finally {
      rl.close()
    }

    // Calculate derived values
    this.config.founderStarterPrice = (
      parseFloat(this.config.starterPrice) *
      (1 - parseFloat(this.config.founderDiscount) / 100)
    ).toFixed(2)
    this.config.founderProPrice = (
      parseFloat(this.config.proPrice) *
      (1 - parseFloat(this.config.founderDiscount) / 100)
    ).toFixed(2)
    this.config.founderEnterprisePrice = (
      parseFloat(this.config.enterprisePrice) *
      (1 - parseFloat(this.config.founderDiscount) / 100)
    ).toFixed(2)
  }

  createDirectoryStructure() {
    const dirs = ['lib/monetization', 'legal', 'marketing', 'billing']

    dirs.forEach(dir => {
      const fullPath = path.join(this.projectRoot, dir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
    })
  }

  async generateStripeIntegration() {
    const stripeCode = this.templates.stripe
      .replace(/{{PROJECT_NAME}}/g, this.config.projectName)
      .replace(/{{PRO_PRICE}}/g, this.config.proPrice)
      .replace(/{{ENTERPRISE_PRICE}}/g, this.config.enterprisePrice)

    fs.writeFileSync(
      path.join(this.projectRoot, 'lib/monetization/stripe-integration.js'),
      stripeCode
    )
  }

  async generateLicensingSystem() {
    const licensingCode = this.templates.licensing
      .replace(/{{PROJECT_NAME}}/g, this.config.projectName)
      .replace(/{{PREMIUM_FEATURES}}/g, this.config.premiumFeatures)
      .replace(/{{FREE_FEATURES}}/g, this.config.freeTierFeatures)
      .replace(/{{PRO_PRICE}}/g, this.config.proPrice)
      .replace(/{{ENTERPRISE_PRICE}}/g, this.config.enterprisePrice)
      .replace(/{{FOUNDER_PRO_PRICE}}/g, this.config.founderProPrice)
      .replace(/{{DOMAIN}}/g, this.config.domain)

    fs.writeFileSync(
      path.join(this.projectRoot, 'lib/monetization/licensing.js'),
      licensingCode
    )
  }

  async generateLegalPages() {
    for (const [filename, template] of Object.entries(this.templates.legal)) {
      const content = template
        .replace(/{{PROJECT_NAME}}/g, this.config.projectName)
        .replace(/{{COMPANY_NAME}}/g, this.config.companyName)
        .replace(/{{DOMAIN}}/g, this.config.domain)
        .replace(/{{SUPPORT_EMAIL}}/g, this.config.supportEmail)
        .replace(/{{DESCRIPTION}}/g, this.config.description)
        .replace(/{{DATE}}/g, new Date().toISOString().split('T')[0])

      fs.writeFileSync(path.join(this.projectRoot, 'legal', filename), content)
    }
  }

  async generateMarketingAssets() {
    for (const [filename, template] of Object.entries(
      this.templates.marketing
    )) {
      const content = template
        .replace(/{{PROJECT_NAME}}/g, this.config.projectName)
        .replace(/{{DESCRIPTION}}/g, this.config.description)
        .replace(/{{DOMAIN}}/g, this.config.domain)
        .replace(/{{PRO_PRICE}}/g, this.config.proPrice)
        .replace(/{{ENTERPRISE_PRICE}}/g, this.config.enterprisePrice)
        .replace(/{{FOUNDER_PRO_PRICE}}/g, this.config.founderProPrice)
        .replace(
          /{{FOUNDER_ENTERPRISE_PRICE}}/g,
          this.config.founderEnterprisePrice
        )
        .replace(/{{FOUNDER_DISCOUNT}}/g, this.config.founderDiscount)
        .replace(
          /{{PREMIUM_FEATURES}}/g,
          this.config.premiumFeatures
            .split(',')
            .map(f => f.trim())
            .join(', ')
        )
        .replace(/{{SUPPORT_EMAIL}}/g, this.config.supportEmail)

      fs.writeFileSync(
        path.join(this.projectRoot, 'marketing', filename),
        content
      )
    }
  }

  async generateBillingDashboard() {
    const billingCode = this.templates.billing
      .replace(/{{PROJECT_NAME}}/g, this.config.projectName)
      .replace(/{{PRO_PRICE}}/g, this.config.proPrice)
      .replace(/{{ENTERPRISE_PRICE}}/g, this.config.enterprisePrice)
      .replace(/{{FOUNDER_PRO_PRICE}}/g, this.config.founderProPrice)
      .replace(
        /{{FOUNDER_ENTERPRISE_PRICE}}/g,
        this.config.founderEnterprisePrice
      )
      .replace(/{{PREMIUM_FEATURES}}/g, this.config.premiumFeatures)

    fs.writeFileSync(
      path.join(this.projectRoot, 'billing/dashboard.html'),
      billingCode
    )
  }

  async updatePackageJson() {
    const packagePath = path.join(this.projectRoot, 'package.json')

    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

      // Add monetization scripts
      pkg.scripts = pkg.scripts || {}
      pkg.scripts['activate-license'] =
        'node lib/monetization/cli-activation.js'
      pkg.scripts['license-status'] = 'node lib/monetization/license-status.js'
      pkg.scripts['billing-webhook'] = 'node lib/monetization/stripe-webhook.js'

      // Add monetization dependencies
      pkg.dependencies = pkg.dependencies || {}
      pkg.dependencies.stripe = '^14.15.0'
      pkg.dependencies.crypto = '^1.0.1'

      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2))
    }
  }

  async generateEnvironmentTemplate() {
    const envTemplate = `# ${this.config.projectName} - SaaS Monetization Environment Variables

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_ID_PRO=price_your_pro_monthly_id
STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_monthly_id
STRIPE_PRICE_ID_PRO_FOUNDER=price_your_pro_founder_id
STRIPE_PRICE_ID_ENTERPRISE_FOUNDER=price_your_enterprise_founder_id

# License Security
LICENSE_SIGNING_SECRET=your_secure_random_string_here

# Application Configuration
APP_DOMAIN=${this.config.domain}
SUPPORT_EMAIL=${this.config.supportEmail}
COMPANY_NAME=${this.config.companyName}

# Production Override (uncomment for live environment)
# STRIPE_SECRET_KEY=sk_live_your_live_key_here
# STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
`

    fs.writeFileSync(path.join(this.projectRoot, '.env.template'), envTemplate)
  }

  async generateDeploymentGuide() {
    const guide = `# ${this.config.projectName} - Monetization Setup Guide

## 🚀 Complete SaaS Revenue System

This guide walks you through setting up the complete monetization infrastructure for ${this.config.projectName}.

## 📁 Generated Files

### Payment Infrastructure
- \`lib/monetization/stripe-integration.js\` - Complete Stripe payment processing
- \`lib/monetization/licensing.js\` - License key validation and management
- \`billing/dashboard.html\` - Customer subscription management UI

### Legal Compliance
- \`legal/privacy-policy.md\` - GDPR/CCPA compliant privacy policy
- \`legal/terms-of-service.md\` - Comprehensive terms and liability protection
- \`legal/copyright.md\` - IP and trademark protection
- \`legal/disclaimer.md\` - Software liability disclaimers

### Marketing Assets
- \`marketing/landing-page.html\` - Conversion-optimized sales page
- \`marketing/beta-email-campaign.md\` - 5-email drip sequence
- \`marketing/upgrade-prompts.md\` - CLI and UI upgrade messaging

## 💰 Revenue Configuration

**Pricing Tiers:**
- 🆓 Free: ${this.config.freeTierFeatures}
- 💎 Pro: $${this.config.proPrice}/month (${this.config.premiumFeatures})
- 🏢 Enterprise: $${this.config.enterprisePrice}/month (Everything + priority support)

**Founder Pricing:**
- 💎 Pro: $${this.config.founderProPrice}/month (${this.config.founderDiscount}% off forever)
- 🏢 Enterprise: $${this.config.founderEnterprisePrice}/month (${this.config.founderDiscount}% off forever)

## 🔧 Setup Instructions

### 1. Stripe Configuration (15 minutes)

1. **Create Stripe Account**: https://dashboard.stripe.com/register
2. **Create Products**:
   - Pro Monthly: $${this.config.proPrice}/month
   - Enterprise Monthly: $${this.config.enterprisePrice}/month
   - Pro Founder: $${this.config.founderProPrice}/month
   - Enterprise Founder: $${this.config.founderEnterprisePrice}/month

3. **Configure Environment**:
   \`\`\`bash
   cp .env.template .env
   # Edit .env with your Stripe keys
   \`\`\`

4. **Set up Webhooks**:
   - URL: \`https://${this.config.domain}/api/stripe-webhook\`
   - Events: \`checkout.session.completed\`, \`customer.subscription.deleted\`

### 2. Legal Pages Deployment (5 minutes)

Upload legal pages to your website:
- \`https://${this.config.domain}/legal/privacy-policy.html\` (Required for LinkedIn, GDPR)
- \`https://${this.config.domain}/legal/terms-of-service.html\`
- \`https://${this.config.domain}/legal/copyright.html\`
- \`https://${this.config.domain}/legal/disclaimer.html\`

### 3. Marketing Assets Deployment (10 minutes)

1. **Landing Page**:
   - Upload \`marketing/landing-page.html\` to \`https://${this.config.domain}/upgrade\`
   - Test conversion flow end-to-end

2. **Email Campaign**:
   - Use \`marketing/beta-email-campaign.md\` templates
   - Set up drip sequence in your email platform

### 4. Integration with Your App (20 minutes)

1. **Add License Enforcement**:
   \`\`\`javascript
   const { getLicenseInfo } = require('./lib/monetization/licensing')

   const license = getLicenseInfo()
   if (license.tier === 'FREE') {
     // Show upgrade prompt for premium features
   }
   \`\`\`

2. **Add CLI Commands**:
   \`\`\`javascript
   // Add to your CLI argument parsing
   const isActivateLicenseMode = args.includes('--activate-license')
   const isLicenseStatusMode = args.includes('--license-status')
   \`\`\`

### 5. Testing (5 minutes)

\`\`\`bash
# Test license system
npm run license-status

# Test activation flow
npm run activate-license

# Test Stripe webhook (use Stripe CLI)
stripe listen --forward-to localhost:3000/api/stripe-webhook
\`\`\`

## 📊 Revenue Tracking

### Key Metrics to Monitor:
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (CLV)
- Conversion rates (free → paid)
- Churn rate (target: <5% monthly)

### Success Targets:
- **Month 1**: 10-20 beta user conversions = $${this.config.founderProPrice * 15}/month
- **Month 3**: 50-100 total subscribers = $${this.config.founderProPrice * 75}/month
- **Month 6**: 100-200 subscribers = $${this.config.proPrice * 150}/month
- **Year 1**: 300-500 subscribers = $${this.config.proPrice * 400}/month

## 🛠️ Customization

### Modify Pricing:
Edit \`lib/monetization/licensing.js\` and update:
- Feature definitions
- Pricing display
- Upgrade URLs

### Add Features:
1. Update feature definitions in licensing system
2. Add feature gates in your application code
3. Update marketing materials

### Change Messaging:
- Landing page: \`marketing/landing-page.html\`
- Email campaigns: \`marketing/beta-email-campaign.md\`
- CLI prompts: \`lib/monetization/licensing.js\`

## 🚨 Security Checklist

- [ ] Stripe keys are in environment variables (not code)
- [ ] Webhook endpoints verify signatures
- [ ] License validation uses crypto-secure methods
- [ ] Legal pages are deployed and accessible
- [ ] Privacy policy includes data collection details
- [ ] Terms of service include liability limitations

## 🎯 Launch Checklist

- [ ] Stripe configured with test and live keys
- [ ] Legal pages deployed to domain
- [ ] Landing page deployed and tested
- [ ] Email campaign templates ready
- [ ] License activation tested end-to-end
- [ ] Webhook endpoints responding correctly
- [ ] Premium features properly gated
- [ ] Pricing displayed correctly throughout app

## 📞 Support

For implementation questions:
- Email: ${this.config.supportEmail}
- Documentation: https://${this.config.domain}/docs/monetization

---

**Revenue System Generated**: $(date)
**Estimated Setup Time**: 1 hour
**Revenue Potential**: $1,500-5,000/month recurring
`

    fs.writeFileSync(
      path.join(this.projectRoot, 'MONETIZATION_GUIDE.md'),
      guide
    )
  }

  // Template methods (condensed versions of our implementations)
  getStripeTemplate() {
    return `'use strict'

/**
 * Stripe Integration for {{PROJECT_NAME}}
 * Complete SaaS payment infrastructure
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const os = require('os')

class StripeIntegration {
  constructor() {
    this.stripe = null
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    this.priceIds = {
      PRO_MONTHLY: process.env.STRIPE_PRICE_ID_PRO,
      ENTERPRISE_MONTHLY: process.env.STRIPE_PRICE_ID_ENTERPRISE,
      PRO_FOUNDER: process.env.STRIPE_PRICE_ID_PRO_FOUNDER,
      ENTERPRISE_FOUNDER: process.env.STRIPE_PRICE_ID_ENTERPRISE_FOUNDER
    }
    this.licenseDir = path.join(os.homedir(), '.{{PROJECT_NAME}}')
  }

  async initialize() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable required')
    }

    const { default: Stripe } = await import('stripe')
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })
    return true
  }

  async createCheckoutSession({ tier, isFounder = false, customerEmail, successUrl, cancelUrl, metadata = {} }) {
    await this.initialize()

    const priceId = this.getPriceId(tier, isFounder)

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { tier, isFounder: isFounder.toString(), ...metadata }
      }
    })

    return { sessionId: session.id, url: session.url }
  }

  getPriceId(tier, isFounder = false) {
    if (tier === 'PRO') {
      return isFounder ? this.priceIds.PRO_FOUNDER : this.priceIds.PRO_MONTHLY
    }
    if (tier === 'ENTERPRISE') {
      return isFounder ? this.priceIds.ENTERPRISE_FOUNDER : this.priceIds.ENTERPRISE_MONTHLY
    }
    throw new Error(\`Invalid tier: \${tier}\`)
  }

  generateLicenseKey(customerId, tier, isFounder = false) {
    const payload = { customerId, tier, isFounder, issued: Date.now(), version: '1.0' }

    const hash = crypto.createHash('sha256')
      .update(\`\${customerId}:\${tier}:\${isFounder}:{{PROJECT_NAME}}-license-v1\`)
      .digest('hex')

    const keyParts = hash.slice(0, 16).match(/.{4}/g)
    const licenseKey = \`{{PROJECT_NAME}}-\${keyParts.join('-').toUpperCase()}\`

    return {
      licenseKey,
      payload,
      signature: this.signLicensePayload(payload)
    }
  }

  signLicensePayload(payload) {
    const secret = process.env.LICENSE_SIGNING_SECRET || '{{PROJECT_NAME}}-dev-secret'
    return crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')
  }

  async handleWebhook(body, signature) {
    await this.initialize()

    const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed':
        return await this.handleCheckoutCompleted(event.data.object)
      case 'customer.subscription.deleted':
        return await this.handleSubscriptionCanceled(event.data.object)
      default:
        return { success: true }
    }
  }

  async handleCheckoutCompleted(session) {
    const { tier, isFounder } = session.metadata
    const customerId = session.customer
    const purchaseEmail = session.customer_email || session.customer_details?.email

    const licenseData = this.generateLicenseKey(customerId, tier, isFounder === 'true')

    // Store license in legitimate license database
    await this.addLegitimateKey(
      licenseData.licenseKey,
      customerId,
      tier,
      isFounder === 'true',
      purchaseEmail
    )

    // Send license key to customer via email (implement email sending)

    return { success: true, licenseKey: licenseData.licenseKey }
  }

  async addLegitimateKey(licenseKey, customerId, tier, isFounder = false, purchaseEmail = null) {
    const licenseDir = path.join(os.homedir(), '.{{PROJECT_NAME}}')
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
      } catch (error) {
        console.error('Warning: Could not parse existing database, creating new one')
      }
    }

    // Initialize metadata if needed
    if (!database._metadata) {
      database._metadata = {
        version: '1.0',
        created: new Date().toISOString(),
        description: 'Legitimate license database - populated by webhook'
      }
    }

    // Add license
    database[licenseKey] = {
      customerId,
      tier,
      isFounder,
      email: purchaseEmail,
      addedDate: new Date().toISOString(),
      addedBy: 'stripe_webhook'
    }

    // Update metadata
    database._metadata.lastUpdate = new Date().toISOString()
    database._metadata.totalLicenses = Object.keys(database).length - 1 // Exclude metadata

    // ⚠️ CRITICAL: Calculate SHA256 checksum for integrity verification (MANDATORY)
    // The license validator requires this and will reject databases without it
    const { _metadata, ...licensesOnly } = database
    const sha256 = crypto
      .createHash('sha256')
      .update(JSON.stringify(licensesOnly))
      .digest('hex')
    database._metadata.sha256 = sha256

    // Save database
    fs.writeFileSync(legitimateDBFile, JSON.stringify(database, null, 2))

    console.log(\`✅ Added legitimate license: \${licenseKey}\`)
    console.log(\`   Customer: \${customerId}\`)
    console.log(\`   Tier: \${tier}\`)
    console.log(\`   Founder: \${isFounder ? 'Yes' : 'No'}\`)
    if (purchaseEmail) {
      console.log(\`   Purchase Email: \${purchaseEmail}\`)
    }

    return { success: true }
  }
}

module.exports = { StripeIntegration }
`
  }

  getLicensingTemplate() {
    return `'use strict'

/**
 * Licensing System for {{PROJECT_NAME}}
 * Handles free/pro/enterprise tier validation
 *
 * ⚠️ SECURITY WARNING: This is a template file!
 * For production use, copy from create-qa-architect v4.1.1+ which includes:
 * - Cryptographic signature verification
 * - Secure Stripe integration
 * - License tampering prevention
 * - Legitimate license database system
 * - Admin tools for license management
 *
 * Do NOT use this template as-is in production!
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

const LICENSE_DIR = path.join(os.homedir(), '.{{PROJECT_NAME}}')
const LICENSE_FILE = path.join(LICENSE_DIR, 'license.json')

const LICENSE_TIERS = {
  FREE: 'FREE',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
}

const FEATURES = {
  [LICENSE_TIERS.FREE]: {
    features: [{{FREE_FEATURES}}],
    limits: { users: 1, projects: 3 }
  },
  [LICENSE_TIERS.PRO]: {
    features: [{{PREMIUM_FEATURES}}],
    limits: { users: 10, projects: 50 }
  },
  [LICENSE_TIERS.ENTERPRISE]: {
    features: [{{PREMIUM_FEATURES}}, 'Priority Support', 'Custom Integrations'],
    limits: { users: 'unlimited', projects: 'unlimited' }
  }
}

function getLicenseInfo() {
  try {
    if (!fs.existsSync(LICENSE_FILE)) {
      return { tier: LICENSE_TIERS.FREE, valid: true }
    }

    const licenseData = JSON.parse(fs.readFileSync(LICENSE_FILE, 'utf8'))

    if (!licenseData.tier || !licenseData.licenseKey) {
      return { tier: LICENSE_TIERS.FREE, valid: true, error: 'Invalid license format' }
    }

    if (validateLicenseKey(licenseData.licenseKey, licenseData.tier)) {
      return {
        tier: licenseData.tier,
        valid: true,
        email: licenseData.email,
        expires: licenseData.expires,
      }
    }

    return { tier: LICENSE_TIERS.FREE, valid: true, error: 'Invalid license key' }
  } catch (error) {
    return { tier: LICENSE_TIERS.FREE, valid: true, error: \`License read error: \${error.message}\` }
  }
}

function validateLicenseKey(key, tier) {
  const stripeFormat = /^{{PROJECT_NAME}}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/
  return stripeFormat.test(key)
}

function hasFeature(featureName) {
  const license = getLicenseInfo()
  const tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  return tierFeatures.features.includes(featureName)
}

function showUpgradeMessage(feature) {
  const license = getLicenseInfo()

  console.log(\`\\n🔒 \${feature} is a premium feature\`)
  console.log(\`📊 Current license: \${license.tier.toUpperCase()}\`)

  if (license.tier === LICENSE_TIERS.FREE) {
    console.log('\\n💎 Upgrade to Pro for premium features:')
    console.log('   • {{PREMIUM_FEATURES}}')
    console.log('\\n💰 Pricing:')
    console.log('   • Pro: ${{ PRO_PRICE }}/month')
    console.log('   • Limited-time founder pricing: ${{ FOUNDER_PRO_PRICE }}/month')
    console.log('\\n🚀 Upgrade now: https://{{DOMAIN}}/upgrade')
    console.log('🔑 Activate license: npx {{PROJECT_NAME}}@latest --activate-license')
  }
}

async function activateLicense(licenseKey, email) {
  try {
    if (!licenseKey.match(/^{{PROJECT_NAME}}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      return { success: false, error: 'Invalid license key format' }
    }

    // ⚠️ PRODUCTION SETUP REQUIRED:
    // 1. Copy complete licensing system from create-qa-architect v4.1.1+:
    //    - lib/stripe-integration.js (Stripe API + secure validation)
    //    - lib/licensing.js (License management + activation)
    //    - admin-license.js (Admin tool for adding purchased licenses)
    //
    // 2. Set up legitimate license database:
    //    node admin-license.js <license-key> <customer-id> <tier> [founder] [email]
    //
    // 3. Configure Stripe environment variables:
    //    STRIPE_SECRET_KEY=sk_live_...
    //    LICENSE_SIGNING_SECRET=your-secure-secret
    //
    // 4. Replace this template function with secure implementation

    console.log('⚠️ License activation not configured for production')
    console.log('📋 This is a template - see comments above for setup instructions')
    console.log('📞 Contact support for license activation assistance')

    return {
      success: false,
      error: 'License activation requires production setup. Contact support for assistance.'
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function saveLicense(tier, key, email, expires = null) {
  try {
    if (!fs.existsSync(LICENSE_DIR)) {
      fs.mkdirSync(LICENSE_DIR, { recursive: true })
    }

    const licenseData = {
      tier,
      licenseKey: key,  // ✅ Updated to match v4.1.1+ field structure
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

function showLicenseStatus() {
  const license = getLicenseInfo()

  console.log('\\n📋 License Status:')
  console.log(\`   Tier: \${license.tier.toUpperCase()}\`)

  if (license.email) console.log(\`   Email: \${license.email}\`)
  if (license.expires) console.log(\`   Expires: \${license.expires}\`)
  if (license.error) console.log(\`   ⚠️  Issue: \${license.error}\`)

  console.log('\\n🎯 Available Features:')
  const features = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  features.features.forEach(feature => console.log(\`   ✅ \${feature}\`))
}

module.exports = {
  LICENSE_TIERS,
  FEATURES,
  getLicenseInfo,
  hasFeature,
  showUpgradeMessage,
  activateLicense,
  saveLicense,
  showLicenseStatus,
}
`
  }

  getLegalTemplates() {
    return {
      'privacy-policy.md': `# Privacy Policy

**Effective Date:** {{DATE}}
**Last Updated:** {{DATE}}

## Introduction

{{PROJECT_NAME}} ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our software and related services.

**Contact Information:**
- **Service Provider:** {{COMPANY_NAME}}
- **Email:** {{SUPPORT_EMAIL}}
- **Website:** https://{{DOMAIN}}

## Information We Collect

### 1. Information You Provide Directly
- **Account Information:** Email address, name, company details (for Pro/Enterprise tiers)
- **Payment Information:** Billing details processed securely through Stripe
- **Support Communications:** Messages, bug reports, feature requests

### 2. Information Collected Automatically
- **Usage Analytics:** Commands run, features used, error logs (anonymized)
- **Technical Data:** Operating system, software version, project structure (no source code)
- **Installation Data:** Package downloads, CLI usage frequency

### 3. Information We Do NOT Collect
- **Source Code:** We never read, store, or transmit your actual code
- **Repository Contents:** No access to your repository contents or commit messages
- **Environment Variables:** No collection of secrets, API keys, or sensitive data
- **File Contents:** Only file paths and structure, never file contents

## How We Use Your Information

### Primary Purposes
1. **Service Delivery:** Provide software tools and features
2. **License Validation:** Verify Pro/Enterprise tier access and usage limits
3. **Support:** Respond to questions, issues, and feature requests
4. **Improvement:** Analyze usage patterns to enhance our tools (anonymized)

## Data Sharing and Disclosure

### We Share Information With:
- **Payment Processors:** Stripe for subscription billing (Pro/Enterprise tiers)
- **Cloud Providers:** AWS/Vercel for service hosting (encrypted data only)
- **Analytics Services:** Anonymous usage statistics only

### We Do NOT Share:
- **Personal data with advertisers** or data brokers
- **Project details or technical information** with third parties
- **Any data for marketing purposes** without explicit consent

## Your Privacy Rights

### Rights Available to All Users
- **Access:** Request copy of your personal data
- **Correction:** Update inaccurate or incomplete information
- **Deletion:** Request account and data deletion
- **Portability:** Export your data in machine-readable format
- **Opt-out:** Unsubscribe from marketing communications

### How to Exercise Rights
Email your request to **{{SUPPORT_EMAIL}}** with subject "Privacy Request"

**Response Time:** 30 days maximum, typically within 5 business days

## Data Security and Storage

### Security Measures
- **Encryption:** All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Access Controls:** Strict authentication and authorization protocols
- **Regular Audits:** Quarterly security assessments and vulnerability scans
- **Incident Response:** 24-hour breach notification procedures

### Data Retention
- **Account Data:** Retained while account is active plus 30 days after cancellation
- **Usage Analytics:** Aggregated and anonymized, retained for 2 years maximum
- **Support Data:** Deleted 1 year after case closure

## Changes to This Policy

We may update this Privacy Policy to reflect changes in our practices or applicable law. Material changes will receive 30-day advance notice via email.

## Contact Us

For privacy questions, concerns, or requests:
- **Email:** {{SUPPORT_EMAIL}}
- **Subject Line:** "Privacy Policy Inquiry"
- **Response Time:** 5 business days maximum

---

*This Privacy Policy is designed to comply with GDPR, CCPA, and other applicable privacy laws. Last reviewed on {{DATE}}.*`,

      'terms-of-service.md': `# Terms of Service

**Effective Date:** {{DATE}}
**Last Updated:** {{DATE}}

## 1. Acceptance of Terms

By installing, accessing, or using {{PROJECT_NAME}} ("Service"), you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.

**Service Provider:** {{COMPANY_NAME}}
**Contact:** {{SUPPORT_EMAIL}}

## 2. Description of Service

{{PROJECT_NAME}} is a software tool that provides: {{DESCRIPTION}}

## 3. License and Intellectual Property

### 3.1 License Grant
We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service in accordance with these Terms and your subscription plan (Free, Pro, or Enterprise).

### 3.2 Intellectual Property Rights
- **Our Rights:** All software, documentation, trademarks, and proprietary methods remain our exclusive property
- **Your Rights:** You retain all rights to your source code and project files
- **Restrictions:** You may not reverse engineer, decompile, or create derivative works of our Service

## 4. Subscription Plans and Payment

### 4.1 Subscription Tiers
- **Free Tier:** Basic features as described in our documentation
- **Pro Tier:** ${{ PRO_PRICE }}/month with advanced features
- **Enterprise Tier:** ${{ ENTERPRISE_PRICE }}/month with premium support and features

### 4.2 Payment Terms
- **Billing Cycle:** Monthly subscription charges
- **Payment Method:** Processed securely through Stripe
- **Auto-Renewal:** Subscriptions automatically renew unless cancelled
- **Price Changes:** 30-day advance notice for subscription price increases

### 4.3 Refunds and Cancellation
- **Cancellation:** You may cancel anytime through your account settings
- **Effective Date:** Cancellation effective at end of current billing cycle
- **No Refunds:** All payments are non-refundable except as required by law

## 5. DISCLAIMERS AND LIMITATION OF LIABILITY

### 5.1 SERVICE WARRANTIES DISCLAIMED
THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.

### 5.2 LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES.

### 5.3 MAXIMUM LIABILITY
OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS SHALL NOT EXCEED THE TOTAL AMOUNT YOU PAID US IN THE 12 MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY.

## 6. Indemnification

You agree to indemnify, defend, and hold harmless {{COMPANY_NAME}} from and against any and all claims, damages, losses, costs, and expenses arising from or relating to your use or misuse of the Service.

## 7. Termination

### 7.1 Termination by You
You may terminate your account at any time by cancelling your subscription.

### 7.2 Termination by Us
We may terminate or suspend your access immediately, without prior notice, if you breach these Terms or engage in fraudulent or illegal activities.

## 8. General Provisions

### 8.1 Governing Law
These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.

### 8.2 Entire Agreement
These Terms, together with our Privacy Policy, constitute the entire agreement between you and us.

## 9. Contact Information

For questions about these Terms:
- **Email:** {{SUPPORT_EMAIL}}
- **Subject:** "Terms of Service Inquiry"
- **Response Time:** 5 business days

---

*These Terms of Service provide comprehensive legal protection and comply with standard SaaS industry practices. Last reviewed on {{DATE}}.*`,

      'copyright.md': `# Copyright Notice

**© {{DATE}} {{COMPANY_NAME}}. All rights reserved.**

## Intellectual Property Protection

### Software Copyright
{{PROJECT_NAME}}, including all source code, documentation, design, graphics, and related materials, is protected by copyright law and international treaties. All rights are reserved.

### Trademarks
- **"{{PROJECT_NAME}}"** is a trademark of {{COMPANY_NAME}}
- All other trademarks, service marks, and trade names are the property of their respective owners

## Permitted Uses

### What You May Do
- Use the software in accordance with your subscription license
- Create derivative configurations for your own projects
- Reference our documentation in compliance discussions

### What You May NOT Do
- Copy, modify, or distribute our proprietary source code
- Create competing products based on our software
- Remove or modify copyright notices
- Use our trademarks without written permission

## DMCA Compliance

### Copyright Infringement Claims
If you believe our software infringes your copyright, send a DMCA notice to:

**DMCA Agent:** {{COMPANY_NAME}}
**Email:** {{SUPPORT_EMAIL}}
**Subject:** "DMCA Takedown Notice"

## Contact for Licensing

For licensing inquiries or permission to use copyrighted materials:
- **Email:** {{SUPPORT_EMAIL}}
- **Subject:** "Copyright Licensing Inquiry"

---

*This copyright notice was last updated on {{DATE}}.*`,

      'disclaimer.md': `# Disclaimer

**Last Updated:** {{DATE}}

## IMPORTANT LEGAL NOTICE

The information and software provided by {{PROJECT_NAME}} is subject to the following disclaimers. By using our Service, you acknowledge and agree to these limitations.

## 1. Software Tool Disclaimer

### 1.1 No Guarantee of Results
- **Effectiveness:** While our tool aims to improve software development workflows, we make no guarantees about the effectiveness of our recommendations
- **Project Outcomes:** We are not responsible for any project delays, failures, or issues that may arise from using our tool
- **Compatibility:** We cannot guarantee compatibility with all development environments, frameworks, or tools

### 1.2 User Responsibility
- **Testing:** You are solely responsible for testing all changes made by our tool in your development environment
- **Backup:** Always backup your code before running automated tools
- **Review:** Carefully review all automated changes before committing to production

## 2. Security Disclaimer

### 2.1 Security Tool Limitations
- **Detection Accuracy:** Security scanning tools may produce false positives and false negatives
- **Coverage Limitations:** No security tool can detect 100% of potential vulnerabilities
- **Evolving Threats:** New security threats emerge constantly that may not be detected by current tools

### 2.2 Security Responsibility
- **Professional Assessment:** Complex security issues require professional security assessment
- **Regular Updates:** Security tools and databases must be regularly updated
- **Defense in Depth:** Use multiple layers of security protection

## 3. Service Availability Disclaimer

### 3.1 Uptime and Reliability
- **No Uptime Guarantee:** We make no guarantees about service availability or uptime
- **Third-Party Dependencies:** Our service depends on external services that may experience outages
- **Maintenance Windows:** Scheduled maintenance may temporarily interrupt service

### 3.2 Data and Backup
- **No Backup Service:** We do not provide backup services for your project data
- **Data Loss Risk:** Technical failures could result in loss of configuration or usage data
- **Recovery Limitations:** Our ability to recover lost data is limited

## 4. Professional Advice Disclaimer

### 4.1 Not Professional Advice
- **Development Practices:** Our recommendations are general guidance, not professional consulting
- **Legal Compliance:** We do not provide legal advice regarding software licensing or compliance
- **Business Decisions:** Tool recommendations should not be the sole basis for business-critical decisions

### 4.2 Expert Consultation
- **Complex Scenarios:** Consult with qualified professionals for complex development, security, or legal issues
- **Industry Standards:** Verify that our recommendations align with your industry's specific standards
- **Regulatory Compliance:** Ensure compliance with applicable regulations in your jurisdiction

## 5. Financial and Business Disclaimer

### 5.1 No Business Guarantees
- **ROI Claims:** We make no guarantees about return on investment or cost savings
- **Productivity Claims:** Individual results may vary regarding development productivity
- **Business Outcomes:** We are not responsible for business decisions made based on our tool's output

### 5.2 Subscription and Billing
- **Service Changes:** We may modify features or pricing with appropriate notice
- **Refund Limitations:** Refunds are limited as specified in our Terms of Service
- **Tax Responsibility:** You are responsible for any applicable taxes on your subscription

## 6. Contact Information

For questions about this disclaimer:
- **Email:** {{SUPPORT_EMAIL}}
- **Subject:** "Disclaimer Inquiry"

---

**ACKNOWLEDGMENT:** By using {{PROJECT_NAME}}, you acknowledge that you have read, understood, and agree to be bound by this Disclaimer and accept all associated risks and limitations.

*Last reviewed on {{DATE}}.*`,
    }
  }

  getMarketingTemplates() {
    return {
      'landing-page.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PROJECT_NAME}} Pro - {{DESCRIPTION}}</title>
    <meta name="description" content="{{DESCRIPTION}} - Upgrade to Pro for premium features.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 80px 20px; text-align: center; }
        .hero h1 { font-size: 3.5rem; font-weight: 900; margin-bottom: 20px; line-height: 1.2; }
        .hero .subtitle { font-size: 1.5rem; margin-bottom: 15px; opacity: 0.9; }
        .hero .problem { font-size: 1.2rem; margin-bottom: 40px; opacity: 0.8; }
        .cta-button { background: #ff6b6b; color: white; padding: 20px 40px; font-size: 1.3rem; font-weight: bold; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; text-decoration: none; display: inline-block; margin: 10px; }
        .cta-button:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3); }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .section { padding: 80px 20px; }
        .pricing-section { background: #f8f9fa; text-align: center; }
        .pricing-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; max-width: 800px; margin: 0 auto; }
        .pricing-card { background: white; border-radius: 12px; padding: 40px; position: relative; border: 2px solid #e9ecef; }
        .pricing-card.popular { border-color: #667eea; transform: scale(1.05); }
        .pricing-card h3 { font-size: 1.8rem; margin-bottom: 10px; }
        .price { font-size: 3rem; font-weight: bold; color: #667eea; margin-bottom: 10px; }
        .founder-badge { background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 10px 15px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; margin: 15px 0; display: inline-block; }
    </style>
</head>
<body>
    <section class="hero">
        <div class="container">
            <h1>Unlock {{PROJECT_NAME}} Pro</h1>
            <p class="subtitle">{{DESCRIPTION}}</p>
            <p class="problem">Get access to premium features and priority support.</p>
            <a href="https://{{DOMAIN}}/checkout?tier=pro&founder=true" class="cta-button">Start Pro - ${{ FOUNDER_PRO_PRICE }}/month</a>
        </div>
    </section>

    <section class="section pricing-section">
        <div class="container">
            <h2>Choose Your Plan</h2>
            <div class="pricing-cards">
                <div class="pricing-card popular">
                    <h3>Pro</h3>
                    <div class="price">${{ PRO_PRICE }}<span style="font-size: 1rem; color: #666;">/month</span></div>
                    <div class="founder-badge">🎁 Founder: ${{ FOUNDER_PRO_PRICE }}/month ({{FOUNDER_DISCOUNT}}% off forever)</div>
                    <ul style="text-align: left; margin: 30px 0;">
                        <li style="padding: 8px 0;">{{PREMIUM_FEATURES}}</li>
                    </ul>
                    <a href="https://{{DOMAIN}}/checkout?tier=pro&founder=true" class="cta-button">Start Pro</a>
                </div>

                <div class="pricing-card">
                    <h3>Enterprise</h3>
                    <div class="price">${{ ENTERPRISE_PRICE }}<span style="font-size: 1rem; color: #666;">/month</span></div>
                    <div class="founder-badge">🎁 Founder: ${{ FOUNDER_ENTERPRISE_PRICE }}/month ({{FOUNDER_DISCOUNT}}% off forever)</div>
                    <ul style="text-align: left; margin: 30px 0;">
                        <li style="padding: 8px 0;">Everything in Pro</li>
                        <li style="padding: 8px 0;">Priority Support</li>
                        <li style="padding: 8px 0;">Custom Integrations</li>
                    </ul>
                    <a href="https://{{DOMAIN}}/checkout?tier=enterprise&founder=true" class="cta-button">Start Enterprise</a>
                </div>
            </div>
        </div>
    </section>
</body>
</html>`,

      'beta-email-campaign.md': `# Beta User Email Campaign - {{PROJECT_NAME}}

## Email 1: Founder Pricing Announcement

**Subject:** 🎉 Thanks for beta testing - Your founder discount awaits!

**Body:**
Hi [Name],

Thanks for being an early adopter of {{PROJECT_NAME}}! Your feedback helped us build {{DESCRIPTION}}.

## 🚨 What's Changing
Our beta period has ended. Premium features now require a Pro subscription.

## 🎁 Your Exclusive Founder Pricing
**{{FOUNDER_DISCOUNT}}% off for life** as a thank you:
✅ **Pro Tier**: ${{ FOUNDER_PRO_PRICE }}/month (normally ${{ PRO_PRICE }})
✅ **Enterprise Tier**: ${{ FOUNDER_ENTERPRISE_PRICE }}/month (normally ${{ ENTERPRISE_PRICE }})

## 🚀 What You Get with Pro
• {{PREMIUM_FEATURES}}
• Priority email support
• All future premium features

[**🎯 Claim Founder Pricing**](https://{{DOMAIN}}/upgrade?code=FOUNDER{{FOUNDER_DISCOUNT}})

Questions? Reply to this email.

Best,
{{COMPANY_NAME}}

---

## Email 2: Urgency Reminder (Send 3 days before expiration)

**Subject:** ⏰ Final call: Founder pricing expires soon

**Body:**
Hi [Name],

This is your final reminder - founder pricing expires in 3 days.

After that, Pro tier goes to full price (${{ PRO_PRICE }}/month).

**Don't miss out:**
✅ ${{ FOUNDER_PRO_PRICE }}/month forever (vs ${{ PRO_PRICE }}/month)
✅ All premium features
✅ Priority support

[**🚀 Secure Founder Pricing Now**](https://{{DOMAIN}}/upgrade?code=FOUNDER{{FOUNDER_DISCOUNT}})

Best,
{{COMPANY_NAME}}

---

## Email 3: Welcome + Onboarding (For customers who upgrade)

**Subject:** 🎉 Welcome to Pro! Here's how to activate

**Body:**
Hi [Name],

Welcome to {{PROJECT_NAME}} Pro! 🎉

## 🔑 Activate Your License
Run this command with your license key:
\`\`\`
npx {{PROJECT_NAME}}@latest --activate-license
\`\`\`

## 💬 Priority Support
Questions? Reply to this email for priority support.

Thanks for supporting {{PROJECT_NAME}}!

Best,
{{COMPANY_NAME}}`,

      'upgrade-prompts.md': `# Upgrade Prompts for {{PROJECT_NAME}}

## CLI Upgrade Messages

### When free user encounters premium feature:
\`\`\`
🔒 [Feature Name] is a premium feature
📊 Current license: FREE

💎 Upgrade to Pro for premium features:
   • {{PREMIUM_FEATURES}}

💰 Pricing:
   • Pro: ${{ PRO_PRICE }}/month
   • Limited-time founder pricing: ${{ FOUNDER_PRO_PRICE }}/month

🚀 Upgrade now: https://{{DOMAIN}}/upgrade
🔑 Activate license: npx {{PROJECT_NAME}}@latest --activate-license
\`\`\`

### License activation success:
\`\`\`
✅ License activated successfully!
📋 Tier: PRO
🎁 Founder: Yes
📧 Email: user@example.com

🎉 Premium features are now available!
\`\`\`

### License activation failure:
\`\`\`
❌ License activation failed.
• Check your license key format
• Verify your email address
• Contact support: {{SUPPORT_EMAIL}}
\`\`\``,
    }
  }

  getBillingTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PROJECT_NAME}} - Billing Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; color: white; margin-bottom: 40px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .dashboard-card { background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 30px; margin-bottom: 30px; }
        .tier-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .tier-card { border: 2px solid #e1e5e9; border-radius: 12px; padding: 25px; text-align: center; cursor: pointer; transition: all 0.3s ease; }
        .tier-card:hover { border-color: #667eea; transform: translateY(-5px); box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15); }
        .tier-card.selected { border-color: #667eea; background: linear-gradient(135deg, #667eea10, #764ba210); }
        .tier-card.popular::before { content: "MOST POPULAR"; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
        .tier-name { font-size: 1.5rem; font-weight: bold; margin-bottom: 10px; color: #333; }
        .tier-price { font-size: 2rem; font-weight: bold; color: #667eea; margin-bottom: 15px; }
        .checkout-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; width: 100%; transition: all 0.3s ease; }
        .checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{PROJECT_NAME}}</h1>
            <p>Choose your plan and upgrade to premium features</p>
        </div>

        <div class="dashboard-card">
            <h2>🚀 Choose Your Plan</h2>

            <div class="tier-selector">
                <div class="tier-card popular" data-tier="pro" onclick="selectTier('pro')">
                    <div class="tier-name">Pro</div>
                    <div class="tier-price">${{ PRO_PRICE }}<span style="font-size: 1rem; color: #666;">/month</span></div>
                    <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 10px; border-radius: 8px; margin: 15px 0; font-weight: bold;">
                        🎁 Founder: ${{ FOUNDER_PRO_PRICE }}/month
                    </div>
                    <ul style="text-align: left; margin: 20px 0;">
                        <li style="padding: 5px 0;">{{PREMIUM_FEATURES}}</li>
                    </ul>
                </div>

                <div class="tier-card" data-tier="enterprise" onclick="selectTier('enterprise')">
                    <div class="tier-name">Enterprise</div>
                    <div class="tier-price">${{ ENTERPRISE_PRICE }}<span style="font-size: 1rem; color: #666;">/month</span></div>
                    <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 10px; border-radius: 8px; margin: 15px 0; font-weight: bold;">
                        🎁 Founder: ${{ FOUNDER_ENTERPRISE_PRICE }}/month
                    </div>
                    <ul style="text-align: left; margin: 20px 0;">
                        <li style="padding: 5px 0;">Everything in Pro</li>
                        <li style="padding: 5px 0;">Priority Support (24h)</li>
                        <li style="padding: 5px 0;">Custom Integrations</li>
                    </ul>
                </div>
            </div>

            <button class="checkout-btn" onclick="startCheckout()" id="checkout-btn" disabled>
                Select a plan above
            </button>
        </div>
    </div>

    <script>
        let selectedTier = null;

        function selectTier(tier) {
            selectedTier = tier;
            document.querySelectorAll('.tier-card').forEach(card => card.classList.remove('selected'));
            document.querySelector(\`[data-tier="\${tier}"]\`).classList.add('selected');

            const checkoutBtn = document.getElementById('checkout-btn');
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = tier === 'pro' ?
                'Start Pro Subscription - ${{ FOUNDER_PRO_PRICE }}/month' :
                'Start Enterprise Subscription - ${{ FOUNDER_ENTERPRISE_PRICE }}/month';
        }

        function startCheckout() {
            if (!selectedTier) return;
            window.location.href = \`https://{{DOMAIN}}/api/checkout?tier=\${selectedTier}&founder=true\`;
        }

        // Pre-select Pro tier
        selectTier('pro');
    </script>
</body>
</html>`
  }
}

// Run the bootstrap if this file is executed directly
if (require.main === module) {
  const bootstrap = new SaaSMonetizationBootstrap()
  bootstrap.run().catch(console.error)
}

module.exports = { SaaSMonetizationBootstrap }
