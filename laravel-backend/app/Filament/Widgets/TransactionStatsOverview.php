<?php

namespace App\Filament\Widgets;

use App\Filament\Pages\TransactionDashboard;
use App\Models\Transaction;
use App\Models\UserServicePackage;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Number;

class TransactionStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected static ?string $pollingInterval = null;

    protected function getStats(): array
    {
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        // Transaction stats
        $pendingTransactions = Transaction::pending()->count();
        $todayTransactions = Transaction::whereDate('created_at', $today)->count();
        $todayDeposits = Transaction::deposit()->whereDate('created_at', $today)->sum('amount');
        $todayWithdrawals = Transaction::withdrawal()->whereDate('created_at', $today)->sum('amount');

        $monthlyDeposits = Transaction::deposit()
            ->where('status', 'completed')
            ->where('created_at', '>=', $thisMonth)
            ->sum('amount');

        $monthlyWithdrawals = Transaction::withdrawal()
            ->where('status', 'completed')
            ->where('created_at', '>=', $thisMonth)
            ->sum('amount');

        // Service package stats
        $pendingOrders = UserServicePackage::where('payment_status', 'pending')->count();
        $activePackages = UserServicePackage::active()->count();
        $monthlyRevenue = UserServicePackage::where('payment_status', 'paid')
            ->where('created_at', '>=', $thisMonth)
            ->sum('price_paid');

        return [
            Stat::make('Giao dịch chờ xử lý', $pendingTransactions)
                ->description('Cần được duyệt')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingTransactions > 0 ? 'warning' : 'success')
                ->chart([7, 3, 4, 5, 6, $pendingTransactions]),

            Stat::make('Giao dịch hôm nay', $todayTransactions)
                ->description('Nạp: ' . Number::abbreviate($todayDeposits) . ' | Rút: ' . Number::abbreviate($todayWithdrawals))
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('info'),

            Stat::make('Nạp tiền tháng này', Number::abbreviate($monthlyDeposits) . ' ₫')
                ->description('Đã hoàn thành')
                ->descriptionIcon('heroicon-m-arrow-up-circle')
                ->color('success'),

            Stat::make('Rút tiền tháng này', Number::abbreviate($monthlyWithdrawals) . ' ₫')
                ->description('Đã hoàn thành')
                ->descriptionIcon('heroicon-m-arrow-down-circle')
                ->color('danger'),

            Stat::make('Đơn hàng chờ TT', $pendingOrders)
                ->description('Gói dịch vụ')
                ->descriptionIcon('heroicon-m-shopping-cart')
                ->color($pendingOrders > 0 ? 'warning' : 'success'),

            Stat::make('Doanh thu tháng', Number::abbreviate($monthlyRevenue) . ' ₫')
                ->description($activePackages . ' gói đang hoạt động')
                ->descriptionIcon('heroicon-m-currency-dollar')
                ->color('success'),
        ];
    }
}
