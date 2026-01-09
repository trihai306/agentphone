<?php

namespace App\Filament\Widgets;

use App\Models\ApiLog;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class ApiStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected static ?string $pollingInterval = '30s';

    protected int|string|array $columnSpan = 'full';

    protected function getStats(): array
    {
        $today = now()->startOfDay();

        $totalRequests = ApiLog::whereDate('created_at', $today)->count();
        $successRequests = ApiLog::whereDate('created_at', $today)->successful()->count();
        $failedRequests = ApiLog::whereDate('created_at', $today)->failed()->count();
        $avgResponseTime = ApiLog::whereDate('created_at', $today)->avg('response_time') ?? 0;

        $successRate = $totalRequests > 0 ? round(($successRequests / $totalRequests) * 100, 1) : 0;

        return [
            Stat::make('Requests Hôm Nay', number_format($totalRequests))
                ->description('Tổng số requests')
                ->icon('heroicon-o-arrow-trending-up')
                ->color('primary'),

            Stat::make('Thành Công', number_format($successRequests))
                ->description("{$successRate}% success rate")
                ->icon('heroicon-o-check-circle')
                ->color('success'),

            Stat::make('Lỗi', number_format($failedRequests))
                ->description('4xx & 5xx errors')
                ->icon('heroicon-o-x-circle')
                ->color($failedRequests > 0 ? 'danger' : 'gray'),

            Stat::make('Avg Response', round($avgResponseTime, 0) . 'ms')
                ->description('Thời gian phản hồi')
                ->icon('heroicon-o-clock')
                ->color($avgResponseTime > 1000 ? 'warning' : 'success'),
        ];
    }
}
