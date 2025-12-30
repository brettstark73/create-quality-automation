#!/usr/bin/env node

// @ts-nocheck
/**
 * Stripe Webhook Handler for License Management
 *
 * This is SERVER-SIDE code that processes Stripe webhooks
 * and populates the legitimate license database.
 *
 * Deploy this on your server (not distributed with CLI package).
 *
 * Usage:
 *   1. Deploy this script to your server
 *   2. Set up Stripe webhook endpoint pointing to this handler
 *   3. Set required environment variables
 *   4. Webhook will automatically populate license database when payments succeed
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const express = require('express')
const {
  buildLicensePayload,
  hashEmail,
  signPayload,
  stableStringify,
  loadKeyFromEnv,
} = require('./lib/license-signing')

// Environment variables required
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const LICENSE_DATABASE_PATH = path.resolve(
  process.cwd(),
  process.env.LICENSE_DATABASE_PATH || './legitimate-licenses.json'
)
const LICENSE_PUBLIC_DATABASE_PATH = path.resolve(
  process.cwd(),
  process.env.LICENSE_PUBLIC_DATABASE_PATH ||
    './legitimate-licenses.public.json'
)
const LICENSE_REGISTRY_KEY_ID = process.env.LICENSE_REGISTRY_KEY_ID || 'default'
const LICENSE_REGISTRY_PRIVATE_KEY = loadKeyFromEnv(
  process.env.LICENSE_REGISTRY_PRIVATE_KEY,
  process.env.LICENSE_REGISTRY_PRIVATE_KEY_PATH
)
const PORT = process.env.PORT || 3000

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
  console.error('❌ Required environment variables missing:')
  console.error('   STRIPE_SECRET_KEY - Your Stripe secret key')
  console.error('   STRIPE_WEBHOOK_SECRET - Your Stripe webhook secret')
  process.exit(1)
}

if (!LICENSE_REGISTRY_PRIVATE_KEY) {
  console.error('❌ Required environment variables missing:')
  console.error(
    '   LICENSE_REGISTRY_PRIVATE_KEY or LICENSE_REGISTRY_PRIVATE_KEY_PATH'
  )
  process.exit(1)
}

const app = express()

// Raw body parser for Stripe webhooks
app.use('/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

/**
 * Load legitimate license database
 */
function loadLicenseDatabase() {
  try {
    // Path resolved once at startup; no untrusted user input is allowed here
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(LICENSE_DATABASE_PATH)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return JSON.parse(fs.readFileSync(LICENSE_DATABASE_PATH, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading license database:', error.message)
  }

  return {
    _metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      description: 'Legitimate license database - populated by Stripe webhooks',
    },
  }
}

let writeQueue = Promise.resolve()

function queueDatabaseWrite(task) {
  const next = writeQueue.then(task, task)
  writeQueue = next.catch(() => {})
  return next
}

/**
 * Save legitimate license database
 */
function saveLicenseDatabase(database) {
  try {
    // Ensure directory exists
    const dir = path.dirname(LICENSE_DATABASE_PATH)
    // Path resolved once at startup; no untrusted user input is allowed here
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(dir)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.mkdirSync(dir, { recursive: true })
    }

    // Compute integrity hash over licenses (excluding metadata)
    const { _metadata, ...licenses } = database
    const sha = crypto
      .createHash('sha256')
      .update(JSON.stringify(licenses))
      .digest('hex')

    database._metadata = {
      ...(database._metadata || {}),
      lastSave: new Date().toISOString(),
      sha256: sha,
    }

    const tempPath = `${LICENSE_DATABASE_PATH}.${process.pid}.${Date.now()}.tmp`
    // Path resolved once at startup; no untrusted user input is allowed here
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(tempPath, JSON.stringify(database, null, 2))
    // Path resolved once at startup; no untrusted user input is allowed here
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.renameSync(tempPath, LICENSE_DATABASE_PATH)

    const publicRegistry = buildPublicRegistry(database)
    const publicTempPath = `${LICENSE_PUBLIC_DATABASE_PATH}.${process.pid}.${Date.now()}.tmp`
    // Path resolved once at startup; no untrusted user input is allowed here
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(publicTempPath, JSON.stringify(publicRegistry, null, 2))
    // Path resolved once at startup; no untrusted user input is allowed here
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.renameSync(publicTempPath, LICENSE_PUBLIC_DATABASE_PATH)
    return true
  } catch (error) {
    console.error('Error saving license database:', error.message)
    return false
  }
}

