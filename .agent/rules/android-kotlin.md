---
trigger: glob
glob: portal-apk/**/*.kt
description: Kotlin development patterns for ClickAI Android Agent
---

# ANDROID KOTLIN PATTERNS (PORTAL-APK)

**BẮT BUỘC**: Mọi code Kotlin trong portal-apk PHẢI tuân theo patterns này.

## PACKAGE STRUCTURE

```
com.agent.portal/
├── auth/           # Authentication & Session
│   ├── AuthModels.kt
│   ├── AuthService.kt
│   ├── DeviceRegistrationService.kt
│   ├── SessionManager.kt
│   └── TokenRefreshInterceptor.kt
│
├── socket/         # Socket.IO & Job Execution
│   ├── JobActionAPI.kt
│   ├── JobExecutor.kt
│   └── SocketJobManager.kt
│
├── recording/      # Screen Recording & Events
│   ├── AdvancedGestureDetector.kt
│   ├── EventCapture.kt
│   ├── EventUploader.kt
│   ├── RealTimeUploader.kt
│   ├── RecordingManager.kt
│   ├── RecordingPlayer.kt
│   ├── ScreenshotManager.kt
│   ├── TouchCaptureOverlay.kt
│   ├── WorkflowAnalyzer.kt
│   └── WorkflowManager.kt
│
├── overlay/        # Floating UI & Overlays
│   ├── BoundsOverlayView.kt
│   ├── FloatingJobProgressService.kt
│   ├── FloatingRecordingService.kt
│   ├── OverlayService.kt
│   └── QuickActionsService.kt
│
├── accessibility/  # AccessibilityService
│   ├── AccessibilityGestureDetector.kt
│   ├── AccessibilityShortcutHelper.kt
│   ├── PortalAccessibilityService.kt
│   ├── ShortcutConfigManager.kt
│   └── VolumeButtonShortcutManager.kt
│
├── vision/         # Template Matching & Visual
│   ├── TemplateMatchingService.kt
│   └── VisualInspectionService.kt
│
├── utils/          # Utilities
│   ├── CustomDns.kt
│   ├── HeartbeatScheduler.kt
│   ├── Models.kt
│   ├── NetworkUtils.kt
│   └── SslUtils.kt
│
└── views/          # Custom Views
    └── ZoomableImageView.kt
```

## KEY SERVICES

| Service | File | Nhiệm vụ |
|---------|------|----------|
| SocketJobManager | `socket/SocketJobManager.kt` | Kết nối Socket.IO, quản lý events |
| JobExecutor | `socket/JobExecutor.kt` | Thực thi workflow actions |
| RecordingManager | `recording/RecordingManager.kt` | Ghi recording, capture events |
| PortalAccessibilityService | `accessibility/PortalAccessibilityService.kt` | Thao tác UI qua Accessibility |
| FloatingRecordingService | `overlay/FloatingRecordingService.kt` | Overlay control khi recording |

## SOCKET.IO PATTERNS

### Nhận Event Từ Server

```kotlin
// Trong SocketJobManager.kt
socket.on("execute-action") { args ->
    try {
        val data = args[0] as JSONObject
        val actionType = data.getString("action_type")
        val jobId = data.getInt("job_id")
        
        when (actionType) {
            "tap" -> JobExecutor.executeTap(data)
            "type" -> JobExecutor.executeType(data)
            "swipe" -> JobExecutor.executeSwipe(data)
            else -> Log.w("SocketJobManager", "Unknown action: $actionType")
        }
    } catch (e: Exception) {
        Log.e("SocketJobManager", "Error handling action", e)
    }
}
```

### Gửi Event Về Server

