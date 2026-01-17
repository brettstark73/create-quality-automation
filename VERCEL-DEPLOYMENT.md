# Vercel Deployment Guide - QA Architect Webhook Handler

## Step 1: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Get Your Stripe Live Mode Keys

### 3.1 Secret Key

1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Reveal your **Live mode** secret key (starts with `sk_live_`)
3. Copy it - you'll need it in Step 4

### 3.2 Publishable Key

1. In the same page, copy your **Live mode** publishable key (starts with `pk_live_`)
2. Save for later (Step 6)

### 3.3 Webhook Signing Secret

⚠️ **Wait until AFTER first deployment to get this** (Step 5)

## Step 4: Deploy to Vercel

```bash
# Deploy from qa-architect directory
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Choose your account]
# - Link to existing project? No
# - What's your project name? qa-architect-webhook
# - In which directory is your code located? ./
```

After deployment, Vercel will give you a URL like:
`https://qa-architect-webhook.vercel.app`

## Step 5: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://qa-architect-webhook.vercel.app/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Click "Add endpoint"
6. **Reveal and copy the webhook signing secret** (starts with `whsec_`)

## Step 6: Set Environment Variables in Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select `qa-architect-webhook` project
3. Go to Settings → Environment Variables
4. Add these variables:

```
STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxxxxxx
LICENSE_REGISTRY_KEY_ID = production
PORT = 3000
```

5. For the private key, you have two options:

**Option 6A: Upload as Base64 (Easier)**

```bash
# In qa-architect directory
base64 -i private-key.pem | pbcopy  # macOS
# or
base64 private-key.pem | xclip -selection clipboard  # Linux
```

Then in Vercel Dashboard:

```
LICENSE_REGISTRY_PRIVATE_KEY_BASE64 = [paste from clipboard]
```

**Option 6B: Upload to Vercel Blob Storage (More Secure)**

- Upload `private-key.pem` to Vercel Blob Storage
- Set path: `LICENSE_REGISTRY_PRIVATE_KEY_PATH = /path/to/blob`

### Option B: Via CLI

```bash
vercel env add STRIPE_SECRET_KEY production
# Paste: sk_live_xxxxxxxxxxxxxxxxxxxxx

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_xxxxxxxxxxxxxxxxxx

vercel env add LICENSE_REGISTRY_KEY_ID production
# Type: production

vercel env add LICENSE_REGISTRY_PRIVATE_KEY_BASE64 production
# Paste base64-encoded private key (see Option 6A above)
```

## Step 7: Redeploy with Environment Variables

```bash
vercel --prod
```

## Step 8: Verify Deployment

### Test webhook endpoint:

```bash
curl https://qa-architect-webhook.vercel.app/status
# Should return: {"status":"ok","timestamp":"..."}
```

### Test with Stripe CLI:

```bash
stripe listen --forward-to https://qa-architect-webhook.vercel.app/webhook
stripe trigger checkout.session.completed
```

## Step 9: Update Billing Dashboard

1. Edit `lib/billing-dashboard.html` line 138:

```diff
- const stripe = Stripe('pk_test_your_stripe_publishable_key_here')
+ const stripe = Stripe('pk_live_xxxxxxxxxxxxxxxxxxxxx')
```

2. Deploy billing dashboard to static hosting:

**Option A: Vercel (Recommended)**

```bash
cd lib
vercel --prod billing-dashboard.html
```

**Option B: Netlify**

```bash
netlify deploy --prod --dir=lib --site=qa-architect-billing
```

3. Update link in marketing materials to new billing URL

## Step 10: Test End-to-End

1. Open live billing dashboard
2. Click "Get Started" for Pro tier
3. Use a **real payment method** (live mode has no test cards)
4. Complete checkout
5. Verify:
   - License generated in Vercel logs
   - License format: `QAA-LIVE-XXXX-XXXX-XXXX`
   - Test CLI: `npx create-qa-architect@latest --license QAA-LIVE-XXXX-XXXX-XXXX`

## Monitoring

### View Logs

```bash
vercel logs qa-architect-webhook --prod
```

### View Stripe Events

1. Go to [Stripe Dashboard → Events](https://dashboard.stripe.com/events)
2. Filter by "Live mode"
3. Check for successful webhook deliveries

## Troubleshooting

### Webhook signature verification fails

- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check Vercel logs for actual error: `vercel logs --prod`

### License not generated after payment

1. Check Vercel logs: `vercel logs --prod`
2. Verify price ID in `webhook-handler.js` matches Stripe product
3. Ensure private key is loaded correctly

### 500 Internal Server Error

- Check environment variables are set
- Verify private key is valid
- Check Vercel function logs

## Security Checklist

- [ ] Private key in environment variables (not in code)
- [ ] Private key NOT committed to git (.gitignore verified)
- [ ] Webhook signature verification enabled
- [ ] HTTPS only (Vercel default)
- [ ] Environment variables set to "Production" only
- [ ] Stripe Dashboard email alerts configured
- [ ] Monitor Vercel logs for first 24 hours

## Cost Estimate

- Vercel Hobby (Free): $0/month
  - 100GB bandwidth
  - Serverless functions included
  - Perfect for webhook handler

- If you exceed limits, Vercel Pro: $20/month

## Next Steps

After successful deployment:

1. Monitor first 5 live transactions closely
2. Set up Vercel monitoring/alerts
3. Configure Stripe email receipts
4. Update BACKLOG.md to mark B1 as deployed
5. Create backup cron for `legitimate-licenses.json`

---

**Questions?** Check `docs/STRIPE-LIVE-MODE-DEPLOYMENT.md` or open an issue.
