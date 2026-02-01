<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WalletService
{
    /**
     * Get wallet statistics for user
     */
    public function getWalletStats(User $user): array
    {
        $wallet = $this->getActiveWallet($user);

        return [
            'balance' => $wallet?->balance ?? 0,
            'available_balance' => $wallet?->available_balance ?? 0,
            'locked_balance' => $wallet?->locked_balance ?? 0,
            'total_deposits' => Transaction::where('user_id', $user->id)
                ->where('type', Transaction::TYPE_DEPOSIT)
                ->where('status', Transaction::STATUS_COMPLETED)
                ->sum('final_amount'),
            'total_withdrawals' => Transaction::where('user_id', $user->id)
                ->where('type', Transaction::TYPE_WITHDRAWAL)
                ->where('status', Transaction::STATUS_COMPLETED)
                ->sum('final_amount'),
            'pending_count' => Transaction::where('user_id', $user->id)
                ->whereIn('status', [Transaction::STATUS_PENDING, Transaction::STATUS_PROCESSING])
                ->count(),
        ];
    }

    /**
     * Get active wallet for user
     */
    public function getActiveWallet(User $user): ?Wallet
    {
        return $user->wallets()->where('is_active', true)->first();
    }

    /**
     * Get filtered transactions for user
     */
    public function getTransactions(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Transaction::where('user_id', $user->id)
            ->with(['userBankAccount.bank', 'aiGeneration']);

        // Filter by type
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by date range
        if (!empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }
        if (!empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn($tx) => $this->formatTransaction($tx));
    }

    /**
     * Format transaction for frontend
     */
    public function formatTransaction(Transaction $tx): array
    {
        return [
            'id' => $tx->id,
            'transaction_code' => $tx->transaction_code,
            'type' => $tx->type,
            'type_color' => $tx->type_color,
            'amount' => $tx->amount,
            'fee' => $tx->fee,
            'final_amount' => $tx->final_amount,
            'status' => $tx->status,
            'status_color' => $tx->status_color,
            'payment_method' => $tx->payment_method,
            'bank_name' => $tx->userBankAccount?->bank?->short_name,
            'account_number' => $tx->userBankAccount?->account_number,
            'ai_generation_type' => $tx->aiGeneration?->type,
            'user_note' => $tx->user_note,
            'admin_note' => $tx->admin_note,
            'reject_reason' => $tx->reject_reason,
            'created_at' => $tx->created_at->format('d/m/Y H:i'),
            'completed_at' => $tx->completed_at?->format('d/m/Y H:i'),
        ];
    }

    /**
     * Get transaction type options
     */
    public function getTypeOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Tất cả'],
            ['value' => Transaction::TYPE_DEPOSIT, 'label' => 'Nạp tiền'],
            ['value' => Transaction::TYPE_WITHDRAWAL, 'label' => 'Rút tiền'],
            ['value' => Transaction::TYPE_AI_GENERATION, 'label' => 'Mua AI'],
        ];
    }

    /**
     * Get transaction status options
     */
    public function getStatusOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Tất cả'],
            ['value' => Transaction::STATUS_PENDING, 'label' => 'Chờ duyệt'],
            ['value' => Transaction::STATUS_PROCESSING, 'label' => 'Đang xử lý'],
            ['value' => Transaction::STATUS_COMPLETED, 'label' => 'Hoàn thành'],
            ['value' => Transaction::STATUS_FAILED, 'label' => 'Thất bại'],
            ['value' => Transaction::STATUS_CANCELLED, 'label' => 'Đã hủy'],
        ];
    }
}
