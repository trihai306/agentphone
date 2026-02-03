# Contributing Guide - CLICKAI

Hướng dẫn đóng góp code cho dự án CLICKAI.

---

## 📋 Quy tắc chung

### 1. Coding Standards

- **Laravel Backend**: Tuân thủ [PSR-12](https://www.php-fig.org/psr/psr-12/) và Laravel conventions
- **React Frontend**: ESLint + Prettier configuration
- **Kotlin APK**: Kotlin coding conventions

### 2. Git Workflow

```bash
# 1. Tạo branch từ main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Commit với message rõ ràng
git commit -m "feat: add new workflow node type"
git commit -m "fix: resolve device registration issue"
git commit -m "refactor: improve campaign service performance"

# 3. Push và tạo Pull Request
git push origin feature/your-feature-name
```

### Commit Message Format

```
<type>: <description>

Types:
- feat:     Tính năng mới
- fix:      Bug fix
- refactor: Refactor code
- docs:     Documentation
- style:    Formatting, missing semicolons, etc.
- test:     Adding tests
- chore:    Maintenance
```

---

## 🔧 Development Workflows

Sử dụng các workflows có sẵn trong `.agent/workflows/`:

| Command | Mô tả |
|---------|-------|
| `/createpage` | Tạo page mới (React/Inertia) |
| `/createservice` | Tạo service mới (Laravel) |
| `/filament` | Tạo Filament resource/page/widget |
| `/socket-event` | Thêm WebSocket event |
| `/apk-feature` | Thêm feature cho APK |
| `/i18n` | Thêm translations |

---

## 📁 Project Rules

Đọc kỹ các rules trong `.agent/rules/`:

- `laravel-backend.md` - Backend patterns & standards
- `deploy.md` - Deployment protocols
- `test-web.md` - Web testing guidelines

---

## 🧪 Testing Requirements

### Backend

```bash
# Chạy tests trước khi commit
php artisan test

# Feature tests cho API endpoints
php artisan test --filter=ApiTest
```

### Frontend

```bash
# Type checking
npm run type-check

# Lint
npm run lint
```

---

## 📦 Pull Request Checklist

- [ ] Code follows project conventions
- [ ] Tests added/updated
- [ ] Documentation updated (if needed)
- [ ] Migrations reviewed
- [ ] No console.log or dd() statements
- [ ] Translations added (vi & en)

---

## 🚀 Deployment Notes

⚠️ **QUAN TRỌNG**: 

1. **Laravel Octane**: Phải restart workers sau mỗi code change
2. **Filament Resources**: Clear cache sau khi thêm/sửa resources
3. **WebSocket Events**: Test trên local với Soketi trước khi deploy

---

## 📞 Code Review

- Tất cả PRs cần ít nhất 1 reviewer approval
- Major changes cần team discussion trước
- Performance-critical code cần benchmark

---

## 🐛 Bug Reports

Khi báo bug, cung cấp đầy đủ:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots/logs** (if applicable)
5. **Environment** (browser, device, OS)

---

**Happy Coding! 🚀**
