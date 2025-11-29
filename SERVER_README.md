# Server-Side License Management

**These files are server-side only and NOT included in the npm package.**

## Files

- **webhook-handler.js** - Express server for Stripe webhook integration
- **admin-license.js** - Manual license database management tool

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Stripe Webhook │────▶│  webhook-handler │────▶│ License Database│
│                 │     │      (Server)    │     │     (JSON)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           │ HTTPS GET
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  CLI Activation │
                                                  │   (User Side)   │
                                                  └─────────────────┘
```

## Usage

### Webhook Handler (Automatic)

Processes Stripe webhooks and populates license database automatically.

```bash
# Install server dependencies
npm install express stripe

# Set environment variables
export STRIPE_SECRET_KEY=sk_live_...
export STRIPE_WEBHOOK_SECRET=whsec_...
export LICENSE_DATABASE_PATH=/var/lib/qaa/legitimate-licenses.json
export PORT=3000

# Run webhook handler
node webhook-handler.js

# Configure Stripe webhook endpoint:
# URL: https://your-domain.com/webhook
# Events: checkout.session.completed, invoice.payment_succeeded
```

### Admin Tool (Manual)

Manually add licenses to the database (useful for testing or special cases).

```bash
# Add a license manually
node admin-license.js QAA-1234-ABCD-5678-EF90 cus_customer123 PRO false user@example.com

# Arguments:
# 1. License key (QAA-XXXX-XXXX-XXXX-XXXX format)
# 2. Stripe customer ID
# 3. Tier (PRO or ENTERPRISE)
# 4. Founder status (true/false)
# 5. Purchase email
```

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

### Quick Deployment Options

1. **Vercel/Netlify Functions** - Deploy webhook-handler.js as serverless function
2. **Docker Container** - Package webhook handler in container
3. **Traditional Server** - Run with PM2 or systemd
4. **CDN Distribution** - Serve license database via CDN (Cloudflare, AWS CloudFront)

### Serving the License Database

The CLI fetches licenses from `QAA_LICENSE_DB_URL` (default: `https://license.aibuilderlab.com/qaa/legitimate-licenses.json`).

**Option 1: Direct from webhook handler**

- Webhook handler already serves `/legitimate-licenses.json` endpoint
- Point `QAA_LICENSE_DB_URL` to your webhook handler URL

**Option 2: CDN/Static hosting**

- Upload `legitimate-licenses.json` to CDN/S3
- Point `QAA_LICENSE_DB_URL` to CDN URL
- More scalable, faster for global users

## Security

- **Webhook handler requires STRIPE_SECRET_KEY** - Server-side only, NEVER in client code
- **License database is public** - Contains license keys and tiers only, no sensitive data
- **SHA256 integrity checking** - Database includes `_metadata.sha256` for verification
- **No secrets in CLI** - Users download signed registry, validate locally

## Dependencies

**Server-only (NOT in main package.json dependencies)**:

- express@^4.18.0 or later
- stripe@^14.25.0 or later

These are only needed on the server running webhook-handler.js, not for CLI users.

**Installation**:

```bash
# Install server dependencies (on your server only)
npm install express stripe

# Or use a separate package.json in server/ directory
cd server/
npm init -y
npm install express stripe
```

**Note**: These dependencies are deliberately NOT in the main package.json to keep the CLI package lightweight for end users.

## Testing

```bash
# Test admin tool
node admin-license.js QAA-TEST-1234-5678-ABCD cus_test PRO false test@example.com

# Verify database created
cat ~/.create-qa-architect/legitimate-licenses.json

# Test webhook handler
# (Requires Stripe webhook secret and test event)
curl -X POST http://localhost:3000/webhook \
  -H "stripe-signature: ..." \
  -d @test-event.json
```

## Not For NPM Users

**Important**: These server-side tools are intentionally excluded from the npm package.

- CLI users only need the published license database URL
- Server operators clone the git repository for these tools
- This keeps the npm package lightweight (no express/stripe dependencies for CLI users)
