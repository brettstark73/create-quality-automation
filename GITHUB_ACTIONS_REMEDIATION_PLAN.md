# GitHub Actions Cost Remediation Plan

**Date**: 2026-01-13
**Status**: Action Required

## Executive Summary

Comprehensive audit reveals **300-500 min/month** wasted across qa-architect ecosystem due to:

1. Duplicate workflows
2. Excessive scheduled runs (nightly → should be weekly)
3. Matrix over-execution in minimal mode
4. Broken publishing pipeline

**Impact**: 11 repos using qa-architect need updates once fixes published.

---

## Critical Issues

### 1. Publishing Broken 🚨

- **Local**: v5.6.1
- **npm**: v5.4.3
- **Root Cause**: v5.6.1 committed but tag never created/pushed
- **Impact**: Users stuck on old version with workflow bugs

### 2. Duplicate Workflows

Both `auto-release.yml` AND `release.yml` trigger on `v*` tags:

- auto-release.yml: Creates GitHub release
- release.yml: npm publish + GitHub release
  **Result**: Duplicate execution, second overwrites first

### 3. Excessive Scheduling

`nightly-gitleaks-verification.yml` runs EVERY NIGHT (30×/month):

- Purpose: Verify gitleaks binary integrity
- Reality: Overkill - weekly sufficient
- **Waste**: ~200 min/month

### 4. Matrix Over-Execution

`quality.yml` core-checks runs `[20, 22]` matrix unconditionally:

- Should respect workflow tier (minimal = single version)
- Doubles runner minutes on every commit
- **Waste**: ~50% of core-checks execution time

---

## Ecosystem Audit

### Repos Using qa-architect (11 total)

1. qa-architect
2. stark-program-intelligence
3. project-starter-guide
4. keyflash (7 workflows - over-monitored!)
5. brettstark
6. ai-learning-companion
7. jobrecon
8. vibebuildlab
9. brettstark-about
10. postrail
11. retireabroad

### Wasteful Patterns Found

**auto-release.yml** (5+ repos):

- Found in: vibebuildlab, jobrecon, brettstark, keyflash, qa-architect
- Only needed for repos that publish to npm
- Others should DELETE this workflow

**weekly-audit.yml** (qa-architect, keyflash):

- Runs full test suite weekly
- Reports to vibebuildlab dashboard
- **Question**: Is dashboard actively monitored?
- **Action**: If NO, remove from all repos

**daily-deploy-check.yml** (qa-architect, keyflash):

- Runs 30×/month for URL/SSL checks
- **Question**: Needed on ALL repos?
- **Action**: Keep only for production apps

---

## PHASE 1: Fix qa-architect (IMMEDIATE)

**Priority**: CRITICAL - Blocks all downstream updates

### 1.1 Delete Duplicate Workflow

```bash
cd ~/Projects/qa-architect
git rm .github/workflows/auto-release.yml
git commit -m "fix: remove duplicate auto-release workflow (redundant with release.yml)"
```

### 1.2 Fix Core-Checks Matrix

Update `.github/workflows/quality.yml`:

```yaml
# Current (line 88-94):
core-checks:
  runs-on: ubuntu-latest
  needs: detect-maturity
  strategy:
    matrix:
      node-version: [20, 22]  # ❌ Always runs both
    fail-fast: false

# Should be:
core-checks:
  runs-on: ubuntu-latest
  needs: detect-maturity
  strategy:
    matrix:
      # Respect workflow tier - minimal mode uses single Node version
      node-version: ${{ github.event_name == 'schedule' && '[20, 22]' || '[22]' }}
    fail-fast: false
```

**Alternative**: Use workflow tier detection to set matrix dynamically based on WORKFLOW_MODE marker.

### 1.3 Reduce Gitleaks Schedule

Update `.github/workflows/nightly-gitleaks-verification.yml`:

```yaml
# Current:
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM ❌

# Change to:
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM ✅
```

### 1.4 Create Missing Tag & Publish

