<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function __construct(
        protected WalletService $walletService
    ) {
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        $filters = [
            'type' => $request->type,
            'status' => $request->status,
            'from_date' => $request->from_date,
            'to_date' => $request->to_date,
        ];

        return Inertia::render('Wallet/Index', [
            'stats' => $this->walletService->getWalletStats($user),
            'transactions' => $this->walletService->getTransactions($user, $filters),
            'filters' => $filters,
            'typeOptions' => $this->walletService->getTypeOptions(),
            'statusOptions' => $this->walletService->getStatusOptions(),
        ]);
    }
}
