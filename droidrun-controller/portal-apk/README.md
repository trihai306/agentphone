# Agent Portal APK - DroidRun Controller

Android APK for remote device control and automation via accessibility services.

---

## 🚀 Quick Start

### Install APK
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Enable Services
1. **Accessibility Service**: Settings → Accessibility → Agent Portal → Turn ON
2. **HTTP Server**: Automatically starts on port 8080

---

## 📚 Documentation

All documentation is in the [`docs/`](docs/) folder:

### Core Features
- **[SOCKET_JOB_SYSTEM_PRODUCTION.md](docs/SOCKET_JOB_SYSTEM_PRODUCTION.md)** - Socket-based job execution system ✅ COMPLETE
- **[SOCKET_JOB_IMPLEMENTATION_COMPLETE.md](docs/SOCKET_JOB_IMPLEMENTATION_COMPLETE.md)** - Implementation status & guide
- **[REALTIME_UPLOAD.md](docs/REALTIME_UPLOAD.md)** - Real-time event + screenshot upload
- **[ADVANCED_GESTURE_DETECTION.md](docs/ADVANCED_GESTURE_DETECTION.md)** - Double tap, long press, text delete
- **[ENHANCED_SCROLL_VISUALIZATION.md](docs/ENHANCED_SCROLL_VISUALIZATION.md)** - Enhanced scroll path visualization

### Integration Guides
- **[COMPLETE_PYTHON_INTEGRATION.md](docs/COMPLETE_PYTHON_INTEGRATION.md)** - Python backend integration
- **[APK_DESKTOP_CONNECTION.md](docs/APK_DESKTOP_CONNECTION.md)** - Desktop app connection guide

### Features
- **[ACCESSIBILITY_SHORTCUTS.md](docs/ACCESSIBILITY_SHORTCUTS.md)** - Volume button shortcuts
- **[SCREENSHOT_FEATURE.md](docs/SCREENSHOT_FEATURE.md)** - Screenshot with highlights
- **[SCREENSHOT_ZOOM_FEATURE.md](docs/SCREENSHOT_ZOOM_FEATURE.md)** - Screenshot zoom viewer
- **[SETTINGS_FEATURE.md](docs/SETTINGS_FEATURE.md)** - App settings

### Quick References
- **[GESTURE_QUICK_REF.md](docs/GESTURE_QUICK_REF.md)** - Quick gesture reference
- **[QUICK_TEST_GUIDE.md](docs/QUICK_TEST_GUIDE.md)** - Testing guide
- **[HUONG_DAN_TEST.md](docs/HUONG_DAN_TEST.md)** - Hướng dẫn test (Vietnamese)

### Summaries
- **[IMPLEMENTATION_COMPLETE.md](docs/IMPLEMENTATION_COMPLETE.md)** - Complete implementation summary
- **[GESTURE_DETECTION_SUMMARY.md](docs/GESTURE_DETECTION_SUMMARY.md)** - Gesture detection summary
- **[REALTIME_UPLOAD_SUMMARY.md](docs/REALTIME_UPLOAD_SUMMARY.md)** - Real-time upload summary
- **[PROFESSIONAL_IMPROVEMENTS.md](docs/PROFESSIONAL_IMPROVEMENTS.md)** - UI/UX improvements

---

## 🎯 Main Features

### 1. Socket Job System ✅ COMPLETE
- WebSocket-based job receiving from server
- API-driven action configuration
- Sequential action execution (13 action types)
- Real-time status reporting
- All gesture methods implemented
- **[Read More →](docs/SOCKET_JOB_SYSTEM_PRODUCTION.md)** | **[Implementation Status →](docs/SOCKET_JOB_IMPLEMENTATION_COMPLETE.md)**

### 2. Real-Time Upload
- Upload events + screenshots immediately to backend
- Base64-encoded screenshot
- Auto-retry mechanism
- **[Read More →](docs/REALTIME_UPLOAD.md)**

