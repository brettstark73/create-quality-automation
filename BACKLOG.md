# qa-architect - Backlog

**Last Updated**: 2026-01-10 (Evening)
**Priority**: Value-based (Revenue + Retention + Differentiation) ÷ Effort

---

## 🔍 Pending Review Items

| ID  | Item                                      | Priority | Notes                                                                                                                                                                              |
| --- | ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Review workflow path fix across all repos | Medium   | Fixed `quality.yml` to use `node_modules/create-qa-architect/lib/project-maturity.js` instead of `lib/project-maturity.js`. Verify fix is correct and update starter-kit template. |

---

## ✅ 98% Quality Achievement (2026-01-08)

**Quality Loop Complete** - Production-Perfect Standard Met

- **Fixed**: 54 issues across 18 files
- **Resolved**: 36 TypeScript errors, 18 silent failures
- **Security**: Grade A+ (no vulnerabilities)
- **Architecture**: 88/100 (excellent design patterns)
- **Performance**: Grade A (fast and efficient)
- **Documentation**: 7 new files added
- **Infrastructure**: 6 new command modules, 3 new infrastructure files
- **CI/CD**: All checks passing (tests, security, docs, linting)
- **PR**: #42 ready for review
- **Gitleaks**: Fixed false positives (corrected line numbers in .gitleaksignore)
- **Submodule**: Updated .claude-setup to v4.0.0 with auto-update notifications

**Next Steps**: Merge PR #42, continue with feature development

---

## 🚨 Production-Ready Error Handling (2026-01-03)

### Autonomous Agent Fixes - ALL COMPLETED ✅

| ID  | Issue                                    | Priority | Location                          | Status   |
| --- | ---------------------------------------- | -------- | --------------------------------- | -------- |
| EH1 | safeReadDir silent failure on EACCES/EIO | Critical | `setup.js:253-300`                | ✅ Fixed |
| EH2 | loadUsage corruption no recovery path    | Critical | `lib/licensing.js:976-1032`       | ✅ Fixed |
| EH3 | saveUsage FREE tier quota bypass         | Critical | `lib/licensing.js:1055-1098`      | ✅ Fixed |
| EH4 | Smart strategy template error unhelpful  | High     | `lib/smart-strategy-generator.js` | ✅ Fixed |
| EH5 | Package.json parse error no recovery     | High     | `lib/smart-strategy-generator.js` | ✅ Fixed |
| EH6 | Validation errors don't halt setup       | High     | `setup.js:1571-1596`              | ✅ Fixed |
| EH7 | Dependabot errors generic                | High     | `lib/commands/deps.js:231-279`    | ✅ Fixed |
| EH8 | Directory scan errors silent             | Medium   | `lib/project-maturity.js:407-422` | ✅ Fixed |
| TC1 | result-types.js has 0% test coverage     | Medium   | `tests/result-types.test.js`      | ✅ Fixed |

**Session Summary:**

- 10 issues fixed by autonomous agents (3 Critical, 4 High, 2 Medium, 1 Test)
- Agent workflow: code-reviewer → silent-failure-hunter → code-simplifier → type-design-analyzer
- Test coverage: 72.86% → 73.63% (+0.77%)
- All 41+ test files passing, 0 security vulnerabilities
- PR #37 merged: Production-ready error handling improvements

---

## 🚨 Deep Review Cleanup (2026-01-02 - Session 2)

### Remaining Issues - ALL FIXED ✅

| ID   | Issue                                        | Severity | Location                     | Status   |
| ---- | -------------------------------------------- | -------- | ---------------------------- | -------- |
| DR13 | License database scalability warnings added  | High     | `webhook-handler.js:190-231` | ✅ Fixed |
| DR28 | Replaced manual headers with helmet.js       | Low      | `webhook-handler.js:154-185` | ✅ Fixed |
| DR29 | GitHub token sanitization in error messages  | Low      | `lib/github-api.js:130-220`  | ✅ Fixed |
| DR30 | Stable JSON stringify for license DB hash    | Low      | `webhook-handler.js:261-266` | ✅ Fixed |
| DR31 | Comprehensive webhook event input validation | Low      | `webhook-handler.js:497-646` | ✅ Fixed |

