<?php

namespace App\Services;

use App\Models\AiCreditPackage;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Exception;

class AiCreditService
{
    /**
     * Conversion rate: 500 VND = 1 Credit
     */
    public const CREDIT_RATE = 500;

    /**
     * Get user's wallet
     */
    public function getWallet(User $user, string $currency = 'VND'): ?Wallet
    {
        return $user->wallets()->where('currency', $currency)->first();
    }

    /**
     * Get user's wallet balance
     */
    public function getWalletBalance(User $user): float
    {
        $wallet = $this->getWallet($user);
        return $wallet ? (float) $wallet->balance : 0;
    }

    /**
     * Get available active credit packages
     */
    public function getActivePackages(): array
    {
        return AiCreditPackage::active()
            ->ordered()
            ->get()
            ->map(fn($pkg) => $this->formatPackage($pkg))
            ->toArray();
    }

    /**
     * Find package by ID
     */
    public function findPackage(int $packageId): ?AiCreditPackage
    {
        return AiCreditPackage::find($packageId);
    }

    /**
     * Convert VND to credits
     */
    public function toCredits(float $amount): int
    {
        return (int) floor($amount / self::CREDIT_RATE);
    }

    /**
     * Check if user can afford an amount
     */
    public function canAfford(User $user, float $amount): bool
    {
        return $this->getWalletBalance($user) >= $amount;
    }

    /**
     * Purchase credits using wallet balance
     */
    public function purchaseWithWallet(User $user, AiCreditPackage $package): bool
    {
        $wallet = $this->getWallet($user);

        if (!$wallet || $wallet->balance < $package->price) {
            throw new Exception('Số dư ví không đủ. Vui lòng nạp thêm tiền.');
        }

        DB::beginTransaction();
        try {
            // Deduct from wallet
            $wallet->balance -= $package->price;
            $wallet->save();

            // Create transaction record
            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'type' => Transaction::TYPE_WITHDRAWAL,
                'amount' => $package->price,
                'final_amount' => $package->price,
                'status' => Transaction::STATUS_COMPLETED,
                'payment_method' => 'wallet',
                'user_note' => "Purchased {$package->name} ({$package->credits} AI credits)",
                'completed_at' => now(),
            ]);

            // Add credits to user
            $user->addAiCredits($package->credits);

            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Purchase credits with custom amount
     */
    public function purchaseCustomCredits(User $user, float $amount, int $credits): bool
    {
        // Verify conversion rate
        $expectedCredits = $this->toCredits($amount);
        if ($credits !== $expectedCredits) {
            throw new Exception('Tỷ lệ chuyển đổi không hợp lệ.');
        }

        $wallet = $this->getWallet($user);

        if (!$wallet || $wallet->balance < $amount) {
            throw new Exception('Số dư ví không đủ. Vui lòng nạp thêm tiền.');
        }

        DB::beginTransaction();
        try {
            // Deduct from wallet
            $wallet->balance -= $amount;
            $wallet->save();

            // Create transaction record
            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'type' => Transaction::TYPE_WITHDRAWAL,
                'amount' => $amount,
                'final_amount' => $amount,
                'status' => Transaction::STATUS_COMPLETED,
                'payment_method' => 'wallet',
                'user_note' => "Mua {$credits} AI Credits (tùy chỉnh)",
                'completed_at' => now(),
            ]);

            // Add AI credits
            $user->addAiCredits($credits);

            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get credit purchase history for user
     */
    public function getPurchaseHistory(User $user, int $perPage = 20)
    {
        return Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_WITHDRAWAL)
            ->where('payment_method', 'wallet')
            ->where(function ($query) {
                $query->whereNotNull('ai_generation_id')
                    ->orWhere('user_note', 'like', '%AI credits%')
                    ->orWhere('user_note', 'like', '%AI Credits%');
            })
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Format package for frontend display
     */
    public function formatPackage(AiCreditPackage $package): array
    {
        return [
            'id' => $package->id,
            'name' => $package->name,
            'description' => $package->description,
            'credits' => $package->credits,
            'price' => (float) $package->price,
            'original_price' => $package->original_price ? (float) $package->original_price : null,
            'currency' => $package->currency,
            'is_featured' => $package->is_featured,
            'badge' => $package->badge,
            'badge_color' => $package->badge_color,
            'discount_percent' => $package->discount_percent,
            'formatted_price' => $package->formatted_price,
            'formatted_original_price' => $package->formatted_original_price,
            'price_per_credit' => round($package->price_per_credit, 2),
        ];
    }
}
