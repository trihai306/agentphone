<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ServicePackage;
use App\Models\Transaction;
use App\Models\UserServicePackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PackageController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $packages = ServicePackage::active()
            ->ordered()
            ->get()
            ->map(fn($pkg) => $this->formatPackage($pkg));

        $myPackages = UserServicePackage::with('servicePackage')
            ->where('user_id', $user->id)
            ->whereNotNull('service_package_id')
            ->whereIn('status', ['active', 'pending', 'expired'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($userPkg) => $this->formatUserPackage($userPkg));

        $stats = $this->calculateUserStats($user);

        return Inertia::render('Packages/Index', [
            'packages' => $packages,
            'myPackages' => $myPackages,
            'stats' => $stats,
        ]);
    }

    public function show(ServicePackage $package)
    {
        if (!$package->is_active) {
            abort(404);
        }

        return Inertia::render('Packages/Show', [
            'package' => $this->formatPackage($package),
        ]);
    }

    public function subscribe(ServicePackage $package)
    {
        if (!$package->is_active) {
            abort(404);
        }

        $user = Auth::user();

        $existingPackage = UserServicePackage::where('user_id', $user->id)
            ->where('service_package_id', $package->id)
            ->where('status', 'active')
            ->first();

        $wallet = $user->wallets()->where('currency', 'VND')->first();
        $balance = $wallet ? $wallet->balance : 0;

        return Inertia::render('Packages/Subscribe', [
            'package' => $this->formatPackage($package),
            'existingPackage' => $existingPackage ? $this->formatUserPackage($existingPackage) : null,
            'paymentMethods' => $this->getPaymentMethods($balance, $package->price),
            'walletBalance' => $balance,
        ]);
    }

    public function processSubscription(Request $request, ServicePackage $package)
    {
        $request->validate([
            'payment_method' => 'required|string',
        ]);

        $user = Auth::user();
        $paymentMethod = $request->input('payment_method');

        if ($paymentMethod === 'wallet') {
            $wallet = $user->wallets()->where('currency', 'VND')->first();

            if (!$wallet || $wallet->balance < $package->price) {
                return back()->withErrors([
                    'payment_method' => 'Số dư ví không đủ. Vui lòng nạp thêm tiền hoặc chọn phương thức thanh toán khác.'
                ]);
            }

            $wallet->balance -= $package->price;
            $wallet->save();

            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $wallet->id,
                'type' => Transaction::TYPE_WITHDRAWAL,
                'amount' => $package->price,
                'final_amount' => $package->price,
                'status' => Transaction::STATUS_COMPLETED,
                'payment_method' => 'wallet',
                'user_note' => "Thanh toán gói {$package->name}",
                'completed_at' => now(),
            ]);

            UserServicePackage::create([
                'user_id' => $user->id,
                'service_package_id' => $package->id,
                'status' => UserServicePackage::STATUS_ACTIVE,
                'payment_status' => UserServicePackage::PAYMENT_STATUS_PAID,
                'payment_method' => 'wallet',
                'price_paid' => $package->price,
                'currency' => $package->currency ?? 'VND',
                'credits_remaining' => $package->credits,
                'activated_at' => now(),
                'expires_at' => $package->duration_days ? now()->addDays($package->duration_days) : null,
            ]);

            return redirect()->route('packages.index')
                ->with('success', 'Đã kích hoạt gói dịch vụ thành công!');
        }

        $userPackage = UserServicePackage::create([
            'user_id' => $user->id,
            'service_package_id' => $package->id,
            'status' => UserServicePackage::STATUS_PENDING,
            'payment_status' => UserServicePackage::PAYMENT_STATUS_PENDING,
            'payment_method' => $paymentMethod,
            'price_paid' => $package->price,
            'currency' => $package->currency ?? 'VND',
            'credits_remaining' => $package->credits,
        ]);

        return redirect()->route('packages.payment', $userPackage->id);
    }

    public function manage(UserServicePackage $userPackage)
    {
        $this->authorize('view', $userPackage);

        return Inertia::render('Packages/Manage', [
            'userPackage' => $this->formatUserPackage($userPackage),
        ]);
    }

    public function cancel(Request $request, UserServicePackage $userPackage)
    {
        $this->authorize('cancel', $userPackage);

        $userPackage->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->input('reason'),
        ]);

        return redirect()->route('packages.index')
            ->with('success', 'Gói dịch vụ đã được hủy thành công.');
    }

    public function payment(UserServicePackage $userPackage)
    {
        $this->authorize('view', $userPackage);

        $user = Auth::user();
        $wallet = $user->wallets()->where('currency', 'VND')->first();
        $balance = $wallet ? $wallet->balance : 0;

        return Inertia::render('Packages/Payment', [
            'userPackage' => $this->formatUserPackage($userPackage),
            'paymentMethods' => $this->getPaymentMethods($balance, $userPackage->price_paid),
            'bankInfo' => $this->getBankInfo(),
            'walletBalance' => $balance,
        ]);
    }

    private function getBankInfo(): array
    {
        return [
            'bank_name' => 'Vietcombank',
            'account_number' => '1234567890',
            'account_name' => 'CONG TY TNHH DEVICEHUB',
            'branch' => 'Chi nhánh Hà Nội',
        ];
    }

    private function formatPackage(ServicePackage $package): array
    {
        return [
            'id' => $package->id,
            'code' => $package->code,
            'name' => $package->name,
            'description' => $package->description,
            'type' => $package->type,
            'price' => (float) $package->price,
            'original_price' => $package->original_price ? (float) $package->original_price : null,
            'currency' => $package->currency,
            'duration_days' => $package->duration_days,
            'credits' => $package->credits,
            'features' => $package->features ?? [],
            'limits' => $package->limits ?? [],
            'max_devices' => $package->max_devices,
            'is_featured' => $package->is_featured,
            'is_trial' => $package->is_trial,
            'trial_days' => $package->trial_days,
            'badge' => $package->badge,
            'badge_color' => $package->badge_color,
            'icon' => $package->icon,
            'discount_percent' => $package->discount_percent,
            'formatted_price' => $package->formatted_price,
            'active_subscribers' => $package->active_subscribers,
        ];
    }

    private function formatUserPackage(UserServicePackage $userPackage): array
    {
        return [
            'id' => $userPackage->id,
            'order_code' => $userPackage->order_code,
            'status' => $userPackage->status,
            'payment_status' => $userPackage->payment_status,
            'price_paid' => (float) $userPackage->price_paid,
            'currency' => $userPackage->currency,
            'activated_at' => $userPackage->activated_at?->toISOString(),
            'expires_at' => $userPackage->expires_at?->toISOString(),
            'days_remaining' => $userPackage->days_remaining,
            'remaining_credits' => $userPackage->credits_remaining,
            'credits_used' => $userPackage->credits_used,
            'used_devices' => $userPackage->usage_stats['devices_used'] ?? 0,
            'auto_renew' => $userPackage->auto_renew,
            'service_package' => $userPackage->servicePackage ? $this->formatPackage($userPackage->servicePackage) : null,
            'created_at' => $userPackage->created_at?->toISOString(),
        ];
    }

    private function calculateUserStats($user): array
    {
        $baseQuery = fn() => UserServicePackage::where('user_id', $user->id)
            ->whereNotNull('service_package_id');

        $activePackages = (clone $baseQuery)()
            ->where('status', 'active')
            ->count();

        $remainingCredits = (clone $baseQuery)()
            ->where('status', 'active')
            ->sum('credits_remaining');

        $maxDevices = (clone $baseQuery)()
            ->with('servicePackage')
            ->where('status', 'active')
            ->get()
            ->sum(fn($pkg) => $pkg->servicePackage?->max_devices ?? 0);

        $usedDevices = $user->devices?->count() ?? 0;

        $nearestExpiry = (clone $baseQuery)()
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->orderBy('expires_at')
            ->first();

        $daysRemaining = $nearestExpiry?->days_remaining ?? 0;

        return [
            'activePackages' => $activePackages,
            'remainingCredits' => (int) $remainingCredits,
            'maxDevices' => $maxDevices === -1 ? '∞' : $maxDevices,
            'usedDevices' => $usedDevices,
            'daysRemaining' => (int) $daysRemaining,
        ];
    }

    private function getPaymentMethods($walletBalance = 0, $packagePrice = 0): array
    {
        return [
            [
                'id' => 'wallet',
                'name' => 'Số dư ví',
                'icon' => 'wallet',
                'description' => 'Thanh toán bằng số dư trong ví',
                'balance' => $walletBalance,
                'sufficient' => $walletBalance >= $packagePrice,
            ],
            [
                'id' => 'bank_transfer',
                'name' => 'Chuyển khoản ngân hàng',
                'icon' => 'bank',
                'description' => 'Chuyển khoản trực tiếp đến tài khoản ngân hàng',
            ],
            [
                'id' => 'momo',
                'name' => 'Ví MoMo',
                'icon' => 'momo',
                'description' => 'Thanh toán qua ví điện tử MoMo',
            ],
            [
                'id' => 'vnpay',
                'name' => 'VNPay',
                'icon' => 'vnpay',
                'description' => 'Thanh toán qua cổng VNPay',
            ],
            [
                'id' => 'zalopay',
                'name' => 'ZaloPay',
                'icon' => 'zalopay',
                'description' => 'Thanh toán qua ví ZaloPay',
            ],
        ];
    }
}
