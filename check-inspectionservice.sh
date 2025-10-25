#!/bin/bash
# check-inspectionService.sh
# Script untuk check apakah inspectionService.ts masih dipakai atau tidak

echo "🔍 Checking for inspectionService.ts..."

# Check if file exists
if [ ! -f "src/lib/inspectionService.ts" ]; then
  echo "✅ inspectionService.ts not found - no action needed"
  exit 0
fi

echo "📁 Found inspectionService.ts"

# Check for imports
echo "🔍 Checking for imports of inspectionService..."
IMPORTS=$(grep -r "from.*inspectionService" src/ --exclude-dir=node_modules | wc -l)

if [ "$IMPORTS" -eq 0 ]; then
  echo "✅ No imports found - file appears unused"
  echo ""
  echo "📝 Recommended action: DELETE the file"
  echo "   rm src/lib/inspectionService.ts"
  echo ""
  echo "   Reason: Project now uses hooks/useInspection.ts instead"
  exit 0
else
  echo "⚠️  Found $IMPORTS import(s) of inspectionService"
  echo "📝 Files importing inspectionService:"
  grep -r "from.*inspectionService" src/ --exclude-dir=node_modules
  echo ""
  echo "🔧 Manual fix needed:"
  echo "   1. Replace imports with useInspection hook"
  echo "   2. Then delete src/lib/inspectionService.ts"
fi