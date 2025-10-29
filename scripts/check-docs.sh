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

echo "✅ Documentation consistency checks passed!"