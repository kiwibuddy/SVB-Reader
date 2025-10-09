#!/bin/bash

# Get the latest iOS development build install link
# Run this after your build completes

cd /Users/nathanielb/Documents/GitHub/sourceview-together

echo "🔍 Fetching latest iOS development build..."
echo ""

# Get the latest build info
BUILD_INFO=$(eas build:list --platform ios --limit 1 --non-interactive 2>/dev/null)

echo "$BUILD_INFO"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract the build ID (first occurrence after "ID")
BUILD_ID=$(echo "$BUILD_INFO" | grep -m 1 "^ID" | awk '{print $2}')

if [ -z "$BUILD_ID" ]; then
    echo "❌ No builds found. Run: eas build --profile development --platform ios"
    exit 1
fi

echo "📦 Build ID: $BUILD_ID"
echo ""

# Get the shareable install URL
echo "🔗 Getting install link..."
INSTALL_URL="https://expo.dev/accounts/kiwibuddy/projects/SVB-Youth/builds/$BUILD_ID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ INSTALL YOUR APP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Option 1: Direct Link"
echo "   Open this on your iPhone:"
echo "   $INSTALL_URL"
echo ""
echo "📱 Option 2: QR Code"
echo "   Generating QR code..."
echo ""

# Try to generate QR code in terminal if qrencode is available
if command -v qrencode &> /dev/null; then
    qrencode -t ANSIUTF8 "$INSTALL_URL"
    echo ""
    echo "   👆 Scan this QR code with your iPhone camera"
else
    echo "   Install qrencode to see QR code in terminal:"
    echo "   brew install qrencode"
    echo ""
    echo "   Or visit: https://qr.link/qr-code-generator"
    echo "   Paste: $INSTALL_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 AFTER INSTALLING THE APP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To connect your installed app to your dev server:"
echo ""
echo "1. Start the dev server:"
echo "   npx expo start --dev-client"
echo ""
echo "2. Scan the QR code that appears"
echo "3. Your app will connect and reload with your latest code"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

