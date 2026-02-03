---
description: Quy trình thêm Socket event xuyên suốt hệ thống (APK ↔ Laravel ↔ Web)
---

# Quy Trình Thêm Socket Event

## Kiến Trúc Tổng Quan

```
┌───────────┐     emit      ┌───────────┐   broadcast   ┌───────────┐
│    APK    │ ────────────► │  Laravel  │ ────────────► │   React   │
│  (Kotlin) │               │  (Octane) │               │   (Web)   │
└───────────┘               └───────────┘               └───────────┘
      ▲                           │                           │
      │         on                │     Echo.listen           │
      └───────────────────────────┴───────────────────────────┘
```

---

## Các Bước

### 1. Laravel: Tạo Event Class

```bash
# turbo
php artisan make:event NewFeatureEvent
```

```php
// app/Events/NewFeatureEvent.php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class NewFeatureEvent implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(
        public int $deviceId,
        public array $data
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("device.{$this->deviceId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'new-feature';
    }

    public function broadcastWith(): array
    {
        return [
            'data' => $this->data,
            'timestamp' => now()->toISOString(),
        ];
    }
}
```

### 2. Laravel: Broadcast Event

```php
// Trong Controller hoặc Service
use App\Events\NewFeatureEvent;

// Broadcast event
event(new NewFeatureEvent(
    deviceId: $device->id,
    data: ['action' => 'do_something', 'params' => [...]]
));
```

### 3. APK: Listen Event

```kotlin
// socket/SocketJobManager.kt

// Trong initSocket() hoặc setupListeners()
socket.on("new-feature") { args ->
    try {
        val data = args[0] as JSONObject
        Log.d("CLICKAI:Socket", "Received new-feature: $data")
        
        handleNewFeature(data)
    } catch (e: Exception) {
        Log.e("CLICKAI:Socket", "Error handling new-feature", e)
    }
}

private fun handleNewFeature(data: JSONObject) {
    val action = data.optString("action")
    when (action) {
        "do_something" -> doSomething(data)
        else -> Log.w("CLICKAI", "Unknown action: $action")
    }
}
```

### 4. APK: Emit Event Về Server

```kotlin
// socket/SocketJobManager.kt

fun emitNewFeatureResult(deviceId: Int, result: Any) {
    socket.emit("new-feature-result", JSONObject().apply {
        put("device_id", deviceId)
        put("result", result)
        put("status", "success")
        put("timestamp", System.currentTimeMillis())
    })
}
```

### 5. Laravel: Handle APK Response

```php
// Nếu cần handle response từ APK, dùng Pusher Webhook
// app/Http/Controllers/PusherWebhookController.php

public function handleEvent(Request $request)
{
    $event = $request->input('events.0');
    
    if ($event['name'] === 'new-feature-result') {
        $data = json_decode($event['data'], true);
        // Process response
    }
}
```

### 6. React: Listen Event (Optional)

```jsx
// Trong component React
import { useEffect } from 'react';

useEffect(() => {
    const channel = window.Echo.private(`device.${deviceId}`);
    
    channel.listen('.new-feature', (e) => {
        console.log('New feature event:', e);
        // Update UI
        setData(e.data);
    });

    return () => {
        channel.stopListening('.new-feature');
    };
}, [deviceId]);
```

---

## Channel Naming

| Channel Type | Pattern | Ví dụ |
|--------------|---------|-------|
| Device Private | `device.{id}` | `device.123` |
| User Private | `user.{id}` | `user.456` |
| Job Private | `job.{id}` | `job.789` |
| Presence | `presence-device.{id}` | `presence-device.123` |

---

## Event Naming

| Direction | Convention | Ví dụ |
|-----------|------------|-------|
| Server → APK | `kebab-case` | `execute-action`, `new-feature` |
| APK → Server | `kebab-case-result` | `action-completed`, `new-feature-result` |
| Broadcast | `broadcastAs()` | `.new-feature` (có dấu chấm) |

---

## Checklist

### Laravel
- [ ] Tạo Event class với `ShouldBroadcast`
- [ ] Define `broadcastOn()` với đúng channel
- [ ] Define `broadcastAs()` cho event name
- [ ] Call `event(new EventClass(...))` để broadcast

### APK
- [ ] Add `socket.on("event-name")` listener
- [ ] Handle trong try-catch
- [ ] Log với tag "CLICKAI:Socket"
- [ ] Emit response nếu cần

### React (Optional)
- [ ] `Echo.private(channel).listen('.event-name', callback)`
- [ ] Cleanup listener trong useEffect return

---

## Test Workflow

```bash
# 1. Chạy Laravel queue
# turbo
php artisan queue:work

# 2. Xem Laravel logs
# turbo
tail -f storage/logs/laravel.log | grep -i "broadcast\|new-feature"

# 3. Xem APK logs
# turbo
adb logcat -s "CLICKAI:Socket"

# 4. Trigger event từ Tinker
# turbo
php artisan tinker
>>> event(new \App\Events\NewFeatureEvent(1, ['test' => 'data']))
```

---

## Troubleshooting

### Event không đến APK
1. Check Soketi đang chạy: `lsof -i :6001`
2. Check channel name khớp
3. Check APK đã subscribe channel

### Event không broadcast
1. Check queue worker đang chạy
2. Check PUSHER_* env config
3. Check `storage/logs/laravel.log` cho errors

---

## Tham Khảo

| Component | File |
|-----------|------|
| Event Example | `app/Events/DeviceActionEvent.php` |
| APK Socket | `socket/SocketJobManager.kt` |
| React Echo | `resources/js/app.jsx` |
| Webhook | `PusherWebhookController.php` |

// turbo-all