**Session Summary:**

- 5 remaining issues fixed (1 High, 4 Low)
- Focus: Scalability monitoring, security hardening, input validation
- All Deep Review issues now resolved ✅

---

## 🚨 Deep Review Findings (2026-01-02 Session)

### Blocking & High Priority - FIXED ✅

| ID    | Issue                                        | Severity | Location                               | Status   |
| ----- | -------------------------------------------- | -------- | -------------------------------------- | -------- |
| DR2-1 | setupQualityTools error swallowing           | High     | `setup.js:949-1067`                    | ✅ Fixed |
| DR2-2 | Database corruption handling continues       | Critical | `lib/licensing.js:721-756`             | ✅ Fixed |
| DR2-3 | Email validation missing before hashing      | Medium   | `lib/license-signing.js:33-52`         | ✅ Fixed |
| DR2-4 | Nullable capCheck ambiguity                  | Medium   | `lib/commands/deps.js:89-101`          | ✅ Fixed |
| DR2-5 | Dependabot error messages not actionable     | Medium   | `lib/commands/deps.js:231-251`         | ✅ Fixed |
| DR2-6 | Filesystem errors silent in production       | High     | `setup.js:253-286`                     | ✅ Fixed |
| DR2-7 | Command injection via npx gitleaks fallback  | Critical | `lib/validation/config-security.js`    | ✅ Fixed |
| DR2-8 | checksumMap override allowed in production   | High     | `lib/validation/config-security.js:39` | ✅ Fixed |
| DR2-9 | Custom template path traversal vulnerability | High     | `setup.js:460-486`                     | ✅ Fixed |

**Session Summary:**

- 9 issues fixed (3 Critical, 3 High, 3 Medium)
- Focus: Error handling, security hardening, input validation
- All tests passing (40+ test suites)

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

| ID   | Issue                                         | Severity | Location                           | Status   |
| ---- | --------------------------------------------- | -------- | ---------------------------------- | -------- |
| DR7  | No validation on Stripe event payloads        | High     | `webhook-handler.js`               | ✅ Fixed |
| DR8  | Usage tracking corruption resets quotas       | High     | `lib/licensing.js:875-914`         | ✅ Fixed |
| DR9  | Public DB endpoint returns fallback on error  | High     | `webhook-handler.js:523-544`       | ✅ Fixed |
| DR10 | Developer mode ELOOP warning doesn't halt     | High     | `lib/licensing.js:292-308`         | ✅ Fixed |
| DR11 | Cache clear failures are silent               | High     | `lib/validation/cache-manager.js`  | ✅ Fixed |
| DR12 | GitHub API assumes JSON responses             | High     | `lib/github-api.js:134-152`        | ✅ Fixed |
| DR13 | License database won't scale beyond 10k users | High     | `webhook-handler.js:130-149`       | ✅ Fixed |
| DR14 | No caching on license validation              | High     | `lib/license-validator.js`         | ✅ Fixed |
| DR15 | /status endpoint unauthenticated              | High     | `webhook-handler.js:549-571`       | ✅ Fixed |
| DR16 | Signature verification error too generic      | High     | `lib/license-validator.js:451-454` | ✅ Fixed |

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

| ID   | Issue                                        | Severity | Location                     | Status   |
| ---- | -------------------------------------------- | -------- | ---------------------------- | -------- |
| DR28 | Missing helmet.js for security headers       | Low      | `webhook-handler.js:93-121`  | ✅ Fixed |
| DR29 | GitHub token exposure in error messages      | Low      | `lib/github-api.js:146-150`  | ✅ Fixed |
| DR30 | License DB hash uses unstable JSON.stringify | Low      | `webhook-handler.js:180-183` | ✅ Fixed |
| DR31 | Missing input validation on webhook events   | Low      | `webhook-handler.js:392-407` | ✅ Fixed |

---

## 🚨 CRITICAL: CI Pipeline Failures (2026-01-07)

