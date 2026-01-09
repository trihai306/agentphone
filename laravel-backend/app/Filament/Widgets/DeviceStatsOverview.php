<?php

namespace App\Filament\Widgets;

use App\Services\DeviceAnalyticsService;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class DeviceStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected static ?string $pollingInterval = '15s';

    protected function getStats(): array
    {
        $service = app(DeviceAnalyticsService::class);

        $total = $service->getTotalCount();
        $online = $service->getOnlineCount();
        $offline = $service->getOfflineCount();
        $soketiStats = $service->getSoketiStats();

        return [
            Stat::make('Tổng Thiết Bị', $total)
                ->description('Tất cả thiết bị đã đăng ký')
                ->icon('heroicon-o-device-phone-mobile')
                ->color('primary'),

            Stat::make('Đang Online', $online)
                ->description('Hoạt động trong 5 phút')
                ->icon('heroicon-o-signal')
                ->color('success')
                ->chart($this->getOnlineChart()),

            Stat::make('Offline', $offline)
                ->description('Không hoạt động')
                ->icon('heroicon-o-signal-slash')
                ->color('gray'),

            Stat::make('Socket Connections', $soketiStats['connections'])
                ->description($soketiStats['connected'] ? 'Soketi đang chạy' : 'Soketi offline')
                ->icon('heroicon-o-bolt')
                ->color($soketiStats['connected'] ? 'warning' : 'danger'),
        ];
    }

    /**
     * Get mini chart data for online devices
     */
    protected function getOnlineChart(): array
    {
        $service = app(DeviceAnalyticsService::class);
        $stats = $service->getHourlyOnlineStats(6);

        return $stats->pluck('count')->toArray();
    }
}
