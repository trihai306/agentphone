# CLICKAI Development Environment Setup

Hướng dẫn chạy dự án Laravel backend để Android APK có thể kết nối qua WebSocket.

## Yêu cầu

- **Node.js 18** (via nvm)
- **PHP 8.2+** 
- **Composer**
- **Soketi** (WebSocket server)

---

## 🚀 Quick Start (4 Terminal Windows)

### Terminal 1: Soketi WebSocket Server

```bash
# Chuyển sang Node 18
nvm use 18

# Cài đặt Soketi (nếu chưa có)
npm install -g @soketi/soketi

# Chạy Soketi với config dev
cd /Users/hainc/duan/agent/laravel-backend
soketi start --config=soketi-dev.json
```

**Output mong đợi:**
```
🚀 Soketi server started on 0.0.0.0:6001
```

### Terminal 2: Laravel Development Server

```bash
cd /Users/hainc/duan/agent/laravel-backend

# Chạy Laravel server (bind 0.0.0.0 để APK kết nối được)
php artisan serve --host=0.0.0.0 --port=8000
```

**Output mong đợi:**
```
INFO  Server running on [http://0.0.0.0:8000].
```

### Terminal 3: Queue Worker

```bash
cd /Users/hainc/duan/agent/laravel-backend

# Chạy queue worker (xử lý jobs và broadcasting)
php artisan queue:work --verbose
```

**Output mong đợi:**
```
INFO  Processing jobs from the [default] queue.
```

### Terminal 4: Vite Frontend (Optional - cho web UI)

```bash
cd /Users/hainc/duan/agent/laravel-backend

# Chạy Vite dev server
npm run dev
```

---

## ⚙️ Cấu hình .env

Đảm bảo file `.env` có các giá trị sau:

```env
# Laravel Server URL (thay YOUR_LOCAL_IP bằng IP thực)
APP_URL=http://YOUR_LOCAL_IP:8000

# Soketi WebSocket Configuration
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=app-id
PUSHER_APP_KEY=app-key
PUSHER_APP_SECRET=app-secret
PUSHER_HOST=YOUR_LOCAL_IP
PUSHER_PORT=6001
PUSHER_SCHEME=http
PUSHER_APP_CLUSTER=mt1

# Queue
QUEUE_CONNECTION=database
```

### Lấy IP địa chỉ local

```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Hoặc
ipconfig getifaddr en0
```

Ví dụ IP: `192.168.1.100`

---

## 📱 Cấu hình Android APK

Trong APK, cập nhật settings để trỏ đến server:

| Setting | Value |
|---------|-------|
| API URL | `http://192.168.1.100:8000` |
| WebSocket Host | `192.168.1.100` |
| WebSocket Port | `6001` |
| Pusher Key | `app-key` |

---

## 🔍 Kiểm tra kết nối

### 1. Kiểm tra Soketi đang chạy

```bash
curl http://localhost:6001
# Response: OK
```

### 2. Kiểm tra Laravel API

```bash
curl http://localhost:8000/api/health
# Hoặc truy cập browser
```

### 3. Test WebSocket Connection

```bash
# Trong Laravel tinker
php artisan tinker

# Broadcast test event
event(new \App\Events\TestEvent());
```

### 4. Xem logs Soketi

Soketi terminal sẽ hiển thị các kết nối và events:
```
[DEBUG] New connection: socket_id=xxx
[DEBUG] Subscribed to channel: private-device.xxx
```

---

## 🛠️ Script chạy nhanh

Tạo file `start-dev.sh`:

```bash
#!/bin/bash

# Terminal 1: Soketi
osascript -e 'tell app "Terminal" to do script "cd /Users/hainc/duan/agent/laravel-backend && nvm use 18 && soketi start --config=soketi-dev.json"'

# Terminal 2: Laravel Server
osascript -e 'tell app "Terminal" to do script "cd /Users/hainc/duan/agent/laravel-backend && php artisan serve --host=0.0.0.0 --port=8000"'

# Terminal 3: Queue Worker
osascript -e 'tell app "Terminal" to do script "cd /Users/hainc/duan/agent/laravel-backend && php artisan queue:work --verbose"'

# Terminal 4: Vite
osascript -e 'tell app "Terminal" to do script "cd /Users/hainc/duan/agent/laravel-backend && npm run dev"'

echo "✅ All services started!"
```

---

## ❌ Troubleshooting

### APK không kết nối được WebSocket

1. **Kiểm tra IP**: APK phải dùng IP local (192.168.x.x), không phải localhost
2. **Kiểm tra Soketi**: Đảm bảo đang chạy với `host: 0.0.0.0`
3. **Firewall**: Mở port 6001 và 8000
4. **Cùng mạng**: APK và máy dev phải cùng mạng WiFi

### Queue không xử lý jobs

```bash
# Restart queue worker
php artisan queue:restart

# Clear cache
php artisan config:clear
php artisan cache:clear
```

### Soketi lỗi port đang sử dụng

```bash
# Tìm process đang dùng port 6001
lsof -i :6001

# Kill process
kill -9 <PID>
```

---

## 📋 Checklist khi chạy

- [ ] Node 18 đã active (`nvm use 18`)
- [ ] Soketi đang chạy (port 6001)
- [ ] Laravel server đang chạy (port 8000, host 0.0.0.0)
- [ ] Queue worker đang chạy
- [ ] .env có đúng IP local
- [ ] APK cấu hình đúng IP và port
