# Testing & Code Review Flow - Where Things Actually Run

## Current Reality Check

### Tests in Current Setup

**Pre-Push Hook (local):**

```bash
npm test              # Unit tests via smart test strategy
```

**GitHub Actions CI:**

```yaml
npm run test:fast     # Unit tests (fast subset)
npm run test:smoke    # Smoke tests (basic sanity)
npm run test:e2e      # E2E tests (Playwright browser tests)
```

**These are NOT redundant!** Different test types serve different purposes.

---

## Test Types Breakdown

### 1. Unit Tests

**What:** Test individual functions/components in isolation
**Where:** Pre-push AND GitHub Actions
**Why both:**

- Pre-push: Fast feedback (< 30s), catches obvious breaks
- GitHub Actions: Safety net for bypassed hooks, clean environment validation

### 2. Integration Tests

**What:** Test multiple components working together
**Where:** GitHub Actions only (too slow for pre-push)
**Why:** Ensure components integrate correctly

### 3. E2E Tests (Playwright)

**What:** Test full user flows in real browser
**Where:** GitHub Actions only (requires browser, slow ~1-2 min)
**Why:** Catch UI/UX breaks that unit tests miss

### 4. Smoke Tests

**What:** Basic sanity checks (app starts, routes work)
**Where:** GitHub Actions only
**Why:** Quick validation that nothing is fundamentally broken

---

## Code Review Flow

### Where Code Reviews Happen

#### 1. Pre-Push (Automated Quality Checks)

**Tool:** ESLint + Prettier + TypeScript
**What it catches:**

- Code style violations
- Type errors
- Common mistakes (unused vars, missing returns)
- Security patterns (eslint-plugin-security)

**What it DOESN'T catch:**

- Logic errors
- Architecture issues
- Security vulnerabilities (beyond patterns)
- Business logic bugs

#### 2. /bs:quality (On-Demand AI Review)

**Tool:** Claude Code autonomous agents
**When:** Manual trigger before PR
**What it catches:**

- Logic errors
- Architecture issues
- Silent failures
- Type design problems
- Code complexity
- Security vulnerabilities (level 98)
- Performance issues (level 98)

**Limitation:** Manual (user must run it)

#### 3. GitHub Actions (Automatic PR Review - OPTIONAL)

**Tool:** claude-code-action (anthropics/claude-code-action@beta)
**When:** Every PR automatically
**What it catches:**

- Everything /bs:quality catches
- Runs automatically (no manual trigger needed)

**Cost:** ~5 min GitHub Actions + Claude API cost per PR

#### 4. Manual Human Review

**When:** Before merge
**What it catches:**

- Business logic correctness
- Requirements fulfillment
- Edge cases
- UX considerations

---

## The Problem with My Original Proposal

### What I Said to Remove:

❌ Unit tests from GitHub Actions (said "redundant")
❌ ESLint from GitHub Actions (said "redundant")
❌ Prettier from GitHub Actions (said "redundant")

### Why That's Wrong:

**Tests are NOT redundant because:**

1. **Different test types:** Pre-push runs unit tests, CI runs unit + integration + E2E + smoke
2. **Safety net:** CI catches what pre-push misses (bypassed hooks, environment differences)
3. **Clean environment:** CI validates in fresh npm install (local might have stale deps)

**Lint/Format checks ARE somewhat redundant, but:**

- Pre-push can be bypassed with --no-verify
- CI is the final gate before merge
- Cheap to run (< 1 min)

---

## Corrected Optimal Flow

### Stage 1: Pre-Commit (< 15 seconds)

```bash
✅ lint-staged (ESLint, Prettier on staged files only)
✅ Test coverage check (warning only)
```

### Stage 2: Pre-Push (1-3 minutes)

```bash
✅ ESLint (full project)
✅ Prettier check (full project)
✅ TypeScript type-check
✅ Unit tests (smart strategy)
+ 🔐 Gitleaks (secret scan) - NEW
+ 🔐 npm audit (dependencies) - NEW
+ 🔐 XSS patterns - NEW
```

### Stage 3: On-Demand /bs:quality (Optional)

```bash
# Manual trigger before creating PR
/bs:quality --scope changed      # Quick: 2-5 min
/bs:quality                      # Default: 30-60 min (95%)
/bs:quality --level 98           # Comprehensive: 1-3 hours

Runs: Autonomous agents (code-reviewer, silent-failure-hunter, etc.)
```

### Stage 4: GitHub Actions CI (Automatic on PR/Push)

**Option A: Minimal (Recommended for most repos)**

```yaml
✅ Unit tests (safety net for bypassed pre-push)
✅ Integration tests
✅ E2E tests (Playwright)
✅ Smoke tests
✅ Build verification
✅ Package signatures
✅ Weekly security scan (gitleaks + npm audit)

NOT NEEDED:
❌ ESLint (already in pre-push, but could keep as final gate)
❌ Prettier (already in pre-push, but could keep as final gate)
❌ Gitleaks (moved to pre-push + weekly scan)
❌ npm audit (moved to pre-push + weekly scan)
```

**Option B: Standard (Active projects)**

```yaml
Everything from Minimal PLUS:
✅ ESLint (final gate)
✅ Prettier (final gate)
✅ Code coverage reporting
```

**Option C: Comprehensive (Critical production)**

