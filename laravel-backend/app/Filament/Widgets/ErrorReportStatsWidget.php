<?php

namespace App\Filament\Widgets;

use App\Models\ErrorReport;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class ErrorReportStatsWidget extends BaseWidget
{
    protected static ?string $pollingInterval = '30s';

    protected static ?int $sort = 2;

    protected function getStats(): array
    {
        $pendingCount = ErrorReport::pending()->count();
        $criticalCount = ErrorReport::pending()->critical()->count();
        $thisWeekCount = ErrorReport::whereBetween('created_at', [now()->startOfWeek(), now()])->count();
        $resolvedThisMonth = ErrorReport::where('status', ErrorReport::STATUS_RESOLVED)
            ->whereBetween('resolved_at', [now()->startOfMonth(), now()])
            ->count();

        return [
            Stat::make('Chờ xử lý', $pendingCount)
                ->description('Báo cáo lỗi mới')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingCount > 0 ? 'warning' : 'success')
                ->chart([4, 2, 6, 8, 3, 7, $pendingCount])
                ->url(route('filament.admin.resources.error-reports.index', ['tableFilters[status][value]' => 'pending'])),

            Stat::make('Nghiêm trọng', $criticalCount)
                ->description('Cần xử lý ngay')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($criticalCount > 0 ? 'danger' : 'success')
                ->url(route('filament.admin.resources.error-reports.index', ['tableFilters[severity][value]' => 'critical'])),

            Stat::make('Tuần này', $thisWeekCount)
                ->description('Báo cáo mới trong tuần')
                ->descriptionIcon('heroicon-m-calendar-days')
                ->color('info'),

            Stat::make('Đã xử lý', $resolvedThisMonth)
                ->description('Tháng này')
                ->descriptionIcon('heroicon-m-check-badge')
                ->color('success'),
        ];
    }
}
