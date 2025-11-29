# Webhook Handler Deployment Guide

This guide explains how to deploy the license webhook handler for production use with create-qa-architect.

## Architecture Overview

```
💳 Stripe → 🌐 Webhook Handler → 📄 License Database → 🖥️ CLI
```

1. **Stripe** sends payment webhooks to your server
2. **Webhook Handler** processes payments and updates license database
3. **License Database** is served via HTTP endpoint
4. **CLI** fetches latest database during license activation

## Prerequisites

- Node.js 20+ server environment
- Stripe account with webhook capability
- Domain with SSL/HTTPS support
- Environment for running Express.js application

## 1. Server Setup

### Deploy webhook-handler.js

```bash
# On your server
git clone your-repo
cd create-qa-architect
npm install express stripe

# Or copy just the webhook handler
cp webhook-handler.js /path/to/your/server/
npm install express stripe
```

### Environment Variables

Create `.env` file on your server:

```env
# Required
STRIPE_SECRET_KEY=sk_live_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Stripe webhook endpoint secret

# Optional
PORT=3000  # Server port (default: 3000)
LICENSE_DATABASE_PATH=/var/lib/cqa/legitimate-licenses.json  # Database file path
```

### Start the Server

```bash
# Production
node webhook-handler.js

# With PM2 (recommended)
npm install -g pm2
pm2 start webhook-handler.js --name "cqa-license-webhook"
pm2 startup
pm2 save
```

## 2. Stripe Configuration

### Create Webhook Endpoint

1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/webhook`
4. Select events to listen for:
   - `checkout.session.completed` (required)
   - `invoice.payment_succeeded` (recommended)
   - `customer.subscription.deleted` (optional)
5. Copy the webhook secret to your `.env` file

### Configure Price IDs

Update the price mapping in webhook-handler.js:

```javascript
function mapPriceToTier(priceId) {
  const priceMapping = {
    price_1ABC123: { tier: 'PRO', isFounder: false },
    price_1XYZ789: { tier: 'PRO', isFounder: true },
    price_1DEF456: { tier: 'ENTERPRISE', isFounder: false },
    price_1GHI789: { tier: 'ENTERPRISE', isFounder: true },
  }
  return priceMapping[priceId] || { tier: 'PRO', isFounder: false }
}
```

## 3. CLI Configuration

### Update License Database Endpoints

Edit `lib/license-validator.js` to point to your server:

```javascript
const endpoints = [
  'https://your-domain.com/legitimate-licenses.json',
  'https://your-backup-domain.com/legitimate-licenses.json',
]
```

### Test CLI Connection

```bash
# Test that CLI can fetch license database
curl https://your-domain.com/legitimate-licenses.json

# Test full activation flow
npx create-qa-architect@latest --activate-license
```

## 4. Production Considerations

### SSL/HTTPS

Stripe requires HTTPS for webhooks. Use:

- Let's Encrypt for free SSL certificates
- Cloudflare for SSL termination
- Your hosting provider's SSL

### Database Backup

```bash
# Backup license database daily
0 2 * * * cp /var/lib/cqa/legitimate-licenses.json /backup/cqa-licenses-$(date +\%Y-\%m-\%d).json
```

### Monitoring

Monitor these endpoints:

- `GET /health` - Server health check
- `GET /status` - License database status
- `GET /legitimate-licenses.json` - CLI database access

### Rate Limiting

Add rate limiting to protect against abuse:

```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})

app.use('/legitimate-licenses.json', limiter)
```

### CORS Configuration

For production, restrict CORS to your domains:

```javascript
app.use('/legitimate-licenses.json', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://your-domain.com')
  next()
})
```

## 5. Testing

### Test Webhook Processing

```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Check database status
curl https://your-domain.com/status
```

### Test License Generation

Use Stripe's test mode to verify license generation:

1. Create test payment in Stripe dashboard
2. Webhook should add license to database
3. CLI should be able to fetch and validate license

### Verify CLI Integration

```bash
# Check CLI can access database
node -e "
const { LicenseValidator } = require('./lib/license-validator.js');
const v = new LicenseValidator();
v.fetchLegitimateDatabase().then(db => {
  console.log('Database keys:', Object.keys(db).length);
}).catch(console.error);
"
```

## 6. Troubleshooting

### Common Issues

**Webhook not receiving events:**

- Verify webhook URL is accessible externally
- Check Stripe webhook logs in dashboard
- Ensure HTTPS is properly configured

**CLI can't fetch database:**

- Test endpoint directly with curl
- Check CORS configuration
- Verify server is running and accessible

**License validation fails:**

- Check webhook processing created correct database entries
- Verify license key format matches expected pattern
- Test with known valid license key

### Debug Mode

Enable debug logging:

```bash
DEBUG=true node webhook-handler.js
```

### Logs

Check application logs:

```bash
# PM2 logs
pm2 logs cqa-license-webhook

# Direct logs
tail -f /var/log/cqa-webhook.log
```

## 7. Security Checklist

- [ ] HTTPS enabled for all endpoints
- [ ] Stripe webhook secret properly configured
- [ ] Environment variables secured (not in code)
- [ ] Rate limiting enabled on public endpoints
- [ ] Database file permissions restricted
- [ ] Server firewall configured
- [ ] Regular security updates applied

## 8. Scaling Considerations

For high-volume usage:

- **Load Balancing**: Use multiple webhook handler instances
- **Database**: Consider using Redis or PostgreSQL instead of JSON file
- **CDN**: Serve license database via CDN for global performance
- **Caching**: Implement intelligent caching with invalidation

## Support

For deployment issues:

- Check server logs first
- Test each component individually
- Verify Stripe webhook configuration
- Contact support with specific error messages and logs
