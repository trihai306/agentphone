<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\ServicePackageDistributionChart;
use App\Filament\Widgets\ServicePackageRevenueChart;
use App\Filament\Widgets\ServicePackageStatsOverview;
use App\Filament\Widgets\LatestServiceOrders;
use Filament\Pages\Page;

class ServicePackageDashboard extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-cube';

    protected static string $view = 'filament.pages.service-package-dashboard';

    protected static ?string $slug = 'service-package-analytics';

    protected static ?string $navigationLabel = 'Thống Kê Gói Dịch Vụ';

    protected static ?string $title = 'Dashboard Gói Dịch Vụ';

    protected static ?string $navigationGroup = 'Phân Tích';

    protected static ?int $navigationSort = 3;

    protected function getHeaderWidgets(): array
    {
        return [
            ServicePackageStatsOverview::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            ServicePackageDistributionChart::class,
            ServicePackageRevenueChart::class,
            LatestServiceOrders::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int|array
    {
        return 5;
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