**Priority**: BLOCKING - Must fix before any merges

| ID  | Issue                                    | Type | Effort | Priority | Status  |
| --- | ---------------------------------------- | ---- | ------ | -------- | ------- |
| CI1 | **Missing validate-claude-md.js script** | Bug  | S      | CRITICAL | Pending |
| CI2 | **core-checks failing (Node 20 & 22)**   | Bug  | M      | CRITICAL | Pending |
| CI3 | **documentation check failing**          | Bug  | M      | CRITICAL | Pending |
| CI4 | **security check failing**               | Bug  | M      | CRITICAL | Pending |

### Details

**CI1: Missing validate-claude-md.js script**

- **Error**: `Cannot find module '/home/runner/work/qa-architect/qa-architect/scripts/validate-claude-md.js'`
- **Impact**: CLAUDE.md validation workflow fails on every PR
- **Root cause**: Script referenced in `.github/workflows/` but doesn't exist in `scripts/`
- **Fix**: Either create the missing script or remove the validation step
- **Effort**: 30 min

**CI2-CI4: Multiple workflow check failures**

- **Checks failing**: core-checks, documentation, security
- **Impact**: Cannot merge any PRs until fixed
- **Investigation needed**: Check CI logs to determine root cause
- **Effort**: 2-4 hours total

---

## 🔧 Technical Debt & Quality (Post-Workflow Tiers)

**Priority**: Critical for production readiness

| ID   | Issue                                            | Type      | Effort | Priority | Status  |
| ---- | ------------------------------------------------ | --------- | ------ | -------- | ------- |
| TD32 | **Fix Python setup test failure**                | Bug       | S      | High     | Pending |
| TD33 | **Improve test coverage to 75%**                 | Quality   | M      | High     | ✅ Done |
| TD34 | **Add integration test for --analyze-ci**        | Testing   | S      | Medium   | ✅ Done |
| MK1  | **Update landing-page.html with workflow tiers** | Marketing | S      | Medium   | ✅ Done |
| MK2  | **Update vibebuildlab.com/qa-architect page**    | Marketing | M      | Medium   | Pending |

### Details

**TD32: Fix Python setup test failure**

- **Issue**: `tests/setup.test.js` Python integration test fails, blocking full test suite
- **Impact**: Cannot measure accurate test coverage (currently 43.35%, need 75%)
- **Root cause**: Pre-existing bug unrelated to workflow tiers feature
- **Location**: `tests/setup.test.js` Python project setup
- **Effort**: 1-2 hours to debug and fix

**TD33: Improve test coverage to 75%** ✅ Done (2026-01-07)

- **Completed**: Coverage improved from 43.35% → 76.04% (exceeded target)
- **Final**: 76.04% lines, 76.56% statements, 82.45% branches
- **Changes**:
  - Added integration tests for `--analyze-ci` CLI command (7 tests)
  - Added edge case tests for `deps.js` (6 tests)
  - Enhanced `cache-manager.test.js` (2 additional tests)
  - Updated `package.json` test suite to include new test files
- **PR**: #41

**TD34: Add integration test for --analyze-ci command** ✅ Done (2026-01-07)

- **Completed**: Created `tests/analyze-ci-integration.test.js` with 7 full CLI tests
- **Coverage**: analyze-ci.js improved from 11.72% → 54.5%
- **Tests cover**: Basic workflow, matrix detection, optimized workflow, error handling
- **Part of**: TD33 coverage improvement

**MK1: Update landing-page.html with workflow tiers** ✅ Done (2026-01-07)

- **Completed**: Updated landing page with CI cost optimization messaging
- **Changes**:
  - Hero section: "Cut GitHub Actions costs by 95% + reduce dependency PRs by 60%"
  - Stats bar: Added 95% CI cost reduction, $0-5/mo minimal tier cost
  - New section: "GitHub Actions Cost Optimization" with before/after comparison
  - Feature card: CI Cost Optimization (3 workflow tiers)
  - Pricing: Added CI cost optimization to Pro features
  - Final CTA: Updated to mention both benefits

