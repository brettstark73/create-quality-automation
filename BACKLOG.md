# qa-architect - Backlog

**Last Updated**: 2025-12-29
**Priority**: Value-based (Revenue + Retention + Differentiation) ÷ Effort

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

| ID  | Feature                         | Completed  |
| --- | ------------------------------- | ---------- |
| ✓   | Stripe payment flow (test mode) | 2025-12-23 |
| ✓   | Landing page comparison table   | 2025-12-23 |
| ✓   | Terminal demo animation         | 2025-12-26 |
| ✓   | Expanded FAQs                   | 2025-12-26 |

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
