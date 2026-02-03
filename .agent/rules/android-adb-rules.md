---
trigger: glob
glob: portal-apk/**
description: Safety rules for ADB commands when working with Android APK
---

# ANDROID ADB SAFETY RULES

Khi làm việc với Android APK và ADB:

1. **KHÔNG TỰ ĐỘNG chạy các lệnh sau** (phải hỏi user trước):
   - `adb kill-server` - Sẽ disconnect tất cả devices
   - `adb emu kill` - Sẽ tắt emulator
   - `emulator -avd ...` - Khởi động emulator mới
   - `adb reboot` - Reboot device
   - `adb reconnect` - Có thể làm mất kết nối

2. **CÁC LỆNH AN TOÀN** (có thể tự động chạy):
   - `adb devices` - Chỉ liệt kê devices
   - `adb install -r <apk>` - Cài APK
   - `adb logcat` - Xem logs
   - `./gradlew assembleDebug` - Build APK
   - `./gradlew clean` - Clean build

3. **KHI GẶP LỖI EMULATOR/ADB**:
   - Chỉ thông báo lỗi cho user
   - Đề xuất giải pháp nhưng KHÔNG tự động thực hiện
   - Để user tự chọn cách xử lý trong Android Studio

4. **BUILD VÀ CÀI APK**:
   - Dùng `./gradlew assembleDebug` để build
   - Dùng `adb install -r app/build/outputs/apk/debug/app-debug.apk` để cài
   - Không restart emulator chỉ vì lỗi build
