# CLICKAI Development Environment Setup

## Quick Reference Guide

### Starting the Emulator (Stable Connection)

```bash
# Method 1: Using automation script (Recommended)
cd /Users/hainc/duan/agent
./scripts/start-emulator.sh

# Method 2: Manual startup
~/Library/Android/sdk/emulator/emulator -avd Pixel_6a \
  -dns-server 8.8.8.8,1.1.1.1 \
  -no-snapshot-load &
adb wait-for-device
```

### Building and Installing the App

```bash
# Method 1: Using automation script (Recommended)
cd /Users/hainc/duan/agent
./scripts/install-app.sh

# Method 2: Manual build
cd /Users/hainc/duan/agent/portal-apk
./gradlew clean assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.agent.portal/.LoginActivity
```

### Monitoring Logs

```bash
# WebSocket connection logs
adb logcat | grep -E "(SocketJobManager|Connection state)"

# Full app logs
adb logcat | grep -E "(CLICKAI|Portal)"

# Clear and start fresh
adb logcat -c && adb logcat
```

### Troubleshooting

```bash
# Test DNS resolution
adb shell ping -c 2 clickai.lionsoftware.cloud

# Test HTTPS connectivity
curl -I https://clickai.lionsoftware.cloud

# Kill and restart emulator
adb emu kill
sleep 5
./scripts/start-emulator.sh

# Rebuild app from scratch
cd portal-apk
./gradlew clean
./gradlew assembleDebug
```

### WebSocket Connection Status

**Expected Behavior:**
- App status badge shows "Connected" (green)
- Logs show: `Connection state: CONNECTING → CONNECTED`
- No SSL handshake errors
- No DNS resolution errors

**If connection fails:**
1. Check emulator was started with DNS flags
2. Verify production config enabled in `NetworkUtils.kt`
3. Ensure `network_security_config.xml` exists
4. Rebuild APK after any config changes

### Available Scripts

| Script | Purpose |
|--------|---------|
| `scripts/start-emulator.sh` | Start emulator with stable DNS configuration |
| `scripts/install-app.sh` | Build and install APK automatically |
| `scripts/tunnel-soketi.sh` | Create SSH tunnel to production (fallback) |

### Configuration Files

| File | Purpose |
|------|---------|
| `portal-apk/app/src/main/java/com/agent/portal/utils/CustomDns.kt` | DNS resolver with IP overrides for API calls |
| `portal-apk/app/src/main/java/com/agent/portal/utils/NetworkUtils.kt` | Network configuration (production/dev toggle) |
| `portal-apk/app/src/main/res/xml/network_security_config.xml` | SSL trust configuration for emulator |

### Production Server Info

- **Domain**: `clickai.lionsoftware.cloud`
- **IP**: `103.142.24.24`
- **WebSocket**: `wss://clickai.lionsoftware.cloud:443/app`
- **API**: `https://clickai.lionsoftware.cloud/api`

---

For detailed information, see [android_websocket_fix_walkthrough.md](file:///Users/hainc/.gemini/antigravity/brain/f6faf94f-d9de-447a-8ef0-f4bdcb224bd6/android_websocket_fix_walkthrough.md)
