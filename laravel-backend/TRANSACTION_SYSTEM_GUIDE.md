# Hệ Thống Quản Lý Nạp/Rút Tiền - Tích Hợp Ngân Hàng Việt Nam

## Tổng Quan

Hệ thống quản lý nạp/rút tiền hoàn chỉnh với tích hợp 30+ ngân hàng Việt Nam, được xây dựng trên Laravel và Filament Admin Panel.

## Cấu Trúc Database

### 1. Bảng `banks` - Danh sách ngân hàng
- `code`: Mã ngân hàng (VCB, TCB, BIDV...)
- `short_name`: Tên viết tắt
- `full_name`: Tên đầy đủ
- `logo`: Logo ngân hàng
- `bin`: BIN number
- `is_active`: Trạng thái hoạt động
- `sort_order`: Thứ tự hiển thị

### 2. Bảng `wallets` - Ví tiền của user
- `user_id`: User sở hữu
- `balance`: Số dư hiện tại
- `locked_balance`: Số dư bị khóa (đang xử lý giao dịch rút)
- `currency`: Loại tiền tệ (mặc định VND)
- `is_active`: Trạng thái ví

### 3. Bảng `user_bank_accounts` - Tài khoản ngân hàng của user
- `user_id`: User sở hữu
- `bank_id`: Ngân hàng
- `account_number`: Số tài khoản
- `account_name`: Tên chủ tài khoản
- `branch`: Chi nhánh
- `is_verified`: Đã xác thực
- `is_default`: Tài khoản mặc định
- `verified_at`: Thời gian xác thực

### 4. Bảng `transactions` - Giao dịch nạp/rút
- `transaction_code`: Mã giao dịch duy nhất (tự động tạo)
- `user_id`: User thực hiện
- `wallet_id`: Ví liên quan
- `type`: Loại giao dịch (deposit/withdrawal)
- `amount`: Số tiền giao dịch
- `fee`: Phí giao dịch
- `final_amount`: Số tiền thực nhận/trừ
- `status`: Trạng thái (pending/processing/completed/failed/cancelled)
- `user_bank_account_id`: Tài khoản ngân hàng user
- `payment_method`: Phương thức thanh toán
- `proof_images`: Ảnh chứng từ
- `bank_transaction_id`: Mã GD ngân hàng
- `approved_by`: Admin duyệt
- `admin_note`: Ghi chú admin
- `user_note`: Ghi chú user
- `reject_reason`: Lý do từ chối

## Models

### 1. Bank Model
```php
App\Models\Bank
```
- Relationships: `userBankAccounts()`
- Scopes: `active()`, `ordered()`

### 2. Wallet Model
```php
App\Models\Wallet
```
- Relationships: `user()`, `transactions()`
- Methods:
  - `deposit($amount)`: Nạp tiền vào ví
  - `withdraw($amount)`: Rút tiền từ ví
  - `lock($amount)`: Khóa số tiền
  - `unlock($amount)`: Mở khóa số tiền
- Attributes: `available_balance` (số dư khả dụng)

### 3. UserBankAccount Model
```php
App\Models\UserBankAccount
```
- Relationships: `user()`, `bank()`, `transactions()`
- Scopes: `verified()`, `default()`
- Auto-update: Chỉ 1 tài khoản default per user

### 4. Transaction Model
```php
App\Models\Transaction
```
- Relationships: `user()`, `wallet()`, `userBankAccount()`, `approvedBy()`
- Scopes: `deposit()`, `withdrawal()`, `pending()`, `processing()`, `completed()`
- Auto-generate: `transaction_code` khi tạo mới
- Constants:
  - Types: `TYPE_DEPOSIT`, `TYPE_WITHDRAWAL`
  - Statuses: `STATUS_PENDING`, `STATUS_PROCESSING`, `STATUS_COMPLETED`, `STATUS_FAILED`, `STATUS_CANCELLED`

## Filament Resources

### 1. TransactionResource
**Đường dẫn:** `/admin/transactions`

**Tính năng:**
- Xem danh sách giao dịch với bộ lọc đầy đủ
- Tạo/Sửa/Xóa giao dịch
- Duyệt giao dịch ngay trên bảng (action button)
- Từ chối giao dịch với lý do
- Badge hiển thị số giao dịch chờ duyệt
- Lọc theo: loại GD, trạng thái, khoảng thời gian
- Upload ảnh chứng từ

**Actions:**
- Approve: Duyệt giao dịch (chỉ hiện với status=pending)
- Reject: Từ chối giao dịch (chỉ hiện với status=pending)

### 2. BankResource
**Đường dẫn:** `/admin/banks`

**Tính năng:**
- Quản lý danh sách ngân hàng
- Thêm/Sửa/Xóa ngân hàng
- Upload logo ngân hàng
- Kích hoạt/Vô hiệu hóa ngân hàng
- Sắp xếp thứ tự hiển thị

### 3. Widget: TransactionStatsWidget
**Hiển thị trên Dashboard:**
- Số giao dịch chờ duyệt
- Tổng tiền nạp hôm nay
- Tổng tiền rút hôm nay

## Service Layer

### TransactionService
```php
App\Services\TransactionService
```

**Methods:**

1. **createDeposit(User $user, array $data): Transaction**
   - Tạo giao dịch nạp tiền
   - Auto-create wallet nếu chưa có

2. **createWithdrawal(User $user, array $data): Transaction**
   - Tạo giao dịch rút tiền
   - Kiểm tra số dư
   - Tự động khóa số tiền trong ví

