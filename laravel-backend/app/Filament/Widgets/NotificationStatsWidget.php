<?php

namespace App\Filament\Widgets;

use App\Models\SystemNotification;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class NotificationStatsWidget extends BaseWidget
{
    protected static ?int $sort = 5;

    protected static ?string $pollingInterval = '30s';

    protected function getStats(): array
    {
        $pendingCount = SystemNotification::where('is_broadcasted', false)
            ->where('is_active', true)
            ->count();

        $sentTodayCount = SystemNotification::whereDate('broadcasted_at', today())
            ->count();

        $totalActiveCount = SystemNotification::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->count();

        $readRateToday = $this->calculateReadRate();

        return [
            Stat::make('Pending Notifications', $pendingCount)
                ->description('Awaiting broadcast')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingCount > 0 ? 'warning' : 'success')
                ->chart([0, $pendingCount]),

            Stat::make('Sent Today', $sentTodayCount)
                ->description('Notifications broadcasted')
                ->descriptionIcon('heroicon-m-paper-airplane')
                ->color('primary')
                ->chart($this->getSentTrendData()),

            Stat::make('Active Notifications', $totalActiveCount)
                ->description('Currently active')
                ->descriptionIcon('heroicon-m-bell')
                ->color('info'),

            Stat::make('Read Rate', $readRateToday . '%')
                ->description('Average engagement')
                ->descriptionIcon('heroicon-m-eye')
                ->color($readRateToday > 50 ? 'success' : 'warning'),
        ];
    }

    protected function getSentTrendData(): array
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $data[] = SystemNotification::whereDate('broadcasted_at', now()->subDays($i))
                ->count();
        }
        return $data;
    }

    protected function calculateReadRate(): float
    {
        $recentNotifications = SystemNotification::where('is_broadcasted', true)
            ->where('created_at', '>=', now()->subDays(7))
            ->withCount('readers')
            ->get();

        if ($recentNotifications->isEmpty()) {
            return 0;
        }

        $totalReaders = $recentNotifications->sum('readers_count');
        $expectedReaders = $recentNotifications->count() * 10; // Assuming average 10 users per notification

        return $expectedReaders > 0 ? round(($totalReaders / $expectedReaders) * 100, 1) : 0;
    }
}
