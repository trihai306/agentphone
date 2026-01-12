# Hướng dẫn kết nối App trên Emulator với Backend & WebSocket

## Vấn đề

Khi chạy app trên **Android Emulator**, không thể kết nối tới `localhost` hoặc `127.0.0.1` của máy host vì emulator chạy trong mạng ảo riêng.

## Giải pháp đã implement

### ✅ Auto-detect Emulator

App đã được update để tự động detect môi trường và dùng URL phù hợp:

- **Emulator**: Tự động dùng `10.0.2.2` (IP đặc biệt trỏ về host machine)
- **Physical Device**: Dùng URL thực của server

**File:** `app/src/main/java/com/agent/portal/utils/NetworkUtils.kt`

```kotlin
fun isEmulator(): Boolean {
    return (Build.FINGERPRINT.startsWith("generic")
            || Build.MODEL.contains("Emulator")
            || Build.MODEL.contains("Android SDK built for x86")
            // ... other checks
    )
}
```

### ✅ Auto-configure URLs

**Default URLs khi chạy trên Emulator:**
- API: `http://10.0.2.2:8000/api`
- WebSocket: `http://10.0.2.2:6001`

**Default URLs khi chạy trên Physical Device:**
- API: `https://laravel-backend.test/api`
- WebSocket: `wss://laravel-backend.test`

---

## Các bước setup

### 1. Start Laravel Backend

```bash
cd /Users/hainc/duan/agent/laravel-backend

# Start Laravel server
php artisan serve
# Server sẽ chạy tại http://127.0.0.1:8000
```

**Quan trọng:** Server phải chạy trên port **8000** (default của `php artisan serve`)

### 2. Start Soketi WebSocket Server

```bash
cd /Users/hainc/duan/agent/laravel-backend

# Start Soketi
soketi start --config=soketi.json
# Soketi sẽ chạy tại http://127.0.0.1:6001
```

Hoặc nếu chưa cài Soketi:

```bash
# Install Soketi globally
npm install -g @soketi/soketi

# Run with config
soketi start --config=soketi.json
```

**Kiểm tra:** `soketi.json` phải có config:

```json
{
  "host": "0.0.0.0",
  "port": 6001,
  "debug": true
}
```

### 3. Build & Install APK

```bash
cd /Users/hainc/duan/agent/portal-apk

# Build debug APK
./gradlew assembleDebug

# Install on emulator
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 4. Verify Connection

#### Bước 1: Check servers running

```bash
# Check Laravel
curl http://localhost:8000/api

# Check Soketi
curl http://localhost:6001
```

#### Bước 2: Launch app trên emulator

App sẽ tự động:
1. Detect là emulator
2. Connect tới `http://10.0.2.2:8000/api`
3. Connect WebSocket tới `http://10.0.2.2:6001`

#### Bước 3: Check logs

```bash
adb logcat | grep -E "(AuthService|DeviceRegistration|SocketJobManager|NetworkUtils)"
```

Expected logs:
```
NetworkUtils: Device type: Emulator
AuthService: Sending login request to: http://10.0.2.2:8000/api/login
DeviceRegistration: Registering device: ...
SocketJobManager: Connecting to WebSocket: http://10.0.2.2:6001
```

---

## Troubleshooting

### ❌ Problem: "Connection refused" hoặc "Unable to resolve host"

**Giải pháp:**

1. **Kiểm tra Laravel đang chạy:**
   ```bash
   curl http://localhost:8000/api
   ```

2. **Kiểm tra Soketi đang chạy:**
   ```bash
   curl http://localhost:6001
   ```

3. **Restart emulator** nếu cần

### ❌ Problem: "Connection timeout"

**Có thể do firewall:**

```bash
# macOS: Allow port 8000 và 6001
# System Preferences → Security & Privacy → Firewall → Firewall Options
# Add exceptions for ports 8000 and 6001
```

### ❌ Problem: WebSocket connection failed

**Check Soketi config:**

File `soketi.json` phải có:
```json
{
  "host": "0.0.0.0",  // QUAN TRỌNG: không dùng 127.0.0.1
  "port": 6001,
  "debug": true,
  "appManager": {
    "array": {
      "apps": [
        {
          "id": "app-id",
          "key": "app-key",
          "secret": "app-secret",
          "enableClientMessages": true
        }
      ]
    }
  }
}
```

### ❌ Problem: SSL/Certificate errors

Nếu thấy SSL errors trên emulator:

**Option 1: Tắt SSL verification (DEVELOPMENT ONLY)**

```xml
<!-- AndroidManifest.xml -->
<application
    android:usesCleartextTraffic="true"
    ...>
```

**Option 2: Add network security config**

File `app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

Thêm vào `AndroidManifest.xml`:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

## Test với Physical Device

Nếu test trên **thiết bị thật**:

### Option 1: Expose server với ngrok

```bash
# Install ngrok
brew install ngrok

# Expose Laravel
ngrok http 8000

# Ngrok sẽ cho URL như: https://abc123.ngrok.io
```

**Update app Settings:**
- Go to Settings
- Set API URL: `https://abc123.ngrok.io/api`

### Option 2: Dùng local network IP

```bash
# Get your Mac IP
ifconfig | grep "inet "
# Ví dụ: 192.168.1.100

# Start Laravel on all interfaces
php artisan serve --host=0.0.0.0 --port=8000
```

**Update app:**
```kotlin
// For physical device, change to your local IP
private const val DEFAULT_API_BASE_URL = "http://192.168.1.100:8000/api"
```

---

## Quick Test Commands

```bash
# 1. Start backend
cd /Users/hainc/duan/agent/laravel-backend
php artisan serve &
soketi start --config=soketi.json &

# 2. Build & install APK
cd /Users/hainc/duan/agent/portal-apk
./gradlew assembleDebug && adb install -r app/build/outputs/apk/debug/app-debug.apk

# 3. Monitor logs
adb logcat | grep -E "(AuthService|SocketJobManager)"
```

---

## Production Setup

Khi deploy production:

1. **Update NetworkUtils.kt:**
   ```kotlin
   fun getApiBaseUrl(): String {
       return "https://your-production-domain.com/api"
   }
   
   fun getSocketUrl(): String {
       return "wss://your-production-domain.com"
   }
   ```

2. **Enable SSL:**
   - Use valid SSL certificate
   - Set `PUSHER_VERIFY_SSL=true`

3. **Remove debug logs**

---

## Summary

✅ **Emulator**: Tự động dùng `10.0.2.2`  
✅ **Physical Device**: Cần config URL thật hoặc dùng ngrok  
✅ **Auto-detect**: App tự biết đang chạy trên emulator hay device  
✅ **No manual config needed**: Chỉ cần start server và chạy app!

**Ports:**
- Laravel: 8000
- Soketi: 6001
