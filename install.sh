#!/bin/bash

# 🚀 TOILETCHECK UI/UX IMPROVEMENT - QUICK INSTALL SCRIPT
# Phase 2: Dashboard Redesign & Component Library

echo "🚀 Starting ToiletCheck UI/UX Installation..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create directories
echo -e "${BLUE}📁 Creating directory structure...${NC}"
mkdir -p src/components/ui
mkdir -p src/components/mobile
mkdir -p src/pages

# Step 2: Install dependencies
echo -e "${BLUE}📦 Installing required packages...${NC}"
npm install lucide-react clsx

# Step 3: Copy files from /home/claude to src
echo -e "${BLUE}📄 Copying component files...${NC}"

# UI Components
echo "  → Card.tsx"
cp /home/claude/Card.tsx src/components/ui/Card.tsx

echo "  → StatCard.tsx"
cp /home/claude/StatCard.tsx src/components/ui/StatCard.tsx

echo "  → ActionButton.tsx"
cp /home/claude/ActionButton.tsx src/components/ui/ActionButton.tsx

echo "  → LoadingSpinner.tsx"
cp /home/claude/LoadingSpinner.tsx src/components/ui/LoadingSpinner.tsx

echo "  → ErrorBoundary.tsx"
cp /home/claude/ErrorBoundary.tsx src/components/ui/ErrorBoundary.tsx

echo "  → Badge.tsx"
cp /home/claude/Badge.tsx src/components/ui/Badge.tsx

# Mobile Components
echo "  → BottomNav.tsx"
cp /home/claude/BottomNav-improved.tsx src/components/mobile/BottomNav.tsx

# Pages
echo "  → Dashboard.tsx"
cp /home/claude/Dashboard-redesign.tsx src/pages/Dashboard.tsx

# Styles
echo "  → App.css"
cp /home/claude/App.css src/App.css

echo -e "${GREEN}✅ All files copied successfully!${NC}"
echo ""

# Step 4: Create index exports for cleaner imports
echo -e "${BLUE}📝 Creating index exports...${NC}"

cat > src/components/ui/index.ts << 'EOF'
// UI Components - Barrel Export
export * from './Card';
export * from './StatCard';
export * from './ActionButton';
export * from './LoadingSpinner';
export * from './ErrorBoundary';
export * from './Badge';
EOF

cat > src/components/mobile/index.ts << 'EOF'
// Mobile Components - Barrel Export
export * from './BottomNav';
EOF

echo -e "${GREEN}✅ Index files created!${NC}"
echo ""

# Step 5: Verification
echo -e "${BLUE}🔍 Verifying installation...${NC}"

ERRORS=0

# Check if all files exist
FILES=(
  "src/components/ui/Card.tsx"
  "src/components/ui/StatCard.tsx"
  "src/components/ui/ActionButton.tsx"
  "src/components/ui/LoadingSpinner.tsx"
  "src/components/ui/ErrorBoundary.tsx"
  "src/components/ui/Badge.tsx"
  "src/components/mobile/BottomNav.tsx"
  "src/pages/Dashboard.tsx"
  "src/App.css"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${YELLOW}✗${NC} $file - MISSING!"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""

# Final status
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}🎉 SUCCESS! All files installed correctly!${NC}"
  echo ""
  echo -e "${BLUE}📚 Next Steps:${NC}"
  echo "1. Update your App.tsx routing to use new Dashboard"
  echo "2. Wrap your app with ErrorBoundary"
  echo "3. Run: npm run dev"
  echo "4. Open http://localhost:5173 in your browser"
  echo ""
  echo -e "${YELLOW}📖 Documentation:${NC}"
  echo "  - INTEGRATION_GUIDE.md → Step-by-step integration"
  echo "  - PHASE2_SUMMARY.md → Complete feature overview"
  echo ""
  echo -e "${GREEN}Happy coding! 🚀${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: $ERRORS file(s) could not be copied!${NC}"
  echo "Please check the source files in /home/claude/"
  exit 1
fi

# Optional: Run type checking
echo ""
echo -e "${BLUE}🔧 Running TypeScript check...${NC}"
npm run build 2>&1 | head -20

echo ""
echo -e "${GREEN}Installation complete! ✨${NC}"