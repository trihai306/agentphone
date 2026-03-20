#!/bin/bash
# ================================================
# CLICKAI Auto-Deploy Script for Laravel Octane/Swoole
# ================================================
# This script handles deployment with proper cache clearing 
# for Swoole/Octane environment on aaPanel
# 
# Usage: deploy.sh [branch]
# Example: deploy.sh main
# ================================================

set -e

# Configuration
PROJECT_DIR="/www/wwwroot/clickai.lionsoftware.cloud"
BACKEND_DIR="${PROJECT_DIR}/laravel-backend"
BRANCH="${1:-main}"
LOG_FILE="/www/wwwlogs/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# ================================================
# DEPLOYMENT STEPS
# ================================================

log "=========================================="
log "Starting deployment for branch: $BRANCH"
log "=========================================="

# Step 1: Navigate to project directory
cd "$PROJECT_DIR"

# Step 2: Pull latest changes
log "📥 Pulling latest changes from origin/$BRANCH..."
git fetch origin
git reset --hard "origin/$BRANCH"
success "Git pull completed"

# Step 3: Navigate to Laravel backend
cd "$BACKEND_DIR"

# Step 4: Install/update Composer dependencies (if composer.lock changed)
if git diff HEAD@{1} --name-only 2>/dev/null | grep -q "composer.lock"; then
    log "📦 composer.lock changed, installing dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev
    success "Composer install completed"
else
    log "📦 No composer.lock changes, skipping composer install"
fi

# Step 5: Build frontend assets (if package.json or resources changed)
if git diff HEAD@{1} --name-only 2>/dev/null | grep -qE "(package-lock\.json|resources/js|resources/css|vite\.config)"; then
    log "🏗️  Frontend changes detected, rebuilding assets..."
    npm ci --production=false 2>/dev/null || npm install
    npm run build
    success "Frontend build completed"
else
    log "🏗️  No frontend changes, skipping build"
fi

# Step 6: Run database migrations (if any)
log "🗄️  Running database migrations..."
php artisan migrate --force || warning "No new migrations"

# Step 7: Clear ALL caches (critical for Swoole/Octane)
log "🧹 Clearing all caches..."
php artisan optimize:clear
success "optimize:clear completed"

# Step 8: Rebuild caches
log "⚡ Rebuilding caches..."

# Config cache
php artisan config:cache
success "config:cache completed"

# Route cache
php artisan route:cache
success "route:cache completed"

# View cache
php artisan view:cache
success "view:cache completed"

# Event cache  
php artisan event:cache
success "event:cache completed"

# Filament components cache
php artisan filament:cache-components
success "filament:cache-components completed"

# Step 9: Restart Laravel Octane (critical for Swoole to load new code)
log "🔄 Restarting Laravel Octane..."
if supervisorctl status octane 2>/dev/null | grep -q "RUNNING"; then
    supervisorctl restart octane
    sleep 3
    if supervisorctl status octane | grep -q "RUNNING"; then
        success "Octane restarted successfully"
    else
        error "Failed to restart Octane!"
        supervisorctl status octane
        exit 1
    fi
else
    warning "Octane not running via supervisor, trying direct restart..."
    php artisan octane:reload 2>/dev/null || php artisan octane:restart 2>/dev/null || warning "Could not restart Octane automatically"
fi

# Step 10: Restart queue workers
if supervisorctl status queue 2>/dev/null | grep -q "RUNNING"; then
    log "🔄 Restarting queue workers..."
    supervisorctl restart queue
    success "Queue workers restarted"
fi

# Step 11: Restart Soketi (if running)
if supervisorctl status soketi 2>/dev/null | grep -q "RUNNING"; then
    log "🔄 Restarting Soketi..."
    supervisorctl restart soketi
    success "Soketi restarted"
fi

# Final status
log "=========================================="
success "✅ Deployment completed successfully!"
log "=========================================="
log "Deployment summary:"
log "  - Branch: $BRANCH"
log "  - Time: $(date '+%Y-%m-%d %H:%M:%S')"
log "=========================================="

# Show current services status
echo ""
log "Current services status:"
supervisorctl status || true

echo ""
success "🚀 All done! Your application is now running the latest code."
