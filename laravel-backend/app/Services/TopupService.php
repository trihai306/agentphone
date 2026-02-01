<?php

namespace App\Services;

use App\Models\AiCreditPackage;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserServicePackage;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class TopupService
{
    /**
     * Conversion rates
     */
    public const XU_RATE = 100;     // 100 VND = 1 Xu
    public const CREDIT_RATE = 500; // 500 VND = 1 Credit

    /**
     * Get user's wallet or create one
     */
    public function getOrCreateWallet(User $user, string $currency = 'VND'): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $user->id, 'is_active' => true],
            ['balance' => 0, 'locked_balance' => 0, 'currency' => $currency]
        );
    }

    /**
     * Get user's wallet balance
     */
    public function getWalletBalance(User $user): float
    {
        $wallet = Wallet::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        return $wallet ? (float) $wallet->balance : 0;
    }

    /**
     * Convert VND to Xu
     */
    public function toXu(float $vnd): int
    {
        return (int) floor($vnd / self::XU_RATE);
    }

    /**
     * Convert VND to Credits
     */
    public function toCredits(float $vnd): int
    {
        return (int) floor($vnd / self::CREDIT_RATE);
    }

    /**
     * Get topup packages list
     */
    public function getTopupPackages(): array
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
     * Get available AI credit packages
     */
    public function getAiCreditPackages(): array
    {
        return AiCreditPackage::active()
            ->ordered()
            ->get()
            ->map(fn($pkg) => [
                'id' => $pkg->id,
                'name' => $pkg->name,
                'credits' => $pkg->credits,
                'price' => (float) $pkg->price,
                'original_price' => $pkg->original_price ? (float) $pkg->original_price : null,
                'is_featured' => $pkg->is_featured,
                'badge' => $pkg->badge,
                'formatted_price' => $pkg->formatted_price,
                'formatted_original_price' => $pkg->formatted_original_price,
            ])
            ->toArray();
    }

    /**
     * Get payment methods
     */
    public function getPaymentMethods(): array
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
     * Get bank info for transfers
     */
    public function getBankInfo(): array
    {
        return [
            'bank_name' => 'Vietcombank',
            'account_number' => '1234567890',
            'account_name' => 'CONG TY TNHH DEVICEHUB',
            'branch' => 'Chi nhánh Hà Nội',
        ];
    }

    /**
     * Find package by ID
     */
    public function findPackage(string $packageId): ?array
    {
        return collect($this->getTopupPackages())->firstWhere('id', $packageId);
    }

    /**
     * Create topup order (deposit pending)
     */
    public function createTopupOrder(User $user, array $package, string $paymentMethod): UserServicePackage
    {
        $orderCode = 'TOP' . strtoupper(Str::random(8));

        return DB::transaction(function () use ($user, $orderCode, $package, $paymentMethod) {
            $wallet = $this->getOrCreateWallet($user);

            // Create transaction
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'type' => Transaction::TYPE_DEPOSIT,
                'amount' => $package['price'],
                'fee' => 0,
                'final_amount' => $package['price'] + ($package['bonus'] ?? 0),
                'status' => Transaction::STATUS_PENDING,
                'payment_method' => $paymentMethod,
                'payment_details' => [
                    'package_id' => $package['id'],
                    'package_name' => $package['name'],
                    'base_amount' => $package['price'],
                    'bonus_amount' => $package['bonus'] ?? 0,
                ],
                'user_note' => 'Nạp ' . $package['name'] . ' - ' . number_format($package['price'], 0, ',', '.') . ' VND',
            ]);

            // Create user service package
            return UserServicePackage::create([
                'user_id' => $user->id,
                'service_package_id' => null,
                'order_code' => $orderCode,
                'transaction_id' => $transaction->id,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $paymentMethod,
                'price_paid' => $package['price'],
                'currency' => 'VND',
                'credits_remaining' => 0,
                'metadata' => [
                    'type' => 'topup',
                    'package_id' => $package['id'],
                    'package_name' => $package['name'],
                    'base_amount' => $package['price'],
                    'bonus_amount' => $package['bonus'] ?? 0,
                    'total_amount' => $package['price'] + ($package['bonus'] ?? 0),
                    'transaction_id' => $transaction->id,
                ],
            ]);
        });
    }

    /**
     * Get recent topups for user
     */
    public function getRecentTopups(User $user, int $limit = 5): array
    {
        return Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_DEPOSIT)
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->map(fn($t) => $this->formatTransaction($t))
            ->toArray();
    }

    /**
     * Get paginated topup history
     */
    public function getTopupHistory(User $user, int $perPage = 10)
    {
        return Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_DEPOSIT)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn($t) => $this->formatTransaction($t));
    }

    /**
     * Get topup statistics for user
     */
    public function getTopupStats(User $user): array
    {
        $walletBalance = $this->getWalletBalance($user);

        return [
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
            'current_balance' => $walletBalance,
        ];
    }

    /**
     * Check if user can purchase (has enough balance)
     */
    public function canPurchase(User $user, float $amount): bool
    {
        return $this->getWalletBalance($user) >= $amount;
    }

    /**
     * Format transaction for display
     */
    public function formatTransaction(Transaction $transaction): array
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
     * Format UserServicePackage for display
     */
    public function formatTopup(UserServicePackage $topup): array
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
