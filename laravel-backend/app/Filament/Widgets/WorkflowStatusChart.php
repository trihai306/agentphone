<?php

namespace App\Filament\Widgets;

use App\Models\Flow;
use Filament\Widgets\ChartWidget;

class WorkflowStatusChart extends ChartWidget
{
    protected static ?string $heading = 'Phân Bố Trạng Thái Workflow';

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 1;

    protected static ?string $pollingInterval = '60s';

    protected function getData(): array
    {
        $draftCount = Flow::where('status', Flow::STATUS_DRAFT)->count();
        $activeCount = Flow::where('status', Flow::STATUS_ACTIVE)->count();
        $archivedCount = Flow::where('status', Flow::STATUS_ARCHIVED)->count();

        return [
            'datasets' => [
                [
                    'data' => [$draftCount, $activeCount, $archivedCount],
                    'backgroundColor' => [
                        'rgb(251, 191, 36)', // warning - draft
                        'rgb(34, 197, 94)',  // success - active
                        'rgb(156, 163, 175)', // gray - archived
                    ],
                ],
            ],
            'labels' => ['Bản nháp', 'Đang hoạt động', 'Đã lưu trữ'],
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
