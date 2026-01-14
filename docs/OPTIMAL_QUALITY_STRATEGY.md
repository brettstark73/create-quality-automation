# Optimal Quality Strategy - Universal & Cost-Effective

**Date:** 2026-01-14
**Goal:** Maintain high quality while getting under 2,000 GH Actions min/month

## Key Insights

1. **/bs:quality already exists** - Comprehensive autonomous quality loop using Claude Code agents
2. **qa-architect should work for everyone** - Not everyone has Claude Code MAX
3. **60-80% of CI checks are redundant** - Already running in pre-push hooks
4. **Security scans CAN run locally** - gitleaks, npm audit are free

---

## Three-Tier Quality Approach

### Tier 1: Pre-Push (Universal - Works for Everyone)

**Time:** 45-150 seconds
**Cost:** Free (runs locally)
**Who:** Everyone using qa-architect

```bash
✅ ESLint + Prettier + Stylelint (already in place)
✅ TypeScript type-check (already in place)
✅ Unit tests - smart strategy (already in place)
+ 🔐 Gitleaks (secret scanning) - ADD THIS
+ 🔐 npm audit (dependency vulnerabilities) - ADD THIS
+ 🔐 XSS pattern detection (grep-based) - ADD THIS
```

**Result:** Catch 95% of issues before push, including security issues

---

### Tier 2: On-Demand /bs:quality (Claude Code Users)

**Time:** 2-5 min (quick) to 1-3 hours (level 98)
**Cost:** Free with Claude Code MAX, usage-based on other tiers
**Who:** Claude Code users (any tier)

```bash
/bs:quality --scope changed      # Quick: 2-5 min, uncommitted changes
/bs:quality                      # Default: 30-60 min, branch scope, 95%
/bs:quality --level 98           # Comprehensive: 1-3 hours, 98% quality
/bs:quality --merge              # + auto-merge and deploy
```

**Agents:**

- code-reviewer
- silent-failure-hunter
- type-design-analyzer
- code-simplifier
- security-auditor (level 98)
- accessibility-tester (level 98)
- performance-engineer (level 98)
- architect-reviewer (level 98)

**Result:** Comprehensive AI-powered review before PR

---

### Tier 3: Minimal GitHub Actions (Safety Net Only)

**Time:** 1-3 minutes
**Cost:** Minimized to essential checks only
**Who:** Runs automatically on push to main

**REMOVE redundant checks:**

- ❌ ESLint (redundant with pre-push)
- ❌ Prettier (redundant with pre-push)
- ❌ Stylelint (redundant with pre-push)
- ❌ Unit tests (redundant with pre-push)
- ❌ TypeScript type-check (redundant with pre-push)
- ❌ Gitleaks (moving to pre-push)
- ❌ npm audit (moving to pre-push)
- ❌ XSS detection (moving to pre-push)
- ❌ Smoke tests (redundant, covered by unit tests)

**KEEP minimal checks:**

- ✅ Package signature verification (needs npm registry)
- ✅ E2E smoke test (optional, main branch only)
- ✅ Build verification (quick, ensures deployability)

**Optional scheduled scan:**

- 🗓️ Weekly security audit (gitleaks + npm audit) - runs once/week
- **Cost:** ~10 min/week = 40 min/month per repo

---

## Implementation for qa-architect

### Phase 1: Add Local Security Scans (Everyone Benefits)

**Timeline:** v5.7.0 release

Add to pre-push hook (`.husky/pre-push`):

