<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletController extends Controller
{
    /**
     * Trang quản lý ví và lịch sử giao dịch
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $wallet = $user->wallets()->where('is_active', true)->first();

        // Stats
        $stats = [
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

        // Build query với filters
        $query = Transaction::where('user_id', $user->id)
            ->with(['userBankAccount.bank', 'aiGeneration']);

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Paginate
        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->through(fn($tx) => [
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
            ]);

        return Inertia::render('Wallet/Index', [
            'stats' => $stats,
            'transactions' => $transactions,
            'filters' => [
                'type' => $request->type,
                'status' => $request->status,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
            ],
            'typeOptions' => [
                ['value' => '', 'label' => 'Tất cả'],
                ['value' => Transaction::TYPE_DEPOSIT, 'label' => 'Nạp tiền'],
                ['value' => Transaction::TYPE_WITHDRAWAL, 'label' => 'Rút tiền'],
                ['value' => Transaction::TYPE_AI_GENERATION, 'label' => 'Mua AI'],
            ],
            'statusOptions' => [
                ['value' => '', 'label' => 'Tất cả'],
                ['value' => Transaction::STATUS_PENDING, 'label' => 'Chờ duyệt'],
                ['value' => Transaction::STATUS_PROCESSING, 'label' => 'Đang xử lý'],
                ['value' => Transaction::STATUS_COMPLETED, 'label' => 'Hoàn thành'],
                ['value' => Transaction::STATUS_FAILED, 'label' => 'Thất bại'],
                ['value' => Transaction::STATUS_CANCELLED, 'label' => 'Đã hủy'],
            ],
        ]);
    }
}