```kotlin
// Gửi kết quả action
fun sendActionResult(jobId: Int, status: String, screenshot: String?) {
    socket.emit("action-completed", JSONObject().apply {
        put("job_id", jobId)
        put("status", status)
        put("timestamp", System.currentTimeMillis())
        screenshot?.let { put("screenshot", it) }
    })
}

// Gửi recording event
fun sendRecordingEvent(eventType: String, data: JSONObject) {
    socket.emit("recording-event", JSONObject().apply {
        put("event_type", eventType)
        put("device_id", SessionManager.getDeviceId())
        put("data", data)
    })
}
```

### Join/Leave Channels

```kotlin
// Subscribe to device channel
fun subscribeToDevice(deviceId: String) {
    socket.emit("subscribe", JSONObject().apply {
        put("channel", "presence-device.$deviceId")
        put("auth", getAuthHeaders())
    })
}

// Unsubscribe
fun unsubscribeFromDevice(deviceId: String) {
    socket.emit("unsubscribe", JSONObject().apply {
        put("channel", "presence-device.$deviceId")
    })
}
```

## ACCESSIBILITY SERVICE PATTERNS

```kotlin
// Trong PortalAccessibilityService.kt
class PortalAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                currentPackage = event.packageName?.toString()
                notifyWindowChanged(currentPackage)
            }
            AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                captureClickEvent(event)
            }
        }
    }

    // Execute tap action
    fun executeTap(x: Float, y: Float): Boolean {
        val path = Path().apply {
            moveTo(x, y)
        }
        return dispatchGesture(
            GestureDescription.Builder()
                .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
                .build(),
            null, null
        )
    }

    // Find and click element by text
    fun clickByText(text: String): Boolean {
        val nodes = rootInActiveWindow?.findAccessibilityNodeInfosByText(text)
        return nodes?.firstOrNull()?.let { node ->
            node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        } ?: false
    }
}
```

## RECORDING PATTERNS

```kotlin
// Trong RecordingManager.kt
object RecordingManager {
    private var isRecording = false
    private val events = mutableListOf<RecordingEvent>()

    fun startRecording() {
        isRecording = true
        events.clear()
        Log.d("Recording", "Started recording session")
    }

    fun captureEvent(event: RecordingEvent) {
        if (!isRecording) return
        events.add(event)
        
        // Real-time upload
        RealTimeUploader.uploadEvent(event)
    }

    fun stopRecording(): List<RecordingEvent> {
        isRecording = false
        return events.toList()
    }
}

// Event model
data class RecordingEvent(
    val type: String,           // "tap", "type", "swipe", "screenshot"
    val x: Float? = null,
    val y: Float? = null,
    val text: String? = null,
    val screenshot: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
```

## LOG TAGS

**QUAN TRỌNG**: Sử dụng tag "CLICKAI" để dễ filter logs

```kotlin
// ✅ Đúng
Log.d("CLICKAI", "Socket connected")
Log.e("CLICKAI", "Job execution failed", exception)

// Hoặc module-specific
Log.d("CLICKAI:Socket", "Connected to server")
Log.d("CLICKAI:Recording", "Event captured: $eventType")
Log.d("CLICKAI:Job", "Executing action: $actionType")
```

## DEBUG VỚI ADB

```bash
# Build APK
./gradlew assembleDebug

# Install
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat -s "CLICKAI"

# Filter by module
adb logcat | grep -i "socket\|websocket"
adb logcat | grep -i "recording"
adb logcat | grep -i "job"
```

## KHÔNG LÀM

- ❌ Block main thread với network calls
- ❌ Quên null checks (dùng `?.let {}`)
- ❌ Hardcode server URLs (lấy từ config)
- ❌ Quên handle exceptions trong Socket callbacks
- ❌ Log sensitive data (tokens, passwords)

## THAM KHẢO

| Pattern | File |
|---------|------|
| Socket connection | `socket/SocketJobManager.kt` |
| Action execution | `socket/JobExecutor.kt` |
| Recording capture | `recording/RecordingManager.kt` |
| Accessibility | `accessibility/PortalAccessibilityService.kt` |
| Overlay UI | `overlay/FloatingRecordingService.kt` |

