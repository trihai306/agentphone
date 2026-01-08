<?php

namespace App\Http\Controllers;

use App\Models\ServicePackage;
use App\Models\UserServicePackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PackageController extends Controller
{
    /**
     * Hiển thị danh sách gói dịch vụ cho user
     */
    public function index()
    {
        $user = Auth::user();

        // Lấy tất cả gói dịch vụ active
        $packages = ServicePackage::active()
            ->ordered()
            ->get()
            ->map(fn($pkg) => $this->formatPackage($pkg));

        // Lấy gói của user đang sử dụng
        $myPackages = UserServicePackage::with('servicePackage')
            ->where('user_id', $user->id)
            ->whereIn('status', ['active', 'pending', 'expired'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($userPkg) => $this->formatUserPackage($userPkg));

        // Tính stats
        $stats = $this->calculateUserStats($user);

        return Inertia::render('Packages/Index', [
            'packages' => $packages,
            'myPackages' => $myPackages,
            'stats' => $stats,
        ]);
    }

    /**
     * Hiển thị chi tiết một gói
     */
    public function show(ServicePackage $package)
    {
        if (!$package->is_active) {
            abort(404);
        }

        return Inertia::render('Packages/Show', [
            'package' => $this->formatPackage($package),
        ]);
    }

    /**
     * Trang đăng ký gói mới
     */
    public function subscribe(ServicePackage $package)
    {
        if (!$package->is_active) {
            abort(404);
        }

        $user = Auth::user();

        // Kiểm tra xem user đã có gói này chưa
        $existingPackage = UserServicePackage::where('user_id', $user->id)
            ->where('service_package_id', $package->id)
            ->where('status', 'active')
            ->first();

        return Inertia::render('Packages/Subscribe', [
            'package' => $this->formatPackage($package),
            'existingPackage' => $existingPackage ? $this->formatUserPackage($existingPackage) : null,
            'paymentMethods' => $this->getPaymentMethods(),
        ]);
    }

    /**
     * Xử lý đăng ký gói
     */
    public function processSubscription(Request $request, ServicePackage $package)
    {
        $request->validate([
            'payment_method' => 'required|string',
        ]);

        $user = Auth::user();

        // Tạo user service package
        $userPackage = UserServicePackage::create([
            'user_id' => $user->id,
            'service_package_id' => $package->id,
            'status' => UserServicePackage::STATUS_PENDING,
            'payment_status' => UserServicePackage::PAYMENT_STATUS_PENDING,
            'payment_method' => $request->input('payment_method'),
            'price_paid' => $package->price,
            'currency' => $package->currency ?? 'VND',
            'credits_remaining' => $package->credits,
        ]);

        // TODO: Redirect to payment gateway based on payment_method

        return redirect()->route('packages.payment', $userPackage->id);
    }

    /**
     * Trang quản lý gói của user
     */
    public function manage(UserServicePackage $userPackage)
    {
        $user = Auth::user();

        if ($userPackage->user_id !== $user->id) {
            abort(403);
        }

        return Inertia::render('Packages/Manage', [
            'userPackage' => $this->formatUserPackage($userPackage),
        ]);
    }

    /**
     * Hủy gói
     */
    public function cancel(Request $request, UserServicePackage $userPackage)
    {
        $user = Auth::user();

        if ($userPackage->user_id !== $user->id) {
            abort(403);
        }

        $userPackage->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->input('reason'),
        ]);

        return redirect()->route('packages.index')
            ->with('success', 'Gói dịch vụ đã được hủy thành công.');
    }

    /**
     * Trang thanh toán
     */
    public function payment(UserServicePackage $userPackage)
    {
        $user = Auth::user();

        if ($userPackage->user_id !== $user->id) {
            abort(403);
        }

        return Inertia::render('Packages/Payment', [
            'userPackage' => $this->formatUserPackage($userPackage),
            'paymentMethods' => $this->getPaymentMethods(),
            'bankInfo' => $this->getBankInfo(),
        ]);
    }

    /**
     * Lấy thông tin ngân hàng
     */
    private function getBankInfo(): array
    {
        return [
            'bank_name' => 'Vietcombank',
            'account_number' => '1234567890',
            'account_name' => 'CONG TY TNHH DEVICEHUB',
            'branch' => 'Chi nhánh Hà Nội',
        ];
    }

    /**
     * Format package data cho frontend
     */
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

    /**
     * Format user package data cho frontend
     */
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

    /**
     * Tính toán stats cho user
     */
    private function calculateUserStats($user): array
    {
        $activePackages = UserServicePackage::where('user_id', $user->id)
            ->where('status', 'active')
            ->count();

        $remainingCredits = UserServicePackage::where('user_id', $user->id)
            ->where('status', 'active')
            ->sum('credits_remaining');

        // Tính tổng thiết bị được phép từ các gói active
        $maxDevices = UserServicePackage::with('servicePackage')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->get()
            ->sum(fn($pkg) => $pkg->servicePackage?->max_devices ?? 0);

        // Giả sử user có devices relationship
        $usedDevices = $user->devices?->count() ?? 0;

        // Tính số ngày còn lại của gói gần hết hạn nhất
        $nearestExpiry = UserServicePackage::where('user_id', $user->id)
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

    /**
     * Lấy danh sách phương thức thanh toán
     */
    private function getPaymentMethods(): array
    {
        return [
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
