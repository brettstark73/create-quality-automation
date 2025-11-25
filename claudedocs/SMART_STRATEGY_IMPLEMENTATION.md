# Smart Test Strategy - Universal Implementation Plan

**Date:** 2025-11-25
**Decision:** Implement adaptive smart testing across ALL projects
**Status:** Ready for Implementation

---

## Core Smart Strategy Pattern

### Universal Risk Scoring (0-10)

**File-Based Risk Factors:**

- High-risk files (project-specific): +4
- API/Route files: +2
- Config files (package.json, .env, etc.): +2
- Security files (auth, payment, crypto): +3

**Change-Based Risk Factors:**

- Files changed > 10: +2
- Lines changed > 200: +2
- Files changed > 20: +3

**Branch-Based Risk Factors:**

- main/master/production: +3
- hotfix/\*: +4
- release/\*: +2
- develop: +1

**Time-Based Optimization:**

- Work hours (9am-5pm M-F): Speed bonus (favor faster tests)
- Off hours: Favor comprehensive testing

**Test Tier Selection:**

- Risk ≥ 7: **Comprehensive** (all tests + security audit)
- Risk 4-6: **Medium** (fast + integration, exclude slow)
- Risk 2-3: **Fast** (unit tests + smoke tests only)
- Risk 0-1: **Minimal** (lint + format only)

---

## Project-Specific Configurations

### 1. create-quality-automation (CLI Tool)

**High-Risk Patterns:**

```bash
setup.js|lib/.*|templates/.*|config/.*
```

**Test Tiers:**

```json
{
  "minimal": "lint + format:check",
  "fast": "minimal + test:unit",
  "medium": "fast + test:patterns + test:commands",
  "comprehensive": "medium + test:integration + security:audit"
}
```

**Risk Customization:**

- setup.js changes: +4 (critical file)
- Template changes: +3 (affects generated projects)
- Test changes: +1 (self-validating)

**Rationale:** CLI tool changes to setup.js or templates affect ALL users who run the tool.

---

### 2. letterflow (Web App)

**High-Risk Patterns:**

```bash
auth|payment|security|crypto|api/generate|api/scrape
```

**Test Tiers:**

```json
{
  "minimal": "lint + format:check",
  "fast": "minimal + test:unit",
  "medium": "fast + test:smoke (excludes crypto/browser)",
  "comprehensive": "test:all + test:e2e + security:audit"
}
```

**Risk Customization:**

- Auth/payment files: +4
- API routes: +2
- Crypto operations: +3
- Database migrations: +3

**Status:** Script exists, just needs activation

---

### 3. keyflash (TBD - After Analysis)

**Pending:** Analyze project structure first

**Expected High-Risk Patterns:**

```bash
TBD after analysis
```

---

### 4. saas-starter-template (SaaS Boilerplate)

**High-Risk Patterns:**

```bash
auth|payment|billing|subscription|stripe|api
```

**Test Tiers:**

```json
{
  "minimal": "lint + format:check",
  "fast": "minimal + test:unit",
  "medium": "fast + test:integration",
  "comprehensive": "medium + test:e2e + security:audit"
}
```

**Risk Customization:**

- Auth templates: +4 (affects all users)
- Payment integration: +4 (financial risk)
- Database schema: +3
- API routes: +2

**Rationale:** Template changes affect all projects bootstrapped from this template.

---

### 5. project-starter-guide (Documentation)

**High-Risk Patterns:**

```bash
guides/security|guides/deployment|setup-instructions
```

**Test Tiers:**

```json
{
  "minimal": "markdownlint",
  "fast": "minimal + link:check:fast",
  "medium": "fast + spelling + grammar",
  "comprehensive": "medium + link:check:external + accessibility"
}
```

**Risk Customization:**

- Security guide changes: +3 (accuracy critical)
- Setup instructions: +2 (user-facing)
- Examples/snippets: +1

**Rationale:** Documentation errors can mislead users. Security docs need extra validation.

---

## Universal Smart Strategy Script Template

