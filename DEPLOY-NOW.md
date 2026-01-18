# Deploy Webhook Handler to Vercel - Quick Start

**Time**: 5 minutes
**Cost**: Free (Vercel Hobby tier)

## Step 1: Deploy to Vercel

```bash
vercel

# Answer prompts:
# - Set up and deploy? YES
# - Which scope? [Your account]
# - Link to existing project? NO
# - Project name? qa-architect-webhook
# - Directory? ./
# - Override settings? NO
```

After deployment, you'll get a URL like:
`https://qa-architect-webhook.vercel.app`

**Save this URL** - you'll need it for Stripe webhook configuration.

## Step 2: Get Stripe Live Keys

### 2.1 Secret Key

1. Go to https://dashboard.stripe.com/apikeys
2. Toggle to **Live mode** (top right)
3. Reveal **Secret key** (starts with `sk_live_`)
4. Copy it

### 2.2 Webhook Signing Secret

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://qa-architect-webhook.vercel.app/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Click **Add endpoint**
6. Reveal **Signing secret** (starts with `whsec_`)
7. Copy it

### 2.3 Publishable Key

1. Still in https://dashboard.stripe.com/apikeys (Live mode)
2. Copy **Publishable key** (starts with `pk_live_`)

## Step 3: Set Vercel Environment Variables

### Option A: Via Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select **qa-architect-webhook** project
3. Settings → Environment Variables
4. Add these (all for **Production** environment):

```
STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxxxxxx
LICENSE_REGISTRY_KEY_ID = production
```

5. For private key:

```bash
# Copy base64-encoded key to clipboard
cat /tmp/private-key-base64.txt | pbcopy  # macOS
# or
cat /tmp/private-key-base64.txt | xclip -selection clipboard  # Linux
```

Then in Vercel Dashboard:

```
LICENSE_REGISTRY_PRIVATE_KEY = [paste base64 string]
```

### Option B: Via CLI

```bash
# Add each variable
vercel env add STRIPE_SECRET_KEY production
# Paste: sk_live_xxxxxxxxxxxxxxxxxxxxx

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_xxxxxxxxxxxxxxxxxx

vercel env add LICENSE_REGISTRY_KEY_ID production
# Type: production

vercel env add LICENSE_REGISTRY_PRIVATE_KEY production
# Paste contents of /tmp/private-key-base64.txt
```

## Step 4: Redeploy with Environment Variables

```bash
vercel --prod
```

## Step 5: Verify Deployment

```bash
# Test health check
curl https://qa-architect-webhook.vercel.app/status

# Should return:
# {"status":"ok","timestamp":"..."}
```

## Step 6: Update Billing Dashboard

Edit `lib/billing-dashboard.html` line 138:

```diff
- const stripe = Stripe('pk_test_your_stripe_publishable_key_here')
+ const stripe = Stripe('pk_live_xxxxxxxxxxxxxxxxxxxxx')
```

## Step 7: Deploy Billing Dashboard

```bash
# Deploy billing dashboard to Vercel
cd lib
vercel --prod

# You'll get a URL like:
# https://billing-dashboard-xxxxx.vercel.app

# Update marketing materials with this URL
```

## Step 8: Test End-to-End

1. Open your live billing dashboard URL
2. Click "Get Started" for Pro tier ($49/mo)
3. Use a **real payment method** (no test cards in live mode!)
4. Complete checkout
5. Check Vercel logs: `vercel logs qa-architect-webhook --prod`
6. License should be generated with format: `QAA-LIVE-XXXX-XXXX-XXXX`
7. Test CLI: `npx create-qa-architect@latest --license QAA-LIVE-XXXX-XXXX-XXXX`

## Monitoring

```bash
# View webhook logs
vercel logs qa-architect-webhook --prod --follow

# View Stripe events
# Go to: https://dashboard.stripe.com/events
# Filter: Live mode
```

## Troubleshooting

### Webhook signature verification fails

```bash
vercel logs qa-architect-webhook --prod
# Check STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
```

### License not generated

1. Check Vercel logs for errors
2. Verify private key is set correctly
3. Check Stripe event was received

### 500 Internal Server Error

- Verify all environment variables are set
- Check Vercel function logs for specific error

## Done!

You're now processing real payments and generating PRO licenses automatically! 🎉

**Next**: Monitor first 5 transactions closely via Vercel logs and Stripe Dashboard.
