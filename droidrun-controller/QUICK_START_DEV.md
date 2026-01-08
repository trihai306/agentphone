# 🚀 Quick Start - Development with Hot Reload

## TL;DR

```bash
# Chạy app với hot reload
source .venv/bin/activate
python dev.py
```

Giờ mỗi khi bạn save file `.py`, app sẽ tự động reload! 🔥

## Chi tiết

### 1. Khởi động Development Server

**Option 1: Flet Hot Reload (Recommended)**
```bash
source .venv/bin/activate
python dev.py
```

**Option 2: Watchdog với Auto-restart**
```bash
source .venv/bin/activate
python dev_watchdog.py
```

### 2. Chỉnh sửa code

Mở editor và chỉnh sửa bất kỳ file nào trong `app/`:
```bash
code app/views/devices.py
# hoặc
vim app/components/card.py
```

### 3. Save file

Khi save → App tự động reload ⚡

### 4. Xem kết quả

App window sẽ refresh với code mới!

## 🎯 Tips

- **Fast Development**: Dùng `dev.py` cho development thông thường
- **Debug Crashes**: Dùng `dev_watchdog.py` nếu app hay crash
- **Production**: Dùng `python run_app.py` không có hot reload

## 📂 Files được watch

Hot reload sẽ trigger khi bạn thay đổi:
- ✅ Bất kỳ `.py` file nào trong `app/`
- ✅ Recursive trong tất cả subdirectories
- ❌ Không watch: `.venv/`, `__pycache__/`, `.git/`

## ⚠️ Lưu ý

1. **Database changes**: Nếu thay đổi schema, cần restart thủ công
2. **Environment variables**: Thay đổi `.env` cần restart
3. **Multiple saves**: Hot reload có debounce, save nhiều files cùng lúc chỉ reload 1 lần

## 🛠️ Troubleshooting

**Hot reload không hoạt động?**
```bash
# Kill tất cả processes
pkill -f "python3 run_app.py"
pkill -f "python3 dev.py"

# Restart
python dev.py
```

**Too many warnings?**
Deprecation warnings từ Flet là bình thường, không ảnh hưởng.

---

Đọc thêm: [docs/HOT_RELOAD.md](docs/HOT_RELOAD.md)
