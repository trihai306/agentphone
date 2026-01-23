<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\WorkflowStatsOverview;
use App\Filament\Widgets\WorkflowStatusChart;
use App\Filament\Widgets\RecentWorkflowsTable;
use App\Filament\Widgets\JobStatsOverview;
use App\Filament\Widgets\JobStatusChart;
use App\Filament\Widgets\JobTrendChart;
use App\Filament\Widgets\RecentJobsTable;
use Filament\Pages\Page;

class WorkflowDashboard extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-arrows-right-left';

    protected static string $view = 'filament.pages.workflow-dashboard';

    protected static ?string $slug = 'workflow-analytics';

    protected static ?string $navigationLabel = 'Workflow & Jobs';

    protected static ?string $title = 'Dashboard Workflow & Jobs';

    protected static ?string $navigationGroup = 'Dashboard';

    protected static ?int $navigationSort = 4;

    protected function getHeaderWidgets(): array
    {
        return [
            WorkflowStatsOverview::class,
            JobStatsOverview::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            WorkflowStatusChart::class,
            JobStatusChart::class,
            JobTrendChart::class,
            RecentWorkflowsTable::class,
            RecentJobsTable::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int|array
    {
        return 1;
    }

    public function getFooterWidgetsColumns(): int|array
    {
        return [
            'default' => 1,
            'md' => 2,
            'xl' => 3,
        ];
    }
}
