<?php

namespace App\Filament\Widgets;

use App\Models\UserServicePackage;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class MonthlyRevenueChart extends ChartWidget
{
    protected static ?string $heading = 'Doanh thu 6 tháng gần đây';

    protected static ?int $sort = 6;

    protected int | string | array $columnSpan = 1;

    protected static ?string $maxHeight = '250px';

    protected function getData(): array
    {
        $months = collect(range(5, 0))->map(function ($monthsAgo) {
            return Carbon::now()->subMonths($monthsAgo)->startOfMonth();
        });

        $revenue = [];
        $labels = [];

        foreach ($months as $month) {
            $labels[] = $month->format('m/Y');

            $revenue[] = UserServicePackage::where('payment_status', 'paid')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('price_paid') / 1000000; // Đổi sang triệu
        }

        return [
            'datasets' => [
                [
                    'label' => 'Doanh thu (triệu ₫)',
                    'data' => $revenue,
                    'backgroundColor' => 'rgba(99, 102, 241, 0.5)',
                    'borderColor' => 'rgb(99, 102, 241)',
                    'borderWidth' => 2,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => false,
                ],
            ],
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                ],
            ],
        ];
    }
}
