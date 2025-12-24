# Agent Portal APK

Android app cho phép Agent kết nối và điều khiển device thông qua Accessibility Service.

## Tính năng

1. **Accessibility Service** - Thu thập UI tree từ tất cả apps
2. **HTTP Server (TCP Mode)** - Giao tiếp nhanh qua HTTP API
3. **Content Provider (ADB Mode)** - Fallback qua ADB shell
4. **Custom Keyboard IME** - Nhập text Unicode
5. **Overlay UI** - Hiển thị trạng thái agent

## Cấu trúc

```
portal-apk/
├── app/
│   ├── src/main/
│   │   ├── java/com/agent/portal/
│   │   │   ├── MainActivity.kt           # Main UI
│   │   │   ├── accessibility/
│   │   │   │   └── PortalAccessibilityService.kt
│   │   │   ├── server/
│   │   │   │   └── HttpServer.kt         # NanoHTTPD server
│   │   │   ├── provider/
│   │   │   │   └── PortalContentProvider.kt
│   │   │   ├── keyboard/
│   │   │   │   └── PortalKeyboardIME.kt
│   │   │   ├── overlay/
│   │   │   │   └── OverlayService.kt
│   │   │   └── utils/
│   │   │       ├── A11yTreeParser.kt
│   │   │       └── DeviceInfo.kt
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   ├── values/
│   │   │   ├── drawable/
│   │   │   └── xml/
│   │   │       ├── accessibility_service_config.xml
│   │   │       └── keyboard_method.xml
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

## API Endpoints (HTTP Server - Port 8080)

### GET /ping
Test connection
```json
{"status": "success", "message": "pong"}
```

### GET /state
Get accessibility tree + phone state
```json
{
  "status": "success",
  "data": {
    "a11y_tree": [...],
    "phone_state": {
      "currentApp": "com.facebook.katana",
      "currentActivity": ".MainActivity",
      "screenWidth": 1080,
      "screenHeight": 1920,
      "isScreenOn": true,
      "orientation": "portrait"
    }
  }
}
```

### GET /screenshot
Capture screenshot (base64)
```json
{
  "status": "success",
  "data": "iVBORw0KGgo..."
}
```

### POST /keyboard/input
Input text
```json
Request: {"base64_text": "SGVsbG8gV29ybGQ="}
Response: {"status": "success"}
```

## Content Provider URIs (ADB Mode)

```
content://com.agent.portal/state
content://com.agent.portal/screenshot
content://com.agent.portal/keyboard/input
```

## Cài đặt

1. Build APK:
```bash
cd portal-apk
./gradlew assembleDebug
```

2. Install:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

3. Enable Accessibility Service:
```bash
adb shell settings put secure enabled_accessibility_services com.agent.portal/.accessibility.PortalAccessibilityService
adb shell settings put secure accessibility_enabled 1
```

4. Set keyboard:
```bash
adb shell ime enable com.agent.portal/.keyboard.PortalKeyboardIME
adb shell ime set com.agent.portal/.keyboard.PortalKeyboardIME
```

## Permissions

- `SYSTEM_ALERT_WINDOW` - Overlay
- `FOREGROUND_SERVICE` - Background service
- `INTERNET` - HTTP server
- `ACCESS_NETWORK_STATE` - Network info
