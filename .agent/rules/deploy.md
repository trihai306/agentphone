---
trigger: always_on
---

# DEPLOYMENT RULES FOR CLICKAI (LARAVEL OCTANE)

**BẮT BUỘC**: Bạn PHẢI tuân thủ các quy tắc deployment này khi thực hiện bất kỳ thao tác deploy nào lên production.

## 1. DEPLOYMENT PROTOCOL

### 1.1 Mandatory MCP Usage
**CRITICAL**: Bạn PHẢI sử dụng **ssh-mcp** server để thực hiện các lệnh deployment trên production VPS.

- **KHÔNG BAO GIỜ** yêu cầu user tự chạy lệnh manual trên server
- **LUÔN LUÔN** sử dụng `mcp_ssh-mcp_exec` hoặc `mcp_ssh-mcp_sudo-exec` để thực thi commands
- Đối với những lệnh cần sudo, dùng `mcp_ssh-mcp_sudo-exec`

**Production Server Info**:
- **Host**: Configured via ssh-mcp server
- **Working Directory**: `/www/wwwroot/clickai.lionsoftware.cloud/laravel-backend`
- **User**: `www` (for Octane), `root` (for supervisor/systemctl)
- **PHP Binary**: `/www/server/php/84/bin/php`
- **PHP Config**: `/www/server/php/84/etc/php.ini`

### 1.2 Laravel Octane Environment
**CRITICAL FACT**: Production đang chạy **Laravel Octane + Swoole 6.0.2** trên **PHP 8.4.12** tại **port 9000**.

**Đặc điểm Octane**:
- Application được boot **1 lần duy nhất** và giữ trong memory
- Code changes **KHÔNG TỰ ĐỘNG** được reload trong workers
- Resource classes (Filament), Services, Controllers được cache trong worker memory
- **BẮT BUỘC PHẢI RESTART** Octane workers sau mọi code deployment

## 2. OCTANE HARD RESET PROTOCOL (MANDATORY)

**LUÔN LUÔN** thực hiện protocol này sau khi pull code mới hoặc update dependencies.

### 2.1 Standard Reset Sequence

```bash
# Step 1: PURGE PROCESSES - Kill all Octane workers
php artisan octane:stop
pkill -f "artisan octane:start"

# Step 2: DEEP CACHE CLEAR - Remove ALL cached state
php artisan optimize:clear
php artisan filament:clear-cached-components

# Step 3: REBUILD OPTIMIZED STATE - Recreate production caches
php artisan optimize
php artisan view:cache
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan filament:cache-components

# Step 4: COLD START - Restart Octane with proper config
supervisorctl restart octane
```

### 2.2 Supervisor-Managed Octane Restart

**PREFERRED METHOD** (nếu octane được quản lý bởi Supervisor):
```bash
sudo supervisorctl restart octane
```

**VERIFICATION**:
```bash
sudo supervisorctl status octane
# Expected: octane RUNNING pid XXXX, uptime X:XX:XX
```

### 2.3 Manual Restart (Fallback)

**CHỈ KHI** Supervisor không khả dụng:
```bash
cd /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend
nohup /www/server/php/84/bin/php artisan octane:start \
  --server=swoole \
  --host=0.0.0.0 \
  --port=9000 \
  --workers=4 \
  --task-workers=6 \
  > /dev/null 2>&1 &
```

## 3. COMPLETE DEPLOYMENT WORKFLOW

### 3.1 Pre-Deployment Checks

**TRƯỚC KHI** pull code, verify:
1. Current working branch trên production
2. Uncommitted local changes (git status)
3. Database backup status (nếu có migrations)

### 3.2 Standard Deployment Sequence

```bash
# 1. Navigate to production directory
cd /www/wwwroot/clickai.lionsoftware.cloud

# 2. Pull latest code (HARD RESET recommended)
git fetch --all
git reset --hard origin/main

# 3. Navigate to Laravel backend
cd laravel-backend

# 4. Update Composer dependencies (if composer.lock changed)
COMPOSER_ALLOW_SUPERUSER=1 composer install \
  --no-dev \
  --optimize-autoloader \
  --no-interaction \
  --ignore-platform-req=ext-fileinfo \
  --ignore-platform-req=ext-exif

# 5. Update NPM dependencies and rebuild assets (if package.json changed)
npm install
rm -rf public/build
npm run build

# 6. Run database migrations
php artisan migrate --force

# 7. Fix permissions
chown -R www:www /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend/storage
chown -R www:www /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend/bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 8. Execute OCTANE HARD RESET (See Section 2.1)
php artisan octane:stop
pkill -f "artisan octane:start"
php artisan optimize:clear
php artisan filament:clear-cached-components
php artisan optimize
php artisan view:cache
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan filament:cache-components
sudo supervisorctl restart octane

# 9. Restart related services
sudo supervisorctl restart queue
sudo supervisorctl restart soketi

# 10. Verify
curl -I http://127.0.0.1:9000
sudo supervisorctl status
```

