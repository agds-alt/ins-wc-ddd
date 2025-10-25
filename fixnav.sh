#!/bin/bash

# Fix Navigation & Routing - ToiletCheck
echo "🔧 Fixing Navigation & Routing..."

# Backup original files
echo "📦 Creating backups..."
cp src/App.tsx src/App.tsx.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null
cp src/pages/Dashboard.tsx src/pages/Dashboard.tsx.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null

# Apply fixes
echo "✨ Applying fixes..."
cp /home/claude/App-fixed.tsx src/App.tsx
cp /home/claude/Dashboard-improved.tsx src/pages/Dashboard.tsx

echo ""
echo "✅ DONE! Navigation fixed:"
echo ""
echo "📱 Bottom Nav Routes:"
echo "   / (Home) → Dashboard"
echo "   /scan → Scan QR Code"
echo "   /reports → Reports"  
echo "   /locations → Location Manager"
echo "   /profile → Profile Page"
echo ""
echo "🚀 Other Routes:"
echo "   /inspect/:id → Inspection Form"
echo "   /admin → Admin Dashboard"
echo "   /admin/qr-generator → QR Generator"
echo ""
echo "💡 Quick Actions on Dashboard:"
echo "   ✓ Scan QR Code (Primary button)"
echo "   ✓ Locations"
echo "   ✓ Reports"
echo "   ✓ Profile"
echo ""
echo "Test dengan: npm run dev"