**MK2: Update vibebuildlab.com/qa-architect page**

- **Issue**: External website may not reflect new workflow tier feature
- **Need**: Update product page with workflow tiers, cost savings, --analyze-ci feature
- **Effort**: 3-4 hours (depends on CMS/deployment process)

---

## 🔥 High Value - Next Up

**Scoring**: (Revenue + Retention + Differentiation) ÷ Effort = Priority Score

| ID  | Feature                      | Value Drivers      | Effort | Score | Tier                            | Status         |
| --- | ---------------------------- | ------------------ | ------ | ----- | ------------------------------- | -------------- |
| B1  | **Copy Stripe to live mode** | Rev:5 Ret:3 Diff:2 | S      | 10.0  | -                               | 🔜 Ready       |
| Q1  | **Lighthouse CI**            | Rev:3 Ret:4 Diff:5 | S      | 12.0  | Free (basic) / Pro (thresholds) | 🔄 In Progress |
| Q2  | **Bundle size limits**       | Rev:3 Ret:4 Diff:4 | S      | 11.0  | Pro                             | Pending        |
| Q5  | **Coverage thresholds**      | Rev:3 Ret:4 Diff:3 | S      | 10.0  | Pro                             | Pending        |
| Q3  | **axe-core accessibility**   | Rev:2 Ret:3 Diff:4 | S      | 9.0   | Free                            | Pending        |
| Q4  | **Conventional commits**     | Rev:2 Ret:4 Diff:3 | S      | 9.0   | Free                            | Pending        |

## 📊 Medium Value - Worth Doing

| ID  | Feature                                           | Value Drivers      | Effort | Score | Tier | Status  |
| --- | ------------------------------------------------- | ------------------ | ------ | ----- | ---- | ------- |
| Q7  | **Dead code detection (knip)**                    | Rev:2 Ret:3 Diff:3 | S      | 8.0   | Free | Pending |
| Q8  | **License checker**                               | Rev:2 Ret:2 Diff:3 | S      | 7.0   | Pro  | Pending |
| Q9  | **Changelog generation**                          | Rev:2 Ret:3 Diff:2 | S      | 7.0   | Free | Pending |
| Q12 | **GitHub Actions cost analyzer + workflow tiers** | Rev:3 Ret:4 Diff:5 | M      | 6.0   | Pro  | ✅ Done |
| Q6  | **Semgrep integration**                           | Rev:3 Ret:3 Diff:4 | M      | 5.0   | Pro  | Pending |
| B2  | **Usage analytics**                               | Rev:3 Ret:3 Diff:2 | M      | 4.0   | -    | Pending |
| Q10 | **E2E test scaffolding**                          | Rev:2 Ret:3 Diff:3 | M      | 4.0   | Pro  | Pending |

## 📚 Low Value - When Needed

| ID  | Feature                      | Value Drivers      | Effort | Score | Status  |
| --- | ---------------------------- | ------------------ | ------ | ----- | ------- |
| B3  | **Team tier implementation** | Rev:4 Ret:2 Diff:3 | L      | 3.0   | Pending |
| B4  | **Enterprise tier**          | Rev:5 Ret:2 Diff:4 | XL     | 2.75  | Future  |

## Completed ✅

| ID  | Item                                                       | Type       | Completed |
| --- | ---------------------------------------------------------- | ---------- | --------- |
| Q12 | GitHub Actions cost analyzer + workflow tiers (3 CI modes) | 2026-01-07 |
| Q11 | Bash/Shell script support                                  | 2026-01-06 |
| ✓   | SOTA audit: TD1-TD4 security/arch                          | 2025-12-30 |
| ✓   | Pre-launch validation suite (5.3.0)                        | 2025-12-29 |
| ✓   | Quality tools integration (5.2.0)                          | 2025-12-29 |
| ✓   | Stripe payment flow (test mode)                            | 2025-12-23 |
| ✓   | Landing page comparison table                              | 2025-12-23 |
| ✓   | Terminal demo animation                                    | 2025-12-26 |
| ✓   | Expanded FAQs                                              | 2025-12-26 |

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
