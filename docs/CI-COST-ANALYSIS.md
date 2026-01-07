# GitHub Actions Cost Analysis: Is qa-architect Over-Engineering CI/CD?

**Date**: 2026-01-06
**Finding**: YES - qa-architect's default setup is 3-5x more expensive than industry standards for solo/small projects.

---

## The Problem

Your projects are costing **$469/month** in GitHub Actions CI when they should cost **$0-50/month**.

| Project                    | Commits/Day | Minutes/Month | Cost/Month | Status      |
| -------------------------- | ----------- | ------------- | ---------- | ----------- |
| vibebuildlab               | 7.4         | 46,852 min    | $358       | 🔴 CRITICAL |
| qa-architect               | 1.7         | 15,810 min    | $110       | 🔴 HIGH     |
| stark-program-intelligence | 1.6         | 2,160 min     | $1.28      | 🟢 OK       |
| vibelab-claude-setup       | 2.0         | 531 min       | $0         | ✅ OPTIMAL  |

---

## Root Cause Analysis

### What qa-architect Is Doing (vibebuildlab example)

**Current quality.yml**: 161 minutes per commit, runs 221 times/month

```yaml
Jobs running on EVERY push:
1. detect-maturity (1 job) ~ 2 min
2. core-checks (2 jobs) ~ 10 min  # Node 20 + 22 matrix
3. linting (1 job) ~ 8 min
4. security (1 job) ~ 25 min       # Gitleaks + Semgrep + 3× npm audit
5. tests (2 jobs) ~ 30 min         # Node 20 + 22 matrix
6. documentation (1 job) ~ 15 min  # Only if production-ready
7. summary (1 job) ~ 1 min

TOTAL: ~90-100 minutes per push (when all jobs run)
```

**Problems identified**:

1. ❌ **No path filters** - Runs full CI on docs/README commits
2. ❌ **Duplicate matrix testing** - Both core-checks AND tests run Node 20/22
3. ❌ **Security overkill** - Gitleaks + Semgrep + npm audit (3 variants) on EVERY push
4. ❌ **No job concurrency limits** - Rapid commits queue up expensive builds
5. ❌ **Production checks on every commit** - Documentation validation should be release-only

---

## Industry Standards (Successful Projects)

### Vite (Major Framework, 1000+ contributors)

- **Runtime**: 50-60 min/commit
- **Path filters**: ✅ Skips tests on docs-only changes
- **Matrix**: Node 20, 22, 24 (3 versions)
- **Cross-platform**: Only on latest Node, not all versions
- **Security**: Runs on schedule, not every commit

### Ky (Popular Library, Sindre Sorhus)

- **Runtime**: 10-15 min/commit
- **Matrix**: Node 20, 22, 24, latest (4 versions)
- **Platform**: macOS only (assumes Linux/Windows compatibility)
- **Security**: Separate workflow

### Common Patterns

1. **Minimal on push** - Lint + test current Node only
2. **Matrix testing** - Only on main branch or scheduled
3. **Security scans** - Weekly/nightly, not per commit
4. **Documentation** - Only on release branches
5. **Path filters** - Skip CI for docs/README/LICENSE changes

**Sources**:

