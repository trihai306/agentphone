<?php

namespace App\Filament\Widgets;

use App\Models\InteractionHistory;
use Filament\Widgets\ChartWidget;

class InteractionsByActionType extends ChartWidget
{
    protected static ?string $heading = 'Tương tác theo loại';

    protected static ?int $sort = 4;

    protected static ?string $pollingInterval = '60s';

    protected static ?string $maxHeight = '250px';

    protected function getData(): array
    {
        $actionTypes = InteractionHistory::getActionTypes();
        $data = [];
        $labels = [];
        $colors = [
            'tap' => 'rgb(34, 197, 94)',
            'long_tap' => 'rgb(234, 179, 8)',
            'swipe' => 'rgb(59, 130, 246)',
            'input_text' => 'rgb(139, 92, 246)',
            'scroll' => 'rgb(156, 163, 175)',
        ];
        $backgroundColors = [];

        foreach ($actionTypes as $key => $label) {
            $count = InteractionHistory::where('action_type', $key)->count();
            if ($count > 0) {
                $data[] = $count;
                $labels[] = $label;
                $backgroundColors[] = $colors[$key] ?? 'rgb(156, 163, 175)';
            }
        }

        return [
            'datasets' => [
                [
                    'data' => $data,
                    'backgroundColor' => $backgroundColors,
                    'borderWidth' => 0,
                ],
            ],
            'labels' => $labels,
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
                    'position' => 'right',
                ],
            ],
            'cutout' => '60%',
        ];
    }
}
