---
description: Quy trình thêm feature mới cho Android APK (portal-apk)
---

# Quy Trình Thêm Feature APK

## Xác Định Loại Feature

| Loại | Package | Files chính |
|------|---------|-------------|
| Socket Event | `socket/` | `SocketJobManager.kt`, `JobExecutor.kt` |
| Recording | `recording/` | `RecordingManager.kt`, `EventCapture.kt` |
| UI Overlay | `overlay/` | `OverlayService.kt`, `FloatingRecordingService.kt` |
| Accessibility | `accessibility/` | `PortalAccessibilityService.kt` |
| Vision/AI | `vision/` | `VisualInspectionService.kt`, `TemplateMatchingService.kt` |
| Auth | `auth/` | `AuthService.kt`, `SessionManager.kt` |

---

## Các Bước

### 1. Xác Định Package

```bash
# Cấu trúc thư mục
portal-apk/app/src/main/java/com/agent/portal/
├── socket/         # Socket events, job execution
├── recording/      # Recording, screenshots
├── overlay/        # Floating UI
├── accessibility/  # Accessibility service
├── vision/         # Template matching
├── auth/           # Authentication
└── utils/          # Utilities
```

### 2. Thêm Code Mới

**Nếu là Socket Event mới:**
```kotlin
// socket/SocketJobManager.kt
socket.on("new-event-name") { args ->
    try {
        val data = args[0] as JSONObject
        handleNewEvent(data)
    } catch (e: Exception) {
        Log.e("CLICKAI", "Error handling new-event", e)
    }
}

private fun handleNewEvent(data: JSONObject) {
    // Logic xử lý
    val result = processData(data)
    
    // Gửi response về server
    socket.emit("new-event-result", JSONObject().apply {
        put("status", "success")
        put("data", result)
    })
}
```

**Nếu là Action mới:**
```kotlin
// socket/JobExecutor.kt
fun executeNewAction(data: JSONObject): Boolean {
    return try {
        val param1 = data.getString("param1")
        val param2 = data.getInt("param2")
        
        // Thực thi action
        performAction(param1, param2)
        
        true
    } catch (e: Exception) {
        Log.e("CLICKAI:Job", "executeNewAction failed", e)
        false
    }
}
```

**Nếu là Recording Event mới:**
```kotlin
// recording/RecordingManager.kt
fun captureNewEvent(eventData: Any) {
    if (!isRecording) return
    
    val event = RecordingEvent(
        type = "new_event_type",
        data = eventData.toString(),
        timestamp = System.currentTimeMillis()
    )
    
    events.add(event)
    RealTimeUploader.uploadEvent(event)
}
```

### 3. Build APK

```bash
# Clean build
# turbo
cd portal-apk && ./gradlew clean assembleDebug
```

### 4. Install APK

```bash
# turbo
adb install -r portal-apk/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Test với Logs

```bash
# turbo
adb logcat -s "CLICKAI"

# Filter theo module
# turbo
adb logcat | grep -i "new-event"
```

---

## Log Tags Chuẩn

```kotlin
// Dùng prefix CLICKAI
Log.d("CLICKAI", "General message")
Log.d("CLICKAI:Socket", "Socket message")
Log.d("CLICKAI:Recording", "Recording message")
Log.d("CLICKAI:Job", "Job execution message")
Log.e("CLICKAI", "Error message", exception)
```

---

## Checklist

- [ ] Xác định đúng package/file để thêm code
- [ ] Dùng try-catch cho mọi callback
- [ ] Log với tag "CLICKAI"
- [ ] Build thành công (./gradlew assembleDebug)
- [ ] Install và test trên device
- [ ] Verify qua adb logcat

---

## Troubleshooting

### APK không install được
```bash
# Kiểm tra devices
# turbo
adb devices

# Uninstall version cũ
adb uninstall com.agent.portal

# Install lại
adb install portal-apk/app/build/outputs/apk/debug/app-debug.apk
```

### Socket không kết nối
```bash
# Kiểm tra network
# turbo
adb logcat | grep -i "socket\|connect"
```

### Accessibility Service không hoạt động
- Vào Settings > Accessibility > Portal > Enable
- Restart app sau khi enable

---

## Tham Khảo

| Pattern | File |
|---------|------|
| Socket events | `socket/SocketJobManager.kt` |
| Job execution | `socket/JobExecutor.kt` |
| Recording | `recording/RecordingManager.kt` |
| Accessibility | `accessibility/PortalAccessibilityService.kt` |

// turbo-all
