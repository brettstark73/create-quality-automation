# Development Workflow Guide

**Last Updated**: 2026-01-19
**Audience**: Developers using qa-architect

## Overview

This guide explains the complete development workflow from writing code to production deployment, including how automated quality checks work at each stage.

---

## The Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOCAL DEVELOPMENT                                        │
│ Your machine: ~/Projects/your-project/                      │
│ Duration: Hours/days                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ git add . && git commit -m "message"
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PRE-COMMIT HOOK (Husky)                                  │
│ Triggered: Automatically on 'git commit'                    │
│ Duration: < 5 seconds                                       │
│ Checks: Lint-staged (only changed files)                   │
│ ✓ ESLint on staged .js/.ts files                           │
│ ✓ Prettier on staged files                                 │
│ ✓ Stylelint on staged .css files                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ git push origin branch-name
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PRE-PUSH HOOK (Husky + Smart Test Strategy)             │
│ Triggered: Automatically on 'git push'                      │
│ Duration: 30s - 2 minutes                                   │
│ Checks: Risk-based test strategy                           │
│ ✓ Lint + Format check                                      │
│ ✓ Fast tests (unit + integration)                          │
│ ✓ Security audit (npm audit)                               │
│ ✗ E2E tests (run in CI only)                               │
│ ✗ Command execution tests (run in CI only)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Code pushed to GitHub
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CI/CD (GitHub Actions)                                   │
│ Triggered: Automatically on push/PR                         │
│ Duration: 3-10 minutes                                      │
│ Where: GitHub's cloud servers                               │
│ Checks: COMPREHENSIVE validation                            │
│ ✓ Lint + Format + Type check                               │
│ ✓ Unit tests                                                │
│ ✓ Integration tests                                         │
│ ✓ E2E tests (with proper dev server + browsers)            │
│ ✓ Command execution tests                                   │
│ ✓ Security scans (Gitleaks, npm audit)                     │
│ ✓ Build verification                                        │
│ ✓ Multi-version testing (Node 20, 22)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ CI passes ✓
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. STAGING DEPLOYMENT (Optional)                            │
│ Where: Preview URL (e.g., project-git-branch.vercel.app)   │
│ Purpose: Manual testing before production                   │
│ Who: You + team review                                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Merge to main
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. PRODUCTION DEPLOYMENT                                    │
│ Where: Live domain (e.g., yourdomain.com)                  │
│ Triggered: Auto-deploy on main branch                       │
│ Users: Real traffic                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Local Development

**What happens:**

- You write code on your machine
- Run `npm run dev` to test locally
- See changes at `http://localhost:3000`

**Tools:**

- VS Code, Cursor, or your editor
- Local development server
- Browser DevTools

**Example:**

```bash
cd ~/Projects/postrail
npm run dev
# Edit files, see changes instantly
```

---

## Stage 2: Pre-Commit Hook

**Trigger:** Automatically when you run `git commit`

**What it checks:**

- **Only the files you changed** (lint-staged)
- ESLint on `.js`, `.ts`, `.jsx`, `.tsx` files
- Prettier formatting
- Stylelint on CSS files

**Duration:** < 5 seconds

**How it works:**

1. qa-architect installed Husky
2. Created `.husky/pre-commit` file
3. Git automatically runs this script before committing

**Example:**

```bash
git add src/app/page.tsx
git commit -m "Update homepage"

# Output:
# ✨ Linting staged files...
# ✅ ESLint passed
# ✅ Prettier passed
# ✅ Commit created!
```

**If it fails:**

```bash
# ❌ ESLint failed: Unused variable 'foo'
# Fix errors and try again

# Fix the error
git add .
git commit -m "Update homepage"
# ✅ Now it passes
```

---

## Stage 3: Pre-Push Hook

**Trigger:** Automatically when you run `git push`

**What it checks:**

- Risk-based test strategy (analyzes your changes)
- Lint + Format check (all files)
- Fast tests (unit + integration, **no E2E**)
- Security audit (npm audit)

**Duration:** 30 seconds - 2 minutes

**Risk Levels:**

### Minimal Risk (< 10s)

- Lint + format check only
- Example: Markdown file changes

### Low Risk (20-40s)

- Unit tests only
- Example: Small feature branch, off-hours commit

### Medium Risk (1-2 min)

- Fast tests + integration
- Example: API changes, 10+ files changed

### High Risk (2 min)

- Unit + integration + security audit
- Example: Pushing to main, auth changes, 20+ files

**How it works:**

