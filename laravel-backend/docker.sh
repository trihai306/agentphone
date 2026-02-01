#!/bin/bash

# ==============================================
# Docker Management Script for Laravel Backend
# ==============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Commands
case "$1" in
    build)
        print_header "Building Docker Images"
        check_docker
        docker-compose build --no-cache
        print_success "Build completed!"
        ;;
    
    up)
        print_header "Starting Docker Containers"
        check_docker
        
        # Copy .env.docker to .env if not exists
        if [ ! -f .env ]; then
            print_warning ".env not found, copying from .env.docker"
            cp .env.docker .env
        fi
        
        docker-compose up -d
        
        echo ""
        print_success "Containers started!"
        echo ""
        echo -e "Services:"
        echo -e "  ${GREEN}Laravel App:${NC}    http://localhost:8001"
        echo -e "  ${GREEN}phpMyAdmin:${NC}     http://localhost:8080"
        echo -e "  ${GREEN}Mailpit:${NC}        http://localhost:8025"
        echo -e "  ${GREEN}MySQL:${NC}          localhost:3306"
        echo -e "  ${GREEN}Redis:${NC}          localhost:6379"
        echo ""
        echo -e "${YELLOW}Soketi:${NC} Connected to ${GREEN}clickai.lionsoftware.cloud${NC} (production)"
        ;;
    
    down)
        print_header "Stopping Docker Containers"
        docker-compose down
        print_success "Containers stopped!"
        ;;
    
    restart)
        print_header "Restarting Docker Containers"
        docker-compose restart
        print_success "Containers restarted!"
        ;;
    
    logs)
        print_header "Showing Logs"
        if [ -z "$2" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f "$2"
        fi
        ;;
    
    shell)
        print_header "Entering Laravel Container Shell"
        docker-compose exec app bash
        ;;
    
    artisan)
        shift
        docker-compose exec app php artisan "$@"
        ;;
    
    composer)
        shift
        docker-compose exec app composer "$@"
        ;;
    
    npm)
        shift
        docker-compose exec app npm "$@"
        ;;
    
    migrate)
        print_header "Running Migrations"
        docker-compose exec app php artisan migrate
        print_success "Migrations completed!"
        ;;
    
    fresh)
        print_header "Fresh Migration + Seed"
        docker-compose exec app php artisan migrate:fresh --seed
        print_success "Database refreshed!"
        ;;
    
    seed)
        print_header "Running Seeders"
        docker-compose exec app php artisan db:seed
        print_success "Seeding completed!"
        ;;
    
    queue)
        print_header "Queue Status"
        docker-compose exec app php artisan queue:monitor redis:default
        ;;
    
    cache-clear)
        print_header "Clearing All Caches"
        docker-compose exec app php artisan optimize:clear
        docker-compose exec app php artisan filament:clear-cached-components
        print_success "Caches cleared!"
        ;;
    
    optimize)
        print_header "Optimizing Application"
        docker-compose exec app php artisan optimize
        docker-compose exec app php artisan filament:cache-components
        print_success "Application optimized!"
        ;;
    
    test)
        print_header "Running Tests"
        docker-compose exec app php artisan test
        ;;
    
    status)
        print_header "Container Status"
        docker-compose ps
        ;;
    
    clean)
        print_header "Cleaning Docker Resources"
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleaned!"
        ;;
    
    *)
        echo "Laravel Docker Management Script"
        echo ""
        echo "Usage: ./docker.sh [command]"
        echo ""
        echo "Commands:"
        echo "  build        Build Docker images"
        echo "  up           Start all containers"
        echo "  down         Stop all containers"
        echo "  restart      Restart all containers"
        echo "  logs [svc]   Show logs (optional: service name)"
        echo "  shell        Enter Laravel container shell"
        echo "  artisan      Run artisan command"
        echo "  composer     Run composer command"
        echo "  npm          Run npm command"
        echo "  migrate      Run database migrations"
        echo "  fresh        Fresh migration with seeding"
        echo "  seed         Run database seeders"
        echo "  queue        Show queue status"
        echo "  cache-clear  Clear all caches"
        echo "  optimize     Optimize application"
        echo "  test         Run tests"
        echo "  status       Show container status"
        echo "  clean        Clean Docker resources"
        echo ""
        echo "Examples:"
        echo "  ./docker.sh up"
        echo "  ./docker.sh logs app"
        echo "  ./docker.sh artisan make:model Post -m"
        echo "  ./docker.sh composer require package/name"
        ;;
esac
