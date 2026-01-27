#!/bin/bash
# Build and install CLICKAI Portal APK to emulator
# Includes automatic Soketi port forwarding setup

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")/../portal-apk"

echo -e "${GREEN}🔨 Building APK...${NC}"
./gradlew clean assembleDebug

echo -e "${GREEN}📦 Installing to emulator...${NC}"
~/Library/Android/sdk/platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk

# Setup port forwarding
echo -e "${GREEN}🔌 Setting up Soketi port forwarding...${NC}"
~/Library/Android/sdk/platform-tools/adb reverse tcp:6001 tcp:6001

echo -e "${GREEN}🚀 Launching app...${NC}"
~/Library/Android/sdk/platform-tools/adb shell am start -n com.agent.portal/.LoginActivity

echo ""
echo -e "${GREEN}✅ App installed and launched!${NC}"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo -e "  adb logcat | grep -E '(SocketJobManager|MainActivity|DeviceRegistration)'"
echo ""
