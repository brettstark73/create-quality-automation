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
const os = require('os')
const path = require('path')
const express = require('express')
const {
  LICENSE_KEY_PATTERN,
  buildLicensePayload,
  hashEmail,
  signPayload,
  stableStringify,
  loadKeyFromEnv,
} = require('./lib/license-signing')

/**
 * Validate that a database path is within allowed directories (cwd or home)
 * Security: Prevents path traversal attacks via environment variables
 */
function validateDatabasePath(envPath, defaultPath) {
  const cwd = process.cwd()
  const home = os.homedir()
  const resolved = path.resolve(cwd, envPath || defaultPath)

  // Must be within cwd or home directory
  const isInCwd = resolved.startsWith(cwd + path.sep) || resolved === cwd
  const isInHome = resolved.startsWith(home + path.sep) || resolved === home

  if (!isInCwd && !isInHome) {
    console.error(
      `❌ Database path must be within cwd or home directory: ${envPath}`
    )
    console.error(`   Using default: ${defaultPath}`)
    return path.resolve(cwd, defaultPath)
  }

  return resolved
}

// Environment variables required
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
// Security: Validate paths to prevent traversal attacks
const LICENSE_DATABASE_PATH = validateDatabasePath(
  process.env.LICENSE_DATABASE_PATH,
  './legitimate-licenses.json'
)
const LICENSE_PUBLIC_DATABASE_PATH = validateDatabasePath(
  process.env.LICENSE_PUBLIC_DATABASE_PATH,
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

/**
 * DR19 fix: Simple in-memory rate limiter for public endpoints
 * Prevents abuse of health check and license database endpoints
 */
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
    this.requests = new Map() // ip -> [timestamps]
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown'
      const now = Date.now()

      // Get existing requests for this IP
      let timestamps = this.requests.get(ip) || []

      // Remove expired timestamps (outside the window)
      timestamps = timestamps.filter(ts => now - ts < this.windowMs)

      // Check if limit exceeded
      if (timestamps.length >= this.maxRequests) {
        const oldestTimestamp = timestamps[0]
        const retryAfter = Math.ceil(
          (oldestTimestamp + this.windowMs - now) / 1000
        )

        res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        })
        return
      }

      // Add current request
      timestamps.push(now)
      this.requests.set(ip, timestamps)

      // Cleanup old entries periodically (every 100 requests)
      if (this.requests.size > 100) {
        for (const [key, value] of this.requests.entries()) {
          const filtered = value.filter(ts => now - ts < this.windowMs)
          if (filtered.length === 0) {
            this.requests.delete(key)
          }
        }
      }

      next()
    }
  }
}

// Create rate limiters for different endpoints
const healthRateLimiter = new RateLimiter(60000, 60) // 60 requests per minute
const dbRateLimiter = new RateLimiter(60000, 30) // 30 requests per minute

const app = express()

// TD6 fix: Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY')
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  // XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block')
  // Strict Content Security Policy for API endpoints
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  )
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Permissions policy - disable unnecessary browser features
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  )
  // HSTS - only set in production (when HTTPS is guaranteed)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
  next()
})