1. `.husky/pre-push` runs `scripts/smart-test-strategy.sh`
2. Analyzes: branch, files changed, lines changed, high-risk patterns
3. Calculates risk score (0-10)
4. Runs appropriate test tier

**Example:**

```bash
git push origin feature-auth

# Output:
# 🧠 Analyzing changes for optimal test strategy...
# 📊 Analysis Results:
#    📁 Files changed: 5
#    📏 Lines changed: 120
#    🌿 Branch: feature-auth
#    🎯 Risk Score: 8/10
#    ⚡ Speed Bonus: false
#
# 🔴 HIGH RISK - Comprehensive validation (pre-push)
#    • Unit + integration tests + security audit
#    • (E2E and command tests run in CI only)
#
# ✅ Running tests...
# ✅ Security audit passed!
# ✅ Pre-push validation passed!
#
# Pushing to GitHub...
```

**Important:** E2E tests are **excluded** from pre-push because they:

- Need a dev server running (port 3001)
- Require browser automation
- Take 5-10 minutes
- Can have port conflicts

**If it fails:**

```bash
# ❌ Tests failed: 2 failing
# Fix tests before pushing

npm test  # Debug locally
# Fix the issues
git push  # Try again
```

---

## Stage 4: CI/CD (Continuous Integration)

**Trigger:** Automatically when code is pushed to GitHub

**Where:** GitHub Actions runners (cloud servers)

**What it checks:** **EVERYTHING**

- Linting (ESLint, Stylelint)
- Format checking (Prettier)
- Type checking (TypeScript)
- Unit tests
- Integration tests
- **E2E tests** (NOW they work properly)
- Command execution tests
- Security scans
- Build verification
- Multi-version testing (Node 20, 22)

**Duration:** 3-10 minutes

**Workflow file:** `.github/workflows/quality.yml`

**How it works:**

### Step 1: Detection

```yaml
- Detect package manager (npm/pnpm/yarn/bun)
- Detect Turborepo (if turbo.json exists)
- Detect project maturity (minimal/bootstrap/development/production)
```

### Step 2: Install Dependencies

```yaml
- Install pnpm (if needed)
- Setup Node.js with caching
- Run: pnpm install --frozen-lockfile
- Setup Turborepo (if detected)
```

### Step 3: Core Checks

```yaml
- Prettier check (all files)
```

### Step 4: Linting

```yaml
- ESLint (all source files)
- Stylelint (all CSS files)
```

### Step 5: Tests

```yaml
- Unit tests
- Integration tests
- E2E tests (with dev server + browsers)
- Command execution tests
```

### Step 6: Security

```yaml
- Gitleaks (secret scanning)
- npm audit (dependency vulnerabilities)
- XSS pattern detection
```

### Step 7: Build

```yaml
- npm run build (if build script exists)
- Verify build succeeds
```

**Example GitHub Actions output:**

```
✓ detect-maturity (30s)
  Package Manager: pnpm
  Turborepo: true
  Maturity: production-ready

✓ core-checks (45s)
  Prettier check passed

✓ linting (1m 20s)
  ESLint passed
  Stylelint passed

✓ tests (5m 30s)
  Unit tests: 42 passed
  Integration tests: 15 passed
  E2E tests: 8 passed

✓ security (1m 15s)
  No secrets detected
  No vulnerable dependencies

✓ build (2m 10s)
  Build successful

✅ All checks passed!
```

**If CI fails:**

- Check the GitHub Actions tab in your repo
- Review failed job logs
- Fix issues locally and push again

---

## Stage 5: Staging Deployment

**Where:** Preview URL (Vercel/Netlify/etc.)

**Trigger:** Automatic after CI passes

**Purpose:**

- Manual testing before production
- Share with team for review
- Test on real infrastructure (not localhost)

**Example URLs:**

```
Preview: https://postrail-git-feature-auth.vercel.app
Staging: https://staging.postrail.com
```

**Testing checklist:**

- [ ] Features work as expected
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable (Lighthouse)
- [ ] Links work correctly

---

## Stage 6: Production Deployment

**Where:** Live domain (your custom domain)

**Trigger:** Merge to `main` branch

**Auto-deployment:**

```bash
# On GitHub: Merge PR to main
# → Vercel automatically deploys to production
# Live at: https://postrail.com
```

**Rollback:**

```bash
# In Vercel dashboard:
# Deployments → Select previous version → Promote to Production
```

---

## Key Concepts

### Git Hooks (Husky)

**What are they?**

- Scripts that run automatically during git operations
- Installed in `.husky/` directory
- Managed by Husky package

**Available hooks:**

- `pre-commit`: Before `git commit`
- `pre-push`: Before `git push`
- `commit-msg`: Validate commit messages

