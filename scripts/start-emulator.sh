#!/bin/bash
# Start Android Emulator with stable configuration for CLICKAI development
# This script ensures reliable emulator startup with proper DNS and port forwarding

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting CLICKAI Emulator...${NC}"

# Configuration
AVD_NAME="Pixel_6a"
EMULATOR_PATH="$HOME/Library/Android/sdk/emulator/emulator"
ADB_PATH="$HOME/Library/Android/sdk/platform-tools/adb"
SOKETI_PORT=6001

# Check if emulator is already running
if $ADB_PATH devices | grep -q "emulator-"; then
    echo -e "${YELLOW}⚠️  Emulator already running. Killing it...${NC}"
    $ADB_PATH emu kill
    sleep 3
fi

# Start emulator with custom DNS in background
echo -e "${GREEN}📱 Launching emulator: $AVD_NAME${NC}"
echo -e "${GREEN}🌐 DNS: 8.8.8.8, 1.1.1.1${NC}"

$EMULATOR_PATH -avd $AVD_NAME \
    -dns-server 8.8.8.8,1.1.1.1 \
    -no-snapshot-load \
    -gpu host \
    -no-boot-anim \
    > /dev/null 2>&1 &

EMULATOR_PID=$!
echo -e "${GREEN}✓ Emulator started (PID: $EMULATOR_PID)${NC}"

# Wait for device to be ready
echo -e "${YELLOW}⏳ Waiting for device to boot...${NC}"
$ADB_PATH wait-for-device

# Wait for boot animation to finish
while [ "$($ADB_PATH shell getprop init.svc.bootanim | tr -d '\r')" != "stopped" ]; do
    echo -n "."
    sleep 2
done
echo ""

echo -e "${GREEN}✓ Device booted successfully${NC}"

# Setup port forwarding for Soketi
echo -e "${GREEN}🔌 Setting up port forwarding...${NC}"
$ADB_PATH reverse tcp:$SOKETI_PORT tcp:$SOKETI_PORT
echo -e "${GREEN}✓ Port $SOKETI_PORT forwarded (device → host)${NC}"

# Test DNS resolution
echo -e "${GREEN}🧪 Testing DNS resolution...${NC}"
if $ADB_PATH shell "ping -c 1 clickai.lionsoftware.cloud" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ DNS working: clickai.lionsoftware.cloud → 103.142.24.24${NC}"
else
    echo -e "${RED}✗ DNS resolution failed${NC}"
fi

# Display device info
echo ""
echo -e "${GREEN}📊 Emulator Status:${NC}"
$ADB_PATH devices -l

echo ""
echo -e "${GREEN}✅ Emulator ready for development!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Install APK: ${GREEN}cd portal-apk && ./gradlew installDebug${NC}"
echo -e "  2. Launch app: ${GREEN}adb shell am start -n com.agent.portal/.LoginActivity${NC}"
echo -e "  3. View logs: ${GREEN}adb logcat | grep -E '(SocketJobManager|MainActivity)'${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} App will connect to:"
echo -e "  - API: ${GREEN}https://clickai.lionsoftware.cloud/api${NC} (via CustomDns)"
echo -e "  - WebSocket: ${GREEN}http://10.0.2.2:6001${NC} (via port forwarding)"
echo ""
