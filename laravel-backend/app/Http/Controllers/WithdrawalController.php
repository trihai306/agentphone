<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\UserBankAccount;
use App\Services\TransactionService;
use App\Services\NotificationService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function __construct(
        protected TransactionService $transactionService,
        protected NotificationService $notificationService,
        protected WalletService $walletService
    ) {
    }

    /**
     * Trang rút tiền
     */
    public function index()
    {
        $user = Auth::user();
        $wallet = $this->walletService->getActiveWallet($user);

        return Inertia::render('Withdrawal/Index', [
            'bankAccounts' => $this->getBankAccounts($user),
            'pendingWithdrawals' => $this->getPendingWithdrawals($user),
            'recentWithdrawals' => $this->getRecentWithdrawals($user),
            'walletBalance' => $wallet?->balance ?? 0,
            'availableBalance' => $wallet?->available_balance ?? 0,
            'lockedBalance' => $wallet?->locked_balance ?? 0,
            'minWithdrawal' => 50000,
            'withdrawalFee' => 0,
        ]);
    }

    /**
     * Get user's bank accounts
     */
    protected function getBankAccounts($user)
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
            ]);
    }

    /**
     * Get pending withdrawal requests
     */
    protected function getPendingWithdrawals($user)
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
            ]);
    }

    /**
     * Get recent withdrawal history
     */
    protected function getRecentWithdrawals($user)
    {
        return Transaction::where('user_id', $user->id)
            ->where('type', Transaction::TYPE_WITHDRAWAL)
            ->with('userBankAccount.bank')
            ->orderBy('created_at', 'desc')
            ->limit(10)
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
            ]);
    }

    /**
     * Tạo yêu cầu rút tiền
     */
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:50000',
            'bank_account_id' => 'required|exists:user_bank_accounts,id',
            'note' => 'nullable|string|max:500',
        ], [
            'amount.required' => 'Vui lòng nhập số tiền rút',
            'amount.min' => 'Số tiền rút tối thiểu là 50,000 ₫',
            'bank_account_id.required' => 'Vui lòng chọn tài khoản ngân hàng',
            'bank_account_id.exists' => 'Tài khoản ngân hàng không tồn tại',
        ]);

        $user = Auth::user();

        $bankAccount = UserBankAccount::where('id', $request->bank_account_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$bankAccount) {
            return back()->withErrors(['bank_account_id' => 'Tài khoản ngân hàng không hợp lệ']);
        }

        try {
            $this->transactionService->createWithdrawal($user, [
                'amount' => $request->amount,
                'fee' => 0,
                'user_bank_account_id' => $request->bank_account_id,
                'user_note' => $request->note,
            ]);

            $this->notificationService->sendToAdmins(
                'Yêu cầu rút tiền mới',
                "Người dùng {$user->name} yêu cầu rút " . number_format($request->amount) . " ₫",
                'withdrawal',
                [],
                '/admin/transactions?activeTableTab=pending-tab'
            );

            return back()->with('success', 'Yêu cầu rút tiền đã được gửi. Vui lòng chờ admin xử lý.');
        } catch (\Exception $e) {
            return back()->withErrors(['amount' => $e->getMessage()]);
        }
    }

    /**
     * Hủy yêu cầu rút tiền
     */
    public function cancel(Transaction $transaction)
    {
        $user = Auth::user();

        if ($transaction->user_id !== $user->id) {
            abort(403);
        }

        if ($transaction->type !== Transaction::TYPE_WITHDRAWAL) {
            return back()->withErrors(['error' => 'Giao dịch không hợp lệ']);
        }

        if ($transaction->status !== Transaction::STATUS_PENDING) {
            return back()->withErrors(['error' => 'Chỉ có thể hủy yêu cầu đang chờ xử lý']);
        }

        try {
            $this->transactionService->cancelTransaction($transaction);
            return back()->with('success', 'Đã hủy yêu cầu rút tiền');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