- [GitHub Actions alternatives for modern CI/CD](https://northflank.com/blog/github-actions-alternatives)
- [Ultimate free CI/CD for open-source projects](https://dev.to/itnext/the-ultimate-free-ci-cd-for-your-open-source-projects-3bkd)

---

## Recommended Changes

### Phase 1: Quick Wins (Reduce by 60-70%)

#### 1. Add Path Filters

```yaml
on:
  push:
    paths-ignore:
      - '**.md'
      - 'docs/**'
      - 'LICENSE'
      - '.gitignore'
      - '.editorconfig'
```

**Savings**: ~20% of commits are docs-only
**vibebuildlab**: 7,117 min/month saved ($57/mo)

#### 2. Reduce Matrix Redundancy

```yaml
# BEFORE: 2 matrix jobs (core-checks + tests)
core-checks:
  matrix:
    node-version: [20, 22]  # Runs twice

tests:
  matrix:
    node-version: [20, 22]  # Runs twice again!

# AFTER: 1 matrix job only
tests:
  matrix:
    node-version: [20, 22]  # Runs once
```

**Savings**: 50% reduction in matrix jobs
**vibebuildlab**: ~18,000 min/month saved ($144/mo)

#### 3. Move Security to Scheduled Workflow

```yaml
# New file: .github/workflows/security-weekly.yml
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch: # Manual trigger

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - name: Gitleaks
      - name: Semgrep
      - name: npm audit
```

**Savings**: From 221 runs/month → 4 runs/month
**vibebuildlab**: ~5,400 min/month saved ($43/mo)

### Phase 2: Industry-Standard Setup (Get under $50/mo total)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '**.md'
      - 'docs/**'
      - 'LICENSE'
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true # Cancel old runs

jobs:
  # Quick checks on every commit (current Node only)
  quick-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm test

  # Matrix testing only on main branch
  cross-version:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v6
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm test
```

**Estimated runtime**:

- Pull requests: 5-10 min (quick-check only)
- Main branch: 15-20 min (quick-check + cross-version)

**Estimated cost for vibebuildlab**:

- Current: 46,852 min/month ($358/mo)
- After changes: ~3,500 min/month ($12/mo)
- **Savings: $346/month (97% reduction)**

---

## Strategic Recommendations

### For Solo Developers / Small Teams

**Make all repos public** → GitHub Actions is FREE

- If code can be public, this is the best option
- vibebuildlab, qa-architect could potentially be public

### For Private Repos

**Option A: Minimal CI** (Recommended)

```
✅ Lint + format on every commit (5 min)
✅ Test on current Node only (10 min)
✅ Matrix testing on main branch only
✅ Security scans weekly, not per commit
✅ Documentation checks on releases only

Total: ~500-1,000 min/month ($0-8/mo)
```

**Option B: Self-Hosted Runner**

- Rent $10-20/mo VPS (Hetzner, DigitalOcean)
- Install GitHub self-hosted runner
- Total cost: $20/mo for UNLIMITED minutes
- **Best if you have 5+ active private repos**

**Option C: Strategic Testing**

```yaml
# Only test what matters
on:
  pull_request: # Test on PRs
  push:
    branches: [main] # Test on main
    paths-ignore:
      - '**.md'
      - 'docs/**'

# Skip matrix on draft PRs
if: github.event.pull_request.draft == false
```

### For qa-architect Product

**Current Default** (what qa-architect creates):

- ❌ Enterprise-grade CI for solo devs
- ❌ Costs $100-350/mo for typical projects
- ❌ Over-engineering: Gitleaks + Semgrep on every commit

**Recommended Default**:

```yaml
Basic (Free tier friendly):
✅ Lint + format + test (current Node only)
✅ Security scans weekly
✅ Matrix testing opt-in only
✅ Path filters enabled by default

Pro tier enhancements:
✅ Add matrix testing (if needed)
✅ Add cross-platform testing (if needed)
✅ Add comprehensive security (scheduled)
```

---

## Action Items

### Immediate (This Week)

1. Add path filters to all repos → Save 20% instantly
2. Move security scans to weekly schedule → Save 95% of security costs
3. Remove duplicate matrix jobs → Save 50% of test costs

### Short Term (This Month)

1. Redesign qa-architect default template (minimal-first approach)
2. Create three tiers:
   - `--minimal`: Lint + test (current Node), FREE tier friendly
   - `--standard`: + matrix testing (main branch only)
   - `--comprehensive`: Current setup (for large teams)
3. Add `--public` flag that optimizes for unlimited minutes

### Long Term (Q1 2026)

1. Add cost analyzer to `npx create-qa-architect` (show estimated costs)
2. Default to minimal setup, prompt for upgrades
3. Document self-hosted runner setup guide
4. Create cost monitoring dashboard (track actual usage)

---

## Conclusion

**YES, you're right to question this.**

qa-architect is creating **enterprise-grade CI for solo developers**, resulting in:

- 3-5x longer CI times than industry standards
- 10-20x higher costs than necessary
- Excessive testing that doesn't add proportional value

**The fix**: Shift to "minimal by default, comprehensive on demand."

For your specific projects:

- **vibebuildlab**: $358/mo → $12/mo (implement Phase 1 + 2)
- **qa-architect**: $110/mo → $5/mo (same changes)
- **Total savings**: $451/month ($5,412/year)

Or just make repos public → **$0/month**.
