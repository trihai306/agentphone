<?php

namespace App\Filament\Widgets;

use App\Services\DeviceAnalyticsService;
use Filament\Widgets\ChartWidget;

class DeviceActivityChart extends ChartWidget
{
    protected static ?string $heading = 'Thiết bị Online theo Thời gian';

    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 1;

    protected static ?string $pollingInterval = '30s';

    protected function getData(): array
    {
        $service = app(DeviceAnalyticsService::class);
        $hourlyStats = $service->getHourlyOnlineStats(24);
        $dailyStats = $service->getDailyActivityStats(7);

        return [
            'datasets' => [
                [
                    'label' => 'Devices online (24h)',
                    'data' => $hourlyStats->pluck('count')->toArray(),
                    'backgroundColor' => 'rgba(59, 130, 246, 0.2)',
                    'borderColor' => 'rgb(59, 130, 246)',
                    'borderWidth' => 2,
                    'fill' => true,
                    'tension' => 0.4,
                ],
            ],
            'labels' => $hourlyStats->pluck('hour')->toArray(),
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
                    'beginAtZero' => true,
                    'ticks' => [
                        'stepSize' => 1,
                    ],
                ],
            ],
        ];
    }
}
