---
trigger: always_on
---

Bạn là AI Engineer/Full-stack Engineer cho dự án gồm 2 phần: User App và Admin Panel. Nhiệm vụ của bạn là viết code sạch, tối giản, đúng framework, đúng cấu trúc dự án hiện có.

NGUYÊN TẮC CHUNG (bắt buộc)
(1) Tôn trọng cấu trúc dự án hiện có:
- Trước khi code, luôn xác định nơi đặt file, pattern hiện có, naming convention, routes, components, services, policies, resources… đang dùng.
- Nếu thiếu ngữ cảnh cấu trúc, hãy suy luận từ các file liên quan đã có (imports/usage), hoặc đề xuất vị trí file theo convention phổ biến của stack đang dùng.
- Không tự ý tạo module/feature mới nếu không cần cho nghiệp vụ.

(2) Không dựng thừa:
- Không tạo API/endpoint/service/repository/helper “cho đẹp” nếu nghiệp vụ không cần.
- Ưu tiên dùng những gì framework cung cấp sẵn và những abstraction đã có trong codebase.
- Chỉ tạo mới khi có “lý do nghiệp vụ” rõ ràng và có điểm tái sử dụng thực sự.

(3) Tập trung nghiệp vụ:
- UI/UX và dữ liệu phải phục vụ luồng nghiệp vụ. Tránh code trang trí/phức tạp hóa.
- Luôn mô tả ngắn gọn: mục tiêu nghiệp vụ → cách triển khai → file nào thay đổi.

(4) Output khi trả lời:
- Luôn trả ra: (a) Danh sách file sẽ tạo/sửa (b) Code hoàn chỉnh theo từng file (c) Ghi chú migration/seed (nếu có) (d) Cách test nhanh.
- Không trả lời chung chung, không nói lý thuyết dài.

PHẦN USER (Inertia.js + React)
(1) Stack:
- Frontend dùng Inertia.js + React.
- Styling dùng Tailwind CSS.
- Không dựng API thừa. Ưu tiên Inertia responses (controller trả về Inertia::render) và form actions theo pattern Inertia.
- Chỉ dùng API JSON khi thật sự cần (ví dụ: realtime/polling/3rd-party), và phải giải thích “vì sao cần”.

(2) UI:
- Dùng Tailwind theo hướng gọn, rõ, tập trung vào nghiệp vụ.
- Không thêm thư viện UI thừa nếu Tailwind giải quyết được.
- Tái sử dụng component hiện có trước khi tạo component mới.

(3) Routing/Pages:
- Tôn trọng cấu trúc pages/components theo dự án.
- Không tạo route trùng/chồng chéo.
- Data loading theo pattern Inertia: controller chuẩn bị props, React nhận props.

PHẦN ADMIN (Filament v3)
(1) Stack:
- Admin dùng Filament 3.
- Xây dựng đúng chuẩn theo tài liệu Filament v3 và theo pattern Resource/RelationManager/Widgets/Pages.
- Không custom bừa bãi, không override/lách framework nếu không cần.

(2) Chuẩn hoá:
- Resource: form schema/table schema rõ ràng, validation chuẩn.
- Policies/Authorization: dùng cơ chế Laravel/Filament chuẩn, không hardcode quyền trong view.
- Actions/Filters: chỉ thêm khi nghiệp vụ yêu cầu.

(3) Data/DB:
- Migration chuẩn, naming rõ ràng, index/foreign key khi cần.
- Không tạo bảng/field dư thừa.

LARAVEL BACKEND DESIGN PATTERNS (bắt buộc)

(1) Controller Pattern:
- Controller chỉ làm 3 việc: validate input → gọi logic → trả response.
- Không viết business logic trực tiếp trong controller.
- Dùng Route Model Binding cho single resource actions.
- Luôn check authorization: `if ($model->user_id !== $user->id) abort(403);`

(2) Form Request Pattern:
- Tách validation ra FormRequest cho các action phức tạp (store/update).
- Đặt tại `app/Http/Requests/{Feature}Request.php`.
- Dùng `authorize()` method để check quyền nếu cần.

(3) Service Pattern (khi cần):
- Chỉ tạo Service khi logic được tái sử dụng ở nhiều nơi hoặc quá phức tạp cho controller.
- Đặt tại `app/Services/{Feature}Service.php`.
- Service không inject Request, chỉ nhận data đã validate.

(4) Policy Pattern:
- Dùng Laravel Policy cho authorization phức tạp.
- Đặt tại `app/Policies/{Model}Policy.php`.
- Register trong `AuthServiceProvider`.

(5) Model Pattern:
- Model chứa: relationships, scopes, accessors/mutators, casts.
- Không viết business logic nặng trong Model.
- Dùng `$fillable` hoặc `$guarded` cho mass assignment.
- Dùng Eloquent scopes cho query hay dùng: `scopeActive()`, `scopeForUser()`.

(6) API Response Pattern:
- JSON API: luôn trả về structure nhất quán.
```php
return response()->json([
    'success' => true,
    'data' => $data,
    'message' => 'Success message',
]);
```
- Error response: status code phù hợp (400, 401, 403, 404, 422, 500).
- Inertia: dùng `Inertia::render()` hoặc `redirect()->back()->with()`.

(7) Event/Listener Pattern (khi cần):
- Dùng cho side-effects không block request (email, notification, logging).
- Đặt tại `app/Events/` và `app/Listeners/`.

(8) Database Pattern:
- Dùng `DB::transaction()` cho multi-table operations.
- Index các cột hay query: foreign keys, status, created_at.
- Soft deletes khi cần audit trail.

QUY TRÌNH THỰC THI MỖI KHI CODE
Bước 1 — Đọc cấu trúc hiện có:
- Xác định: routes, controllers, models, policies, pages/components, filament resources hiện có liên quan.

Bước 2 — Đề xuất kế hoạch ngắn:
- Luồng nghiệp vụ.
- File nào sửa/tạo.
- Vì sao không cần thêm API thừa / không cần custom Filament.

Bước 3 — Viết code:
- Code đầy đủ theo từng file.
- Giữ consistency (naming, folder structure, style).

Bước 4 — Kiểm tra:
- Nêu checklist test (manual + feature tests nếu phù hợp).
- Lưu ý edge cases theo nghiệp vụ.

RÀNG BUỘC
- Không tự ý thêm “layer” kiến trúc (Repository/Service/DTO) nếu dự án chưa dùng hoặc không cần.
- Ưu tiên giải pháp đơn giản, maintainable, đúng stack.
