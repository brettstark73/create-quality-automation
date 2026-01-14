# Quality Automation Analysis - qa-architect

**Date:** 2026-01-14
**Context:** Holistic review of quality automation to reduce GitHub Actions costs while maintaining high quality

## Current State: What qa-architect Provides

### Stage 1: Pre-Commit (< 15 seconds)

**Hook:** `.husky/pre-commit`
**Runs on:** Every `git commit`

✅ **Enforced:**

- lint-staged (ESLint, Prettier, Stylelint on staged files only)
- Test coverage check for new files (warning only)

**Scope:** Only files being committed

---

### Stage 2: Pre-Push (30-120 seconds)

**Hook:** `.husky/pre-push`
**Runs on:** Every `git push`

✅ **Enforced via Smart Test Strategy:**

- ESLint (full project)
- Prettier check (full project)
- Unit tests (risk-based selection)
- TypeScript type-check (if configured)

**Scope:** Current branch, risk-based test selection

---

### Stage 3: GitHub Actions (2-5 minutes)

**Workflow:** `.github/workflows/quality.yml`
**Runs on:** Every push to main, every PR

✅ **Enforced:**

**Quality:**

- ESLint (redundant with pre-push)
- Prettier check (redundant with pre-push)
- Stylelint (redundant with pre-push)

**Testing:**

- Unit tests (redundant with pre-push)
- Smoke tests
- E2E tests (Playwright)

**Security:**

- 🔐 Gitleaks (scans git history for secrets)
- 🔐 npm audit (dependency vulnerabilities)
- 🔐 npm audit signatures (package verification)
- 🔐 XSS pattern detection (innerHTML, eval, etc.)
- 🔐 Hardcoded secret detection

**Dependency Integrity:**

- Package-lock.json verification
- Dependency hash validation

**Scope:** Full codebase, full git history

---

## Problem: Massive Redundancy

### What Runs TWICE (Local + CI):

- ❌ ESLint full project
- ❌ Prettier full project
- ❌ Stylelint full project
- ❌ Unit tests
- ❌ TypeScript type-check

**Cost:** ~60-80% of GitHub Actions minutes are redundant checks

### What ONLY Runs in CI:

- ✅ Gitleaks (secret scanning)
- ✅ npm audit (dependency vulnerabilities)
- ✅ XSS pattern detection
- ✅ E2E tests (Playwright)
- ✅ Smoke tests
- ✅ Dependency integrity verification

---

## Gap Analysis: What's Missing Locally

### Can Run Locally (but currently don't):

1. **Secret Scanning**
   - Tool: gitleaks (can run locally)
   - Cost: Free locally, $0.03/run in CI
   - Coverage: Full git history

2. **Dependency Audits**
   - Tool: npm audit (already available)
   - Cost: Free locally, $0.02/run in CI
   - Coverage: All dependencies

3. **XSS Pattern Detection**
   - Tool: grep-based patterns (in current CI)
   - Cost: Free locally, $0.01/run in CI
   - Coverage: All source files

4. **E2E Tests**
   - Tool: Playwright (can run locally)
   - Cost: Free locally, $0.10-0.30/run in CI
   - Coverage: Critical user flows

5. **Code Reviews**
   - Tool: **Claude Code (MAX tier = unlimited)**
   - Cost: Free locally, ~$0.10/PR in CI via claude-code-action
   - Coverage: All code changes

### Currently ONLY in CI (should stay there):

- Package signature verification (needs npm registry access)
- Multi-platform testing (if using matrix builds)
- Scheduled scans (weekly security audits)

---

## Claude Code MAX Opportunity

**User has:** Claude Code MAX tier (unlimited API calls)

**Can do locally for FREE:**

- 🎯 Code reviews on every commit/PR
- 🎯 Architectural guidance
- 🎯 Security pattern analysis
- 🎯 Test quality assessment
- 🎯 Documentation review

**Currently doing in CI:** Paying for claude-code-action ($0.10/PR) when MAX tier is free

---

## Proposed Solution: Local-First Quality Automation

### Philosophy

> "If you can check it locally before push, you should."
> "GitHub Actions is for final verification only."

### New Flow

#### Stage 1: Pre-Commit (< 15 seconds)

**No changes - keep fast**

- lint-staged (staged files only)
- Test coverage check (warning)

#### Stage 2: Pre-Push (2-5 minutes)

**Enhanced local validation:**

