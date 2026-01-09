<?php

namespace App\Filament\Widgets;

use App\Models\UserServicePackage;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\DB;

class ServicePackageRevenueChart extends ChartWidget
{
    protected static ?string $heading = 'Doanh Thu Theo Tháng';

    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 1;

    protected static ?string $pollingInterval = '60s';

    protected function getData(): array
    {
        // Get revenue for last 6 months
        $months = [];
        $revenueData = [];
        $ordersData = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months[] = $date->format('m/Y');

            $revenue = UserServicePackage::paid()
                ->whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->sum('price_paid');

            $orders = UserServicePackage::paid()
                ->whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();

            $revenueData[] = $revenue / 1000000; // Convert to millions
            $ordersData[] = $orders;
        }

        return [
            'datasets' => [
                [
                    'label' => 'Doanh thu (triệu ₫)',
                    'data' => $revenueData,
                    'backgroundColor' => 'rgba(34, 197, 94, 0.2)',
                    'borderColor' => 'rgb(34, 197, 94)',
                    'borderWidth' => 2,
                    'fill' => true,
                    'yAxisID' => 'y',
                ],
                [
                    'label' => 'Số đơn hàng',
                    'data' => $ordersData,
                    'backgroundColor' => 'rgba(59, 130, 246, 0.8)',
                    'borderColor' => 'rgb(59, 130, 246)',
                    'borderWidth' => 2,
                    'type' => 'bar',
                    'yAxisID' => 'y1',
                ],
            ],
            'labels' => $months,
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => true,
                    'position' => 'top',
                ],
            ],
            'scales' => [
                'y' => [
                    'type' => 'linear',
                    'display' => true,
                    'position' => 'left',
                    'beginAtZero' => true,
                ],
                'y1' => [
                    'type' => 'linear',
                    'display' => true,
                    'position' => 'right',
                    'beginAtZero' => true,
                    'grid' => [
                        'drawOnChartArea' => false,
                    ],
                ],
            ],
        ];
    }
}