function buildPublicRegistry(database) {
  const publicLicenses = {}
  const issuedAt = new Date().toISOString()

  Object.entries(database).forEach(([licenseKey, entry]) => {
    if (licenseKey === '_metadata') return
    const issued = entry.issued || entry.addedDate || issuedAt
    const emailHash = hashEmail(entry.email)
    const payload = buildLicensePayload({
      licenseKey,
      tier: entry.tier,
      isFounder: entry.isFounder,
      emailHash,
      issued,
    })
    const signature = signPayload(payload, LICENSE_REGISTRY_PRIVATE_KEY)
    publicLicenses[licenseKey] = {
      tier: entry.tier,
      isFounder: entry.isFounder,
      issued,
      emailHash,
      signature,
      keyId: LICENSE_REGISTRY_KEY_ID,
    }
  })

  const registrySignature = signPayload(
    publicLicenses,
    LICENSE_REGISTRY_PRIVATE_KEY
  )

  return {
    _metadata: {
      version: '1.0',
      created: database._metadata?.created || issuedAt,
      lastSave: issuedAt,
      algorithm: 'ed25519',
      keyId: LICENSE_REGISTRY_KEY_ID,
      registrySignature,
      hash: crypto
        .createHash('sha256')
        .update(stableStringify(publicLicenses))
        .digest('hex'),
    },
    ...publicLicenses,
  }
}

