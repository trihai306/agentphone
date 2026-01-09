<?php

namespace App\Filament\Widgets;

use App\Models\ApiLog;
use Filament\Widgets\ChartWidget;

class ApiEndpointChart extends ChartWidget
{
    protected static ?string $heading = 'Requests Theo Endpoint';

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 1;

    protected function getData(): array
    {
        $topEndpoints = ApiLog::selectRaw('endpoint, count(*) as count')
            ->whereDate('created_at', '>=', now()->subDays(7))
            ->groupBy('endpoint')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return [
            'datasets' => [
                [
                    'data' => $topEndpoints->pluck('count')->toArray(),
                    'backgroundColor' => [
                        'rgb(59, 130, 246)',
                        'rgb(34, 197, 94)',
                        'rgb(251, 191, 36)',
                        'rgb(239, 68, 68)',
                        'rgb(168, 85, 247)',
                        'rgb(236, 72, 153)',
                        'rgb(20, 184, 166)',
                        'rgb(249, 115, 22)',
                        'rgb(156, 163, 175)',
                        'rgb(139, 92, 246)',
                    ],
                ],
            ],
            'labels' => $topEndpoints->pluck('endpoint')->map(fn($e) => strlen($e) > 30 ? '...' . substr($e, -27) : $e)->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}
