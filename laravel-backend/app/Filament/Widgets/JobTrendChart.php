<?php

namespace App\Filament\Widgets;

use App\Models\WorkflowJob;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class JobTrendChart extends ChartWidget
{
    protected static ?string $heading = 'Xu Hướng Jobs (7 Ngày)';

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 1;

    protected static ?string $pollingInterval = '60s';

    protected function getData(): array
    {
        $labels = [];
        $completedData = [];
        $failedData = [];
        $totalData = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $labels[] = $date->format('d/m');

            $completed = WorkflowJob::where('status', WorkflowJob::STATUS_COMPLETED)
                ->whereDate('updated_at', $date->toDateString())
                ->count();

            $failed = WorkflowJob::where('status', WorkflowJob::STATUS_FAILED)
                ->whereDate('updated_at', $date->toDateString())
                ->count();

            $total = WorkflowJob::whereDate('created_at', $date->toDateString())->count();

            $completedData[] = $completed;
            $failedData[] = $failed;
            $totalData[] = $total;
        }

        return [
            'datasets' => [
                [
                    'label' => 'Hoàn thành',
                    'data' => $completedData,
                    'borderColor' => '#10b981',
                    'backgroundColor' => 'rgba(16, 185, 129, 0.1)',
                    'fill' => true,
                ],
                [
                    'label' => 'Thất bại',
                    'data' => $failedData,
                    'borderColor' => '#ef4444',
                    'backgroundColor' => 'rgba(239, 68, 68, 0.1)',
                    'fill' => true,
                ],
                [
                    'label' => 'Tổng mới',
                    'data' => $totalData,
                    'borderColor' => '#6366f1',
                    'backgroundColor' => 'rgba(99, 102, 241, 0.1)',
                    'fill' => true,
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
                    'position' => 'bottom',
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
