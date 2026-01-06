# qa-architect - Backlog

**Last Updated**: 2026-01-06
**Priority**: Value-based (Revenue + Retention + Differentiation) ÷ Effort

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
| Q11 | **Bash/Shell script support**  | Diff:4 Ret:3 Rev:2 | S      | Free | Pending |
| Q12 | **GitHub Actions cost analyzer** | Diff:5 Ret:4 Rev:3 | M    | Pro  | Pending |

### Q11: Bash/Shell Script Support Details

**Priority**: P2
**Use Case**: Config repos, dotfiles, script collections need CI/CD quality gates

**Requirements**:
- Detect bash-based projects (*.sh files, no package.json)
- Generate `.github/workflows/ci.yml` with:
  - shellcheck validation
  - syntax validation
  - permissions checking
- Generate `.github/workflows/quality-checks.yml` with:
  - maturity assessment
  - documentation validation
  - quality summary
- Optional: Husky pre-commit hooks for shellcheck (requires Git hooks setup)

**Implementation Notes**:
- Detection logic: Check for `*.sh` files and absence of `package.json`
- Extend `lib/project-maturity.js` to detect shell script projects
- Create shell-specific templates in `templates/` or `config/`
- Add shell script validation to workflow templates

**Tier Assignment**:
- **Free**: Basic shellcheck CI, syntax validation, quality checks
- **Pro**: Advanced shell analysis, security scanning for secrets/vulnerabilities

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

---

## 📋 Feature Specifications

### Q12: GitHub Actions Cost Analyzer

**Problem**: Developers building multiple projects in parallel (indie hackers, agencies, SaaS factories) quickly exceed GitHub Actions free tier limits (2,000 min/month) without realizing it. Costs can balloon to $50-200/month across multiple repos with no visibility into optimization opportunities.

**Solution**: Add `--analyze-ci` command that analyzes GitHub Actions usage patterns and provides actionable cost optimization recommendations.

#### Phase 1: Usage Analysis (MVP)

**Requirements**:
- Detect GitHub Actions workflows in current repo
- Calculate estimated minutes/month based on:
  - Average commits/day (from git log)
  - Workflow duration (from `.github/workflows/*.yml` job estimates)
  - Number of active branches
- Compare against tier limits:
  - Free: 2,000 min/month
  - Team: 3,000 min/month
  - Pay-as-you-go: $0.008/min for private repos
  - Self-hosted: $0/min (but VPS costs)

**Output Example**:
```bash
npx create-qa-architect --analyze-ci

📊 GitHub Actions Usage Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repository: myapp
Estimated usage: 3,200 min/month
  ├─ CI workflow: ~45 min/day (1,350 min/month)
  ├─ E2E tests: ~60 min/day (1,800 min/month)
  └─ Deploy: ~2 min/day (60 min/month)

💰 Cost Analysis
Free tier (2,000 min): EXCEEDED by 1,200 min
Overage cost: $9.60/month

Alternative options:
  Team plan ($4/user/month): Saves $5.60
  Self-hosted runner: $0/month CI + ~$5 VPS
```

#### Phase 2: Optimization Recommendations (Pro Tier)

**Features**:
- **Caching audit**: Detect missing dependency caches
- **Path filters**: Suggest `paths-ignore` for docs/markdown-only changes
- **Concurrency limits**: Flag missing `concurrency` groups (skip duplicate runs)
- **Job optimization**: Identify long-running jobs that could be parallelized
- **Conditional execution**: Recommend `if:` conditions to skip unnecessary jobs

**Output Example**:
```bash
💡 Optimization Opportunities (Save ~1,400 min/month)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ⚡ Enable dependency caching
   Impact: Save ~40% (1,280 min/month)
   Files: .github/workflows/ci.yml

   Add to your workflow:
     - uses: actions/cache@v4
       with:
         path: ~/.npm
         key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

2. 📝 Skip CI on docs-only changes
   Impact: Save ~120 min/month

   Add to workflow trigger:
     on:
       push:
         paths-ignore:
           - 'docs/**'
           - '*.md'

3. 🔄 Add concurrency limits
   Impact: Save ~5% (160 min/month)

   Add to workflow:
     concurrency:
       group: ${{ github.workflow }}-${{ github.ref }}
       cancel-in-progress: true
```

