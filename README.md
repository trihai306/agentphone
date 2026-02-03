# CLICKAI - AI-Powered Automation Platform

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel"/>
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Kotlin-1.9-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white" alt="Kotlin"/>
  <img src="https://img.shields.io/badge/Filament-3.3-F59E0B?style=for-the-badge&logo=filament&logoColor=white" alt="Filament"/>
  <img src="https://img.shields.io/badge/Swoole-6.0-34495E?style=for-the-badge" alt="Swoole"/>
</p>

<p align="center">
  <b>Enterprise-grade automation platform for device fleet management, workflow automation, and AI-powered content generation.</b>
</p>

---

## 🌟 Overview

CLICKAI is a comprehensive SaaS automation platform that combines:

- **🤖 AI Studio** - AI-powered image & video generation
- **⚡ Workflow Automation** - Visual flow-based automation builder
- **📱 Device Fleet Management** - Remote Android device control
- **🎯 Campaign Management** - Orchestrate workflows across devices
- **🛒 Marketplace** - Share and monetize automation recipes
- **💰 Monetization System** - Wallet, credits, and subscription management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLICKAI Platform                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Laravel Backend (Octane + Swoole)             │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐ │   │
│  │  │  Inertia   │ │  Filament  │ │   API      │ │   WebSocket    │ │   │
│  │  │  React UI  │ │   Admin    │ │  Endpoints │ │   (Soketi)     │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘ │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │                    Services Layer                           │  │   │
│  │  │  • WorkflowService      • AiGenerationService              │  │   │
│  │  │  • CampaignService      • DeviceService                    │  │   │
│  │  │  • WalletService        • TopupService                     │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                              WebSocket                                   │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Android Agent (APK)                           │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐ │   │
│  │  │ Socket Job │ │Accessibility│ │  HTTP      │ │   Recording    │ │   │
│  │  │  Manager   │ │  Service   │ │  Server    │ │    Manager     │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
agent/
├── laravel-backend/          # Laravel 12 + Octane Backend
│   ├── app/
│   │   ├── Filament/         # Admin panel (Filament v3)
│   │   │   ├── Resources/    # 30+ admin resources
│   │   │   ├── Pages/        # Custom admin pages
│   │   │   └── Widgets/      # Dashboard widgets
│   │   ├── Http/             # Controllers & Middleware
│   │   ├── Models/           # 40+ Eloquent models
│   │   ├── Services/         # Business logic services
│   │   ├── Events/           # Broadcasting events
│   │   ├── Jobs/             # Queue jobs
│   │   └── Policies/         # Authorization policies
│   ├── resources/
│   │   └── js/Pages/         # React/Inertia pages
│   │       ├── AiStudio/     # AI generation UI
│   │       ├── Flows/        # Flow editor
│   │       ├── Devices/      # Device management
│   │       ├── Campaigns/    # Campaign management
│   │       ├── Marketplace/  # Recipe marketplace
│   │       └── ...           # 25+ feature pages
│   └── deploy.sh             # Production deployment script
│
├── portal-apk/               # Android Agent (Kotlin)
│   ├── app/src/main/
│   │   └── java/com/agent/portal/
│   │       ├── SocketJobManager.kt     # WebSocket job handling
│   │       ├── PortalAccessibilityService.kt
│   │       ├── RecordingManager.kt
│   │       └── ...
│   └── docs/                 # APK documentation
│
└── .agent/                   # Development configuration
    ├── rules/                # Coding standards
    └── workflows/            # Development workflows
```

---

## 🚀 Features

### 1. AI Studio 🎨
- **Image Generation** - AI-powered image creation
- **Video Generation** - Text-to-video and image-to-video
- **Scenario Generation** - AI content for automation
- **Credits System** - Pay-per-use AI generation

### 2. Workflow Automation ⚡
- **Visual Flow Editor** - Drag-and-drop workflow builder
- **13+ Node Types** - Tap, swipe, input, scroll, AI, loops, conditions
- **Recording Mode** - Record user interactions on device
- **Variable System** - Dynamic data handling

### 3. Device Management 📱
- **Fleet Overview** - Real-time device status
- **Remote Control** - Execute actions remotely
- **Presence System** - Redis-based online tracking
- **Multi-brand Support** - Samsung, Xiaomi, OPPO, etc.

### 4. Campaign Orchestration 🎯
- **Multi-device Deployment** - Run workflows across device fleet
- **Data Iteration** - Process data collections per device
- **Scheduling** - Cron-based automation
- **Progress Monitoring** - Real-time job tracking

### 5. Marketplace 🛒
- **Recipe Bundles** - Workflows + Data Collections
- **Revenue Sharing** - 80/20 creator split
- **Tag-based Discovery** - Category filtering
- **One-click Import** - Deep-clone engine

### 6. Monetization 💰
- **Wallet System** - Multi-currency support (VND/Credits)
- **Package Subscriptions** - Tiered pricing plans
- **Per-seat Pricing** - Enterprise licensing
- **Top-up & Withdrawal** - Bank integration

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Laravel | 12.0 | PHP Framework |
| Laravel Octane | 2.0 | High-performance server |
| Swoole | 6.0 | Async runtime |
| Filament | 3.3 | Admin panel |
| Inertia.js | 2.0 | SPA bridge |
| Soketi | - | WebSocket server |
| Redis | - | Cache & presence |
| MySQL | - | Database |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI library |
| Vite | 6.0 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 12.x | Animations |
| ReactFlow | 11.x | Flow editor |
| i18next | 25.x | Internationalization |
| Laravel Echo | 1.19 | WebSocket client |

### Android Agent
| Technology | Purpose |
|------------|---------|
| Kotlin | Primary language |
| Pusher Client | WebSocket communication |
| ML Kit | OCR & Object detection |
| NanoHTTPD | HTTP server |
| WorkManager | Background tasks |

---

## 🔧 Development Setup

### Prerequisites
- PHP 8.2+
- Node.js 18+
- Composer 2.x
- Redis
- MySQL 8.0+
- Android Studio (for APK development)

### Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd agent/laravel-backend

# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database
php artisan migrate
php artisan db:seed

# Start development server
npm run dev  # In terminal 1
php artisan serve  # In terminal 2
# Or use Laravel Octane
php artisan octane:start --server=swoole --port=8000
```

