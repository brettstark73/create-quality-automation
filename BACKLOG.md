# qa-architect - Backlog

**Last Updated**: 2026-01-01
**Priority**: Value-based (Revenue + Retention + Differentiation) ÷ Effort

---

## 🚨 Technical Debt (Deep Review 2025-12-31)

| ID   | Issue                                       | Severity | Location                       | Status   |
| ---- | ------------------------------------------- | -------- | ------------------------------ | -------- |
| TD9  | `/status` exposes license keys without auth | High     | `webhook-handler.js:481-494`   | ✅ Fixed |
| TD10 | Timing attacks on hash comparisons          | High     | `license-validator.js:225,385` | ✅ Fixed |
| TD11 | ESLint object injection warning             | Medium   | `webhook-handler.js:169`       | ✅ Fixed |
| TD12 | Silent catch in verifySignature()           | Medium   | `license-validator.js:355-362` | ✅ Fixed |
| TD13 | stableStringify no circular ref protection  | Medium   | `license-signing.js:5-17`      | ✅ Fixed |
| TD14 | buildLicensePayload no input validation     | Medium   | `license-signing.js:31-48`     | ✅ Fixed |
| TD15 | License key regex duplicated 3x             | Low      | Multiple files                 | ✅ Fixed |
| TD1  | Hardcoded dev secret fallback               | Critical | `licensing.js:396`             | ✅ Fixed |
| TD2  | `setup.js` 2100+ lines needs split          | P0       | `setup.js` → `/lib/commands/`  | ✅ Fixed |
| TD3  | Command injection in linkinator call        | Medium   | `prelaunch-validator.js:281`   | ✅ Fixed |
| TD4  | Unused `_vars` bypass ESLint                | Medium   | Multiple files                 | ✅ Fixed |
| TD5  | No rate limiting on GitHub API              | Medium   | `lib/github-api.js`            | ✅ Fixed |
| TD6  | Missing security headers on webhook         | Low      | `webhook-handler.js`           | ✅ Fixed |
| TD7  | Inconsistent async patterns                 | Low      | `lib/validation/index.js`      | N/A      |
| TD8  | Commented-out validation code               | Low      | `setup.js:1371`                | ✅ Fixed |

---

## 🚨 Deep Review Findings (2026-01-01)

### Critical Issues (Fix Immediately)

| ID  | Issue                                        | Severity | Location                         | Status   |
| --- | -------------------------------------------- | -------- | -------------------------------- | -------- |
| DR1 | Webhook database write failures lose revenue | Critical | `webhook-handler.js:156-162`     | ✅ Fixed |
| DR2 | Network failures reject valid licenses       | Critical | `license-validator.js:236-241`   | ✅ Fixed |
| DR3 | Corrupted license crashes CLI                | Critical | `license-validator.js:355-381`   | ✅ Fixed |
| DR4 | Subscription cancellation errors swallowed   | Critical | `webhook-handler.js:483-502`     | ✅ Fixed |
| DR5 | Rate limiter failures silently consumed      | Critical | `lib/github-api.js:18-41`        | ✅ Fixed |
| DR6 | Template loader skips failed files           | Critical | `lib/template-loader.js:172-178` | ✅ Fixed |

### High Priority Issues (Fix This Sprint)

| ID   | Issue                                         | Severity | Location                           | Status        |
| ---- | --------------------------------------------- | -------- | ---------------------------------- | ------------- |
| DR7  | No validation on Stripe event payloads        | High     | `webhook-handler.js`               | ✅ Fixed      |
| DR8  | Usage tracking corruption resets quotas       | High     | `lib/licensing.js:875-914`         | ✅ Fixed      |
| DR9  | Public DB endpoint returns fallback on error  | High     | `webhook-handler.js:523-544`       | ✅ Fixed      |
| DR10 | Developer mode ELOOP warning doesn't halt     | High     | `lib/licensing.js:292-308`         | ✅ Fixed      |
| DR11 | Cache clear failures are silent               | High     | `lib/validation/cache-manager.js`  | ✅ Fixed      |
| DR12 | GitHub API assumes JSON responses             | High     | `lib/github-api.js:134-152`        | ✅ Fixed      |
| DR13 | License database won't scale beyond 10k users | High     | `webhook-handler.js:130-149`       | 📋 TODO Added |
| DR14 | No caching on license validation              | High     | `lib/license-validator.js`         | ✅ Fixed      |
| DR15 | /status endpoint unauthenticated              | High     | `webhook-handler.js:549-571`       | ✅ Fixed      |
| DR16 | Signature verification error too generic      | High     | `lib/license-validator.js:451-454` | ✅ Fixed      |

### Medium Priority Issues (Fix Next Sprint)

