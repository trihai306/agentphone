<?php

namespace App\Filament\Widgets;

use App\Models\User;
use App\States\UserWorkflow\Active;
use App\States\UserWorkflow\Archived;
use App\States\UserWorkflow\Pending;
use App\States\UserWorkflow\Suspended;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class UserStatsWidget extends BaseWidget
{
    /**
     * The heading displayed above the stats.
     */
    protected ?string $heading = 'User Statistics';

    /**
     * The description displayed below the heading.
     */
    protected ?string $description = 'Overview of user accounts and their workflow states';

    /**
     * Polling interval for live updates (null to disable).
     */
    protected static ?string $pollingInterval = '30s';

    /**
     * Sort order on the dashboard (lower numbers appear first).
     */
    protected static ?int $sort = 1;

    /**
     * Get the stats to display in the widget.
     *
     * @return array<Stat>
     */
    protected function getStats(): array
    {
        $totalUsers = User::count();
        $activeUsers = User::where('workflow_state', Active::class)->count();
        $pendingUsers = User::where('workflow_state', Pending::class)->count();
        $suspendedUsers = User::where('workflow_state', Suspended::class)->count();
        $archivedUsers = User::where('workflow_state', Archived::class)->count();

        // Calculate percentages for descriptions
        $activePercentage = $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0;
        $pendingPercentage = $totalUsers > 0 ? round(($pendingUsers / $totalUsers) * 100, 1) : 0;
        $suspendedPercentage = $totalUsers > 0 ? round(($suspendedUsers / $totalUsers) * 100, 1) : 0;

        // Get recent user activity (last 7 days)
        $recentUsers = User::where('created_at', '>=', now()->subDays(7))->count();

        return [
            Stat::make('Total Users', number_format($totalUsers))
                ->description("{$recentUsers} new this week")
                ->descriptionIcon('heroicon-m-user-group')
                ->color('primary'),

            Stat::make('Active Users', number_format($activeUsers))
                ->description("{$activePercentage}% of total")
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),

            Stat::make('Pending Users', number_format($pendingUsers))
                ->description("{$pendingPercentage}% awaiting activation")
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning'),

            Stat::make('Suspended Users', number_format($suspendedUsers))
                ->description("{$suspendedPercentage}% of total")
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color('danger'),
        ];
    }
}