### Soketi (WebSocket) Setup

```bash
# Using Docker
docker-compose -f docker-compose.soketi.yml up -d

# Or using soketi-dev.json config
soketi start --config=soketi-dev.json
```

### APK Development

```bash
cd portal-apk

# Build debug APK
./gradlew assembleDebug

# Install to device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Enable accessibility service
# Settings → Accessibility → Agent Portal → ON
```

---

## 🚀 Production Deployment

### Prerequisites
- aaPanel (recommended) or similar
- PHP 8.4 with Swoole extension
- Supervisor for process management

### Deployment Steps

```bash
# SSH to server
cd /www/wwwroot/clickai.lionsoftware.cloud/laravel-backend

# Use automated deploy script
bash deploy.sh main
```

### Manual Deployment (if needed)

```bash
# 1. Pull latest code
git fetch --all
git reset --hard origin/main

# 2. Install dependencies
composer install --no-dev --optimize-autoloader

# 3. Build assets
npm install && npm run build

# 4. Run migrations
php artisan migrate --force

# 5. Clear and rebuild caches
php artisan optimize:clear
php artisan optimize
php artisan filament:cache-components

# 6. Restart Octane
supervisorctl restart octane queue soketi
```

> ⚠️ **Important**: Laravel Octane keeps the application in memory. Always restart Octane workers after code changes!

---

## 📡 API Endpoints

### Device API
- `POST /api/device/register` - Register device
- `POST /api/device/heartbeat` - Update presence
- `GET /api/device/{id}/status` - Get device status

### Workflow API
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `POST /api/workflows/{id}/execute` - Execute workflow

### Recording API
- `POST /api/recordings/events` - Upload recording events
- `GET /api/recordings/{id}` - Get recording details

---

## 🔐 Admin Panel

Access the admin panel at `/admin`:

- **Dashboard** - System overview & statistics
- **Users** - User management
- **Devices** - Device fleet management
- **Workflows** - Workflow administration
- **Jobs** - Job monitoring
- **Transactions** - Financial management
- **Settings** - System configuration

---

## 🌐 Internationalization

The platform supports multiple languages:
- 🇻🇳 Vietnamese (vi)
- 🇺🇸 English (en)

Translation files are located in:
- Frontend: `resources/js/i18n/locales/`
- Backend: `lang/`

---

## 📚 Documentation

### Backend
- [Laravel Documentation](https://laravel.com/docs)
- [Filament Documentation](https://filamentphp.com/docs)
- [Inertia.js Documentation](https://inertiajs.com/)

### APK
- [APK README](portal-apk/README.md)
- [Socket Job System](portal-apk/docs/SOCKET_JOB_SYSTEM_PRODUCTION.md)
- [Emulator Connection Guide](portal-apk/EMULATOR_CONNECTION_GUIDE.md)

### Development Workflows
- `/createpage` - Create new React/Inertia page
- `/createservice` - Create new Laravel service
- `/filament` - Create Filament resource
- `/socket-event` - Add WebSocket event
- `/apk-feature` - Add APK feature

---

## 🤝 Contributing

1. Follow coding standards in `.agent/rules/`
2. Use workflows in `.agent/workflows/`
3. Run linting before commits
4. Write tests for new features

---

## 📄 License

Proprietary - All rights reserved.

---

## 📞 Support

- **Zalo**: [Contact Link]
- **Facebook**: [Page Link]
- **Email**: support@example.com

---

<p align="center">
  <b>Built with ❤️ by CLICKAI Team</b>
</p>
