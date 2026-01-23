<?php

namespace App\Filament\Widgets;

use App\Models\WorkflowJob;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class JobStatusChart extends ChartWidget
{
    protected static ?string $heading = 'Phân Bổ Trạng Thái Jobs';

    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 1;

    protected static ?string $pollingInterval = '30s';

    protected function getData(): array
    {
        $pending = WorkflowJob::where('status', WorkflowJob::STATUS_PENDING)->count();
        $running = WorkflowJob::where('status', WorkflowJob::STATUS_RUNNING)->count();
        $completed = WorkflowJob::where('status', WorkflowJob::STATUS_COMPLETED)->count();
        $failed = WorkflowJob::where('status', WorkflowJob::STATUS_FAILED)->count();
        $cancelled = WorkflowJob::where('status', WorkflowJob::STATUS_CANCELLED)->count();

        return [
            'datasets' => [
                [
                    'label' => 'Jobs',
                    'data' => [$pending, $running, $completed, $failed, $cancelled],
                    'backgroundColor' => [
                        '#f59e0b', // amber - pending
                        '#3b82f6', // blue - running
                        '#10b981', // green - completed
                        '#ef4444', // red - failed
                        '#6b7280', // gray - cancelled
                    ],
                ],
            ],
            'labels' => ['Chờ xử lý', 'Đang chạy', 'Hoàn thành', 'Thất bại', 'Đã hủy'],
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
                    'position' => 'bottom',
                ],
            ],
        ];
    }
}
