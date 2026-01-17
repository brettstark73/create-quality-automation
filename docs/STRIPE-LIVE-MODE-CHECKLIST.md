# Stripe Live Mode Checklist

Quick reference for deploying QA Architect to Stripe live mode.

## Pre-Deployment Checklist

- [ ] Stripe account verified for live payments
- [ ] SSL certificate configured for webhook endpoint
- [ ] Hosting platform ready (Vercel, Railway, Fly.io, etc.)
- [ ] License signing keys generated
- [ ] Backup strategy for license database

## Stripe Configuration

- [ ] Get live secret key (sk*live*...)
- [ ] Get live publishable key (pk*live*...)
- [ ] Create webhook endpoint in Stripe Dashboard
- [ ] Get webhook signing secret (whsec\_...)
- [ ] Verify price IDs match products

## Server Deployment

- [ ] Set `STRIPE_SECRET_KEY` environment variable
- [ ] Set `STRIPE_WEBHOOK_SECRET` environment variable
- [ ] Set `LICENSE_REGISTRY_PRIVATE_KEY_PATH` environment variable
- [ ] Set `LICENSE_REGISTRY_KEY_ID` environment variable
- [ ] Deploy webhook-handler.js to server
- [ ] Verify webhook endpoint is accessible via HTTPS

## Client Deployment

- [ ] Update billing dashboard with live publishable key
- [ ] Deploy billing dashboard to static hosting
- [ ] Update marketing links to billing page

## Testing

- [ ] Test webhook with Stripe CLI
- [ ] Complete end-to-end purchase flow
- [ ] Verify license generation
- [ ] Verify license validation in CLI
- [ ] Test subscription cancellation flow
- [ ] Test subscription renewal

## Monitoring

- [ ] Set up Stripe Dashboard alerts
- [ ] Configure webhook failure notifications
- [ ] Enable fraud detection rules
- [ ] Set up license database backups
- [ ] Configure error logging/monitoring

## Security

- [ ] Keys stored in secure environment variables (not code)
- [ ] Webhook signature verification enabled
- [ ] Rate limiting configured on public endpoints
- [ ] License database access restricted
- [ ] Regular key rotation scheduled

## Documentation

- [ ] Team trained on live mode operations
- [ ] Incident response plan documented
- [ ] Rollback procedures tested
- [ ] Customer support scripts updated

## Post-Launch

- [ ] Monitor first 24 hours closely
- [ ] Review Stripe logs for issues
- [ ] Verify email receipts working
- [ ] Check license database backups
- [ ] Update marketing materials

## Rollback Plan

If issues occur:

1. Switch billing dashboard to test mode
2. Revert environment variables
3. Notify affected customers
4. Investigate and fix
5. Resume after validation

## Reference

Full guide: [STRIPE-LIVE-MODE-DEPLOYMENT.md](STRIPE-LIVE-MODE-DEPLOYMENT.md)