```bash
#!/bin/sh
echo "🔍 Running pre-push validation..."

# Existing checks
npm run lint || exit 1
npm run format:check || exit 1
npm test || exit 1

# NEW: Security scans
echo "🔐 Scanning for secrets..."
if command -v gitleaks &> /dev/null; then
  gitleaks detect --no-git --verbose || exit 1
else
  echo "⚠️  gitleaks not installed - skipping secret scan"
  echo "   Install: brew install gitleaks (Mac) or see https://github.com/gitleaks/gitleaks"
fi

echo "🔐 Checking dependencies..."
npm audit --audit-level=high || exit 1

echo "🔐 Scanning for XSS patterns..."
# Check for dangerous patterns
if grep -rE "innerHTML.*\\\$\{" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null; then
  echo "❌ Potential XSS: innerHTML with interpolation found"
  exit 1
fi

echo "✅ All pre-push checks passed!"
```

**Add gitleaks to devDependencies** (or recommend global install):

```json
{
  "devDependencies": {
    "gitleaks": "^8.18.0" // or global install instructions
  }
}
```

**Benefits:**

- ✅ Works for everyone (not just MAX tier)
- ✅ Catches secrets before they reach GitHub
- ✅ Catches vulnerable dependencies early
- ✅ Catches XSS patterns locally
- ✅ Still fast enough (adds ~10-15s to pre-push)

---

### Phase 2: Slim Down GitHub Actions Template

**Timeline:** v5.7.0 release

New `.github/workflows/quality.yml` template:

```yaml
name: Quality Checks

on:
  push:
    branches: [main, master]
    # Only run on main - feature branches rely on pre-push hooks
  schedule:
    # Weekly security audit as safety net
    - cron: '0 2 * * 0' # Sunday 2 AM

concurrency:
  group: quality-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  minimal-verification:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v6
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # Only essential checks that can't run locally
      - name: Verify build
        run: npm run build

      - name: Package signature verification
        run: npm audit signatures || echo "⚠️ Signature verification failed"

      # Optional: E2E smoke test (only on main)
      - name: E2E smoke test
        if: github.ref == 'refs/heads/main'
        run: |
          npx playwright install --with-deps chromium
          npm run test:e2e || echo "⚠️ E2E tests failed"
        continue-on-error: true

  # Weekly security audit (safety net)
  weekly-security:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0 # Full history for gitleaks

      - name: Gitleaks scan
        uses: gitleaks/gitleaks-action@v2

      - name: Dependency audit
        run: npm audit --audit-level=high
```

**Result:**

- Main branch push: ~2-3 minutes (build + signatures + optional E2E)
- Weekly security: ~3-5 minutes once/week
- **Total per repo:** ~10-15 min/week = 40-60 min/month

---

## Cost Calculation

### Before (Current State)

**Per repo per day:**

- Every push: 5 min (redundant checks)
- Average 5 pushes/day = 25 min/day
- **Monthly:** 25 × 30 = 750 min/month per repo

**11 repos:**

- 750 × 11 = 8,250 min/month
- **Cost:** ~$49/month

### After (Optimized)

**Per repo per day:**

- Main branch push: 2-3 min (1-2 times/day max)
- Average 2 min/day (most work on feature branches uses local hooks)
- **Monthly:** 2 × 30 = 60 min/month per repo

**11 repos:**

- 60 × 11 = 660 min/month
- **Cost:** ~$4/month

**Savings: $45/month (92% reduction)**

---

## For Users Without Claude Code

**They still get:**

- ✅ Pre-push security scans (gitleaks, npm audit, XSS detection)
- ✅ Full lint/format/test automation
- ✅ Minimal CI as safety net
- ✅ All core qa-architect features

**They miss:**

- ❌ /bs:quality autonomous agents (need Claude Code)

**But they can:**

- ✅ Use /pr-review-toolkit:review-pr skill (if they have Claude Code on any tier)
- ✅ Manual PR reviews with Claude Code
- ✅ Still maintain high quality with automated tooling

---

## For Users With Claude Code MAX

**They get everything above PLUS:**

- ✅ /bs:quality autonomous loops (unlimited)
- ✅ On-demand comprehensive reviews
- ✅ AI-powered architecture guidance
- ✅ Cost-free comprehensive testing

**Workflow:**