**How qa-architect sets them up:**

1. Installs Husky: `npm install husky --save-dev`
2. Adds prepare script: `"prepare": "[ \"$CI\" = \"true\" ] && echo 'Skipping Husky in CI' || husky"`
3. Creates `.husky/pre-commit` and `.husky/pre-push` files

**Skipping hooks temporarily:**

```bash
# Skip pre-commit
git commit --no-verify -m "WIP"

# Skip pre-push
git push --no-verify

# ⚠️ Only use in emergencies! Quality checks exist for a reason.
```

### CI vs CD

**CI (Continuous Integration):**

- Automated **testing** on GitHub's servers
- Runs on every push/PR
- Ensures code quality before merging

**CD (Continuous Deployment):**

- Automated **deployment** to staging/production
- Happens after CI passes
- Vercel/Netlify handle this automatically

### Why E2E Tests Only in CI

**Pre-push (your machine):**

- ❌ Port conflicts (dev server already running)
- ❌ Slow (5-10 minutes blocks you)
- ❌ Flaky (browser automation on laptop)

**CI (GitHub servers):**

- ✅ Clean environment (no port conflicts)
- ✅ Doesn't block you (runs in background)
- ✅ Reliable (consistent infrastructure)
- ✅ Proper browser automation setup

---

## Troubleshooting

### Pre-commit hook not running

**Check:**

```bash
# Is Husky installed?
ls .husky/

# Reinstall hooks
npx husky install
```

### Pre-push taking too long

**Check risk score:**

```bash
# See what's being tested
git push

# Force minimal mode (testing only)
FORCE_MINIMAL=1 git push
```

**Reduce risk score:**

- Don't push 50 files at once
- Push feature branches (not main) during development
- Push during work hours (gets speed bonus)

### CI failing but pre-push passed

**Common reasons:**

- E2E tests failed (don't run in pre-push)
- Command execution tests failed
- Environment differences (Node versions)

**Fix:**

```bash
# Run comprehensive tests locally
npm run test:comprehensive

# Fix failures
npm test

# Push again
git push
```

### Husky failing in CI/Vercel

**This is fixed!** qa-architect now automatically skips Husky in CI environments.

**How it works:**

```json
"prepare": "[ \"$CI\" = \"true\" ] && echo 'Skipping Husky in CI' || husky"
```

No manual configuration needed.

---

## Environment Variables

### Skip Quality Checks (Emergency Use Only)

```bash
# Skip smart test strategy
SKIP_SMART=1 git push

# Force minimal tests
FORCE_MINIMAL=1 git push

# Force comprehensive tests
FORCE_COMPREHENSIVE=1 git push

# Skip Husky entirely (not recommended)
git push --no-verify
```

### CI Detection

These environment variables automatically tell tools they're in CI:

- `CI=true` - GitHub Actions, Vercel, Netlify
- `GITHUB_ACTIONS=true` - GitHub Actions
- `VERCEL=1` - Vercel

---

## Workflow Customization

### Test Tiers

Edit `scripts/smart-test-strategy.sh`:

```bash
# HIGH RISK (score ≥ 7)
# Default: Unit + integration + security audit
# Customize: Add performance tests, visual regression, etc.

# MEDIUM RISK (score ≥ 4)
# Default: Fast tests + integration
# Customize: Add API tests, smoke tests

# LOW RISK (score ≥ 2)
# Default: Unit tests only
# Customize: Add critical path tests

# MINIMAL RISK
# Default: Lint + format check
# Customize: Add snapshot tests
```

### Workflow Modes

Edit `.github/workflows/quality.yml` (line 31):

```yaml
# WORKFLOW_MODE: minimal    (default, ~$0-5/mo)
# WORKFLOW_MODE: standard   (~$5-20/mo)
# WORKFLOW_MODE: comprehensive (~$100-350/mo)
```

Update mode:

```bash
npx create-qa-architect@latest --workflow-minimal
npx create-qa-architect@latest --workflow-standard
npx create-qa-architect@latest --workflow-comprehensive
```

---

## Related Documentation

- [CI Cost Analysis](./CI-COST-ANALYSIS.md) - Workflow tier pricing
- [Smart Test Strategy](./SMART-TEST-STRATEGY.md) - Risk-based testing
- [Turborepo Support](./TURBOREPO-SUPPORT.md) - Monorepo setup
- [Monorepo Compatibility](./MONOREPO-COMPATIBILITY-FIX.md) - Workspace handling

---

**Questions?** Open an issue: https://github.com/vibebuildlab/qa-architect/issues
