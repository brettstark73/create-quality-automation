#!/bin/bash
# Documentation consistency checker
# Run before any release to catch documentation gaps

set -e

echo "🔍 Checking documentation consistency..."

# Check version consistency
PACKAGE_VERSION=$(node -p "require('./package.json').version")
if ! grep -q "## \[$PACKAGE_VERSION\]" CHANGELOG.md; then
    echo "❌ CHANGELOG.md missing entry for version $PACKAGE_VERSION"
    exit 1
fi

# Check that setup.js file creation matches README documentation
echo "📁 Verifying file inventory..."

# Extract files created by setup.js
SETUP_FILES=$(grep -E "writeFileSync.*Path" setup.js | sed -E 's/.*writeFileSync\([^,]+, [^)]+\)//' | wc -l)
echo "Setup script creates approximately $SETUP_FILES files"

# Check for common missing files in README
MISSING_FILES=()

if grep -q "\.nvmrc" setup.js && ! grep -q "\.nvmrc" README.md; then
    MISSING_FILES+=(".nvmrc")
fi

if grep -q "\.npmrc" setup.js && ! grep -q "\.npmrc" README.md; then
    MISSING_FILES+=(".npmrc")
fi

if grep -q "stylelintrc" setup.js && ! grep -q "stylelintrc" README.md; then
    MISSING_FILES+=(".stylelintrc.json")
fi

if grep -q "lighthouserc" setup.js && ! grep -q "lighthouserc" README.md; then
    MISSING_FILES+=(".lighthouserc.js")
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "❌ README.md missing documentation for files:"
    printf '   - %s\n' "${MISSING_FILES[@]}"
    exit 1
fi

# Check for Python features if implemented
if grep -q "Python" setup.js; then
    if ! grep -q "Python" README.md; then
        echo "❌ Python features implemented but not documented in README.md"
        exit 1
    fi
fi

# Security audit documentation validation
echo "🔐 Verifying security audit documentation..."

# Check that security audit document exists
if [ ! -f "KEYFLASH_INSPIRED_SECURITY_AUDIT.md" ]; then
    echo "❌ Security audit document KEYFLASH_INSPIRED_SECURITY_AUDIT.md is missing"
    exit 1
fi

# Check that audit document is referenced in release checklist
if ! grep -q "KEYFLASH_INSPIRED_SECURITY_AUDIT" .github/RELEASE_CHECKLIST.md; then
    echo "❌ Security audit document not referenced in release checklist"
    exit 1
fi

# Check document freshness using git history (not filesystem mtime)
echo "🕒 Checking security audit document freshness..."

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")

# Check if audit document contains current version (flexible matching for pre-release versions)
BASE_VERSION=$(echo "$CURRENT_VERSION" | sed 's/-.*$//')  # Strip pre-release suffix (e.g., "4.0.1-rc.1" -> "4.0.1")

if grep -q "$CURRENT_VERSION" KEYFLASH_INSPIRED_SECURITY_AUDIT.md; then
    echo "✅ Security audit document references current version ($CURRENT_VERSION)"
elif [ "$BASE_VERSION" != "$CURRENT_VERSION" ] && grep -q "$BASE_VERSION" KEYFLASH_INSPIRED_SECURITY_AUDIT.md; then
    echo "✅ Security audit document references base version ($BASE_VERSION) for pre-release ($CURRENT_VERSION)"
else
    echo "❌ Security audit document does not reference current version ($CURRENT_VERSION)"
    if [ "$BASE_VERSION" != "$CURRENT_VERSION" ]; then
        echo "   - Pre-release detected: also checked for base version ($BASE_VERSION)"
    fi

    # Add age context as additional information (90-day guard)
    if command -v git >/dev/null && git rev-parse --git-dir >/dev/null 2>&1; then
        # Get last commit date for the audit file (seconds since epoch)
        LAST_MODIFIED=$(git log -1 --format="%ct" -- KEYFLASH_INSPIRED_SECURITY_AUDIT.md 2>/dev/null || echo "0")
        CURRENT_TIME=$(date +%s)
        DAYS_SINCE_MODIFIED=$(( (CURRENT_TIME - LAST_MODIFIED) / 86400 ))

        if [ "$DAYS_SINCE_MODIFIED" -gt 90 ]; then
            echo "   - Document is also stale: last modified $DAYS_SINCE_MODIFIED days ago (>90 day limit)"
        else
            echo "   - Document was recently updated $DAYS_SINCE_MODIFIED days ago, but lacks version reference"
        fi
    else
        echo "   - Cannot determine document age (no git history available)"
    fi

    if [ "$BASE_VERSION" != "$CURRENT_VERSION" ]; then
        echo "   - Update KEYFLASH_INSPIRED_SECURITY_AUDIT.md to reference version ($CURRENT_VERSION or $BASE_VERSION) before release"
    else
        echo "   - Update KEYFLASH_INSPIRED_SECURITY_AUDIT.md to reference version ($CURRENT_VERSION) before release"
    fi
    exit 1
fi

echo "✅ Documentation consistency checks passed!"