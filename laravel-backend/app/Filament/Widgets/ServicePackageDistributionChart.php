<?php

namespace App\Filament\Widgets;

use App\Models\ServicePackage;
use Filament\Widgets\ChartWidget;

class ServicePackageDistributionChart extends ChartWidget
{
    protected static ?string $heading = 'Phân bố đăng ký theo gói';

    protected static ?int $sort = 5;

    protected int | string | array $columnSpan = 1;

    protected static ?string $maxHeight = '250px';

    protected function getData(): array
    {
        $packages = ServicePackage::active()
            ->withCount(['userServicePackages as active_count' => function ($query) {
                $query->where('status', 'active');
            }])
            ->orderBy('active_count', 'desc')
            ->limit(5)
            ->get();

        $colors = [
            'rgba(99, 102, 241, 0.8)',   // Indigo
            'rgba(34, 197, 94, 0.8)',    // Green
            'rgba(249, 115, 22, 0.8)',   // Orange
            'rgba(236, 72, 153, 0.8)',   // Pink
            'rgba(59, 130, 246, 0.8)',   // Blue
        ];

        return [
            'datasets' => [
                [
                    'label' => 'Số đăng ký',
                    'data' => $packages->pluck('active_count')->toArray(),
                    'backgroundColor' => array_slice($colors, 0, $packages->count()),
                ],
            ],
            'labels' => $packages->pluck('name')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => true,
                    'position' => 'bottom',
                ],
            ],
        ];
    }
}