| ID   | Issue                                         | Severity | Location                          | Status        |
| ---- | --------------------------------------------- | -------- | --------------------------------- | ------------- |
| DR17 | License DB signature not required in dev mode | Medium   | `license-validator.js:430-446`    | ✅ Fixed      |
| DR18 | Webhook handler exposes error details         | Medium   | `webhook-handler.js:386-387`      | ✅ Fixed      |
| DR19 | Missing rate limiting on public endpoints     | Medium   | `webhook-handler.js:523-543`      | ✅ Fixed      |
| DR20 | Stack traces may leak in error reporter       | Medium   | `lib/error-reporter.js:131-150`   | ✅ Fixed      |
| DR21 | Missing email validation before hashing       | Medium   | `license-validator.js:290-302`    | ✅ Fixed      |
| DR22 | package.json read returns null on all errors  | Medium   | `smart-strategy-generator.js:158` | ✅ Fixed      |
| DR23 | Mutable exported constants (LICENSE_TIERS)    | Medium   | `lib/licensing.js`                | ✅ Fixed      |
| DR24 | No tier validation in saveLicense()           | Medium   | `lib/licensing.js`                | ✅ Fixed      |
| DR25 | Inconsistent result types across modules      | Medium   | Multiple files                    | ✅ Fixed      |
| DR26 | setup.js still 2201 lines despite TD2         | Medium   | `setup.js`                        | 📋 Documented |
| DR27 | Mixed async patterns (callbacks vs async)     | Medium   | `lib/licensing.js:763-816`        | ✅ Fixed      |

### Low Priority Issues (Address When Convenient)

| ID   | Issue                                        | Severity | Location                     | Status  |
| ---- | -------------------------------------------- | -------- | ---------------------------- | ------- |
| DR28 | Missing helmet.js for security headers       | Low      | `webhook-handler.js:93-121`  | Pending |
| DR29 | GitHub token exposure in error messages      | Low      | `lib/github-api.js:146-150`  | Pending |
| DR30 | License DB hash uses unstable JSON.stringify | Low      | `webhook-handler.js:180-183` | Pending |
| DR31 | Missing input validation on webhook events   | Low      | `webhook-handler.js:392-407` | Pending |

---

## 🔥 High Value - Next Up

| ID  | Feature                    | Value Drivers      | Effort | Tier                            | Status         |
| --- | -------------------------- | ------------------ | ------ | ------------------------------- | -------------- |
| Q1  | **Lighthouse CI**          | Diff:5 Ret:4 Rev:3 | S      | Free (basic) / Pro (thresholds) | 🔄 In Progress |
| Q2  | **Bundle size limits**     | Diff:4 Ret:4 Rev:3 | S      | Pro                             | Pending        |
| Q3  | **axe-core accessibility** | Diff:4 Ret:3 Rev:2 | S      | Free                            | Pending        |
| Q4  | **Conventional commits**   | Diff:3 Ret:4 Rev:2 | S      | Free                            | Pending        |
| Q5  | **Coverage thresholds**    | Diff:3 Ret:4 Rev:3 | S      | Pro                             | Pending        |

## 📊 Medium Value - Worth Doing

| ID  | Feature                        | Value Drivers      | Effort | Tier | Status  |
| --- | ------------------------------ | ------------------ | ------ | ---- | ------- |
| Q6  | **Semgrep integration**        | Diff:4 Ret:3 Rev:3 | M      | Pro  | Pending |
| Q7  | **Dead code detection (knip)** | Diff:3 Ret:3 Rev:2 | S      | Free | Pending |
| Q8  | **License checker**            | Diff:3 Ret:2 Rev:2 | S      | Pro  | Pending |
| Q9  | **Changelog generation**       | Diff:2 Ret:3 Rev:2 | S      | Free | Pending |
| Q10 | **E2E test scaffolding**       | Diff:3 Ret:3 Rev:2 | M      | Pro  | Pending |

## 📚 Business & Infrastructure

| ID  | Feature                      | Value Drivers | Effort | Status   |
| --- | ---------------------------- | ------------- | ------ | -------- |
| B1  | **Copy Stripe to live mode** | Rev:5         | S      | 🔜 Ready |
| B2  | **Usage analytics**          | Rev:3 Ret:3   | M      | Pending  |
| B3  | **Team tier implementation** | Rev:4 Diff:3  | L      | Pending  |
| B4  | **Enterprise tier**          | Rev:5 Diff:4  | XL     | Future   |

## Completed ✅

| ID  | Feature                             | Completed  |
| --- | ----------------------------------- | ---------- |
| ✓   | SOTA audit: TD1-TD4 security/arch   | 2025-12-30 |
| ✓   | Pre-launch validation suite (5.3.0) | 2025-12-29 |
| ✓   | Quality tools integration (5.2.0)   | 2025-12-29 |
| ✓   | Stripe payment flow (test mode)     | 2025-12-23 |
| ✓   | Landing page comparison table       | 2025-12-23 |
| ✓   | Terminal demo animation             | 2025-12-26 |
| ✓   | Expanded FAQs                       | 2025-12-26 |

---

## Tier Assignment Rationale

**Free Tier** - Accessible quality essentials:

- Lighthouse CI (basic scores without thresholds)
- axe-core accessibility (basic WCAG checks)
- Conventional commits (commitlint)
- Dead code detection (knip)
- Changelog generation

**Pro Tier** ($19/mo) - Advanced quality controls:

- Lighthouse CI with custom thresholds & budgets
- Bundle size limits (size-limit)
- Coverage thresholds enforcement
- Semgrep advanced static analysis
- License compliance checking
- E2E test scaffolding (Playwright/Cypress)

**Team/Enterprise** - Org-level features:

- Dashboard & reporting
- Slack/email alerts
- Custom policies
- SSO/SAML
