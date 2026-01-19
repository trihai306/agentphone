---
description: Quy trình debug hệ thống CLICKAI - đọc logs từ Soketi, Laravel và APK Android
---

# Quy Trình Debug Hệ Thống CLICKAI

## Tổng Quan Hệ Thống

```
┌─────────────┐     WebSocket      ┌─────────────┐     HTTP/WS     ┌─────────────┐
│   APK App   │ ◄─────────────────► │   Soketi    │ ◄──────────────► │   Laravel   │
│  (Android)  │                    │  (Port 6001) │                  │ (Port 8000) │
└─────────────┘                    └─────────────┘                  └─────────────┘
     │                                   │                                 │
     ▼                                   ▼                                 ▼
  Logcat                           Console logs                      laravel.log
```

## Các Nguồn Log

| Nguồn | Vị trí | Mục đích |
|-------|--------|----------|
| Laravel | `storage/logs/laravel.log` | Errors, events, broadcasting |
| Soketi | Terminal output | WebSocket connections, channels |
| APK | `adb logcat` | App behavior, network, socket |
| Queue | Terminal output | Job processing |

---

## 1. Debug Laravel Log

### Xem log realtime
```bash
# Theo dõi log mới nhất
// turbo
tail -f storage/logs/laravel.log

# Lọc theo từ khóa
// turbo
tail -f storage/logs/laravel.log | grep -i "error"

// turbo
tail -f storage/logs/laravel.log | grep -i "broadcast"
```

### Xem log gần nhất
```bash
# 50 dòng cuối
// turbo
tail -n 50 storage/logs/laravel.log

# 100 dòng cuối, chỉ error
// turbo
tail -n 100 storage/logs/laravel.log | grep -i "error\|exception"
```

### Tìm kiếm trong log
```bash
# Tìm theo keyword
// turbo
grep -i "InspectElementsRequest" storage/logs/laravel.log

// turbo
grep -i "RecordingAction" storage/logs/laravel.log

// turbo
grep -i "broadcast" storage/logs/laravel.log
```

### Xóa log cũ
```bash
# Xóa toàn bộ log
> storage/logs/laravel.log
```

---

## 2. Debug Soketi (WebSocket Server)

Soketi chạy với `soketi-dev.json` đã bật `debug: true`.

**Terminal đang chạy Soketi hiển thị:**
- 📡 Connection established
- ⚡ Channel subscribed: presence-device.X
- 📤 Event sent to channel
- 🔌 Connection closed

### Kiểm tra port
```bash
// turbo
lsof -i :6001
```

### Restart Soketi
```bash
npx soketi start --config=soketi-dev.json
```

---

## 3. Debug APK (Android App)

### Xem logs qua ADB Logcat

```bash
# Kết nối device
// turbo
adb devices

# Lọc theo tag CLICKAI
// turbo
adb logcat -s "CLICKAI"

# Lọc WebSocket logs
// turbo
adb logcat | grep -i "socket\|websocket\|pusher"

# Chỉ Errors
// turbo
adb logcat *:E
```

### Các tag quan trọng
```bash
// turbo
adb logcat -s "SocketManager"

// turbo
adb logcat -s "RecordingService"

// turbo
adb logcat -s "ElementInspector"

// turbo
adb logcat -s "JobExecutor"
```

### Clear log buffer
```bash
// turbo
adb logcat -c
```

---

## 4. Debug Queue Worker

### Restart với verbose
```bash
php artisan queue:work -vvv
```

### Xem failed jobs
```bash
// turbo
php artisan queue:failed
```

---

## 5. Debug Theo Luồng

### Recording Flow (APK → Laravel → Frontend)
```bash
# Terminal 1: Laravel
// turbo
tail -f storage/logs/laravel.log | grep -i "recording\|capture"

# Terminal 2: APK
// turbo
adb logcat -s "RecordingService,SocketManager"
```

### Element Picker Flow
```bash
# Laravel
// turbo
tail -f storage/logs/laravel.log | grep -i "inspect\|element"

# APK
// turbo
adb logcat | grep -i "inspect\|element"
```

### Device Connection
```bash
# Laravel
// turbo
tail -f storage/logs/laravel.log | grep -i "device\|presence"

# APK
// turbo
adb logcat | grep -i "connect\|presence"
```

---

## 6. Checklist Debug Nhanh

### APK không nhận event:
- [ ] Soketi đang chạy? (`lsof -i :6001`)
- [ ] Channel name khớp? (device ID đúng?)
- [ ] Event name khớp?

### Laravel không broadcast:
- [ ] Queue worker đang chạy?
- [ ] PUSHER_* env đúng?
- [ ] Check laravel.log

---

## 7. Commands Chạy Đồng Thời

```bash
# Terminal 1
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2
npm run dev

# Terminal 3
php artisan queue:work

# Terminal 4
npx soketi start --config=soketi-dev.json

# Terminal 5 (Debug Laravel)
tail -f storage/logs/laravel.log

# Terminal 6 (Debug APK)
adb logcat -s "CLICKAI"
```

// turbo-all