3. **approveDeposit(Transaction $transaction, User $approver, ?string $note): bool**
   - Duyệt giao dịch nạp tiền
   - Cộng tiền vào ví

4. **approveWithdrawal(Transaction $transaction, User $approver, ?string $note): bool**
   - Duyệt giao dịch rút tiền
   - Mở khóa và trừ tiền từ ví

5. **rejectTransaction(Transaction $transaction, User $approver, string $reason): bool**
   - Từ chối giao dịch
   - Mở khóa tiền (nếu là rút tiền)

6. **cancelTransaction(Transaction $transaction): bool**
   - Hủy giao dịch
   - Mở khóa tiền (nếu là rút tiền)

7. **getUserTransactions(User $user, array $filters): LengthAwarePaginator**
   - Lấy danh sách giao dịch của user
   - Hỗ trợ filter

8. **getTransactionStats(array $filters): array**
   - Thống kê giao dịch
   - Tổng nạp, rút, số lượng theo trạng thái

## Danh Sách Ngân Hàng Tích Hợp

30+ ngân hàng Việt Nam bao gồm:
- Vietcombank (VCB)
- Techcombank (TCB)
- Vietinbank (VTB)
- BIDV
- ACB
- MBBank
- VPBank
- TPBank
- Sacombank
- HDBank
- MSB
- SHB
- VIB
- SeABank
- Eximbank
- OCB
- LienVietPostBank
- VietABank
- NamABank
- PGBank
- VietCapitalBank
- SCB
- ABBank
- BacABank
- PVcomBank
- CAKE by VPBank
- Ubank by VPBank
- Timo by VPBank
- WooriBank
- ... và nhiều hơn nữa

## Cách Sử Dụng

### 1. Chạy Migration và Seeder
```bash
# Đã chạy rồi
php artisan migrate
php artisan db:seed --class=BankSeeder
```

### 2. Truy Cập Filament Admin
```
URL: http://your-domain/admin
Email: admin@example.com (theo file ADMIN_CREDENTIALS.md)
```

### 3. Sử Dụng TransactionService trong Code

```php
use App\Services\TransactionService;
use App\Models\User;

$service = new TransactionService();

// Tạo giao dịch nạp tiền
$transaction = $service->createDeposit($user, [
    'amount' => 1000000,
    'fee' => 0,
    'payment_method' => 'bank_transfer',
    'user_bank_account_id' => 1,
    'user_note' => 'Nạp tiền từ VCB',
    'proof_images' => ['path/to/image.jpg'],
]);

// Duyệt giao dịch
$service->approveDeposit($transaction, auth()->user(), 'Đã kiểm tra');

// Tạo giao dịch rút tiền
$withdrawal = $service->createWithdrawal($user, [
    'amount' => 500000,
    'fee' => 5000,
    'user_bank_account_id' => 1,
]);

// Từ chối giao dịch
$service->rejectTransaction($transaction, auth()->user(), 'Ảnh chứng từ không rõ');
```

## Quy Trình Giao Dịch

### Nạp Tiền (Deposit)
1. User tạo yêu cầu nạp tiền → Status: PENDING
2. User upload ảnh chứng từ chuyển khoản
3. Admin kiểm tra và duyệt → Status: COMPLETED
4. Tiền được cộng vào ví user

### Rút Tiền (Withdrawal)
1. User tạo yêu cầu rút tiền → Status: PENDING
2. Hệ thống tự động khóa số tiền trong ví
3. Admin kiểm tra và duyệt → Status: COMPLETED
4. Tiền được trừ từ ví và mở khóa
5. Admin chuyển khoản cho user

## Bảo Mật

- Transaction sử dụng Database Transaction để đảm bảo tính toàn vẹn dữ liệu
- Locked balance ngăn user rút quá số dư
- Chỉ admin có quyền duyệt giao dịch
- Mã giao dịch unique tự động tạo
- Lưu lịch sử đầy đủ (approved_by, timestamps)

## Navigation Menu

Trong Filament Admin, sẽ có nhóm menu **"Quản lý tài chính"** với:
1. Giao dịch (badge: số GD chờ duyệt)
2. Ví tiền
3. Ngân hàng
4. Tài khoản ngân hàng

## Mở Rộng

Có thể dễ dàng mở rộng hệ thống với:
- API endpoints cho mobile app
- Webhook tích hợp với payment gateway
- Auto-verification qua banking API
- Notification khi có giao dịch mới
- Export báo cáo Excel
- Dashboard analytics nâng cao

## Files Đã Tạo

### Migrations
- `2025_12_28_070541_create_banks_table.php`
- `2025_12_28_070548_create_user_bank_accounts_table.php`
- `2025_12_28_070554_create_transactions_table.php`
- `2025_12_28_070613_create_wallets_table.php`

### Models
- `app/Models/Bank.php`
- `app/Models/Wallet.php`
- `app/Models/UserBankAccount.php`
- `app/Models/Transaction.php`

### Filament Resources
- `app/Filament/Resources/BankResource.php`
- `app/Filament/Resources/TransactionResource.php`
- `app/Filament/Resources/UserBankAccountResource.php`
- `app/Filament/Resources/WalletResource.php`

### Services
- `app/Services/TransactionService.php`

### Seeders
- `database/seeders/BankSeeder.php`

### Widgets
- `app/Filament/Widgets/TransactionStatsWidget.php`

---

**Lưu ý:** Hệ thống đã sẵn sàng sử dụng. Bạn có thể truy cập Filament Admin và bắt đầu quản lý giao dịch ngay!
