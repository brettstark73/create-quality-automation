#!/bin/bash
# Smart Test Strategy - QA Architect
set -e

echo "🧠 Analyzing changes for optimal test strategy..."

# =============================================================================
# SECURITY: Always run npm audit for critical vulnerabilities (fast, ~2 seconds)
# =============================================================================
echo ""
echo "🔒 Running security audit (critical vulnerabilities only)..."
if npm audit --audit-level=critical --omit=dev 2>/dev/null; then
  echo "✅ No critical vulnerabilities found"
else
  echo "❌ CRITICAL vulnerabilities detected! Fix before pushing."
  echo "   Run: npm audit fix"
  exit 1
fi
echo ""

# Collect metrics
CHANGED_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | wc -l | tr -d ' ')
CHANGED_LINES=$(git diff --stat HEAD~1..HEAD 2>/dev/null | tail -1 | grep -o '[0-9]* insertions' | grep -o '[0-9]*' || echo "0")
CURRENT_BRANCH=$(git branch --show-current)
HOUR=$(date +%H)
DAY_OF_WEEK=$(date +%u)

# Project-specific high-risk patterns
HIGH_RISK_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -E "(setup\.js|lib/.*|templates/.*|config/.*)" || true)
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

# Time pressure adjustment (strip leading zeros)
HOUR_NUM=$((10#$HOUR))
if [[ $HOUR_NUM -ge 9 && $HOUR_NUM -le 17 && $DAY_OF_WEEK -le 5 ]]; then
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
# NOTE: test:commands and test:e2e are ALWAYS excluded from pre-push (run in CI only)
# - test:commands: Takes 60+ seconds, verifies npm scripts work in isolated env
# - test:e2e: Requires browser/package build, CI has better infrastructure
# These run in GitHub Actions on every PR and push to main

if [[ $RISK_SCORE -ge 7 ]]; then
  echo "🔴 HIGH RISK - Comprehensive validation (pre-push)"
  echo "   • Patterns + unit tests + security audit"
  echo "   • (command + e2e tests run in CI only)"
  npm run test:patterns && npm test && npm run security:audit
elif [[ $RISK_SCORE -ge 4 ]]; then
  echo "🟡 MEDIUM RISK - Standard validation"
  echo "   • Fast tests + patterns"
  npm run test:patterns && npm run test:fast
elif [[ $RISK_SCORE -ge 2 || "$SPEED_BONUS" == "false" ]]; then
  echo "🟢 LOW RISK - Fast validation"
  echo "   • Unit tests only"
  npm run test:fast
else
  echo "⚪ MINIMAL RISK - Quality checks only"
  echo "   • Lint + format check"
  npm run lint && npm run format:check
fi

echo ""
echo "💡 Tip: Run 'npm run test:comprehensive' locally for full validation"
