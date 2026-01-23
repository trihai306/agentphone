<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\DeviceActivityChart;
use App\Filament\Widgets\DeviceStatsOverview;
use App\Filament\Widgets\OnlineDevicesTable;
use App\Filament\Widgets\SoketiConnectionStats;
use Filament\Pages\Page;

class DeviceAnalyticsDashboard extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-device-phone-mobile';

    protected static string $view = 'filament.pages.device-analytics-dashboard';

    protected static ?string $slug = 'device-analytics';

    protected static ?string $navigationLabel = 'Quản Lý Thiết Bị';

    protected static ?string $title = 'Dashboard Thiết Bị & Kết Nối';

    protected static ?string $navigationGroup = 'Dashboard';

    protected static ?int $navigationSort = 2;

    protected function getHeaderWidgets(): array
    {
        return [
            DeviceStatsOverview::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            SoketiConnectionStats::class,
            DeviceActivityChart::class,
            OnlineDevicesTable::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int|array
    {
        return 4;
    }

    public function getFooterWidgetsColumns(): int|array
    {
        return [
            'default' => 1,
            'md' => 2,
            'xl' => 2,
        ];
    }
}
