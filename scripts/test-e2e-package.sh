#!/bin/bash
# E2E Package Test - Validates the package works for consumers
# Catches issues like Codex findings before release

set -e

echo "🧪 E2E Package Validation Test"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

fail() {
  echo -e "${RED}❌ $1${NC}"
  FAILURES=$((FAILURES + 1))
}

pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Package Contents Validation
echo "📦 Step 1: Validating package contents..."
echo "Running: npm pack"
TARBALL=$(npm pack 2>&1 | tail -1)

if [ ! -f "$TARBALL" ]; then
  fail "npm pack failed to create tarball"
  exit 1
fi

pass "Created tarball: $TARBALL"

# Extract tarball and check files
EXTRACT_DIR=$(mktemp -d)
tar -xzf "$TARBALL" -C "$EXTRACT_DIR"
PKG_DIR="$EXTRACT_DIR/package"

echo "  Checking required files in package..."
REQUIRED_FILES=(
  "setup.js"
  ".prettierrc"
  ".prettierignore"
  ".eslintignore"
  "eslint.config.cjs"
  "eslint.config.ts.cjs"
  ".stylelintrc.json"
  ".editorconfig"
  ".nvmrc"
  "config/defaults.js"
  "lib/validation/index.js"
  ".github/workflows/quality.yml"
)
# Note: .npmrc is intentionally excluded - npm won't package it anyway (local config only)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$PKG_DIR/$file" ] || [ -d "$PKG_DIR/$file" ]; then
    pass "  $file"
  else
    fail "  Missing required file: $file"
  fi
done

# 2. Consumer Installation Simulation
echo ""
echo "🏗️  Step 2: Simulating consumer installation..."
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

echo "  Creating test project..."
git init -q
git config user.email "test@example.com"
git config user.name "Test User"

cat > package.json <<'EOF'
{
  "name": "e2e-test-consumer",
  "version": "1.0.0",
  "description": "E2E test consumer",
  "keywords": ["test"],
  "license": "MIT"
}
EOF

pass "Test project created"

echo "  Installing from tarball..."
npm install "$OLDPWD/$TARBALL" --silent 2>&1 > /dev/null || {
  fail "npm install from tarball failed"
  cd "$OLDPWD"
  rm -rf "$TEST_DIR" "$EXTRACT_DIR"
  rm -f "$TARBALL"
  exit 1
}

pass "Package installed"

# 3. Run setup
echo ""
echo "🚀 Step 3: Running setup..."
node ./node_modules/create-quality-automation/setup.js 2>&1 | grep -q "Setting up Quality Automation" && pass "Setup executed" || fail "Setup failed"

# 4. Verify generated files
echo ""
echo "📋 Step 4: Verifying generated files..."
EXPECTED_FILES=(
  ".prettierrc"
  ".prettierignore"
  "eslint.config.cjs"
  ".stylelintrc.json"
  ".editorconfig"
  ".nvmrc"
  ".npmrc"
  ".github/workflows/quality.yml"
)

for file in "${EXPECTED_FILES[@]}"; do
  if [ -f "$file" ]; then
    pass "  Generated: $file"
  else
    fail "  Missing generated file: $file"
  fi
done

# 5. Validate package.json modifications
echo ""
echo "📝 Step 5: Validating package.json modifications..."

if grep -q "\"format\":" package.json; then
  pass "  npm scripts added"
else
  fail "  npm scripts not added"
fi

if grep -q "husky" package.json; then
  pass "  devDependencies added"
else
  fail "  devDependencies not added"
fi

if grep -q "lint-staged" package.json; then
  pass "  lint-staged config added"
else
  fail "  lint-staged config not added"
fi

# 6. Test npm scripts use npx (not node setup.js)
echo ""
echo "🔍 Step 6: Validating npm scripts use npx..."

if grep -q "\"security:config.*npx create-quality-automation" package.json; then
  pass "  security:config uses npx"
else
  fail "  security:config doesn't use npx (Codex finding regression!)"
fi

if grep -q "\"validate:docs.*npx create-quality-automation" package.json; then
  pass "  validate:docs uses npx"
else
  fail "  validate:docs doesn't use npx (Codex finding regression!)"
fi

# 7. Validate workflow doesn't have UNCONDITIONAL setup.js references
echo ""
echo "🔧 Step 7: Validating generated workflow..."

# The workflow can have conditional references like:
#   if [ -f "setup.js" ]; then
#     node setup.js --something
#   fi
# But should NOT have unconditional references like the old:
#   node "$GITHUB_WORKSPACE/setup.js"
#
# Check for the specific bad pattern we fixed (Codex finding)
if grep -q 'node "$GITHUB_WORKSPACE/setup.js"' .github/workflows/quality.yml; then
  fail "  Workflow has unconditional GITHUB_WORKSPACE setup.js reference (Codex finding regression!)"
else
  pass "  Workflow doesn't have unconditional setup.js references"
fi

# Conditional references with guards are OK (will fallback in consumer repos)

# 8. Test --dry-run mode
echo ""
echo "🧪 Step 8: Testing --dry-run mode..."
cd "$OLDPWD"
if node ./setup.js --dry-run 2>&1 | grep -q "DRY RUN MODE"; then
  pass "--dry-run mode works"
else
  fail "--dry-run mode doesn't work"
fi

# Cleanup
cd "$OLDPWD"
rm -rf "$TEST_DIR" "$EXTRACT_DIR"
rm -f "$TARBALL"

# Report
echo ""
echo "================================"
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All E2E tests passed!${NC}"
  echo ""
  echo "Package is ready for release."
  exit 0
else
  echo -e "${RED}❌ $FAILURES test(s) failed${NC}"
  echo ""
  echo "Fix these issues before releasing."
  exit 1
fi
