<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\TransactionService;
use App\Services\NotificationService;
use App\Services\WalletService;
use App\Services\WithdrawalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function __construct(
        protected TransactionService $transactionService,
        protected NotificationService $notificationService,
        protected WalletService $walletService,
        protected WithdrawalService $withdrawalService
    ) {
    }

    public function index()
    {
        $user = Auth::user();
        $wallet = $this->walletService->getActiveWallet($user);
        $config = $this->withdrawalService->getWithdrawalConfig();

        return Inertia::render('Withdrawal/Index', [
            'bankAccounts' => $this->withdrawalService->getBankAccounts($user),
            'pendingWithdrawals' => $this->withdrawalService->getPendingWithdrawals($user),
            'recentWithdrawals' => $this->withdrawalService->getRecentWithdrawals($user),
            'walletBalance' => $wallet?->balance ?? 0,
            'availableBalance' => $wallet?->available_balance ?? 0,
            'lockedBalance' => $wallet?->locked_balance ?? 0,
            'minWithdrawal' => $config['minWithdrawal'],
            'withdrawalFee' => $config['withdrawalFee'],
        ]);
    }

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

        $bankAccount = $this->withdrawalService->verifyBankAccountOwnership(
            $request->bank_account_id,
            $user
        );

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
