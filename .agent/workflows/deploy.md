---
description: Quy trình deploy code lên production VPS
---

# Quy Trình Deploy Production

## ⚠️ QUAN TRỌNG

- **LUÔN** sử dụng MCP ssh-mcp tools
- **LUÔN** thực hiện OCTANE HARD RESET sau khi pull code
- **LUÔN** verify services sau deployment

---

## Quick Deploy (Hotfix)

Dùng khi chỉ fix nhỏ, không thay đổi dependencies.

```bash
# 1. Pull code
cd /www/wwwroot/clickai.lionsoftware.cloud
git pull origin main

# 2. Clear cache
cd laravel-backend
php artisan optimize:clear

# 3. Restart Octane
sudo supervisorctl restart octane

# 4. Verify
sudo supervisorctl status
```

---

## Standard Deploy (Feature)

Dùng khi deploy feature mới.

### Bước 1: Pull Code

```bash
cd /www/wwwroot/clickai.lionsoftware.cloud
git fetch --all
git reset --hard origin/main
```

### Bước 2: Install Dependencies

```bash
cd laravel-backend

# Composer (nếu composer.lock thay đổi)
COMPOSER_ALLOW_SUPERUSER=1 composer install \
  --no-dev \
  --optimize-autoloader \
  --no-interaction \
  --ignore-platform-req=ext-exif

# NPM (nếu package.json thay đổi)
npm install
rm -rf public/build
npm run build
```

### Bước 3: Database Migration

```bash
php artisan migrate --force
```

### Bước 4: Octane Hard Reset

```bash
# Stop processes
php artisan octane:stop
pkill -f "artisan octane:start"

# Clear ALL caches
php artisan optimize:clear
php artisan filament:clear-cached-components

# Rebuild caches
php artisan optimize
php artisan view:cache
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan filament:cache-components

# Restart services
sudo supervisorctl restart octane
sudo supervisorctl restart queue
```

### Bước 5: Verify

```bash
# Check services
sudo supervisorctl status

# Check HTTP
curl -I http://127.0.0.1:9000

# Check ports
ss -tlnp | grep -E "(9000|6001)"
```

---

## Deploy Script (Recommended)

```bash
cd /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend
bash deploy.sh
```

---

## Emergency Rollback

```bash
# 1. Rollback code
cd /www/wwwroot/clickai.lionsoftware.cloud
git reflog
git reset --hard HEAD@{1}

# 2. Reinstall dependencies
cd laravel-backend
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --no-interaction

# 3. Reset Octane
php artisan optimize:clear
php artisan filament:clear-cached-components
php artisan optimize
sudo supervisorctl restart octane

# 4. Verify
sudo supervisorctl status
```

---

## Log Locations

| Log | Path |
|-----|------|
| Laravel | `storage/logs/laravel.log` |
| Octane | `storage/logs/octane.log` |
| Queue | `/www/wwwlogs/laravel-queue.log` |
| Deploy | `/www/wwwlogs/deploy.log` |
| Nginx | `/www/wwwlogs/clickai.lionsoftware.cloud.error.log` |

---

## Checklist

- [ ] Code pulled thành công
- [ ] Dependencies installed (nếu thay đổi)
- [ ] Migrations chạy thành công
- [ ] Octane restarted
- [ ] Queue restarted
- [ ] `supervisorctl status` shows all RUNNING
- [ ] `curl -I http://127.0.0.1:9000` returns 200

---

## Troubleshooting

### 502 Bad Gateway
```bash
sudo supervisorctl restart octane
tail -f storage/logs/octane.log
```

### Filament UI không update
```bash
php artisan filament:clear-cached-components
sudo supervisorctl restart octane
```

### Assets cũ (CSS/JS)
```bash
rm -rf public/build
npm run build
pkill -HUP nginx
```

// turbo-all