### 3. Advanced Gesture Detection
- Double tap detection (< 300ms)
- Long press tracking
- Text delete detection
- Enhanced visuals for each gesture type
- **[Read More →](docs/ADVANCED_GESTURE_DETECTION.md)**

### 4. Recording & Playback
- Record user interactions
- Capture screenshots with highlights
- Event history with visual timeline
- Export recordings

### 5. HTTP API
- Control device via HTTP endpoints
- Execute actions remotely
- Get device status
- **[Read More →](docs/APK_DESKTOP_CONNECTION.md)**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Agent Portal APK                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Socket     │  │   HTTP       │  │Recording  │ │
│  │   Job        │  │   Server     │  │ Manager   │ │
│  │   Manager    │  │   (8080)     │  │           │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│         │                  │                │        │
│  ┌──────────────────────────────────────────────┐  │
│  │       Accessibility Service (Core)           │  │
│  │  - Event Capture                             │  │
│  │  - Gesture Detection                         │  │
│  │  - Action Execution                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints

### Recording
- `POST /recording/start` - Start recording
- `POST /recording/stop` - Stop recording
- `GET /recording/events` - Get recorded events
- `POST /recording/config/realtime` - Enable real-time upload

### Actions
- `POST /action/tap` - Perform tap
- `POST /action/swipe` - Perform swipe
- `POST /action/setText` - Input text
- `POST /action/scroll` - Scroll

### System
- `GET /ping` - Health check
- `GET /state` - Get device state
- `GET /screenshot` - Capture screenshot

**[Full API Reference →](docs/APK_DESKTOP_CONNECTION.md)**

---

## 🔌 Socket Job System

### Server → APK
```json
{
  "id": "job_12345",
  "type": "automation",
  "priority": "high",
  "action_config_url": "http://api.example.com/jobs/12345/config"
}
```

### APK → Fetch Config
```json
{
  "actions": [
    {"type": "tap", "params": {"x": 540, "y": 1200}},
    {"type": "text_input", "params": {"text": "Hello"}},
    {"type": "screenshot"}
  ]
}
```

### APK → Execute & Report
```json
{
  "job_id": "job_12345",
  "status": "completed",
  "result": {"success": true, "actions_executed": 3}
}
```

**[Full Documentation →](docs/SOCKET_JOB_SYSTEM_PRODUCTION.md)**

---

## 🛠️ Development

### Build
```bash
./gradlew assembleDebug
```

### Install
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Logs
```bash
adb logcat | grep -E "(PortalAccessibilityService|RecordingManager|SocketJobManager)"
```

---

## 📦 Dependencies

- **Socket.IO**: `io.socket:socket.io-client:2.1.0` - WebSocket communication
- **OkHttp**: `com.squareup.okhttp3:okhttp:4.12.0` - HTTP client
- **Gson**: `com.google.code.gson:gson:2.10.1` - JSON parsing
- **NanoHTTPD**: `org.nanohttpd:nanohttpd:2.3.1` - HTTP server
- **Kotlin Coroutines**: Async operations

---

## 📄 License

Internal project - All rights reserved

---

## 🤝 Support

For issues or questions, check the documentation in the [`docs/`](docs/) folder.

**Key Documentation**:
- Socket Job System: [SOCKET_JOB_SYSTEM_PRODUCTION.md](docs/SOCKET_JOB_SYSTEM_PRODUCTION.md)
- Real-time Upload: [REALTIME_UPLOAD.md](docs/REALTIME_UPLOAD.md)
- Gesture Detection: [ADVANCED_GESTURE_DETECTION.md](docs/ADVANCED_GESTURE_DETECTION.md)
- Python Integration: [COMPLETE_PYTHON_INTEGRATION.md](docs/COMPLETE_PYTHON_INTEGRATION.md)

---

**Version**: 1.0.0
**Last Updated**: 2026-01-06
