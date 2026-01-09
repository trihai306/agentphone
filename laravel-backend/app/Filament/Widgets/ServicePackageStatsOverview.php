<?php

namespace App\Filament\Widgets;

use App\Models\ServicePackage;
use App\Models\UserServicePackage;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class ServicePackageStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected static ?string $pollingInterval = '30s';

    protected int|string|array $columnSpan = 'full';

    protected function getStats(): array
    {
        // Service Package stats
        $totalPackages = ServicePackage::count();
        $activePackages = ServicePackage::active()->count();

        // Subscription stats
        $totalSubscriptions = UserServicePackage::count();
        $activeSubscriptions = UserServicePackage::active()->count();
        $pendingPayment = UserServicePackage::where('payment_status', UserServicePackage::PAYMENT_STATUS_PENDING)->count();
        $expiringIn7Days = UserServicePackage::expiring(7)->count();

        // Revenue this month
        $monthlyRevenue = UserServicePackage::paid()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('price_paid');

        $formattedRevenue = number_format($monthlyRevenue, 0, ',', '.') . ' ₫';

        return [
            Stat::make('Gói Dịch Vụ', $totalPackages)
                ->description("{$activePackages} đang hoạt động")
                ->icon('heroicon-o-cube')
                ->color('primary'),

            Stat::make('Đơn Hàng', $totalSubscriptions)
                ->description("{$activeSubscriptions} đang active")
                ->icon('heroicon-o-shopping-cart')
                ->color('success')
                ->chart($this->getOrderChart()),

            Stat::make('Chờ Thanh Toán', $pendingPayment)
                ->description('Đơn hàng pending')
                ->icon('heroicon-o-clock')
                ->color($pendingPayment > 0 ? 'warning' : 'gray'),

            Stat::make('Sắp Hết Hạn', $expiringIn7Days)
                ->description('Trong 7 ngày tới')
                ->icon('heroicon-o-exclamation-triangle')
                ->color($expiringIn7Days > 0 ? 'danger' : 'gray'),

            Stat::make('Doanh Thu Tháng', $formattedRevenue)
                ->description('Tháng ' . now()->format('m/Y'))
                ->icon('heroicon-o-banknotes')
                ->color('success'),
        ];
    }

    protected function getOrderChart(): array
    {
        // Get orders count for last 7 days
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = UserServicePackage::whereDate('created_at', $date->toDateString())->count();
            $data[] = $count;
        }
        return $data;
    }
}