```bash
#!/bin/bash
# Smart Test Strategy - [PROJECT_NAME]
set -e

echo "🧠 Analyzing changes for optimal test strategy..."

# Collect metrics
CHANGED_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | wc -l | tr -d ' ')
CHANGED_LINES=$(git diff --stat HEAD~1..HEAD 2>/dev/null | tail -1 | grep -o '[0-9]* insertions' | grep -o '[0-9]*' || echo "0")
CURRENT_BRANCH=$(git branch --show-current)
HOUR=$(date +%H)
DAY_OF_WEEK=$(date +%u)

# Project-specific high-risk patterns
HIGH_RISK_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -E "PROJECT_SPECIFIC_PATTERN" || true)
API_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -E "api/" || true)
CONFIG_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -E "(package\.json|\.env|config)" || true)
TEST_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -E "test|spec" || true)

# Calculate risk score (0-10)
RISK_SCORE=0

# File-based risk
[[ -n "$HIGH_RISK_FILES" ]] && RISK_SCORE=$((RISK_SCORE + 4))
[[ -n "$API_FILES" ]] && RISK_SCORE=$((RISK_SCORE + 2))
[[ -n "$CONFIG_FILES" ]] && RISK_SCORE=$((RISK_SCORE + 2))

# Size-based risk
[[ $CHANGED_FILES -gt 10 ]] && RISK_SCORE=$((RISK_SCORE + 2))
[[ $CHANGED_FILES -gt 20 ]] && RISK_SCORE=$((RISK_SCORE + 3))
[[ $CHANGED_LINES -gt 200 ]] && RISK_SCORE=$((RISK_SCORE + 2))

# Branch-based risk
case $CURRENT_BRANCH in
  main|master|production) RISK_SCORE=$((RISK_SCORE + 3)) ;;
  hotfix/*) RISK_SCORE=$((RISK_SCORE + 4)) ;;
  release/*) RISK_SCORE=$((RISK_SCORE + 2)) ;;
  develop) RISK_SCORE=$((RISK_SCORE + 1)) ;;
esac

# Time pressure adjustment
if [[ $HOUR -ge 9 && $HOUR -le 17 && $DAY_OF_WEEK -le 5 ]]; then
  SPEED_BONUS=true
else
  SPEED_BONUS=false
fi

# Display analysis
echo "📊 Analysis Results:"
echo "   📁 Files: $CHANGED_FILES"
echo "   📏 Lines: $CHANGED_LINES"
echo "   🌿 Branch: $CURRENT_BRANCH"
echo "   🎯 Risk Score: $RISK_SCORE/10"
echo "   ⚡ Speed Bonus: $SPEED_BONUS"
echo ""

# Decision logic
if [[ $RISK_SCORE -ge 7 ]]; then
  echo "🔴 HIGH RISK - Comprehensive validation"
  PROJECT_TEST_COMPREHENSIVE
elif [[ $RISK_SCORE -ge 4 ]]; then
  echo "🟡 MEDIUM RISK - Standard validation"
  PROJECT_TEST_MEDIUM
elif [[ $RISK_SCORE -ge 2 || "$SPEED_BONUS" == "false" ]]; then
  echo "🟢 LOW RISK - Fast validation"
  PROJECT_TEST_FAST
else
  echo "⚪ MINIMAL RISK - Quality checks only"
  PROJECT_TEST_MINIMAL
fi

echo ""
echo "💡 Tip: Run 'npm run test:comprehensive' locally for full validation"
```

---

## Implementation Phases

### Phase 1: Setup Infrastructure (All Projects)

**For Each Project:**

1. **Create test tier npm scripts** in package.json:

   ```json
   {
     "test:unit": "run only unit tests",
     "test:fast": "test:unit + smoke tests",
     "test:medium": "test:fast + integration (exclude slow)",
     "test:slow": "slow tests only (crypto, E2E, real APIs)",
     "test:comprehensive": "all tests + security audit"
   }
   ```

2. **Create smart strategy script** at `scripts/smart-test-strategy.sh`
   - Copy universal template
   - Customize high-risk patterns
   - Define test tier commands

3. **Update pre-push hook** at `.husky/pre-push`:

   ```bash
   echo "🔍 Running smart pre-push validation..."
   bash scripts/smart-test-strategy.sh
   ```

4. **Test the strategy:**
   - Test minimal risk (doc change)
   - Test medium risk (code change)
   - Test high risk (main branch + setup.js)

---

### Phase 2: Project-by-Project Rollout

**Order (by pain level):**