```bash
cd ~/Projects/qa-architect

# Verify tests pass
npm run prerelease

# Create and push tag
git tag -a v5.6.1 -m "Release v5.6.1 - CI concurrency controls and workflow fixes"
git push origin v5.6.1

# Monitor release workflow
# https://github.com/your-org/qa-architect/actions
```

**Verify**:

1. GitHub Actions release.yml workflow triggers
2. npm publish succeeds
3. `npm view create-qa-architect version` returns `5.6.1`

---

## PHASE 2: Update All Repos (AFTER v5.6.1 published)

### 2.1 Automated Update Script

```bash
#!/bin/bash
# update-qa-architect-repos.sh

REPOS=(
  "stark-program-intelligence"
  "project-starter-guide"
  "keyflash"
  "brettstark"
  "ai-learning-companion"
  "jobrecon"
  "vibebuildlab"
  "brettstark-about"
  "postrail"
  "retireabroad"
)

for repo in "${REPOS[@]}"; do
  echo "=== Updating $repo ==="
  cd ~/Projects/$repo

  # Update to latest qa-architect
  npx create-qa-architect@latest

  # Commit changes
  git add .
  git commit -m "chore: update qa-architect to v5.6.1 (workflow optimizations)"
  git push

  echo
done
```

### 2.2 Manual Workflow Cleanup

For EACH repo, check `.github/workflows/`:

**Remove auto-release.yml IF**:

- Repo doesn't publish to npm (check package.json for `"private": true`)
- No npm publish workflow exists

**Keep auto-release.yml IF**:

- Repo publishes to npm (like qa-architect itself)

**Audit Checklist**:

```bash
# For each repo:
cd ~/Projects/<repo>

# 1. Check if npm package
grep -q '"private": true' package.json && echo "NOT npm package - can remove auto-release" || echo "IS npm package - keep auto-release"

# 2. Count workflows
ls -1 .github/workflows/ | wc -l

# 3. Check workflow mode
grep "WORKFLOW_MODE" .github/workflows/quality.yml || echo "No mode marker - likely comprehensive (expensive)"

# 4. List all workflows
ls -1 .github/workflows/
```

---

## PHASE 3: Vibebuildlab Monitoring (REVIEW FIRST)

**Decision Required**: Is `dash.vibebuildlab.com` actively monitored?

### IF YES (Dashboard is used):

1. Keep `weekly-audit.yml` in critical repos only
2. Remove `daily-deploy-check.yml` from non-production repos
3. keyflash: Keep weekly-audit, remove daily-deploy-check

### IF NO (Dashboard not used):

1. Remove `weekly-audit.yml` from ALL repos
2. Remove `daily-deploy-check.yml` from ALL repos
3. Archive dashboard code if not needed

**Repos to clean**:

- qa-architect (has both)
- keyflash (has both)

```bash
# If removing monitoring workflows:
cd ~/Projects/qa-architect
git rm .github/workflows/weekly-audit.yml
git rm .github/workflows/daily-deploy-check.yml
git commit -m "chore: remove vibebuildlab monitoring workflows (dashboard not in use)"

# Repeat for keyflash
cd ~/Projects/keyflash
git rm .github/workflows/weekly-audit.yml
git rm .github/workflows/daily-deploy-check.yml
git commit -m "chore: remove vibebuildlab monitoring workflows (dashboard not in use)"
```

---

## PHASE 4: Optimize Workflow Modes

### Repo-by-Repo Mode Recommendations

**minimal** (default - use for most projects):

- Single Node 22 for tests
- Security weekly only
- Path filters (skip docs)
- **Cost**: $0-5/month
- **Use for**: Side projects, experiments, low-traffic apps

**standard** (use selectively):

- Matrix [20, 22] for tests
- Tests ONLY on main branch
- Security weekly
- **Cost**: $5-20/month
- **Use for**: Active projects with users

**comprehensive** (use rarely):

- Matrix every commit
- Security every commit
- No path filters
- **Cost**: $100-350/month
- **Use for**: Critical infrastructure (qa-architect itself)

