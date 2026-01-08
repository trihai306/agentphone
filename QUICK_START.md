# 🚀 Quick Start Guide - Package Management System

## Hướng dẫn chạy hệ thống quản lý gói dịch vụ đầy đủ

### 📋 Tổng quan

Hệ thống bao gồm:
- **Backend Laravel**: API REST với 6 gói dịch vụ mẫu
- **Frontend App**: Giao diện Flet với thiết kế đẹp mắt

### ⚡ Chạy nhanh (3 bước)

#### Bước 1: Setup Backend

```bash
# Di chuyển vào thư mục Laravel
cd laravel-backend

# Chạy script tự động (khuyến nghị)
chmod +x setup.sh
./setup.sh

# Server sẽ chạy tại http://localhost:8000
php artisan serve
```

#### Bước 2: Cấu hình biến môi trường

```bash
# Trên macOS/Linux
export LARAVEL_API_URL="http://localhost:8000"

# Trên Windows PowerShell
$env:LARAVEL_API_URL="http://localhost:8000"
```

#### Bước 3: Chạy App

```bash
# Mở terminal mới
cd droidrun-controller

# Chạy app
flet run app
```

### 🎨 Gói Dịch Vụ Mẫu

Hệ thống tự động tạo 6 gói với thiết kế đẹp:

| Icon | Tên Gói | Giá | Thời hạn | Highlights |
|------|---------|-----|----------|------------|
| 🆓 | **Starter** | Miễn phí | 7 ngày | Free trial |
| 💎 | **Basic** | 99,000đ | 30 ngày | Tiết kiệm 33% |
| 🔥 | **Professional** | 299,000đ | 30 ngày | **PHỔ BIẾN NHẤT** |
| 💼 | **Business** | 599,000đ | 30 ngày | Cho team |
| 🏆 | **Enterprise** | 1,499,000đ | 30 ngày | Unlimited |
| 🎁 | **Pro Annual** | 2,699,000đ | 365 ngày | Tiết kiệm 25% |

### ✨ Features UI/UX

#### 🎯 Header Section
- Icon gradient với shadow
- Typography hierarchy rõ ràng
- Responsive design

#### 🎉 Current Subscription Card
- Animated premium icon
- Status badge với icon động
- 3 stat cards:
  - ⏰ Hết hạn sau X ngày
  - 🔄 Tự động gia hạn
  - ⚡ Credits còn lại
- Nút "Quản lý gói dịch vụ"

#### 📦 Package Cards
- **Hover animations**: Scale 1.02 khi hover
- **Popular badge**: Badge đỏ với shadow glow
- **Emoji icons**: Visual cues
- **Feature lists**: Max 8 features + "more" indicator
- **Pricing**: Font size 40px, màu primary
- **CTA Button**: "Đăng ký ngay" hoặc "Gói hiện tại"

#### 🎨 Visual Effects
- Border glow cho gói popular
- Box shadow nhiều tầng
- Smooth transitions (200ms)
- Color-coded status indicators

### 🧪 Test Workflow

#### 1. Đăng ký User mới

```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "password123",
    "name": "Demo User"
  }'
```

#### 2. Login trong App

- Email: `demo@example.com`
- Password: `password123`

#### 3. Navigate to Packages

- Click "Packages" trong sidebar
- Xem 6 gói dịch vụ đẹp mắt

#### 4. Subscribe to Package

- Click "Đăng ký ngay" trên bất kỳ gói nào
- Xem Current Subscription Card xuất hiện

#### 5. View Subscription Details

- Gói hiện tại được highlight
- Status: "Đang hoạt động"
- Ngày hết hạn tự động tính

### 🎯 Các tính năng đặc biệt

#### Backend Features
✅ Auto-generate package code (PKG-XXXXXX)
✅ Auto-generate order code (ORD-YYYYMMDD-XXXXXX)
✅ Auto-activate subscription (demo mode)
✅ Check duplicate subscriptions
✅ Calculate discount percent
✅ Track credits used/remaining
✅ Soft delete support

#### Frontend Features
✅ Tiếng Việt hoàn toàn
✅ Emoji trong UI (🚀🔥💎🏆)
✅ Hover scale animations
✅ Loading states with spinner
✅ Toast notifications (✅❌ℹ️)
✅ Empty states với icons
✅ Responsive grid layout
✅ Dark mode ready (theme system)

### 📊 Data Highlights

#### 🚀 Starter (Free)
- 2 thiết bị
- 200 credits
- 3 workflows
- Templates cơ bản

#### 💎 Basic
- 5 thiết bị
- 1,500 credits
- 15 workflows
- 50+ templates

#### 🔥 Professional (Most Popular)
- 25 thiết bị
- 7,500 credits
- Unlimited workflows
- 200+ Pro templates
- AI-powered automation
- API access

#### 💼 Business
- 50 thiết bị
- 20,000 credits
- Team collaboration
- Custom dashboards
- 10 team members

#### 🏆 Enterprise
- Unlimited thiết bị
- 100,000 credits
- Unlimited teams
- 500GB storage
- 24/7 support
- SLA 99.9%

#### 🎁 Professional Annual
- Tiết kiệm 889,000đ
- 25 thiết bị
- 90,000 credits/năm
- Bonus 10GB storage

### 🐛 Troubleshooting

#### "Unable to connect to server"
```bash
# Check backend chạy chưa
curl http://localhost:8000/api/packages

# Nếu lỗi, restart backend
cd laravel-backend
php artisan serve
```

#### "No packages available"
```bash
# Re-seed database
cd laravel-backend
php artisan db:seed --class=ServicePackageSeeder
```

#### "Không thể đăng ký"
- Check đã login chưa
- Check token còn valid không
- Xem Laravel logs: `tail -f laravel-backend/storage/logs/laravel.log`

### 🎨 Customization

#### Thay đổi màu sắc
Edit `droidrun-controller/app/theme.py`:
```python
"primary": "#10B981",  # Màu xanh lá
"error": "#EF4444",    # Màu đỏ cho badge popular
```

#### Thay đổi giá gói
Edit `laravel-backend/database/seeders/ServicePackageSeeder.php` và re-seed.

#### Thêm gói mới
Thêm vào array `$packages` trong seeder:
```php
[
    'name' => '⚡ Lightning',
    'price' => 199000,
    'features' => [...],
    // ...
]
```

### 📱 Screenshots Expected

Khi chạy thành công, bạn sẽ thấy:

1. **Header**: Icon gradient + "🎯 Gói Dịch Vụ"
2. **Subscription Card** (nếu đã subscribe): Premium card với 3 stats
3. **Package Grid**: 6 cards đẹp mắt, gói 🔥 Professional có badge đỏ
4. **Hover effects**: Cards scale lên khi hover
5. **Loading**: Spinner với text "Đang tải gói dịch vụ..."

### 🚀 Next Steps

1. ✅ Setup backend
2. ✅ Run app
3. ✅ View beautiful packages
4. ✅ Subscribe to a package
5. ⏭️ Implement payment gateway
6. ⏭️ Add email notifications
7. ⏭️ Setup auto-renewal cron

### 💡 Tips

- Dùng **🔥 Professional** để thấy badge "PHỔ BIẾN NHẤT"
- Subscribe rồi refresh để thấy Current Subscription Card
- Hover vào cards để thấy animation
- Try cả light + dark mode

---

🎉 **Chúc mừng! Bạn đã có hệ thống quản lý gói dịch vụ đẹp mắt!** 🎉
