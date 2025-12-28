<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Exception;

class TransactionService
{
    /**
     * Tạo giao dịch nạp tiền
     */
    public function createDeposit(User $user, array $data): Transaction
    {
        DB::beginTransaction();
        try {
            $wallet = $this->getOrCreateWallet($user, $data['currency'] ?? 'VND');

            $finalAmount = $data['amount'] - ($data['fee'] ?? 0);

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'type' => Transaction::TYPE_DEPOSIT,
                'amount' => $data['amount'],
                'fee' => $data['fee'] ?? 0,
                'final_amount' => $finalAmount,
                'status' => Transaction::STATUS_PENDING,
                'user_bank_account_id' => $data['user_bank_account_id'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
                'payment_details' => $data['payment_details'] ?? null,
                'user_note' => $data['user_note'] ?? null,
                'proof_images' => $data['proof_images'] ?? null,
                'bank_transaction_id' => $data['bank_transaction_id'] ?? null,
            ]);

            DB::commit();
            return $transaction;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Tạo giao dịch rút tiền
     */
    public function createWithdrawal(User $user, array $data): Transaction
    {
        DB::beginTransaction();
        try {
            $wallet = $this->getOrCreateWallet($user, $data['currency'] ?? 'VND');

            $finalAmount = $data['amount'] - ($data['fee'] ?? 0);

            if ($wallet->available_balance < $data['amount']) {
                throw new Exception('Số dư không đủ');
            }

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'type' => Transaction::TYPE_WITHDRAWAL,
                'amount' => $data['amount'],
                'fee' => $data['fee'] ?? 0,
                'final_amount' => $finalAmount,
                'status' => Transaction::STATUS_PENDING,
                'user_bank_account_id' => $data['user_bank_account_id'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
                'payment_details' => $data['payment_details'] ?? null,
                'user_note' => $data['user_note'] ?? null,
            ]);

            $wallet->lock($data['amount']);

            DB::commit();
            return $transaction;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Duyệt giao dịch nạp tiền
     */
    public function approveDeposit(Transaction $transaction, User $approver, ?string $note = null): bool
    {
        if ($transaction->type !== Transaction::TYPE_DEPOSIT) {
            throw new Exception('Không phải giao dịch nạp tiền');
        }

        if ($transaction->status !== Transaction::STATUS_PENDING) {
            throw new Exception('Giao dịch không ở trạng thái chờ duyệt');
        }

        DB::beginTransaction();
        try {
            $transaction->wallet->deposit($transaction->final_amount);

            $transaction->update([
                'status' => Transaction::STATUS_COMPLETED,
                'approved_by' => $approver->id,
                'approved_at' => now(),
                'completed_at' => now(),
                'admin_note' => $note,
            ]);

            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Duyệt giao dịch rút tiền
     */
    public function approveWithdrawal(Transaction $transaction, User $approver, ?string $note = null): bool
    {
        if ($transaction->type !== Transaction::TYPE_WITHDRAWAL) {
            throw new Exception('Không phải giao dịch rút tiền');
        }

        if ($transaction->status !== Transaction::STATUS_PENDING) {
            throw new Exception('Giao dịch không ở trạng thái chờ duyệt');
        }

        DB::beginTransaction();
        try {
            $transaction->wallet->unlock($transaction->amount);
            $transaction->wallet->withdraw($transaction->amount);

            $transaction->update([
                'status' => Transaction::STATUS_COMPLETED,
                'approved_by' => $approver->id,
                'approved_at' => now(),
                'completed_at' => now(),
                'admin_note' => $note,
            ]);

            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Từ chối giao dịch
     */
    public function rejectTransaction(Transaction $transaction, User $approver, string $reason): bool
    {
        if ($transaction->status !== Transaction::STATUS_PENDING) {
            throw new Exception('Giao dịch không ở trạng thái chờ duyệt');
        }

        DB::beginTransaction();
        try {
            if ($transaction->type === Transaction::TYPE_WITHDRAWAL) {
                $transaction->wallet->unlock($transaction->amount);
            }

            $transaction->update([
                'status' => Transaction::STATUS_FAILED,
                'approved_by' => $approver->id,
                'reject_reason' => $reason,
                'approved_at' => now(),
            ]);

            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Hủy giao dịch
     */
    public function cancelTransaction(Transaction $transaction): bool
    {
        if ($transaction->status !== Transaction::STATUS_PENDING) {
            throw new Exception('Chỉ có thể hủy giao dịch đang chờ xử lý');
        }

        DB::beginTransaction();
        try {
            if ($transaction->type === Transaction::TYPE_WITHDRAWAL) {
                $transaction->wallet->unlock($transaction->amount);
            }

            $transaction->update([
                'status' => Transaction::STATUS_CANCELLED,
                'cancelled_at' => now(),
            ]);

            DB::commit();
            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Lấy hoặc tạo ví cho user
     */
    private function getOrCreateWallet(User $user, string $currency = 'VND'): Wallet
    {
        $wallet = Wallet::where('user_id', $user->id)
            ->where('currency', $currency)
            ->first();

        if (!$wallet) {
            $wallet = Wallet::create([
                'user_id' => $user->id,
                'currency' => $currency,
                'balance' => 0,
                'locked_balance' => 0,
                'is_active' => true,
            ]);
        }

        return $wallet;
    }

    /**
     * Lấy lịch sử giao dịch của user
     */
    public function getUserTransactions(User $user, array $filters = [])
    {
        $query = Transaction::where('user_id', $user->id)
            ->with(['wallet', 'userBankAccount.bank']);

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Thống kê giao dịch
     */
    public function getTransactionStats(array $filters = []): array
    {
        $query = Transaction::query();

        if (isset($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        return [
            'total_deposits' => (clone $query)->deposit()->sum('final_amount'),
            'total_withdrawals' => (clone $query)->withdrawal()->sum('final_amount'),
            'pending_count' => (clone $query)->pending()->count(),
            'completed_count' => (clone $query)->completed()->count(),
            'failed_count' => (clone $query)->where('status', Transaction::STATUS_FAILED)->count(),
        ];
    }
}