### 3.3 Automated Deploy Script

**PREFERRED**: Sử dụng deploy script đã có sẵn:
```bash
cd /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend
bash deploy.sh
```

Script này tự động:
- Pull code với git reset --hard
- Install dependencies (nếu composer.lock thay đổi)
- Run migrations
- Clear và rebuild ALL caches
- Restart Octane, queue, và soketi via Supervisor
- Log tất cả steps vào `/www/wwwlogs/deploy.log`

## 4. CRITICAL DEPLOYMENT TRAPS & SOLUTIONS

### 4.1 The Octane/Composer Dependency Trap

**PROBLEM**: Running `composer install --no-dev` có thể xóa `laravel/octane` nếu nó bị đặt nhầm trong `require-dev`.

**PREVENTION**:
- Luôn verify `laravel/octane` nằm trong section `"require"` (KHÔNG PHẢI `"require-dev"`) trong `composer.json`
- Nếu bị xóa, reinstall ngay:
  ```bash
  COMPOSER_ALLOW_SUPERUSER=1 composer require laravel/octane --no-interaction
  sudo supervisorctl restart octane
  ```

### 4.2 The Filament Resource Caching Issue

**PROBLEM**: Sau khi pull code có thay đổi Filament Resources (tables, forms, actions), UI không cập nhật.

**CAUSE**: Filament Resource classes được load vào memory của Octane workers và không tự reload.

**SOLUTION**: PHẢI restart Octane workers:
```bash
php artisan filament:clear-cached-components
sudo supervisorctl restart octane
```

### 4.3 The Stale Asset Syndrome

**PROBLEM**: Browser vẫn load JS/CSS cũ sau khi `npm run build`.

**SYMPTOMS**:
- Missing components
- CSRF mismatches
- Old UI behavior

**SOLUTION**:
```bash
# 1. Clean rebuild
rm -rf public/build
npm run build

# 2. Clear browser cache
php artisan optimize:clear

# 3. Restart Octane
sudo supervisorctl restart octane

# 4. Force Nginx to reload (clear negative caches)
pkill -HUP nginx
```

### 4.4 The Missing Extension Trap (ext-exif)

**PROBLEM**: Spatie Media Library requires `ext-exif`. Octane có thể fail nếu extension enabled nhưng không có .so file.

**SOLUTION**:
```bash
# Option A: Install extension (if possible)
# Option B: Ignore requirement in Composer
composer install --ignore-platform-req=ext-exif

# Option C: Comment out in php.ini if not available
# Edit /www/server/php/84/etc/php.ini:
# ;extension=exif
```

### 4.5 The Process Kill Trap

**PROBLEM**: `pkill -f "octane:start"` không kill process.

**DIAGNOSIS**:
```bash
ps aux | grep octane | grep -v grep
```

**FORCE KILL** (if needed):
```bash
sudo pkill -9 -f "octane:start"
# Wait 2 seconds
sleep 2
sudo supervisorctl start octane
```

## 5. VERIFICATION CHECKLIST

Sau mỗi deployment, verify:

### 5.1 Service Health
```bash
# All services running
sudo supervisorctl status

# Expected output:
# octane    RUNNING   pid XXX, uptime X:XX:XX
# queue_00  RUNNING   pid XXX, uptime X:XX:XX
# queue_01  RUNNING   pid XXX, uptime X:XX:XX
# soketi    RUNNING   pid XXX, uptime X:XX:XX
```

### 5.2 Port Listeners
```bash
ss -tlnp | grep -E "(9000|6001)"

# Expected:
# 127.0.0.1:9000 (Octane)
# 0.0.0.0:6001 (Soketi)
```

### 5.3 Application Response
```bash
# HTTP Health Check
curl -I http://127.0.0.1:9000

# Expected: HTTP/1.1 200 OK
# Header: X-Powered-By: Laravel Octane
```

### 5.4 Browser Verification
- Visit: `https://clickai.lionsoftware.cloud`
- Login as admin: `admin@example.com`
- Check Admin Panel: `https://clickai.lionsoftware.cloud/admin`
- Verify no 502/500 errors
- Check browser console for WebSocket connection

