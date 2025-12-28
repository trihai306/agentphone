<?php

namespace App\Filament\Widgets;

use App\Models\Transaction;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class TransactionStatsWidget extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $pendingCount = Transaction::where('status', Transaction::STATUS_PENDING)->count();
        $todayDeposits = Transaction::deposit()
            ->completed()
            ->whereDate('completed_at', today())
            ->sum('final_amount');
        $todayWithdrawals = Transaction::withdrawal()
            ->completed()
            ->whereDate('completed_at', today())
            ->sum('final_amount');

        return [
            Stat::make('Giao dịch chờ duyệt', $pendingCount)
                ->description('Cần xử lý')
                ->descriptionIcon('heroicon-o-clock')
                ->color('warning'),

            Stat::make('Nạp tiền hôm nay', number_format($todayDeposits) . ' VND')
                ->description('Đã hoàn thành')
                ->descriptionIcon('heroicon-o-arrow-trending-up')
                ->color('success'),

            Stat::make('Rút tiền hôm nay', number_format($todayWithdrawals) . ' VND')
                ->description('Đã hoàn thành')
                ->descriptionIcon('heroicon-o-arrow-trending-down')
                ->color('danger'),
        ];
    }
}