```yaml
Everything from Standard PLUS:
✅ claude-code-action (automatic AI review on every PR)
✅ Matrix builds (Node 20, 22)
✅ Security scans on every commit
```

---

## Cost Analysis - Corrected

### Minimal CI (9 repos)

**Per repo per month:**

- Push to main: 3-4 min (unit + integration + E2E + build)
- Average 2 pushes/day to main = 8 min/day
- Monthly: 8 × 30 = 240 min/month
- Weekly security: 10 min/week × 4 = 40 min/month
- **Total: 280 min/month per repo**

**9 repos × 280 = 2,520 min/month** ⚠️ Still over budget!

### Problem: Tests Take Too Long

Let me recalculate with realistic test times:

**Actual test suite time:**

- Unit tests: 30-60s
- Integration tests: 30-60s
- E2E tests: 1-2 min
- Build: 30-60s
- **Total: 3-5 min per run**

**If we push to main 2×/day:**

- 5 min × 2 = 10 min/day
- 10 × 30 = 300 min/month per repo
- 9 repos = **2,700 min/month** ❌ Over budget!

---

## Real Solution: Reduce What Triggers CI

### Strategy 1: Main Branch Only + Weekly Scans

```yaml
on:
  push:
    branches: [main] # NOT feature branches
  schedule:
    - cron: '0 2 * * 0' # Weekly Sunday 2 AM
```

**Why:** Feature branches rely on pre-push hooks + /bs:quality

**Cost per repo:**

- Main branch push: 5 min × 1-2 times/day = 10 min/day
- But only when you merge PR: ~5-10 pushes/month = 25-50 min/month
- Weekly scan: 10 min/week = 40 min/month
- **Total: 65-90 min/month per repo**

**9 repos × 75 avg = 675 min/month** ✅ Under budget!

### Strategy 2: Workflow Dispatch Only (Manual CI)

```yaml
on:
  workflow_dispatch: # Manual trigger only
  push:
    branches: [main] # Only main
  schedule:
    - cron: '0 2 * * 0' # Weekly
```

**Cost:** Same as Strategy 1, but user can manually trigger if needed

---

## Final Recommendation

### For Pre-Push (Everyone)

```bash
✅ Lint + Format + Type-check
✅ Unit tests (fast)
✅ Gitleaks + npm audit + XSS detection (NEW)
```

**Time:** 1-3 min | **Cost:** Free

### For On-Demand Quality (/bs:quality)

```bash
/bs:quality --scope changed      # Quick iteration
/bs:quality                      # Before PR
/bs:quality --level 98 --merge   # Production-ready
```

**Time:** 2-5 min to 3 hours | **Cost:** Free with MAX tier

### For GitHub Actions CI

```yaml
Trigger: Main branch only + weekly scans
Run: Full test suite (unit + integration + E2E) + build
Skip: Lint/format (redundant with pre-push)
Add: Weekly security scan (safety net)
```

**Time:** 3-5 min per main push | **Cost:** 65-90 min/month per repo

**Total for 11 repos:**

- 2 active (qa-architect, keyflash): 2 × 150 = 300 min/month
- 9 minimal: 9 × 75 = 675 min/month
- **Total: 975 min/month (~$6/month)** ✅

---

## Where Everything Runs - Summary Table

| Check Type            | Pre-Commit | Pre-Push | /bs:quality   | GitHub Actions |
| --------------------- | ---------- | -------- | ------------- | -------------- |
| **Lint (staged)**     | ✅ Fast    | -        | -             | -              |
| **Lint (full)**       | -          | ✅       | ✅            | Optional       |
| **Format**            | ✅         | ✅       | ✅            | Optional       |
| **Type-check**        | -          | ✅       | ✅            | Optional       |
| **Unit tests**        | -          | ✅ Fast  | ✅            | ✅ Full suite  |
| **Integration tests** | -          | ❌       | ✅ (level 98) | ✅             |
| **E2E tests**         | -          | ❌       | ✅ (level 98) | ✅             |
| **Smoke tests**       | -          | ❌       | ❌            | ✅             |
| **Gitleaks**          | -          | ✅ NEW   | ✅            | Weekly only    |
| **npm audit**         | -          | ✅ NEW   | ✅            | Weekly only    |
| **XSS patterns**      | -          | ✅ NEW   | ✅            | ❌             |
| **Code review (AI)**  | -          | ❌       | ✅            | Optional†      |
| **Security audit**    | -          | ❌       | ✅ (level 98) | Weekly         |
| **A11y audit**        | -          | ❌       | ✅ (level 98) | ❌             |
| **Performance**       | -          | ❌       | ✅ (level 98) | ❌             |

† claude-code-action can be added but costs GH Actions minutes

---

## Answer to Your Question

**Tests run:**

1. **Pre-push:** Unit tests (fast subset via smart strategy)
2. **GitHub Actions:** Full suite (unit + integration + E2E + smoke)
3. **/bs:quality:** Any/all tests as part of comprehensive review

**Code review happens:**

1. **Pre-push:** Automated (ESLint, TypeScript, security patterns)
2. **/bs:quality:** AI-powered comprehensive review (manual trigger)
3. **GitHub Actions (optional):** claude-code-action (automatic, but costs minutes)
4. **Manual:** Human review before merge

**Tests are NOT redundant** - they're different types with different purposes!