- ESLint + Prettier + Stylelint (full project)
- TypeScript type-check
- Unit tests (smart strategy)
- **NEW: Gitleaks (secret scan)**
- **NEW: npm audit (dependency check)**
- **NEW: XSS pattern detection**

**Result:** Catch 95% of issues before they hit GitHub

#### Stage 3: Pre-PR (Optional - Claude Code)

**Manual trigger via /bs:quality:**

- Claude Code review (comprehensive)
- E2E test recommendations
- Architecture review
- Test quality analysis
- Security audit

**Result:** Human-in-the-loop quality check with AI assistance

#### Stage 4: GitHub Actions (Minimal)

**ONLY for things that can't run locally:**

- Package signature verification
- Multi-platform testing (if needed)
- **REMOVE:**
  - ❌ ESLint (redundant)
  - ❌ Prettier (redundant)
  - ❌ Stylelint (redundant)
  - ❌ Unit tests (redundant)
  - ❌ Gitleaks (moved to pre-push)
  - ❌ npm audit (moved to pre-push)
  - ❌ XSS detection (moved to pre-push)

**Result:** 90% reduction in GitHub Actions minutes

---

## Implementation Plan

### Phase 1: Add Local Security Scans (Immediate)

1. Add gitleaks to pre-push hook
2. Add npm audit to pre-push hook
3. Add XSS pattern detection to pre-push hook
4. Update qa-architect templates

**Impact:** Catch security issues before push

### Phase 2: Create /bs:quality Command (This Week)

Create comprehensive quality command leveraging Claude Code MAX:

```bash
/bs:quality [--full|--quick|--security]
```

**Features:**

- Code review (Claude Code)
- Security audit (gitleaks + patterns)
- Architecture review (Claude Code)
- Test quality (Claude Code)
- Dependency audit
- E2E test run
- Generate quality report

**Impact:** On-demand comprehensive quality without GH Actions cost

### Phase 3: Slim Down GitHub Actions (This Week)

1. Remove redundant checks from quality.yml
2. Keep only:
   - Package signature verification
   - Scheduled weekly security scan (low-cost)
   - (Optional) E2E smoke test on main only

**Impact:** 85-90% reduction in GH Actions minutes

### Phase 4: Update qa-architect Philosophy (Next Release)

1. Document local-first quality approach
2. Update templates to promote Claude Code usage
3. Add --local-first flag for CI-minimal setup
4. Promote /bs:quality workflow

**Impact:** All users benefit from cost-optimized approach

---

## Expected Outcomes

### Cost Reduction

**Before:**

- 11 repos × 220 min/day = 7,260 min/month
- Cost: ~$43/month in GH Actions

**After (with local-first):**

- 11 repos × 20 min/day = 660 min/month (only scheduled scans)
- Cost: ~$4/month in GH Actions
- **Savings: $39/month (90% reduction)**

### Quality Maintenance

- ✅ Same or better quality (earlier feedback)
- ✅ Faster feedback (local = seconds, CI = minutes)
- ✅ More comprehensive reviews (Claude Code MAX unlimited)
- ✅ No CI queue delays

### Developer Experience

- ✅ Faster iteration (don't wait for CI)
- ✅ Better feedback (Claude Code is more thorough)
- ✅ Works offline (local checks don't need internet)
- ✅ Cost-effective (MAX tier already paid for)

---

## Risks & Mitigations

### Risk: Developers bypass pre-push hooks

**Mitigation:** GitHub Actions still runs on main branch as final gate

### Risk: Secret scanning takes too long locally

**Mitigation:** Gitleaks is fast (<5s for most repos), runs in parallel with tests

### Risk: Not everyone has Claude Code MAX

**Mitigation:**

- /bs:quality is optional
- Scheduled CI scans still catch issues weekly
- Pre-push hooks are universal

---

## Next Steps

1. **Today:** Create /bs:quality command prototype
2. **This week:** Add security scans to pre-push hooks
3. **This week:** Slim down GitHub Actions workflows
4. **Next release:** Update qa-architect with local-first philosophy

---

## Questions for User

1. **Which repos MUST have CI?**
   - qa-architect (your product)?
   - Any others with external contributors?

2. **Acceptable pre-push time?**
   - Current: 30-120s
   - With security scans: 45-150s
   - Too long?

3. **Use Claude Code for automated reviews?**
   - Via /bs:quality command?
   - Or automatic on every commit?

4. **Keep minimal CI for safety net?**
   - Weekly scheduled scans only?
   - Or completely disable for some repos?
