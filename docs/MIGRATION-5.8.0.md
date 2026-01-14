# Migration Guide: v5.8.0

## Overview

Version 5.8.0 fixes critical silent failure bugs in the GitHub Actions workflow template that could allow broken code to merge:

1. **Lighthouse CI failures** were silently ignored (now fails production builds)
2. **Job summaries** always showed ✅ even when checks failed (now shows actual results)

## Who Should Upgrade?

**All projects using qa-architect** - especially production-ready projects that rely on Lighthouse CI for performance gates.

## Quick Migration (Recommended)

Update your workflow in one command:

```bash
npx create-qa-architect@latest
```

This will:

- Detect your existing workflow mode (minimal/standard/comprehensive)
- Preserve your current configuration
- Apply the bug fixes to `.github/workflows/quality.yml`

## What Changes?

### 1. Lighthouse CI - Now Fails Production Builds

**Before (v5.7.0):**

```yaml
- name: Lighthouse CI
  run: npx lhci autorun
  continue-on-error: true # ⚠️ Failures silently ignored
```

**After (v5.8.0):**

```yaml
- name: Lighthouse CI
  id: lighthouse
  run: npx lhci autorun
  continue-on-error: true

- name: Report Lighthouse Failures
  if: steps.lighthouse.outcome == 'failure'
  env:
    MATURITY: ${{ needs.detect-maturity.outputs.maturity }}
  run: |
    echo "::error::Lighthouse CI failed"
    # Fail build for production-ready projects
    if [ "$MATURITY" == "production-ready" ]; then
      exit 1
    fi
```

**Impact:**

- **Production-ready projects**: Lighthouse failures now block merges (hard gate)
- **Other projects**: Lighthouse failures show warnings but don't block (soft gate)

### 2. Job Summary - Shows Actual Results

**Before (v5.7.0):**

```yaml
# Always showed ✅ if enabled, regardless of pass/fail
echo "- ✅ Tests: Enabled" >> $GITHUB_STEP_SUMMARY
```

**After (v5.8.0):**

```yaml
# Shows actual result: ✅ success, ❌ failure, ⏭️ skipped
if [ "$TESTS_RESULT" == "success" ]; then
  echo "- ✅ Tests: Passed" >> $GITHUB_STEP_SUMMARY
elif [ "$TESTS_RESULT" == "failure" ]; then
  echo "- ❌ Tests: Failed" >> $GITHUB_STEP_SUMMARY
fi
```

**Impact:**

- Summaries now accurately reflect job outcomes
- Failures are immediately visible in PR checks

## Verification

After upgrading, verify the changes:

```bash
# Check workflow mode marker
grep "WORKFLOW_MODE:" .github/workflows/quality.yml

# Verify Lighthouse failure handler exists
grep -A 10 "Report Lighthouse Failures" .github/workflows/quality.yml

# Verify summary uses actual results
grep "CORE_RESULT" .github/workflows/quality.yml
```

## Rollback (If Needed)

If you need to rollback to v5.7.0:

```bash
npx create-qa-architect@5.7.0
```

## Breaking Changes

None - these are backwards-compatible bug fixes.

**Exception:** If you have production-ready maturity and currently have Lighthouse failures that are being ignored, they will now block your builds. This is the intended behavior to prevent quality regressions.

## FAQ

### Q: Will this affect my CI minutes?

No - the changes only add a conditional failure reporting step. No new jobs or scans.

### Q: What if I want to keep Lighthouse as a soft failure?

Remove the production-ready check from the "Report Lighthouse Failures" step:

```yaml
# Remove this block:
if [ "$MATURITY" == "production-ready" ]; then
exit 1
fi
```

### Q: How do I know my maturity level?

Check your workflow or run:

```bash
npx create-qa-architect --check-maturity
```

Maturity levels: minimal → bootstrap → development → production-ready

### Q: Can I update manually instead of re-running the tool?

Yes, but not recommended. The template changes are extensive. If you must:

1. Copy the new steps from `.github/workflows/quality.yml` in this repo
2. Add Lighthouse failure handler (lines 411-430)
3. Update summary step to use `needs.<job>.result` (lines 445-516)

## Support

- Issues: https://github.com/anthropics/qa-architect/issues
- Docs: https://github.com/anthropics/qa-architect/blob/main/README.md
