# Vấn đề Git với Auto-Claude - Tài liệu Khắc phục

## Tổng quan vấn đề

Khi làm việc với auto-claude và git worktrees, có một số vấn đề phổ biến khiến các commit không thể push được:

### 1. **Nhánh không có upstream branch**
- **Triệu chứng**: Lỗi `fatal: The current branch has no upstream branch`
- **Nguyên nhân**: Các nhánh auto-claude mới được tạo nhưng chưa được set upstream
- **Giải pháp**: 
  ```bash
  git push --set-upstream origin <branch-name>
  ```

### 2. **File trạng thái bị modified nhưng chưa commit**
- **Triệu chứng**: Có nhiều uncommitted changes trong các worktrees
- **Nguyên nhân**: 
  - `.auto-claude-status` - file trạng thái thay đổi liên tục
  - `.claude_settings.json` - file cấu hình có thể bị chỉnh sửa
  - `__pycache__/` - Python cache files (đã được ignore)
- **Giải pháp**: 
  - Đã thêm `.auto-claude-status` và `.claude_settings.json` vào `.gitignore`
  - Các file này không nên được commit vì chúng thay đổi động

### 3. **Xung đột giữa các worktrees**
- **Triệu chứng**: Warning về "uncommitted changes in main project"
- **Nguyên nhân**: Mỗi worktree có thể có các thay đổi riêng
- **Giải pháp**: 
  - Commit hoặc stash các thay đổi trong từng worktree trước khi merge
  - Sử dụng script `scripts/fix_auto_claude_branches.sh` để kiểm tra

## Các file đã được cập nhật

### `.gitignore`
Đã thêm:
```
.auto-claude-status
.claude_settings.json
```

### Script khắc phục
Tạo file `scripts/fix_auto_claude_branches.sh` để:
- Kiểm tra tất cả các worktrees auto-claude
- Tự động set upstream cho các nhánh chưa có
- Báo cáo các uncommitted changes

## Cách sử dụng

### Kiểm tra và sửa tự động:
```bash
./scripts/fix_auto_claude_branches.sh
```

### Push một nhánh cụ thể:
```bash
cd .worktrees/<worktree-name>
git push --set-upstream origin <branch-name>
```

### Xem trạng thái của một worktree:
```bash
cd .worktrees/<worktree-name>
git status
```

### Commit các thay đổi trong worktree:
```bash
cd .worktrees/<worktree-name>
git add .
git commit -m "your message"
git push
```

## Danh sách các worktrees hiện tại

Các worktrees auto-claude đang hoạt động:
- `002-redesign-desktop-application-ui`
- `003-improve-apk-ui-design`
- `004-simplify-desktop-app-ui`
- `005-show-connected-devices-in-phone-view`
- `006-fix-dark-light-mode-feature`
- `007-build-laravel-be-api` ✅ (đã fix upstream)
- `008-design-app-login-registration-page`
- `009-smart-action-recording-record-generate-workflows`
- `011-fix-app-sidebar-scrolling-issue`
- `012-fix-workflow-button-box-shadow`
- `013-remove-box-shadow-from-token-buttons`
- `014-create-authentication-views`
- `015-enhance-phone-management-ui-features`

## Lưu ý quan trọng

1. **Không commit `.auto-claude-status`**: File này thay đổi liên tục và chỉ dùng để tracking trạng thái local
2. **Không commit `__pycache__`**: Đã được ignore nhưng vẫn có thể xuất hiện trong một số worktrees cũ
3. **Luôn set upstream khi tạo branch mới**: Để tránh lỗi khi push
4. **Kiểm tra trước khi merge**: Đảm bảo không có uncommitted changes trong worktree

## Troubleshooting

### Lỗi: "cannot push because there are uncommitted changes"
```bash
# Xem các thay đổi
git status

# Nếu là file không quan trọng (như .auto-claude-status), restore nó
git restore .auto-claude-status

# Hoặc commit nếu cần
git add .
git commit -m "Update status"
```

### Lỗi: "branch has diverged"
```bash
# Pull và merge
git pull origin <branch-name>

# Hoặc rebase
git pull --rebase origin <branch-name>
```

### Xóa worktree không cần thiết:
```bash
git worktree remove .worktrees/<worktree-name>
```

