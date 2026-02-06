<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\User;
use App\Models\UserBankAccount;

class BankAccountService
{
    /**
     * Get user's bank accounts with formatted data
     */
    public function getBankAccountsForUser(User $user): array
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
                'bank_full_name' => $account->bank?->full_name,
                'bank_logo' => $account->bank?->logo,
                'account_number' => $account->account_number,
                'account_name' => $account->account_name,
                'branch' => $account->branch,
                'is_default' => $account->is_default,
                'is_verified' => $account->is_verified,
                'created_at' => $account->created_at->format('d/m/Y'),
            ])
            ->toArray();
    }

    /**
     * Get list of active banks
     */
    public function getActiveBanks(): array
    {
        return Bank::active()
            ->ordered()
            ->get()
            ->map(fn($bank) => [
                'id' => $bank->id,
                'code' => $bank->code,
                'short_name' => $bank->short_name,
                'full_name' => $bank->full_name,
                'logo' => $bank->logo,
            ])
            ->toArray();
    }

    /**
     * Check if bank account already exists for user
     */
    public function accountExists(User $user, int $bankId, string $accountNumber): bool
    {
        return UserBankAccount::where('user_id', $user->id)
            ->where('bank_id', $bankId)
            ->where('account_number', $accountNumber)
            ->exists();
    }

    /**
     * Check if this is user's first bank account
     */
    public function isFirstAccount(User $user): bool
    {
        return !UserBankAccount::where('user_id', $user->id)->exists();
    }

    /**
     * Create a new bank account for user
     */
    public function createBankAccount(User $user, array $data): UserBankAccount
    {
        $isFirst = $this->isFirstAccount($user);

        return UserBankAccount::create([
            'user_id' => $user->id,
            'bank_id' => $data['bank_id'],
            'account_number' => $data['account_number'],
            'account_name' => strtoupper($data['account_name']),
            'branch' => $data['branch'] ?? null,
            'is_default' => $isFirst || ($data['is_default'] ?? false),
        ]);
    }

    /**
     * Update bank account
     */
    public function updateBankAccount(UserBankAccount $account, array $data): UserBankAccount
    {
        $account->update([
            'account_name' => strtoupper($data['account_name']),
            'branch' => $data['branch'] ?? null,
        ]);

        return $account->fresh();
    }

    /**
     * Check if bank account can be deleted (no pending transactions)
     */
    public function canDeleteBankAccount(UserBankAccount $account): bool
    {
        return !$account->transactions()
            ->whereIn('status', ['pending', 'processing'])
            ->exists();
    }

    /**
     * Delete bank account and reassign default if needed
     */
    public function deleteBankAccount(UserBankAccount $account): void
    {
        $userId = $account->user_id;
        $wasDefault = $account->is_default;

        $account->delete();

        // If deleted account was default, set another as default
        if ($wasDefault) {
            $newDefault = UserBankAccount::where('user_id', $userId)->first();
            if ($newDefault) {
                $newDefault->update(['is_default' => true]);
            }
        }
    }

    /**
     * Set bank account as default
     */
    public function setDefaultBankAccount(UserBankAccount $account): void
    {
        // Model boot will automatically unset other defaults
        $account->update(['is_default' => true]);
    }

    /**
     * Verify user owns bank account
     */
    public function verifyOwnership(UserBankAccount $account, User $user): bool
    {
        return $account->user_id === $user->id;
    }
}
