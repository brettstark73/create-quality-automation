# Stripe Environment Variables Setup

**Deployment**: ✅ Live at https://qa-architect.vercel.app
**Status**: ⚠️ Needs environment variables

## Quick Setup (5 minutes)

### Step 1: Get Your Stripe Keys

#### 1.1 Go to Stripe Dashboard

https://dashboard.stripe.com/apikeys

#### 1.2 Toggle to LIVE MODE (top right switch)

#### 1.3 Get Secret Key

- Click "Reveal test key token" on **Secret key**
- Copy the key (starts with `sk_live_`)
- **Keep this window open** - you'll need it

#### 1.4 Get Publishable Key

- Copy **Publishable key** (starts with `pk_live_`)

### Step 2: Configure Stripe Webhook

#### 2.1 Go to Webhooks

https://dashboard.stripe.com/webhooks

#### 2.2 Click "Add endpoint"

#### 2.3 Endpoint URL

```
https://qa-architect.vercel.app/webhook
```

#### 2.4 Select Events

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

#### 2.5 Click "Add endpoint"

#### 2.6 Get Signing Secret

- Click on your newly created endpoint
- Click "Reveal" under **Signing secret**
- Copy the secret (starts with `whsec_`)

### Step 3: Add Environment Variables to Vercel

#### 3.1 Go to Vercel Dashboard

https://vercel.com/vibebuildlab/qa-architect/settings/environment-variables

#### 3.2 Add These Variables (Production only)

**STRIPE_SECRET_KEY**

- Name: `STRIPE_SECRET_KEY`
- Value: `sk_live_xxxxxxxxxxxxxxxxxxxxx` (paste from Step 1.3)
- Environment: ✅ Production

**STRIPE_WEBHOOK_SECRET**

- Name: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_xxxxxxxxxxxxxxxxxx` (paste from Step 2.6)
- Environment: ✅ Production

**LICENSE_REGISTRY_KEY_ID**

- Name: `LICENSE_REGISTRY_KEY_ID`
- Value: `production`
- Environment: ✅ Production

**LICENSE_REGISTRY_PRIVATE_KEY**

- Name: `LICENSE_REGISTRY_PRIVATE_KEY`
- Value: [See Step 3.3 below]
- Environment: ✅ Production

#### 3.3 Get Private Key Base64

```bash
cat /tmp/private-key-base64.txt
# or regenerate:
base64 -i private-key.pem | tr -d '\n'
```

Copy the entire base64 string and paste as the value for `LICENSE_REGISTRY_PRIVATE_KEY`

### Step 4: Redeploy

After adding all 4 environment variables:

```bash
vercel --prod
```

Or click **Redeploy** in Vercel Dashboard → Deployments → Latest

### Step 5: Verify

```bash
curl https://qa-architect.vercel.app/status

# Should return:
# {"status":"ok","timestamp":"2026-01-17T..."}
```

## Summary Checklist

- [ ] Stripe Live Mode secret key (`sk_live_...`)
- [ ] Stripe webhook endpoint created
- [ ] Stripe webhook signing secret (`whsec_...`)
- [ ] 4 environment variables set in Vercel
- [ ] Redeployed to production
- [ ] `/status` endpoint returns 200 OK

## Next Steps

After verification succeeds:

1. Update billing dashboard with `pk_live_...` key
2. Deploy billing dashboard
3. Test real payment flow

---

**Currently**: Webhook handler deployed ✅ but waiting for environment variables ⏳