**Action**: Audit each repo and set appropriate mode:

```bash
cd ~/Projects/<repo>

# Check current mode
grep "WORKFLOW_MODE" .github/workflows/quality.yml

# Update if needed
npx create-qa-architect --workflow-minimal   # Most repos
npx create-qa-architect --workflow-standard  # Active projects
npx create-qa-architect --workflow-comprehensive  # Critical only
```

**Recommendations**:

- **minimal**: brettstark-about, postrail, retireabroad, ai-learning-companion
- **standard**: jobrecon, vibebuildlab, keyflash, brettstark
- **comprehensive**: qa-architect (critical infrastructure)

---

## Expected Impact

### Before Optimization

- qa-architect: ~8 workflows, nightly + matrix runs
- 11 repos with duplicate workflows
- Estimated: 500-800 min/month across ecosystem

### After Optimization

- qa-architect: 6 workflows, weekly + optimized matrix
- Clean workflows across all repos
- Estimated: 200-300 min/month (60% reduction)

**Monthly Savings**: 300-500 minutes
**Annual Savings**: ~3,600-6,000 minutes

---

## Execution Checklist

### Immediate (Phase 1) - qa-architect fixes

- [ ] Delete `.github/workflows/auto-release.yml`
- [ ] Fix core-checks matrix to respect workflow tier
- [ ] Change nightly-gitleaks to weekly schedule
- [ ] Run `npm run prerelease` to verify tests pass
- [ ] Create and push `v5.6.1` tag
- [ ] Verify npm publish succeeds
- [ ] Confirm `npm view create-qa-architect version` = 5.6.1

### Within 48h (Phase 2) - Repo updates

- [ ] Run update script on all 11 repos
- [ ] Manual review of each repo's workflows
- [ ] Remove unnecessary auto-release.yml files
- [ ] Commit and push all changes

### Within 1 week (Phase 3) - Monitoring decision

- [ ] Check vibebuildlab dashboard usage
- [ ] Remove or consolidate monitoring workflows
- [ ] Document decision in CLAUDE.md

### Within 2 weeks (Phase 4) - Mode optimization

- [ ] Audit each repo's workflow mode
- [ ] Update to appropriate tier (minimal/standard)
- [ ] Document recommendations in each CLAUDE.md

---

## Monitoring & Validation

### Track GH Actions Usage

Check monthly usage at: https://github.com/settings/billing/summary

### Key Metrics

- **Before**: ~500-800 min/month
- **Target**: <300 min/month
- **Alert if**: Usage exceeds 400 min/month

### Quarterly Reviews

- Review workflow configurations
- Check for new wasteful patterns
- Update this document with findings

---

## Additional Opportunities

### 1. Concurrency Controls ✅

qa-architect has good concurrency config - verify other repos have this:

```yaml
concurrency:
  group: quality-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 2. Path Filters ✅

Minimal/standard modes use path-ignore for docs - working correctly

### 3. Cache Optimization ✅

Using package manager cache - effective

### 4. Smart Test Strategy (PRO feature)

Consider using to skip tests when only docs changed

### 5. Template Centralization

Consider storing workflow templates in separate repo for easier updates

### 6. Cost Alerting

Add workflow to track actual GH Actions minutes and alert when exceeding budget

---

## Questions for Review

1. **vibebuildlab dashboard**: Is it actively monitored? Should we keep audit workflows?
2. **daily-deploy-check**: Needed on all repos or just production apps?
3. **auto-release**: Which repos actually publish releases? (audit npm publishing needs)
4. **workflow modes**: Are recommendations above appropriate for each project's criticality?
5. **keyflash**: Why 7 workflows? Is this project production-critical?

---

## Next Steps

**TODAY**:

1. Review this plan
2. Answer questions above
3. Approve Phase 1 fixes

**THIS WEEK**:

1. Execute Phase 1 (qa-architect fixes)
2. Publish v5.6.1 to npm
3. Begin Phase 2 (repo updates)

**ONGOING**:
Monitor GH Actions usage monthly and iterate