1. **create-quality-automation** (Day 1)
   - Current: 10+ hour pre-push
   - Target: 2s (docs) → 2min (high-risk)
   - Impact: CRITICAL - blocks workflow

2. **letterflow** (Day 1)
   - Current: 15s fixed
   - Target: 2s (docs) → 35s (high-risk)
   - Impact: Minor improvement, activate existing script

3. **keyflash** (Day 2 - after analysis)
   - Current: Unknown
   - Target: TBD after analysis
   - Impact: TBD

4. **saas-starter-template** (Day 2)
   - Current: Unknown
   - Target: Fast template validation
   - Impact: Medium - affects template users

5. **project-starter-guide** (Day 2)
   - Current: Unknown
   - Target: Docs-optimized strategy
   - Impact: Low - documentation project

---

### Phase 3: Validation & Tuning

**Per Project:**

1. Monitor pre-push times over 1 week
2. Track false negatives (CI catches issues pre-push missed)
3. Adjust risk thresholds if needed
4. Document learnings

**Success Metrics:**

- Pre-push < 2 min for 95% of commits
- CI failure rate < 5% (pre-push catches most issues)
- No production incidents from missed issues

---

## Implementation Timeline

**Day 1: High-Priority Projects**

- Morning: create-quality-automation implementation
- Afternoon: letterflow activation + testing
- Evening: Validate both working

**Day 2: Remaining Projects**

- Morning: Analyze keyflash
- Afternoon: Implement saas-starter-template
- Evening: Implement project-starter-guide

**Day 3: Validation & Documentation**

- Test all strategies with various change types
- Update project CLAUDE.md files
- Create universal testing guide
- Document learnings

---

## Testing Checklist (Per Project)

**Before Activation:**

- [ ] Test tiers defined in package.json
- [ ] Smart strategy script created
- [ ] High-risk patterns validated
- [ ] Pre-push hook updated

**Activation Testing:**

- [ ] Minimal risk: Doc change only → Should run lint only
- [ ] Low risk: Small code change → Should run fast tests
- [ ] Medium risk: API change → Should run medium tests
- [ ] High risk: Main branch + critical file → Should run comprehensive

**Post-Activation:**

- [ ] Monitor pre-push times
- [ ] Check CI failure rate
- [ ] Gather developer feedback
- [ ] Tune thresholds if needed

---

## Risk Pattern Examples by Project

### create-quality-automation

```bash
HIGH_RISK="setup\.js|lib/.*\.js|templates/.*|config/.*"
MEDIUM_RISK="tests/.*\.test\.js|package\.json"
LOW_RISK="docs/.*|README\.md|\.github/.*"
```

### letterflow

```bash
HIGH_RISK="auth|payment|crypto|api/(generate|scrape)"
MEDIUM_RISK="api/.*|lib/.*|components/.*"
LOW_RISK="docs/.*|README\.md|styles/.*"
```

### saas-starter-template

```bash
HIGH_RISK="auth|payment|billing|stripe|prisma/schema"
MEDIUM_RISK="api/.*|components/.*|lib/.*"
LOW_RISK="docs/.*|README\.md|examples/.*"
```

---

## Escape Hatches

**Skip Smart Strategy (Emergency):**

```bash
SKIP_SMART=1 git push  # Runs comprehensive always
```

**Force Comprehensive:**

```bash
FORCE_COMPREHENSIVE=1 git push  # Always run full tests
```

**Force Minimal:**

```bash
FORCE_MINIMAL=1 git push  # Only lint (use with caution)
```

---

## Maintenance

**Monthly Review:**

- Check risk score distribution (are most commits minimal/low?)
- Verify high-risk patterns are still relevant
- Update patterns based on project evolution
- Check for false negatives (CI catching issues pre-push missed)

**Quarterly Tuning:**

- Analyze pre-push time trends
- Survey developer satisfaction
- Adjust risk thresholds based on data
- Share learnings across projects

---

## Next Actions

1. **Approve this plan** ✓
2. **Start with create-quality-automation** (Day 1 AM)
3. **Activate letterflow** (Day 1 PM)
4. **Analyze remaining projects** (Day 2)
5. **Roll out to all projects** (Day 2-3)

**Ready to implement?** Let me know and I'll start with create-quality-automation.
