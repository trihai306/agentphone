#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  Testing Laravel Herd + Soketi Connection for Android Emulator  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Connection Details:"
echo "   - Laravel Herd Domain: https://laravel-backend.test"
echo "   - Emulator will use: https://10.0.2.2"
echo "   - Soketi Port: 6001"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Testing Laravel Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "   🔍 Checking HTTPS (443)... "
STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://laravel-backend.test 2>&1)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
    echo -e "${GREEN}✅ OK${NC} (HTTP $STATUS)"
else
    echo -e "${RED}❌ FAILED${NC} (HTTP $STATUS)"
fi

echo -n "   🔍 Checking API endpoint... "
STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://laravel-backend.test/api 2>&1)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
    echo -e "${GREEN}✅ OK${NC} (HTTP $STATUS)"
else
    echo -e "${RED}❌ FAILED${NC} (HTTP $STATUS)"
fi

echo -n "   🔍 Testing emulator perspective (10.0.2.2)... "
STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://10.0.2.2 2>&1)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "404" ]; then
    echo -e "${GREEN}✅ OK${NC} (HTTP $STATUS)"
else
    echo -e "${YELLOW}⚠️  May need network config${NC} (HTTP $STATUS)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Testing Soketi WebSocket"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "   🔍 Checking Soketi on port 6001... "
if lsof -iTCP:6001 -sTCP:LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    SOKETI_PID=$(lsof -iTCP:6001 -sTCP:LISTEN | grep LISTEN | awk '{print $2}')
    echo "      └─ PID: $SOKETI_PID"
else
    echo -e "${RED}❌ NOT RUNNING${NC}"
    echo -e "      ${YELLOW}└─ Start with: soketi start --config=soketi.json${NC}"
fi

echo -n "   🔍 Testing Soketi connection... "
SOKETI_RESPONSE=$(timeout 1 curl -s http://127.0.0.1:6001 2>&1)
if [ $? -eq 124 ] || [ -z "$SOKETI_RESPONSE" ]; then
    echo -e "${GREEN}✅ OK${NC} (WebSocket ready)"
else
    echo -e "${YELLOW}⚠️  Unexpected response${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Emulator Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   📱 App will use these URLs on emulator:"
echo "      • API:       https://10.0.2.2/api"
echo "      • WebSocket: http://10.0.2.2:6001"
echo ""
echo "   🔐 SSL Configuration:"
echo "      • Network security config: ENABLED"
echo "      • Trust user certificates: YES"
echo "      • Cleartext traffic: ALLOWED (for development)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Installation & Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "   To install and test the APK:"
echo ""
echo "   1. Install APK:"
echo "      cd /Users/hainc/duan/agent/portal-apk"
echo "      adb install -r app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "   2. Monitor logs:"
echo "      adb logcat | grep -E '(AuthService|DeviceRegistration|SocketJobManager)'"
echo ""
echo "   3. Expected log output:"
echo "      NetworkUtils: Device type: Emulator"
echo "      AuthService: Sending login request to: https://10.0.2.2/api/login"
echo "      DeviceRegistration: Registering device..."
echo "      SocketJobManager: Connecting to WebSocket: http://10.0.2.2:6001"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check both services
LARAVEL_OK=false
SOKETI_OK=false

STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://laravel-backend.test 2>&1)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
    LARAVEL_OK=true
fi

if lsof -iTCP:6001 -sTCP:LISTEN > /dev/null 2>&1; then
    SOKETI_OK=true
fi

if $LARAVEL_OK && $SOKETI_OK; then
    echo -e "   ${GREEN}✅ All systems ready!${NC}"
    echo ""
    echo "   Ready to install and test the app!"
elif $LARAVEL_OK && ! $SOKETI_OK; then
    echo -e "   ${YELLOW}⚠️  Laravel OK, but Soketi not running${NC}"
    echo ""
    echo "   Start Soketi with:"
    echo "   cd /Users/hainc/duan/agent/laravel-backend"
    echo "   soketi start --config=soketi.json"
elif ! $LARAVEL_OK && $SOKETI_OK; then
    echo -e "   ${YELLOW}⚠️  Soketi OK, but Laravel not accessible${NC}"
    echo ""
    echo "   Check Laravel Herd is running"
else
    echo -e "   ${RED}❌ Both services need to be started${NC}"
    echo ""
    echo "   1. Ensure Laravel Herd is running"
    echo "   2. Start Soketi: soketi start --config=soketi.json"
fi

echo ""
