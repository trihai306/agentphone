# CLICKAI Laravel Backend

## Project Overview
Full-stack platform: Laravel 12 + Octane/Swoole backend, Inertia.js + React frontend, Filament v3 admin panel.

## Tech Stack
- **Backend**: Laravel 12, Octane (Swoole), PHP 8.4
- **Frontend**: React 19, Inertia.js, Tailwind CSS
- **Admin**: Filament v3
- **Realtime**: Soketi (Pusher-compatible), Laravel Echo
- **DB**: MySQL
- **Queue**: Redis + Supervisor

## Project Structure
```
app/
├── Http/Controllers/     # Inertia controllers + API controllers
├── Http/Controllers/Api/ # JSON API endpoints
├── Models/               # 42 Eloquent models
├── Services/             # 35 service classes (business logic)
├── Filament/             # Admin panel resources
├── Policies/             # Authorization policies
├── Events/               # Broadcasting events
├── Jobs/                 # Queue jobs
resources/js/
├── Pages/                # React pages (Inertia)
├── Components/           # Reusable React components
├── Layouts/              # AppLayout, LandingLayout
├── Contexts/             # ThemeContext
├── hooks/                # Custom React hooks
```

## Key Patterns (MUST FOLLOW)

### Controller-Service Pattern
- Controllers only: validate → call service → return response
- Business logic lives in `app/Services/`
- Use `Inertia::render()` for pages, `response()->json()` for API

### Frontend Standards  
- Always use `useTranslation()` + `useTheme()` in React pages
- Dark/light mode: `isDark ? 'dark-class' : 'light-class'`
- Import alias: `@/Components/...` (not relative paths)
- Icons: SVG stroke-based from `NavLink.jsx` icons object (NO emoji, NO icon libraries)

### Database
- Migrations: descriptive names, always implement `down()`
- Foreign keys with cascade behavior
- Use `$fillable` (never `$guarded = []`)

### API Design
- RESTful: plural nouns, proper HTTP status codes
- Use API Resources for response formatting
- Paginate collections with `per_page` param

### Security
- Always check authorization before actions
- Validate all input before processing
- Never hardcode secrets

## Commands
```bash
# Dev server
php artisan serve & npm run dev

# Build frontend
npm run build

# Run tests  
php artisan test

# Create migration
php artisan make:migration create_xxx_table

# Deploy to production (via ssh-mcp)
bash deploy.sh main
```

## Agent Teams Guidelines

### When working as a team
- **Backend teammate**: Focus on `app/` directory — Models, Services, Controllers, Migrations
- **Frontend teammate**: Focus on `resources/js/` — Pages, Components, hooks
- **Admin teammate**: Focus on `app/Filament/` — Resources, Pages, Widgets
- **QA teammate**: Focus on `tests/` — Feature tests, Unit tests

### Avoid conflicts
- Each teammate should work on DIFFERENT files
- Coordinate through the shared task list
- Backend changes first, then frontend
- Run `npm run build` to verify JS changes compile

### Quality standards
- All code must follow existing patterns in the codebase
- No emojis in UI code — use SVG icons
- Every page needs dark mode support
- Test critical business logic
