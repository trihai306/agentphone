<?php

namespace App\Filament\Widgets;

use App\Models\WorkflowJob;
use App\Models\Campaign;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class JobStatsOverview extends BaseWidget
{
    protected static ?int $sort = 2;

    protected static ?string $pollingInterval = '15s';

    protected int|string|array $columnSpan = 'full';

    protected function getStats(): array
    {
        // Job stats by status
        $totalJobs = WorkflowJob::count();
        $pendingJobs = WorkflowJob::where('status', WorkflowJob::STATUS_PENDING)->count();
        $runningJobs = WorkflowJob::where('status', WorkflowJob::STATUS_RUNNING)->count();
        $completedJobs = WorkflowJob::where('status', WorkflowJob::STATUS_COMPLETED)->count();
        $failedJobs = WorkflowJob::where('status', WorkflowJob::STATUS_FAILED)->count();

        // Jobs today
        $jobsToday = WorkflowJob::whereDate('created_at', today())->count();
        $completedToday = WorkflowJob::where('status', WorkflowJob::STATUS_COMPLETED)
            ->whereDate('updated_at', today())
            ->count();

        // Campaign stats
        $totalCampaigns = Campaign::count();
        $activeCampaigns = Campaign::where('status', Campaign::STATUS_RUNNING)->count();

        // Success rate
        $finishedJobs = $completedJobs + $failedJobs;
        $successRate = $finishedJobs > 0 ? round(($completedJobs / $finishedJobs) * 100, 1) : 0;

        return [
            Stat::make('Tổng Jobs', number_format($totalJobs))
                ->description("{$runningJobs} đang chạy, {$pendingJobs} chờ xử lý")
                ->icon('heroicon-o-play-circle')
                ->color('primary'),

            Stat::make('Hoàn Thành', number_format($completedJobs))
                ->description("{$completedToday} hôm nay")
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->chart($this->getCompletedChart()),

            Stat::make('Thất Bại', number_format($failedJobs))
                ->description("Tỉ lệ thành công: {$successRate}%")
                ->icon('heroicon-o-x-circle')
                ->color($failedJobs > 0 ? 'danger' : 'gray'),

            Stat::make('Chiến Dịch', number_format($totalCampaigns))
                ->description("{$activeCampaigns} đang chạy")
                ->icon('heroicon-o-megaphone')
                ->color('info'),
        ];
    }

    protected function getCompletedChart(): array
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = WorkflowJob::where('status', WorkflowJob::STATUS_COMPLETED)
                ->whereDate('updated_at', $date->toDateString())
                ->count();
            $data[] = $count;
        }
        return $data;
    }
}
