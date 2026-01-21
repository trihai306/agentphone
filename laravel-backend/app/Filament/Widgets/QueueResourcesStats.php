<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class QueueResourcesStats extends BaseWidget
{
    protected static ?int $sort = 3;

    protected static ?string $pollingInterval = '15s';

    protected int|string|array $columnSpan = 1;

    protected function getStats(): array
    {
        $stats = [];

        // Jobs pending in queue
        try {
            $pendingJobs = DB::table('jobs')->count();
            $stats[] = Stat::make('Jobs Pending', number_format($pendingJobs))
                ->description('Đang chờ xử lý')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingJobs > 100 ? 'warning' : 'success');
        } catch (\Exception $e) {
            $stats[] = Stat::make('Jobs Pending', 'N/A')
                ->description('Lỗi kết nối')
                ->descriptionIcon('heroicon-m-clock')
                ->color('gray');
        }

        // Failed jobs
        try {
            $failedJobs = DB::table('failed_jobs')->count();
            $stats[] = Stat::make('Failed Jobs', number_format($failedJobs))
                ->description($failedJobs > 0 ? 'Cần kiểm tra' : 'Không có lỗi')
                ->descriptionIcon('heroicon-m-x-circle')
                ->color($failedJobs > 0 ? 'danger' : 'success');
        } catch (\Exception $e) {
            $stats[] = Stat::make('Failed Jobs', 'N/A')
                ->description('Lỗi kết nối')
                ->descriptionIcon('heroicon-m-x-circle')
                ->color('gray');
        }

        // Redis memory (if using Redis)
        try {
            if (config('queue.default') === 'redis' || config('cache.default') === 'redis') {
                $redisInfo = Redis::info('memory');
                $usedMemory = $redisInfo['used_memory_human'] ?? 'N/A';

                $stats[] = Stat::make('Redis Memory', $usedMemory)
                    ->description('Cache & Queue')
                    ->descriptionIcon('heroicon-m-server')
                    ->color('info');
            }
        } catch (\Exception $e) {
            // Redis not available
        }

        // Queue workers status
        try {
            $output = shell_exec('pgrep -f "queue:work" | wc -l');
            $workerCount = max(0, (int) trim($output));

            $stats[] = Stat::make('Active Workers', $workerCount)
                ->description($workerCount > 0 ? 'Đang hoạt động' : 'Không có worker')
                ->descriptionIcon('heroicon-m-cog-6-tooth')
                ->color($workerCount > 0 ? 'success' : 'warning');
        } catch (\Exception $e) {
            $stats[] = Stat::make('Active Workers', 'N/A')
                ->descriptionIcon('heroicon-m-cog-6-tooth')
                ->color('gray');
        }

        return $stats;
    }

    protected function getColumns(): int
    {
        return 2;
    }
}
