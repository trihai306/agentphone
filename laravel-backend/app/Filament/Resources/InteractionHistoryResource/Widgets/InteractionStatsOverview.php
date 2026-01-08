<?php

namespace App\Filament\Resources\InteractionHistoryResource\Widgets;

use App\Models\InteractionHistory;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class InteractionStatsOverview extends BaseWidget
{
    protected static ?string $pollingInterval = '30s';

    protected function getStats(): array
    {
        $total = InteractionHistory::count();
        $todayCount = InteractionHistory::whereDate('created_at', today())->count();
        $uniqueDevices = InteractionHistory::distinct('device_serial')->count('device_serial');
        $uniqueSessions = InteractionHistory::whereNotNull('session_id')
            ->distinct('session_id')
            ->count('session_id');

        // Get counts by action type
        $tapCount = InteractionHistory::where('action_type', 'tap')->count();
        $swipeCount = InteractionHistory::where('action_type', 'swipe')->count();

        // Get trend (compare with yesterday)
        $yesterdayCount = InteractionHistory::whereDate('created_at', today()->subDay())->count();
        $trend = $yesterdayCount > 0
            ? round((($todayCount - $yesterdayCount) / $yesterdayCount) * 100, 1)
            : 0;

        return [
            Stat::make('Tổng tương tác', number_format($total))
                ->description('Tất cả thời gian')
                ->descriptionIcon('heroicon-m-finger-print')
                ->color('primary'),

            Stat::make('Hôm nay', number_format($todayCount))
                ->description($trend >= 0 ? "+{$trend}% so với hôm qua" : "{$trend}% so với hôm qua")
                ->descriptionIcon($trend >= 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down')
                ->color($trend >= 0 ? 'success' : 'danger')
                ->chart($this->getTodayChart()),

            Stat::make('Thiết bị', number_format($uniqueDevices))
                ->description('Thiết bị duy nhất')
                ->descriptionIcon('heroicon-m-device-phone-mobile')
                ->color('info'),

            Stat::make('Phiên', number_format($uniqueSessions))
                ->description('Sessions')
                ->descriptionIcon('heroicon-m-folder')
                ->color('warning'),

            Stat::make('Taps', number_format($tapCount))
                ->description('Lượt chạm')
                ->descriptionIcon('heroicon-m-cursor-arrow-rays')
                ->color('success'),

            Stat::make('Swipes', number_format($swipeCount))
                ->description('Lượt vuốt')
                ->descriptionIcon('heroicon-m-arrows-right-left')
                ->color('info'),
        ];
    }

    protected function getTodayChart(): array
    {
        // Get hourly data for today
        $data = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $count = InteractionHistory::whereDate('created_at', today())
                ->whereRaw('HOUR(created_at) = ?', [$hour])
                ->count();
            $data[] = $count;
        }

        // Return only last 12 hours or all hours
        return array_slice($data, max(0, date('G') - 11), 12);
    }

    protected function getColumns(): int
    {
        return 3;
    }
}
