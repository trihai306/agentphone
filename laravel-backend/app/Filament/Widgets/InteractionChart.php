<?php

namespace App\Filament\Widgets;

use App\Models\InteractionHistory;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class InteractionChart extends ChartWidget
{
    protected static ?string $heading = 'Tương tác theo ngày';

    protected static ?int $sort = 3;

    protected static ?string $pollingInterval = '60s';

    protected function getData(): array
    {
        $data = [];
        $labels = [];

        // Get data for last 7 days
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $labels[] = $date->format('d/m');

            $data[] = InteractionHistory::whereDate('created_at', $date)->count();
        }

        return [
            'datasets' => [
                [
                    'label' => 'Tương tác',
                    'data' => $data,
                    'backgroundColor' => 'rgba(99, 102, 241, 0.2)',
                    'borderColor' => 'rgb(99, 102, 241)',
                    'borderWidth' => 2,
                    'fill' => true,
                    'tension' => 0.4,
                ],
            ],
            'labels' => $labels,
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
                    'display' => false,
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
