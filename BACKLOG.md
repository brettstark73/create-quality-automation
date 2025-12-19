# qa-architect - Backlog

**Last Updated**: 2025-12-19
**Priority System**: P0 (Critical) → P1 (Important) → P2 (Nice-to-have) → P3 (Future)

## P0 - Critical (Blocking Revenue)

- [ ] **Deploy Stripe payment flow** - Enable Pro tier purchases
  - Create Stripe products (Pro Monthly $19, Pro Annual $190)
  - Deploy webhook handler to Vercel
  - Add checkout to vibebuildlab.com/qa-architect
  - Test end-to-end purchase flow

## P1 - Important (Should Do Soon)

- [ ] **Landing page improvements** - Better conversion
  - Add live demo / playground
  - Customer testimonials (when available)
  - Comparison table vs manual setup

- [ ] **Usage analytics** - Understand adoption
  - Anonymous telemetry opt-in
  - Track which features used most
  - Identify upgrade triggers

## P2 - Recommended (Post-Launch)

- [ ] **Team tier implementation** - Per-seat licensing
  - Org management dashboard
  - Shared quota tracking
  - Team policy enforcement
  - Slack/email alerts

- [ ] **Performance budgets** - Q1 2026 roadmap item
  - Bundle size limits
  - Lighthouse score thresholds
  - Build time budgets

## P3 - Future Enhancements

- [ ] **Enterprise tier** - Large org features
  - SSO/SAML integration
  - Custom risk patterns
  - Audit log export
  - Compliance pack (SOC2, GDPR)
  - Dedicated TAM + SLA

- [ ] **On-prem license server** - Air-gapped environments
  - Self-hosted validation
  - Offline activation

- [ ] **Additional languages** - Go, Java support
  - Go module dependency monitoring
  - Maven/Gradle integration
