<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserServicePackage;
use App\Services\NotificationService;
use App\Services\TopupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TopupController extends Controller
{
    public function __construct(
        protected TopupService $topupService
    ) {
    }

    public function index()
    {
        $user = Auth::user();

        return Inertia::render('Topup/Index', [
            'creditPackages' => $this->topupService->getTopupPackages(),
            'aiCreditPackages' => $this->topupService->getAiCreditPackages(),
            'recentTopups' => $this->topupService->getRecentTopups($user),
            'walletBalance' => $this->topupService->getWalletBalance($user),
            'currentBalance' => $this->topupService->getWalletBalance($user),
            'aiCredits' => (int) $user->ai_credits,
            'paymentMethods' => $this->topupService->getPaymentMethods(),
        ]);
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'package_id' => 'required|string',
        ]);

        $package = $this->topupService->findPackage($request->package_id);

        if (!$package) {
            return redirect()->route('topup.index')->with('error', 'Gói nạp tiền không hợp lệ.');
        }

        return Inertia::render('Topup/Checkout', [
            'package' => $package,
            'paymentMethods' => $this->topupService->getPaymentMethods(),
            'bankInfo' => $this->topupService->getBankInfo(),
        ]);
    }

    public function process(Request $request)
    {
        $request->validate([
            'package_id' => 'required|string',
            'payment_method' => 'required|string|in:bank_transfer,momo,vnpay,zalopay',
        ]);

        $user = Auth::user();
        $package = $this->topupService->findPackage($request->package_id);

        if (!$package) {
            return back()->with('error', 'Gói nạp tiền không hợp lệ.');
        }

        $topup = $this->topupService->createTopupOrder($user, $package, $request->payment_method);

        $this->notifyAdminsNewTopup($user, $topup, $package);

        return redirect()->route('topup.payment', $topup->id);
    }

    public function payment(UserServicePackage $topup)
    {
        $this->authorize('view', $topup);

        $package = $this->topupService->findPackage($topup->metadata['package_id'] ?? '');

        return Inertia::render('Topup/Payment', [
            'topup' => [
                'id' => $topup->id,
                'order_code' => $topup->order_code,
                'credits' => $topup->credits_remaining,
                'price' => (float) $topup->price_paid,
                'currency' => $topup->currency,
                'payment_method' => $topup->payment_method,
                'payment_status' => $topup->payment_status,
                'package_name' => $topup->metadata['package_name'] ?? 'Gói Credits',
                'bonus_credits' => $topup->metadata['bonus_credits'] ?? 0,
                'created_at' => $topup->created_at->toISOString(),
            ],
            'package' => $package,
            'paymentMethods' => $this->topupService->getPaymentMethods(),
            'bankInfo' => $this->topupService->getBankInfo(),
        ]);
    }

    public function history()
    {
        $user = Auth::user();

        return Inertia::render('Topup/History', [
            'topups' => $this->topupService->getTopupHistory($user),
            'stats' => $this->topupService->getTopupStats($user),
        ]);
    }

    public function purchaseXu(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:10000',
        ]);

        $user = Auth::user();
        $amount = $validated['amount'];
        $xu = $this->topupService->toXu($amount);

        if (!$this->topupService->canPurchase($user, $amount)) {
            return back()->withErrors([
                'message' => 'Số dư ví không đủ. Vui lòng nạp thêm tiền.',
            ]);
        }

        return redirect()->route('topup.index')
            ->with('success', "Số dư ví của bạn tương đương {$xu} Xu.");
    }

    protected function notifyAdminsNewTopup($user, UserServicePackage $topup, array $package): void
    {
        $amountFormatted = number_format($package['price'], 0, ',', '.');

        app(NotificationService::class)->sendToAdmins(
            '💳 Yêu cầu nạp tiền mới',
            "{$user->name} vừa đặt {$package['name']} ({$amountFormatted} ₫). Vui lòng kiểm tra và duyệt.",
            'info',
            [
                'topup_id' => $topup->id,
                'order_code' => $topup->order_code,
                'user_id' => $user->id,
                'user_name' => $user->name,
                'amount' => $package['price'],
            ],
            '/admin/transactions?activeTableTab=pending-tab',
            'Xem giao dịch'
        );
    }
}