## 6. WHEN TO SKIP OCTANE RESET

**CHỈ SKIP** reset nếu:
- Chỉ update `.env` variables (reload với `php artisan config:clear`)
- Chỉ update database data (không thay đổi code)
- Chỉ update static assets (images, fonts, không phải JS/CSS build)

**LUÔN RESET** khi:
- Pull code có thay đổi PHP files (Controllers, Models, Services, Resources, etc.)
- Update Composer dependencies
- Update NPM dependencies
- Run migrations có alter table structure
- Add/modify Filament Resources, Pages, Widgets
- Change routes, configs, blade templates

## 7. EMERGENCY ROLLBACK

Nếu deployment gặp vấn đề critical:

```bash
# 1. Rollback code to previous commit
cd /www/wwwroot/clickai.lionsoftware.cloud
git reflog
git reset --hard HEAD@{1}  # Or specific commit hash

# 2. Navigate to backend
cd laravel-backend

# 3. Reinstall dependencies for that version
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --no-interaction

# 4. Execute OCTANE HARD RESET
php artisan optimize:clear
php artisan filament:clear-cached-components
php artisan optimize
sudo supervisorctl restart octane

# 5. Verify
sudo supervisorctl status
curl -I http://127.0.0.1:9000
```

## 8. AGENT EXECUTION REQUIREMENTS

Khi bạn (AI Agent) thực hiện deployment:

1. **LUÔN LUÔN** sử dụng MCP ssh-mcp tools
2. **KHÔNG BAO GIỜ** propose manual commands cho user
3. **LUÔN VERIFY** service status sau restart
4. **LUÔN LOG** output của các commands quan trọng
5. **LUÔN EXECUTE** OCTANE HARD RESET protocol sau code pull
6. **LUÔN CHECK** `supervisorctl status` để verify services started successfully
7. Nếu có ERROR, **LUÔN READ LOGS** (`storage/logs/laravel.log`, `storage/logs/octane.log`) để diagnose

## 9. COMMON DEPLOYMENT SCENARIOS

### 9.1 Hotfix Deployment (Quick)
```bash
cd /www/wwwroot/clickai.lionsoftware.cloud
git pull origin main
cd laravel-backend
php artisan optimize:clear
sudo supervisorctl restart octane
```

### 9.2 Feature Deployment (Standard)
```bash
# Use full deployment workflow (Section 3.2)
# OR use automated script:
cd /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend
bash deploy.sh main
```

### 9.3 Database Migration Deployment
```bash
# 1. Backup database first
# 2. Follow standard deployment (Section 3.2)
# 3. If migration fails, rollback immediately (Section 7)
```

### 9.4 Dependency Update Deployment
```bash
# CRITICAL: Verify laravel/octane is in "require", not "require-dev"
cd /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend

# Pull and install
git pull origin main
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction

# MANDATORY: Full Octane Reset
php artisan octane:stop
pkill -f "octane:start"
php artisan optimize:clear
php artisan filament:clear-cached-components
composer dump-autoload -o
php artisan optimize
sudo supervisorctl restart octane
```

## 10. MONITORING & LOGS

### 10.1 Log Locations
- **Laravel**: `/www/wwwroot/clickai.lionsoftware.cloud/laravel-backend/storage/logs/laravel.log`
- **Octane**: `/www/wwwroot/clickai.lionsoftware.cloud/laravel-backend/storage/logs/octane.log`
- **Queue**: `/www/wwwlogs/laravel-queue.log`
- **Deployment**: `/www/wwwlogs/deploy.log`
- **Nginx Error**: `/www/wwwlogs/clickai.lionsoftware.cloud.error.log`

### 10.2 Real-time Monitoring
```bash
# Watch Laravel logs
tail -f /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend/storage/logs/laravel.log

# Watch Octane logs
tail -f /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend/storage/logs/octane.log

# Watch all Supervisor processes
watch -n 2 'supervisorctl status'
```

---

## TÓM TẮT: 3 ĐIỀU QUAN TRỌNG NHẤT

1. **LUÔN LUÔN** sử dụng MCP (ssh-mcp) - KHÔNG manual commands
2. **LUÔN LUÔN** thực hiện OCTANE HARD RESET sau code pull
3. **LUÔN LUÔN** verify services running sau deployment (`supervisorctl status`)

**Remember**: Laravel Octane keeps your application in memory. Code changes are INVISIBLE to workers until you restart them. This is NOT PHP-FPM!
