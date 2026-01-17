# Stripe Live Mode Deployment Guide

**Version**: 5.9.1+
**Last Updated**: 2026-01-17

This guide walks through migrating QA Architect from Stripe test mode to live mode for production payment processing.

## Prerequisites

- Stripe account verified for live mode
- Server/hosting for webhook handler (not distributed with CLI)
- SSL certificate for webhook endpoint (required by Stripe)
- License signing keys generated (see `lib/license-signing.js`)

## Overview

QA Architect uses Stripe for Pro tier subscriptions ($49/mo or $490/yr). The system has two components:

1. **Client-side**: Billing dashboard (`lib/billing-dashboard.html`) - Stripe Checkout
2. **Server-side**: Webhook handler (`webhook-handler.js`) - License generation

## Step 1: Get Live Mode Keys from Stripe

### 1.1 Secret Key (Server-side)

1. Go to Stripe Dashboard → Developers → API Keys
2. Reveal your **Live mode** secret key (starts with `sk_live_`)
3. Copy and store securely (never commit to git)

### 1.2 Publishable Key (Client-side)

1. In the same API Keys section
2. Copy your **Live mode** publishable key (starts with `pk_live_`)
3. This will be used in the billing dashboard

### 1.3 Webhook Signing Secret

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/webhook` (must be HTTPS)
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Click "Add endpoint"
6. Reveal and copy the webhook signing secret (starts with `whsec_`)

## Step 2: Configure Server Environment

### 2.1 Set Environment Variables

On your server (e.g., Vercel, Railway, Fly.io):

```bash
# Stripe live mode keys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx

# License signing (generate with lib/license-signing.js)
LICENSE_REGISTRY_PRIVATE_KEY_PATH=/path/to/private-key.pem
LICENSE_REGISTRY_KEY_ID=production

# Database paths (optional, defaults to ./legitimate-licenses.json)
LICENSE_DATABASE_PATH=/path/to/legitimate-licenses.json
LICENSE_PUBLIC_DATABASE_PATH=/path/to/legitimate-licenses.public.json

# Server port (optional, defaults to 3000)
PORT=3000
```

**Security Notes:**

- Never commit these keys to git
- Use your hosting provider's secret management (Vercel Env Vars, Railway Secrets, etc.)
- Rotate keys regularly
- Monitor Stripe logs for suspicious activity

### 2.2 Generate License Signing Keys

```bash
# Generate RSA key pair for license signing
node lib/license-signing.js --generate-keys

# This creates:
# - private-key.pem (keep secret, deploy to server)
# - public-key.pem (distribute with CLI package)
```

### 2.3 Deploy Webhook Handler

```bash
# Install server dependencies (not included in CLI package)
npm install express helmet stripe

# Deploy webhook-handler.js to your server
# Example for Vercel:
vercel deploy --prod

# Example for Railway:
railway up

# Example for traditional server:
pm2 start webhook-handler.js --name qa-architect-webhook
```

## Step 3: Update Client-side Billing Dashboard

### 3.1 Update Publishable Key

Edit `lib/billing-dashboard.html`:

```diff
- const stripe = Stripe('pk_test_your_stripe_publishable_key_here')
+ const stripe = Stripe('pk_live_xxxxxxxxxxxxxxxxxxxxx')
```

**Deployment Options:**

**Option A: Static hosting (recommended)**

- Deploy to Netlify, Vercel, or CloudFlare Pages
- Update links in marketing materials
- Example: `https://billing.vibebuildlab.com`

**Option B: Embed in marketing site**

- Copy HTML to your main site
- Ensure Stripe.js is loaded
- Keep publishable key updated

### 3.2 Update Price IDs (if changed)

In `webhook-handler.js`, verify Stripe price IDs match your live mode products:

```javascript
// Check these match your Stripe Dashboard → Products
const PRICE_TO_TIER = {
  price_1QZxxxxxxxxxxxxx: 'PRO', // $49/mo
  price_1QZxxxxxxxxxxxxx: 'PRO', // $490/yr
}
```

## Step 4: Test Live Mode

### 4.1 Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks to local server
stripe login
stripe listen --forward-to localhost:3000/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### 4.2 End-to-End Test

1. Open billing dashboard in browser
2. Select Pro tier
3. Use a **real payment method** (live mode has no test cards)
4. Complete checkout
5. Verify:
   - Webhook received and processed
   - License added to `legitimate-licenses.json`
   - License key format: `QAA-LIVE-XXXX-XXXX-XXXX`
   - Public database updated
   - Email sent to customer (if configured)

### 4.3 Verify License Validation

```bash
# Test CLI with new live license
npx create-qa-architect@latest --license QAA-LIVE-XXXX-XXXX-XXXX

# Should show:
# ✅ License validated: PRO tier
```

## Step 5: Monitor Production

### 5.1 Stripe Dashboard Monitoring

- Monitor live mode transactions
- Set up fraud detection rules
- Configure email receipts
- Enable dispute notifications

### 5.2 Webhook Logs

```bash
# Check webhook handler logs
pm2 logs qa-architect-webhook

# Or on Vercel/Railway, use platform logs
vercel logs
railway logs
```

### 5.3 License Database Backup

```bash
# Automate daily backups of license database
0 2 * * * /usr/local/bin/backup-licenses.sh

# Example backup script:
#!/bin/bash
cp /path/to/legitimate-licenses.json \
   /backups/licenses-$(date +%Y%m%d).json
```

## Rollback Plan

If issues occur in live mode:

1. **Immediate**: Switch billing dashboard back to test mode
2. **Update keys**: Revert environment variables to test mode
3. **Notify customers**: Email affected users
4. **Investigate**: Check webhook logs, Stripe dashboard
5. **Fix and redeploy**: Address issues, test thoroughly
6. **Resume live mode**: Only after validation

## Security Checklist

- [ ] Live keys stored in secure environment variables (not in code)
- [ ] Webhook endpoint uses HTTPS
- [ ] Webhook signature verification enabled
- [ ] Rate limiting configured on public endpoints
- [ ] License database backed up regularly
- [ ] Fraud detection rules configured in Stripe
- [ ] Email alerts configured for failed payments
- [ ] Monitoring/logging enabled
- [ ] Incident response plan documented

## Common Issues

### Webhook Signature Verification Fails

```
Error: Webhook signature verification failed
```

**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard → Webhooks

### License Not Generated After Payment

**Check**:

1. Webhook received? (check server logs)
2. Event type correct? (should be `checkout.session.completed`)
3. Price ID recognized? (check `PRICE_TO_TIER` mapping)
4. License signing key configured? (check `LICENSE_REGISTRY_PRIVATE_KEY_PATH`)

### Invalid License Key Format

**Verify**:

- License key format: `QAA-LIVE-XXXX-XXXX-XXXX`
- License payload signed correctly
- Public key distributed with CLI matches private key on server

## Support

For issues with Stripe live mode deployment:

1. Check Stripe Dashboard → Developers → Logs
2. Review webhook handler logs
3. Open issue: https://github.com/anthropics/qa-architect/issues
4. Email: support@vibebuildlab.com

## Next Steps

After successful live mode deployment:

1. Update marketing materials with live billing link
2. Configure email templates for receipts
3. Set up analytics tracking for conversions
4. Monitor first 24 hours closely
5. Document any custom modifications

---

**Questions?** See `webhook-handler.js` for implementation details or `lib/license-signing.js` for signing key generation.