#### Phase 3: Self-Hosted Runner Setup (Pro Tier - Optional)

**Features**:
- Docker-based runner setup script
- VPS provider recommendations with cost comparison
  - DigitalOcean: $6/month (1GB RAM)
  - Hetzner: €4.5/month (2GB RAM)
  - Oracle Cloud: Free tier (1GB ARM)
- Security hardening checklist
- Auto-update configuration

**Output**:
```bash
🖥️  Self-Hosted Runner Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recommended VPS: Hetzner CX11 (€4.50/month)
  ├─ 2GB RAM, 20GB SSD
  ├─ Supports 2-3 concurrent jobs
  └─ Cost savings: $9.60/month → €4.50/month

Run this script to set up runner:
  curl -fsSL https://qa-architect.dev/runner-setup.sh | bash

Or use our Docker image:
  docker run -d qa-architect/github-runner \
    --token YOUR_RUNNER_TOKEN \
    --name my-runner
```

#### Phase 4: Workflow Templates (Free Tier)

**Features**:
- Generate optimized workflow templates with best practices built-in
- Smart caching for npm/pnpm/yarn/pip/poetry/cargo
- Fail-fast strategies
- Timeout limits
- Matrix builds vs sequential decision logic

**Implementation**:
```bash
npx create-qa-architect --optimize-workflows

✨ Generated optimized workflows:
  ├─ .github/workflows/ci-optimized.yml (with caching)
  ├─ .github/workflows/e2e-optimized.yml (with parallelization)
  └─ .github/workflows/deploy-optimized.yml (with concurrency limits)

These workflows include:
  ✓ Dependency caching (npm/yarn/pnpm auto-detected)
  ✓ Path-based filtering
  ✓ Concurrency limits
  ✓ 60-minute timeout limits
  ✓ Fail-fast matrix strategy
```

#### Integration Points

**Preflight checks** (add to existing audit):
```bash
npx create-qa-architect --validate

Quality Audit Results
━━━━━━━━━━━━━━━━━━━
✓ ESLint configured
✓ Prettier configured
✗ GitHub Actions missing caching (WARN)
✗ Workflows missing timeout limits (WARN)
✗ No concurrency limits configured (INFO)

Run 'npx create-qa-architect --optimize-workflows' to fix.
```

**Tech Stack**:
- GitHub REST API v3 (`/repos/{owner}/{repo}/actions/runs`)
- YAML parsing for workflow analysis (`js-yaml`)
- Git log analysis for commit frequency (`simple-git`)
- Cost calculation engine
- Template generator (existing `lib/template-loader.js`)

**User Personas**:
1. **Indie hacker**: Building 3-5 SaaS products simultaneously, wants to minimize costs
2. **Agency**: Managing 10+ client repos, needs cost visibility
3. **Bootstrapped startup**: Tight budget, willing to self-host runners

**Success Metrics**:
- Adoption: 20% of Pro users run `--analyze-ci` monthly
- Conversion: 5% of Free users upgrade to Pro for advanced analysis
- Retention: Users who optimize save average $25/month, cite as key value prop

**Effort Estimate**:
- Phase 1 (Analysis): 3 days
- Phase 2 (Recommendations): 4 days
- Phase 3 (Self-hosted): 3 days
- Phase 4 (Templates): 2 days
- Testing & docs: 2 days
- **Total**: ~14 days (Medium effort)

**Revenue Potential**:
- **Direct**: Pro feature, supports $19/month value proposition
- **Indirect**: Attracts cost-conscious developers, improves retention
- **Competitive moat**: No competing QA tools offer CI cost analysis