function loadPublicRegistry() {
  try {
    // Path resolved once at startup; no untrusted user input is allowed here
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(LICENSE_PUBLIC_DATABASE_PATH)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return JSON.parse(fs.readFileSync(LICENSE_PUBLIC_DATABASE_PATH, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading public license registry:', error.message)
  }

  const privateDb = loadLicenseDatabase()
  const registry = buildPublicRegistry(privateDb)
  try {
    const publicTempPath = `${LICENSE_PUBLIC_DATABASE_PATH}.${process.pid}.${Date.now()}.tmp`
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(publicTempPath, JSON.stringify(registry, null, 2))
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.renameSync(publicTempPath, LICENSE_PUBLIC_DATABASE_PATH)
  } catch (error) {
    console.error('Error saving public license registry:', error.message)
  }
  return registry
}

/**
 * Generate deterministic license key from customer ID
 */
function generateLicenseKey(customerId, tier, isFounder = false) {
  const hash = crypto
    .createHash('sha256')
    .update(`${customerId}:${tier}:${isFounder}:cqa-license-v1`)
    .digest('hex')

  // Format as license key: QAA-XXXX-XXXX-XXXX-XXXX
  const keyParts = hash.slice(0, 16).match(/.{4}/g)
  return `QAA-${keyParts.join('-').toUpperCase()}`
}

/**
 * Map Stripe price ID to tier and founder status
 */
function mapPriceToTier(priceId) {
  // Configure these based on your Stripe price IDs (founder pricing retired)
  // Using Map to avoid object-injection warnings from eslint-plugin-security
  const priceMapping = new Map([
    ['price_pro_monthly', { tier: 'PRO', isFounder: false }],
    ['price_pro_annual', { tier: 'PRO', isFounder: false }],
    ['price_team_monthly', { tier: 'TEAM', isFounder: false }],
    ['price_team_annual', { tier: 'TEAM', isFounder: false }],
    ['price_enterprise_annual', { tier: 'ENTERPRISE', isFounder: false }],
  ])

  if (typeof priceId === 'string' && priceMapping.has(priceId)) {
    return priceMapping.get(priceId)
  }
  return null
}

/**
 * Add license to database
 */
function addLicenseToDatabase(licenseKey, customerInfo) {
  return queueDatabaseWrite(() => {
    try {
      // Validate license key format to prevent object injection
      if (
        typeof licenseKey !== 'string' ||
        !/^QAA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(
          licenseKey
        )
      ) {
        console.error('Invalid license key format:', licenseKey)
        return false
      }

      const database = loadLicenseDatabase()

      // eslint-disable-next-line security/detect-object-injection -- licenseKey validated by regex above (QAA-XXXX-XXXX-XXXX-XXXX format)
      database[licenseKey] = {
        customerId: customerInfo.customerId,
        tier: customerInfo.tier,
        isFounder: customerInfo.isFounder,
        email: customerInfo.email,
        subscriptionId: customerInfo.subscriptionId,
        addedDate: new Date().toISOString(),
        issued: new Date().toISOString(),
        addedBy: 'stripe_webhook',
      }

      // Update metadata
      database._metadata.lastUpdate = new Date().toISOString()
      database._metadata.totalLicenses = Object.keys(database).length - 1 // Exclude metadata

      return saveLicenseDatabase(database)
    } catch (error) {
      console.error('Error adding license to database:', error.message)
      return false
    }
  })
}

/**
 * Handle Stripe webhook events
 */
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    // Initialize Stripe
    const stripe = require('stripe')(STRIPE_SECRET_KEY)

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object)
        break

      default:
        console.log(`🔄 Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session) {
  try {
    console.log('💰 Processing checkout completion:', session.id)

    const stripe = require('stripe')(STRIPE_SECRET_KEY)

    // Get customer details
    const customer = await stripe.customers.retrieve(session.customer)

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    )
    const priceId = subscription.items.data[0].price.id

    // Map price to tier
    const priceInfo = mapPriceToTier(priceId)
    if (!priceInfo) {
      throw new Error(`Unknown Stripe price ID: ${priceId}`)
    }
    const { tier, isFounder } = priceInfo

    // Generate license key
    const licenseKey = generateLicenseKey(customer.id, tier, isFounder)

    // Add to database
    const customerInfo = {
      customerId: customer.id,
      tier,
      isFounder,
      email: customer.email,
      subscriptionId: subscription.id,
    }

    const success = await addLicenseToDatabase(licenseKey, customerInfo)

    if (success) {
      console.log(`✅ License created: ${licenseKey}`)
      console.log(`   Customer: ${customer.email}`)
      console.log(`   Tier: ${tier} ${isFounder ? '(Founder)' : ''}`)

      // Here you could also send the license key to the customer via email
      // await sendLicenseEmail(customer.email, licenseKey, tier)
    } else {
      throw new Error('Failed to save license to database')
    }
  } catch (error) {
    console.error('❌ Checkout processing error:', error.message)
    throw error
  }
}

/**
 * Handle successful payment (recurring)
 */
async function handlePaymentSucceeded(invoice) {
  console.log(`💳 Payment succeeded: ${invoice.id}`)
  // License should already exist from checkout.session.completed
  // Could implement license renewal/extension logic here if needed
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription) {
  try {
    console.log(`❌ Subscription canceled: ${subscription.id}`)

    // Could implement license deactivation logic here
    // For now, we'll just log it
    console.log(`   Customer: ${subscription.customer}`)

    // Optional: Remove license from database or mark as canceled
    // const database = loadLicenseDatabase()
    // Object.keys(database).forEach(key => {
    //   if (database[key].subscriptionId === subscription.id) {
    //     database[key].status = 'canceled'
    //   }
    // })
    // saveLicenseDatabase(database)
  } catch (error) {
    console.error('❌ Subscription cancellation error:', error.message)
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    // Path resolved once at startup; no untrusted user input is allowed here
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    database: fs.existsSync(LICENSE_DATABASE_PATH) ? 'exists' : 'missing',
  })
})

/**
 * License database endpoint for CLI access
 *
 * This is the critical endpoint that allows the CLI to fetch
 * the latest legitimate licenses for validation
 */
app.get('/legitimate-licenses.json', (req, res) => {
  try {
    const database = loadPublicRegistry()

    // Add CORS headers for CLI access
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET')
    res.header('Cache-Control', 'public, max-age=300') // Cache for 5 minutes

    res.json(database)
  } catch (error) {
    console.error('Failed to serve license database:', error.message)
    res.status(500).json({
      error: 'Database temporarily unavailable',
      _metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        description: 'Error fallback response',
      },
    })
  }
})

/**
 * License database status endpoint
 */
app.get('/status', (req, res) => {
  try {
    const database = loadLicenseDatabase()
    const licenses = Object.keys(database).filter(key => key !== '_metadata')

    res.json({
      status: 'ok',
      metadata: database._metadata,
      licenseCount: licenses.length,
      recentLicenses: licenses.slice(-5), // Last 5 licenses (keys only)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.listen(PORT, () => {
  console.log('🚀 License webhook handler running')
  console.log(`📡 Port: ${PORT}`)
  console.log(`📄 Database: ${LICENSE_DATABASE_PATH}`)
  console.log(`💡 Webhook endpoint: /webhook`)
  console.log('')
  console.log('🔧 Setup instructions:')
  console.log('1. Configure Stripe webhook to point to this endpoint')
  console.log(
    '2. Add webhook events: checkout.session.completed, invoice.payment_succeeded'
  )
  console.log('3. Set STRIPE_WEBHOOK_SECRET from Stripe dashboard')
  console.log('')
})

module.exports = app