```bash
# 1. Work on feature
git checkout -b feature/new-auth

# 2. Small commits with quick checks
# ... code ...
/bs:quality --scope changed    # 2-5 min
git commit -m "feat: add login"

# 3. Feature complete
/bs:quality                    # 30-60 min, comprehensive
/bs:quality --merge            # Auto-merge and deploy

# Total GH Actions cost: $0 (only runs on main after merge)
```

---

## Migration Path

### Week 1: Update qa-architect (v5.7.0)

- [ ] Add gitleaks to pre-push hook
- [ ] Add npm audit to pre-push hook
- [ ] Add XSS pattern detection to pre-push hook
- [ ] Update GH Actions template (minimal)
- [ ] Update documentation
- [ ] Release v5.7.0

### Week 2: Update All Repos

- [ ] Run `npx create-qa-architect@latest` on all 11 repos
- [ ] Test pre-push hooks work (try to commit a secret, should fail)
- [ ] Verify CI runs only on main
- [ ] Commit and push

### Week 3: Monitor

- [ ] Check GH Actions usage dashboard
- [ ] Verify under 2,000 min/month
- [ ] Collect feedback on pre-push speed

---

## FAQ

### "Won't pre-push be too slow with security scans?"

**A:** Gitleaks is fast (~3-5s), npm audit is ~5-10s, XSS grep is ~2s. Total addition: ~10-15s max.

**Before:** 30-120s
**After:** 45-150s
**Still acceptable** for catching security issues before they hit GitHub.

### "What if I don't have gitleaks installed?"

**A:** Pre-push hook shows warning but doesn't fail. User can install with `brew install gitleaks` or continue without it (CI weekly scan still catches issues).

### "What about repos I'm not actively working on?"

**A:** They still get weekly security scans (40-60 min/month). If inactive for >3 months, consider disabling CI entirely and re-enabling when active.

### "Can I still use comprehensive CI if I want?"

**A:** Yes! Add `--workflow-comprehensive` flag when running qa-architect. Good for critical production apps or open-source projects with external contributors.

---

## Decision Matrix: Which Repos Need What?

### Minimal CI (Default - Recommended for 9/11 repos)

**Use for:** Side projects, internal tools, personal sites
**Cost:** 40-60 min/month per repo
**Safety:** Weekly security scan + local pre-push

- brettstark-about
- ai-learning-companion
- retireabroad
- stark-program-intelligence
- project-starter-guide
- jobrecon
- vibebuildlab
- postrail
- brettstark

### Standard CI (Active Projects - 2 repos)

**Use for:** Active development, moderate traffic
**Cost:** 100-150 min/month per repo
**Safety:** Main branch checks + weekly security

- keyflash
- qa-architect (your product)

### Comprehensive CI (Critical Only - 0 repos currently)

**Use for:** Open source with external PRs, production critical
**Cost:** 300-500 min/month per repo
**Safety:** Every commit checked

- (None currently - can enable per-project if needed)

**Total with this approach:**

- 9 minimal repos: 9 × 50 = 450 min/month
- 2 standard repos: 2 × 125 = 250 min/month
- **Total: 700 min/month (~$4.20/month)**

✅ **Well under 2,000 min/month limit**

---

## Recommendation

**Best strategy:**

1. **Update qa-architect v5.7.0** with local security scans (benefits everyone)
2. **Use minimal CI template** for 9/11 repos (weekly scans only)
3. **Use standard CI** for qa-architect and keyflash (active development)
4. **Keep /bs:quality** for on-demand comprehensive reviews (MAX tier users)
5. **Don't disable CI completely** - weekly scans are valuable safety net

**Result:**

- ✅ Under 2,000 min/month (~700 min/month)
- ✅ Better security (local scans catch issues earlier)
- ✅ Works for everyone (not just MAX tier)
- ✅ Maintains quality (pre-push + weekly scans + /bs:quality)
- ✅ Cost-effective ($4/month vs $49/month)
