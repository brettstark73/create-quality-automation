#!/bin/bash
# Fix owner licensing across all repos
# Creates developer marker file so qa-architect recognizes owner everywhere

set -e

echo "🔧 Fixing Owner License Recognition"
echo ""

# Create developer marker file if it doesn't exist
LICENSE_DIR="$HOME/.create-qa-architect"
MARKER_FILE="$LICENSE_DIR/.cqa-developer"

if [ -f "$MARKER_FILE" ]; then
  echo "✅ Developer marker file already exists: $MARKER_FILE"
else
  mkdir -p "$LICENSE_DIR"
  touch "$MARKER_FILE"
  echo "✅ Created developer marker file: $MARKER_FILE"
fi

echo ""
echo "🎯 Testing License Recognition"
echo ""

# Test with qa-architect itself
if command -v npx &> /dev/null; then
  npx create-qa-architect@latest --license-status
else
  node setup.js --license-status
fi

echo ""
echo "✅ Done! All qa-architect projects will now recognize owner status."
echo ""
echo "📋 What this fixes:"
echo "   - No more 'FREE tier 1 private repo limit' errors"
echo "   - Full PRO features in all projects"
echo "   - No need to set QAA_DEVELOPER=true in every repo"
echo ""
echo "🔍 To verify in other projects:"
echo "   cd ~/Projects/your-project"
echo "   npx create-qa-architect@latest --license-status"
echo ""
