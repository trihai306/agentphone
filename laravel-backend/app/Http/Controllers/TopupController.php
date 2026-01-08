<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\UserServicePackage;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TopupController extends Controller
{
    /**
     * Trang chọn gói nạp tiền
     */
    public function index()
    {
        $user = Auth::user();

        // Các gói nạp tiền VND
        $creditPackages = $this->getTopupPackages();

        // Lấy wallet balance
        $wallet = Wallet::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();
        $walletBalance = $wallet ? (float) $wallet->balance : 0;

        // Lịch sử nạp tiền gần đây
        $recentTopups = Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_DEPOSIT)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($t) => $this->formatTransactionHistory($t));

        return Inertia::render('Topup/Index', [
            'creditPackages' => $creditPackages,
            'recentTopups' => $recentTopups,
            'walletBalance' => $walletBalance,
            'currentBalance' => $walletBalance,
            'paymentMethods' => $this->getPaymentMethods(),
        ]);
    }

    /**
     * Trang thanh toán
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'package_id' => 'required|string',
        ]);

        $user = Auth::user();
        $packages = collect($this->getCreditPackages());
        $selectedPackage = $packages->firstWhere('id', $request->package_id);

        if (!$selectedPackage) {
            return redirect()->route('topup.index')->with('error', 'Gói nạp tiền không hợp lệ.');
        }

        return Inertia::render('Topup/Checkout', [
            'package' => $selectedPackage,
            'paymentMethods' => $this->getPaymentMethods(),
            'bankInfo' => $this->getBankInfo(),
        ]);
    }

    /**
     * Xử lý nạp tiền
     */
    public function process(Request $request)
    {
        $request->validate([
            'package_id' => 'required|string',
            'payment_method' => 'required|string|in:bank_transfer,momo,vnpay,zalopay',
        ]);

        $user = Auth::user();
        $packages = collect($this->getCreditPackages());
        $selectedPackage = $packages->firstWhere('id', $request->package_id);

        if (!$selectedPackage) {
            return back()->with('error', 'Gói nạp tiền không hợp lệ.');
        }

        // Tạo order nạp tiền
        $orderCode = 'TOP' . strtoupper(Str::random(8));

        $topup = DB::transaction(function () use ($user, $orderCode, $selectedPackage, $request) {
            // Lấy hoặc tạo wallet cho user
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id, 'is_active' => true],
                ['balance' => 0, 'locked_balance' => 0, 'currency' => 'VND']
            );

            // Tạo transaction để admin có thể theo dõi
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'type' => Transaction::TYPE_DEPOSIT,
                'amount' => $selectedPackage['price'],
                'fee' => 0,
                'final_amount' => $selectedPackage['price'],
                'status' => Transaction::STATUS_PENDING,
                'payment_method' => $request->payment_method,
                'payment_details' => [
                    'package_id' => $selectedPackage['id'],
                    'package_name' => $selectedPackage['name'],
                    'credits' => $selectedPackage['credits'],
                    'bonus_credits' => $selectedPackage['bonus'] ?? 0,
                ],
                'user_note' => 'Nạp ' . $selectedPackage['name'] . ' - ' . number_format($selectedPackage['price'], 0, ',', '.') . ' VND',
            ]);

            // Tạo user service package
            $topup = UserServicePackage::create([
                'user_id' => $user->id,
                'service_package_id' => null,
                'order_code' => $orderCode,
                'transaction_id' => $transaction->id,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $request->payment_method,
                'price_paid' => $selectedPackage['price'],
                'currency' => 'VND',
                'credits_remaining' => $selectedPackage['credits'],
                'metadata' => [
                    'type' => 'credits',
                    'package_id' => $selectedPackage['id'],
                    'package_name' => $selectedPackage['name'],
                    'bonus_credits' => $selectedPackage['bonus'] ?? 0,
                    'transaction_id' => $transaction->id,
                ],
            ]);

            return $topup;
        });

        return redirect()->route('topup.payment', $topup->id);
    }

    /**
     * Trang hiển thị thông tin thanh toán
     */
    public function payment(UserServicePackage $topup)
    {
        $user = Auth::user();

        if ($topup->user_id !== $user->id) {
            abort(403);
        }

        $packages = collect($this->getCreditPackages());
        $packageInfo = $packages->firstWhere('id', $topup->metadata['package_id'] ?? null);

        return Inertia::render('Topup/Payment', [
            'topup' => [
                'id' => $topup->id,
                'order_code' => $topup->order_code,
                'credits' => $topup->credits_remaining,
                'price' => (float) $topup->price_paid,
                'currency' => $topup->currency,
                'payment_method' => $topup->payment_method,
                'payment_status' => $topup->payment_status,
                'package_name' => $topup->metadata['package_name'] ?? 'Gói Credits',
                'bonus_credits' => $topup->metadata['bonus_credits'] ?? 0,
                'created_at' => $topup->created_at->toISOString(),
            ],
            'package' => $packageInfo,
            'paymentMethods' => $this->getPaymentMethods(),
            'bankInfo' => $this->getBankInfo(),
        ]);
    }

    /**
     * Lịch sử nạp tiền
     */
    public function history(Request $request)
    {
        $user = Auth::user();

        // Lấy lịch sử giao dịch nạp tiền từ Transaction
        $topups = Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_DEPOSIT)
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(fn($t) => $this->formatTransactionHistory($t));

        // Lấy wallet balance
        $wallet = Wallet::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        // Thống kê
        $stats = [
            'total_topups' => Transaction::where('user_id', $user->id)
                ->where('type', Transaction::TYPE_DEPOSIT)
                ->where('status', Transaction::STATUS_COMPLETED)
                ->count(),
            'total_amount' => (float) Transaction::where('user_id', $user->id)
                ->where('type', Transaction::TYPE_DEPOSIT)
                ->where('status', Transaction::STATUS_COMPLETED)
                ->sum('final_amount'),
            'pending_amount' => (float) Transaction::where('user_id', $user->id)
                ->where('type', Transaction::TYPE_DEPOSIT)
                ->where('status', Transaction::STATUS_PENDING)
                ->sum('amount'),
            'current_balance' => $wallet ? (float) $wallet->balance : 0,
        ];

        return Inertia::render('Topup/History', [
            'topups' => $topups,
            'stats' => $stats,
        ]);
    }

    /**
     * Các gói nạp tiền VND
     */
    private function getTopupPackages(): array
    {
        return [
            [
                'id' => 'vnd_50k',
                'name' => 'Gói 50K',
                'price' => 50000,
                'currency' => 'VND',
                'popular' => false,
                'icon' => 'zap',
                'color' => 'blue',
            ],
            [
                'id' => 'vnd_100k',
                'name' => 'Gói 100K',
                'price' => 100000,
                'currency' => 'VND',
                'popular' => false,
                'icon' => 'star',
                'color' => 'green',
            ],
            [
                'id' => 'vnd_200k',
                'name' => 'Gói 200K',
                'price' => 200000,
                'currency' => 'VND',
                'popular' => true,
                'bonus' => 10000,
                'bonus_percent' => 5,
                'icon' => 'fire',
                'color' => 'purple',
            ],
            [
                'id' => 'vnd_500k',
                'name' => 'Gói 500K',
                'price' => 500000,
                'currency' => 'VND',
                'popular' => false,
                'bonus' => 50000,
                'bonus_percent' => 10,
                'icon' => 'briefcase',
                'color' => 'amber',
            ],
            [
                'id' => 'vnd_1m',
                'name' => 'Gói 1 Triệu',
                'price' => 1000000,
                'currency' => 'VND',
                'popular' => false,
                'bonus' => 150000,
                'bonus_percent' => 15,
                'icon' => 'crown',
                'color' => 'rose',
            ],
            [
                'id' => 'vnd_2m',
                'name' => 'Gói 2 Triệu',
                'price' => 2000000,
                'currency' => 'VND',
                'popular' => false,
                'bonus' => 400000,
                'bonus_percent' => 20,
                'icon' => 'diamond',
                'color' => 'indigo',
            ],
        ];
    }

    /**
     * Các gói nạp credits (giữ lại để tương thích)
     */
    private function getCreditPackages(): array
    {
        return [
            [
                'id' => 'credits_100',
                'name' => 'Gói Starter',
                'credits' => 100,
                'bonus' => 0,
                'price' => 20000,
                'currency' => 'VND',
                'price_per_credit' => 200,
                'popular' => false,
                'icon' => 'zap',
                'color' => 'blue',
            ],
            [
                'id' => 'credits_500',
                'name' => 'Gói Basic',
                'credits' => 500,
                'bonus' => 50,
                'price' => 90000,
                'currency' => 'VND',
                'price_per_credit' => 164,
                'popular' => false,
                'save_percent' => 18,
                'icon' => 'star',
                'color' => 'green',
            ],
            [
                'id' => 'credits_1000',
                'name' => 'Gói Pro',
                'credits' => 1000,
                'bonus' => 150,
                'price' => 160000,
                'currency' => 'VND',
                'price_per_credit' => 139,
                'popular' => true,
                'save_percent' => 30,
                'icon' => 'fire',
                'color' => 'purple',
            ],
            [
                'id' => 'credits_2500',
                'name' => 'Gói Business',
                'credits' => 2500,
                'bonus' => 500,
                'price' => 350000,
                'currency' => 'VND',
                'price_per_credit' => 117,
                'popular' => false,
                'save_percent' => 42,
                'icon' => 'briefcase',
                'color' => 'amber',
            ],
            [
                'id' => 'credits_5000',
                'name' => 'Gói Enterprise',
                'credits' => 5000,
                'bonus' => 1500,
                'price' => 600000,
                'currency' => 'VND',
                'price_per_credit' => 92,
                'popular' => false,
                'save_percent' => 54,
                'icon' => 'crown',
                'color' => 'rose',
            ],
            [
                'id' => 'credits_10000',
                'name' => 'Gói Ultimate',
                'credits' => 10000,
                'bonus' => 4000,
                'price' => 1000000,
                'currency' => 'VND',
                'price_per_credit' => 71,
                'popular' => false,
                'save_percent' => 64,
                'icon' => 'diamond',
                'color' => 'indigo',
            ],
        ];
    }

    /**
     * Các phương thức thanh toán
     */
    private function getPaymentMethods(): array
    {
        return [
            [
                'id' => 'bank_transfer',
                'name' => 'Chuyển khoản ngân hàng',
                'icon' => 'bank',
                'description' => 'Chuyển khoản trực tiếp đến tài khoản ngân hàng',
                'processing_time' => '5-15 phút',
            ],
            [
                'id' => 'momo',
                'name' => 'Ví MoMo',
                'icon' => 'momo',
                'description' => 'Thanh toán qua ví điện tử MoMo',
                'processing_time' => 'Tức thì',
            ],
            [
                'id' => 'vnpay',
                'name' => 'VNPay',
                'icon' => 'vnpay',
                'description' => 'Thanh toán qua cổng VNPay',
                'processing_time' => 'Tức thì',
            ],
            [
                'id' => 'zalopay',
                'name' => 'ZaloPay',
                'icon' => 'zalopay',
                'description' => 'Thanh toán qua ví ZaloPay',
                'processing_time' => 'Tức thì',
            ],
        ];
    }

    /**
     * Thông tin ngân hàng
     */
    private function getBankInfo(): array
    {
        return [
            'bank_name' => 'Vietcombank',
            'account_number' => '1234567890',
            'account_name' => 'CONG TY TNHH DEVICEHUB',
            'branch' => 'Chi nhánh Hà Nội',
        ];
    }

    /**
     * Format lịch sử nạp tiền từ Transaction
     */
    private function formatTransactionHistory(Transaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'order_code' => $transaction->transaction_code,
            'amount' => (float) $transaction->amount,
            'final_amount' => (float) $transaction->final_amount,
            'price' => (float) $transaction->amount,
            'currency' => 'VND',
            'payment_method' => $transaction->payment_method,
            'payment_status' => $transaction->status,
            'status' => $transaction->status,
            'package_name' => $transaction->payment_details['package_name'] ?? 'Nạp tiền',
            'created_at' => $transaction->created_at->toISOString(),
            'completed_at' => $transaction->completed_at?->toISOString(),
        ];
    }

    /**
     * Format lịch sử nạp tiền
     */
    private function formatTopupHistory(UserServicePackage $topup): array
    {
        return [
            'id' => $topup->id,
            'order_code' => $topup->order_code,
            'credits' => $topup->credits_remaining,
            'bonus' => $topup->metadata['bonus_credits'] ?? 0,
            'price' => (float) $topup->price_paid,
            'currency' => $topup->currency,
            'payment_method' => $topup->payment_method,
            'payment_status' => $topup->payment_status,
            'status' => $topup->status,
            'package_name' => $topup->metadata['package_name'] ?? 'Gói Credits',
            'created_at' => $topup->created_at->toISOString(),
            'completed_at' => $topup->activated_at?->toISOString(),
        ];
    }
}
