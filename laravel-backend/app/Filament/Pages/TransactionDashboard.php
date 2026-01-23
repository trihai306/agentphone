<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\LatestServiceOrders;
use App\Filament\Widgets\LatestTransactions;
use App\Filament\Widgets\MonthlyRevenueChart;
use App\Filament\Widgets\ServicePackageDistributionChart;
use App\Filament\Widgets\TransactionChart;
use App\Filament\Widgets\TransactionStatsOverview;
use Filament\Pages\Page;

class TransactionDashboard extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-chart-pie';

    protected static string $view = 'filament.pages.transaction-dashboard';

    protected static ?string $navigationLabel = 'Dashboard Giao Dịch';

    protected static ?string $title = 'Dashboard Giao Dịch & Doanh Thu';

    protected static ?string $navigationGroup = 'Dashboard';

    protected static ?int $navigationSort = 1;

    protected function getHeaderWidgets(): array
    {
        return [
            TransactionStatsOverview::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            TransactionChart::class,
            ServicePackageDistributionChart::class,
            MonthlyRevenueChart::class,
            LatestTransactions::class,
            LatestServiceOrders::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int | array
    {
        return 3;
    }

    public function getFooterWidgetsColumns(): int | array
    {
        return [
            'default' => 1,
            'md' => 2,
            'xl' => 2,
        ];
    }
}
