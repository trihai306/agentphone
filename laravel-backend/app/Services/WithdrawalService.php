<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use App\Models\UserBankAccount;

class WithdrawalService
{
    /**
     * Get user's bank accounts with formatted data
     */
    public function getBankAccounts(User $user): array
    {
        return UserBankAccount::where('user_id', $user->id)
            ->with('bank')
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($account) => [
                'id' => $account->id,
                'bank_id' => $account->bank_id,
                'bank_name' => $account->bank?->short_name,
                'bank_logo' => $account->bank?->logo,
                'account_number' => $account->account_number,
                'account_name' => $account->account_name,
                'branch' => $account->branch,
                'is_default' => $account->is_default,
                'is_verified' => $account->is_verified,
            ])
            ->toArray();
    }

    /**
     * Get pending withdrawal requests
     */
    public function getPendingWithdrawals(User $user): array
    {
        return Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_WITHDRAWAL)
            ->whereIn('status', [Transaction::STATUS_PENDING, Transaction::STATUS_PROCESSING])
            ->with('userBankAccount.bank')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($tx) => [
                'id' => $tx->id,
                'transaction_code' => $tx->transaction_code,
                'amount' => $tx->amount,
                'fee' => $tx->fee,
                'final_amount' => $tx->final_amount,
                'status' => $tx->status,
                'bank_name' => $tx->userBankAccount?->bank?->short_name,
                'account_number' => $tx->userBankAccount?->account_number,
                'account_name' => $tx->userBankAccount?->account_name,
                'created_at' => $tx->created_at->format('d/m/Y H:i'),
            ])
            ->toArray();
    }

    /**
     * Get recent withdrawal history (last 10 transactions)
     */
    public function getRecentWithdrawals(User $user, int $limit = 10): array
    {
        return Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_WITHDRAWAL)
            ->with('userBankAccount.bank')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($tx) => [
                'id' => $tx->id,
                'transaction_code' => $tx->transaction_code,
                'amount' => $tx->amount,
                'fee' => $tx->fee,
                'final_amount' => $tx->final_amount,
                'status' => $tx->status,
                'status_color' => $tx->status_color,
                'bank_name' => $tx->userBankAccount?->bank?->short_name,
                'account_number' => $tx->userBankAccount?->account_number,
                'reject_reason' => $tx->reject_reason,
                'created_at' => $tx->created_at->format('d/m/Y H:i'),
                'completed_at' => $tx->completed_at?->format('d/m/Y H:i'),
            ])
            ->toArray();
    }

    /**
     * Get withdrawal configuration (min amount, fees, etc)
     */
    public function getWithdrawalConfig(): array
    {
        return [
            'minWithdrawal' => 50000,
            'withdrawalFee' => 0,
        ];
    }

    /**
     * Verify user owns bank account
     */
    public function verifyBankAccountOwnership(int $bankAccountId, User $user): ?UserBankAccount
    {
        return UserBankAccount::where('id', $bankAccountId)
            ->where('user_id', $user->id)
            ->first();
    }
}
