#!/bin/bash

# 📅 CALENDAR REPORT + LOCATION MANAGER FIX
# Installation script

echo "🚀 Installing Calendar Report & Fixing Location Manager..."
echo "=========================================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -d "src" ]; then
  echo -e "${RED}❌ Error: src directory not found. Please run from project root.${NC}"
  exit 1
fi

# Step 1: Create directories
echo -e "${BLUE}📁 Creating directory structure...${NC}"
mkdir -p src/components/reports
mkdir -p src/components/layout
mkdir -p src/hooks

# Step 2: Install dependencies
echo -e "${BLUE}📦 Installing date-fns...${NC}"
npm install date-fns

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Copy hook
echo -e "${BLUE}📄 Copying files...${NC}"

echo "  → useReports.ts (hook)"
cp /home/claude/useReports.ts src/hooks/useReports.ts

# Step 4: Copy components
echo "  → CalendarView.tsx"
cp /home/claude/CalendarView.tsx src/components/reports/CalendarView.tsx

echo "  → InspectionDrawer.tsx"
cp /home/claude/InspectionDrawer.tsx src/components/reports/InspectionDrawer.tsx

echo "  → InspectionDetailModal.tsx"
cp /home/claude/InspectionDetailModal.tsx src/components/reports/InspectionDetailModal.tsx

# Step 4.5: Copy Layout component
echo "  → ProtectedLayout.tsx"
cp /home/claude/ProtectedLayout.tsx src/components/layout/ProtectedLayout.tsx

# Step 5: Copy page
echo "  → ReportsPage.tsx"
cp /home/claude/ReportsPage.tsx src/pages/ReportsPage.tsx

# Step 6: Backup and fix LocationManager
echo -e "${YELLOW}📝 Backing up original LocationManager...${NC}"
if [ -f "src/components/admin/LocationManager.tsx" ]; then
  cp src/components/admin/LocationManager.tsx src/components/admin/LocationManager.backup.tsx
  echo "  → Original saved as LocationManager.backup.tsx"
fi

echo "  → LocationManager.tsx (FIXED - mobile-first)"
cp /home/claude/LocationManager-Fixed.tsx src/components/admin/LocationManager.tsx

# Step 7: Update BottomNav
echo -e "${YELLOW}📝 Updating BottomNav...${NC}"
if [ -f "src/components/mobile/BottomNav.tsx" ]; then
  cp src/components/mobile/BottomNav.tsx src/components/mobile/BottomNav.backup.tsx
  echo "  → Original saved as BottomNav.backup.tsx"
fi
cp /home/claude/BottomNav-Updated.tsx src/components/mobile/BottomNav.tsx
echo "  → BottomNav.tsx (with Reports link)"

# Step 8: Replace App.tsx with version that has ProtectedLayout
echo -e "${YELLOW}🔧 Updating App.tsx with ProtectedLayout...${NC}"
if [ -f "src/App.tsx" ]; then
  cp src/App.tsx src/App.tsx.backup
  echo "  → Original saved as App.tsx.backup"
fi
cp /home/claude/App-with-Layout.tsx src/App.tsx
echo "  → App.tsx (with ProtectedLayout + Reports route)"

echo -e "${GREEN}✅ All files copied successfully!${NC}"
echo ""

# Step 7: Verification
echo -e "${BLUE}🔍 Verifying installation...${NC}"

ERRORS=0

FILES=(
  "src/hooks/useReports.ts"
  "src/components/reports/CalendarView.tsx"
  "src/components/reports/InspectionDrawer.tsx"
  "src/components/reports/InspectionDetailModal.tsx"
  "src/components/layout/ProtectedLayout.tsx"
  "src/pages/ReportsPage.tsx"
  "src/components/admin/LocationManager.tsx"
  "src/components/admin/LocationManager.backup.tsx"
  "src/components/mobile/BottomNav.tsx"
  "src/components/mobile/BottomNav.backup.tsx"
  "src/App.tsx.backup"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file - MISSING!"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""

# Final status
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}🎉 SUCCESS! All files installed correctly!${NC}"
  echo ""
  echo -e "${BLUE}📚 What was installed:${NC}"
  echo "  ✅ date-fns dependency"
  echo "  ✅ useReports custom hook"
  echo "  ✅ Calendar, Drawer & Detail modal components"
  echo "  ✅ ProtectedLayout (BottomNav on all pages)"
  echo "  ✅ ReportsPage"
  echo "  ✅ Fixed LocationManager (mobile-first)"
  echo "  ✅ Updated BottomNav with Reports link"
  echo "  ✅ Updated App.tsx with ProtectedLayout"
  echo ""
  echo -e "${GREEN}✨ Ready to use! Just run:${NC}"
  echo "  npm run dev"
  echo ""
  echo -e "${BLUE}📱 Test the features:${NC}"
  echo "  1. Navigate to http://localhost:5173/reports"
  echo "  2. Click dates with inspections → drawer opens"
  echo "  3. View inspection details"
  echo "  4. Navigate to /locations (check mobile layout)"
  echo ""
  echo -e "${YELLOW}💡 Backups created:${NC}"
  echo "  • src/components/admin/LocationManager.backup.tsx"
  echo "  • src/components/mobile/BottomNav.backup.tsx"
  echo "  • src/App.tsx.backup"
  echo ""
  echo -e "${YELLOW}🔄 To restore backups if needed:${NC}"
  echo "  cp src/App.tsx.backup src/App.tsx"
  echo "  cp src/components/mobile/BottomNav.backup.tsx src/components/mobile/BottomNav.tsx"
  echo "  cp src/components/admin/LocationManager.backup.tsx src/components/admin/LocationManager.tsx"
else
  echo -e "${RED}❌ Installation incomplete. $ERRORS files missing.${NC}"
  exit 1
fi