// Raw body parser for Stripe webhooks
app.use('/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

/**
 * Load legitimate license database
 *
 * DR13 TODO: Migrate to SQLite for scaling beyond 10k users
 * - Current JSON file approach works for <10k licenses (~500KB)
 * - At 100k licenses (~5MB), JSON parsing becomes slow
 * - Write queue prevents corruption but doesn't scale beyond ~10 req/sec
 * - Recommended: SQLite with indexed queries for PRO tier
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
  // Chain error handling but re-throw so callers can handle
  writeQueue = next.catch(error => {
    // Silent failure fix: Log write queue errors
    console.error(`⚠️  Database write queue error: ${error.message}`)
    throw error // Re-throw to propagate to caller
  })
  return writeQueue
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
    // TD11 fix: Validate license key format to prevent object injection
    // and silence ESLint security/detect-object-injection warning
    if (!LICENSE_KEY_PATTERN.test(licenseKey)) {
      console.warn(`Skipping invalid license key format: ${licenseKey}`)
      return
    }
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
    // TD11: Safe - licenseKey is validated against LICENSE_KEY_PATTERN above
    // eslint-disable-next-line security/detect-object-injection
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
      // TD15 fix: Use shared constant for license key pattern
      if (
        typeof licenseKey !== 'string' ||
        !LICENSE_KEY_PATTERN.test(licenseKey)
      ) {
        console.error('Invalid license key format:', licenseKey)
        throw new Error(`Invalid license key format: ${licenseKey}`)
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

      const saveResult = saveLicenseDatabase(database)
      if (!saveResult) {
        // DR1 fix: CRITICAL - Payment succeeded but license not saved
        console.error(`❌ CRITICAL: Payment processed but license save failed`)
        console.error(`   License Key: ${licenseKey}`)
        console.error(
          `   Customer: ${customerInfo.email || customerInfo.customerId}`
        )
        console.error(`   Action: Manual license activation required`)
        throw new Error(
          'License database save failed - payment succeeded but license not activated'
        )
      }
      return saveResult
    } catch (error) {
      // DR1 fix: Re-throw to trigger Stripe webhook retry
      console.error(`❌ Error adding license to database: ${error.message}`)
      console.error(`   License Key: ${licenseKey}`)
      console.error(
        `   Customer: ${customerInfo.email || customerInfo.customerId}`
      )
      throw error
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
    // DR18 fix: Don't expose error details in production
    const clientMessage =
      process.env.NODE_ENV === 'production'
        ? 'Webhook signature verification failed'
        : `Webhook Error: ${err.message}`
    return res.status(400).send(clientMessage)
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

    // DR7 fix: Validate session structure
    if (!session.customer || !session.subscription) {
      throw new Error(
        'Invalid checkout session: missing customer or subscription'
      )
    }

    const stripe = require('stripe')(STRIPE_SECRET_KEY)

    // Get customer details
    const customer = await stripe.customers.retrieve(session.customer)

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    )

    // DR7 fix: Validate subscription structure
    if (
      !subscription.items ||
      !subscription.items.data ||
      subscription.items.data.length === 0
    ) {
      throw new Error('Invalid subscription: missing items data')
    }

    const priceId = subscription.items.data[0].price?.id
    if (!priceId) {
      throw new Error('Invalid subscription: missing price ID')
    }

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
  console.log(`❌ Subscription canceled: ${subscription.id}`)
  console.log(`   Customer: ${subscription.customer}`)

  try {
    // DR4 fix: Implement license deactivation with proper error handling
    const database = loadLicenseDatabase()
    let licenseFound = false

    Object.keys(database).forEach(key => {
      if (key === '_metadata') return
      // eslint-disable-next-line security/detect-object-injection -- key is from Object.keys(), safe
      if (database[key].subscriptionId === subscription.id) {
        // eslint-disable-next-line security/detect-object-injection
        database[key].status = 'canceled'
        // eslint-disable-next-line security/detect-object-injection
        database[key].canceledAt = new Date().toISOString()
        licenseFound = true
        console.log(`   Marking license ${key} as canceled`)
      }
    })

    if (!licenseFound) {
      console.warn(`⚠️  No license found for subscription ${subscription.id}`)
      return // Not an error - license may have been manually removed
    }

    const saveResult = saveLicenseDatabase(database)
    if (!saveResult) {
      throw new Error(
        `Failed to save license cancellation for subscription ${subscription.id}`
      )
    }

    console.log(`✅ License deactivated for subscription ${subscription.id}`)
  } catch (error) {
    // DR4 fix: Re-throw to trigger webhook retry instead of silently failing
    console.error(`❌ CRITICAL: Subscription cancellation processing failed`)
    console.error(`   Subscription: ${subscription.id}`)
    console.error(`   Error: ${error.message}`)
    console.error(`   ACTION REQUIRED: Manually deactivate license`)
    throw error
  }
}

/**
 * Health check endpoint
 * DR19 fix: Add rate limiting to prevent DoS
 */
app.get('/health', healthRateLimiter.middleware(), (req, res) => {
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
 * DR19 fix: Add rate limiting to prevent abuse
 */
app.get('/legitimate-licenses.json', dbRateLimiter.middleware(), (req, res) => {
  try {
    const database = loadPublicRegistry()

    // Add CORS headers for CLI access
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET')
    res.header('Cache-Control', 'public, max-age=300') // Cache for 5 minutes

    res.json(database)
  } catch (error) {
    // DR9 fix: Return proper error status so clients know to retry with cache
    console.error('Failed to serve license database:', error.message)
    res.status(503).json({
      error: 'License database temporarily unavailable',
      message: 'Please retry shortly or use cached license data',
      retryAfter: 60,
    })
  }
})

/**
 * License database status endpoint
 * DR15 fix: Requires authentication
 */
app.get('/status', (req, res) => {
  // DR15 fix: Require Bearer token authentication
  const authHeader = req.headers.authorization
  const expectedToken = process.env.STATUS_API_TOKEN || 'disabled'

  if (expectedToken === 'disabled') {
    return res.status(503).json({
      error:
        'Status endpoint is disabled. Set STATUS_API_TOKEN env var to enable.',
    })
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: Bearer token required' })
  }

  const token = authHeader.substring(7)
  // Use constant-time comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token)
  const expectedBuffer = Buffer.from(expectedToken)

  // Ensure buffers are same length to prevent length-based timing attacks
  if (tokenBuffer.length !== expectedBuffer.length) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' })
  }

  if (!crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' })
  }

  try {
    const database = loadLicenseDatabase()
    const licenses = Object.keys(database).filter(key => key !== '_metadata')

    // TD9 fix: Don't expose actual license keys - show masked versions for debugging
    const maskedRecent = licenses.slice(-5).map(key => {
      const parts = key.split('-')
      return parts.length === 5
        ? `${parts[0]}-****-****-****-${parts[4]}`
        : '****'
    })

    res.json({
      status: 'ok',
      metadata: database._metadata,
      licenseCount: licenses.length,
      recentLicenses: maskedRecent,
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
