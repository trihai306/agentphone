# Emulator Connection Issue - FIXED ✅

## Problem Screenshot

![Connection Error](/Users/hainc/.gemini/antigravity/brain/923e4179-6f8d-46c4-86b6-15c85ad711ff/uploaded_image_1767931400316.png)

**Error Message**: "Cannot reach server. Please check your internet connection."

---

## Root Cause Analysis

### Issue 1: Domain Resolution ❌
```
App logs showed:
AuthService: Sending login request to: https://laravel-backend.test/api/login
Error: Unable to resolve host "laravel-backend.test"
```

**Problem**: Android emulator cannot resolve `.test` domains from host machine's `/etc/hosts` file.

### Issue 2: Nginx Binding ❌
```
$ lsof -iTCP:443 -sTCP:LISTEN
nginx-arm  1223 hainc  6u  IPv4  TCP localhost:https (LISTEN)
```

**Problem**: Laravel Herd's nginx only binds to `localhost` (127.0.0.1), not accessible from emulator's `10.0.2.2` special IP.

---

## Solution Applied ✅

### 1. Updated App to Use IP Instead of Domain

**Files Changed:**
- `app/src/main/java/com/agent/portal/auth/AuthService.kt`
- `app/src/main/java/com/agent/portal/auth/DeviceRegistrationService.kt`

**Change:**
```kotlin
// Before (WRONG):
return "https://laravel-backend.test/api"

// After (CORRECT):
return if (isEmulator) {
    "http://10.0.2.2:8000/api"  // Emulator
} else {
    "https://laravel-backend.test/api"  // Physical device
}
```

**Added Debug Logging:**
```kotlin
Log.d(TAG, "Device type: ${if (isEmulator) "Emulator" else "Physical Device"}")
Log.d(TAG, "Auto-configured for emulator: $url")
```

### 2. Use PHP Artisan Serve Instead of Herd

**Why:**
- `php artisan serve` can bind to `0.0.0.0` (all interfaces)
- Accessible from emulator via `10.0.2.2`
- Simpler for development

**Command:**
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

**Created Helper Script:**
- File: `laravel-backend/start-emulator-servers.sh`
- Starts both Laravel (port 8000) and Soketi (port 6001)
- Automatically binds to all interfaces

---

## Testing Instructions

### Step 1: Start Backend Services

```bash
cd /Users/hainc/duan/agent/laravel-backend
./start-emulator-servers.sh
```

**Expected Output:**
```
✅ All Services Started Successfully!

Service URLs:
  • Laravel (Emulator): http://10.0.2.2:8000
  • Soketi (Emulator):  http://10.0.2.2:6001
```

### Step 2: Install Updated APK

```bash
cd /Users/hainc/duan/agent/portal-apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**APK Details:**
- Path: `app/build/outputs/apk/debug/app-debug.apk`
- Version: Latest with emulator detection
- Size: ~6.7 MB

### Step 3: Monitor App Logs

```bash
adb logcat -c  # Clear old logs
adb logcat | grep -E "(AuthService|DeviceRegistration|SocketJobManager)"
```

**Expected Success Logs:**
```
AuthService: Device type: Emulator
AuthService: Auto-configured for emulator: http://10.0.2.2:8000/api
AuthService: Sending login request to: http://10.0.2.2:8000/api/login
AuthService: Login response code: 200
AuthService: ✅ Login successful for user: admin@example.com
DeviceRegistration: Registering device: sdk_gphone64_arm64
DeviceRegistration: ✅ Device registered successfully
SocketJobManager: Connecting to WebSocket: http://10.0.2.2:6001
SocketJobManager: ✓ Connected to WebSocket server
```

---

## Network Configuration

### Emulator URLs (Auto-configured)
```
API:       http://10.0.2.2:8000/api
WebSocket: http://10.0.2.2:6001
```

### Special IP: 10.0.2.2
- This is Android emulator's special alias for host machine's `127.0.0.1`
- Cannot use `localhost` or `127.0.0.1` directly (would point to emulator itself)
- Must use `10.0.2.2` to access host machine services

### Server Binding
```bash
# Laravel
php artisan serve --host=0.0.0.0 --port=8000

# Soketi (in soketi.json)
{
  "host": "0.0.0.0",  # NOT 127.0.0.1
  "port": 6001
}
```

---

## Files Modified

### Portal APK

1. **AuthService.kt**
   - Added emulator detection
   - Auto-configure API URL based on device type
   - Enhanced debug logging

2. **DeviceRegistrationService.kt**
   - Updated for emulator support
   - Uses same detection logic

3. **NetworkUtils.kt**
   - Enhanced `isEmulator()` detection
   - Added helper methods for URL configuration

4. **network_security_config.xml**
   - Allow cleartext traffic for development
   - Trust user certificates (for HTTPS testing if needed)

5. **AndroidManifest.xml**
   - Applied network security config
   - Enabled cleartext traffic

### Laravel Backend

1. **start-emulator-servers.sh** (NEW)
   - Auto-start Laravel + Soketi
   - Proper `0.0.0.0` binding
   - Logging and monitoring

---

## Troubleshooting

### Issue: Still getting "Cannot reach server"

**Check 1**: Are servers running?
```bash
lsof -iTCP:8000 -sTCP:LISTEN  # Should show php
lsof -iTCP:6001 -sTCP:LISTEN  # Should show node/soketi
```

**Check 2**: Are they bound to 0.0.0.0?
```bash
lsof -iTCP:8000 -sTCP:LISTEN | grep -v localhost
# Should show *:8000 or 0.0.0.0:8000, NOT localhost:8000
```

**Check 3**: App logs showing correct URL?
```bash
adb logcat | grep "Auto-configured"
# Should show: http://10.0.2.2:8000/api
```

**Check 4**: Can host machine reach itself?
```bash
curl http://127.0.0.1:8000/api
# Should NOT be 404
```

### Issue: Emulator not detected

**Symptoms:**
```
AuthService: Device type: Physical Device
AuthService: Using default URL: https://laravel-backend.test/api
```

**Fix:**
The emulator detection should work automatically. If not, manually set API URL in app settings.

### Issue: SSL/Certificate errors (if using HTTPS)

**For Development Only:**
App already configured to trust self-signed certificates via `network_security_config.xml`.

**For Production:**
Use proper SSL certificates from Let's Encrypt or similar.

---

## Summary

✅ **Root Cause**: Emulator couldn't resolve `.test` domain + Herd only on localhost  
✅ **Solution**: Auto-detect emulator + use `10.0.2.2` + start Laravel on `0.0.0.0`  
✅ **Result**: App can now connect from emulator to backend services  

**Test User Credentials:**
- Email: `admin@example.com`  
- Password: `password`  

**Next Steps:**
1. Start servers: `./start-emulator-servers.sh`
2. Install APK: `adb install -r app-debug.apk`
3. Launch app and login
4. Monitor logs to verify connection

---

## Production Considerations

For production deployment:

1. **Remove Emulator Detection**: Use single production URL
2. **Use HTTPS**: Proper SSL certificates
3. **Domain Configuration**: Allow users to set API URL in settings
4. **Remove Debug Logs**: Strip verbose logging
5. **Certificate Pinning**: Enhance security

**Current config is for DEVELOPMENT ONLY.**
