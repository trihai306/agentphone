<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\WorkflowStatsOverview;
use App\Filament\Widgets\WorkflowStatusChart;
use App\Filament\Widgets\RecentWorkflowsTable;
use Filament\Pages\Page;

class WorkflowDashboard extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-arrows-right-left';

    protected static string $view = 'filament.pages.workflow-dashboard';

    protected static ?string $slug = 'workflow-analytics';

    protected static ?string $navigationLabel = 'Thống Kê Workflow';

    protected static ?string $title = 'Dashboard Workflow';

    protected static ?string $navigationGroup = 'Phân Tích';

    protected static ?int $navigationSort = 4;

    protected function getHeaderWidgets(): array
    {
        return [
            WorkflowStatsOverview::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            WorkflowStatusChart::class,
            RecentWorkflowsTable::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int|array
    {
        return 4;
    }

    public function getFooterWidgetsColumns(): int|array
    {
        return [
            'default' => 1,
            'md' => 2,
            'xl' => 2,
        ];
    }
}
