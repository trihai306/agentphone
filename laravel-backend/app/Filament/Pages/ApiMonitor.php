<?php

namespace App\Filament\Pages;

use App\Models\ApiLog;
use App\Filament\Widgets\ApiStatsOverview;
use App\Filament\Widgets\ApiEndpointChart;
use App\Filament\Widgets\ApiErrorsTable;
use Filament\Pages\Page;

class ApiMonitor extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-chart-bar';

    protected static string $view = 'filament.pages.api-monitor';

    protected static ?string $slug = 'api-monitor';

    protected static ?string $navigationLabel = 'API Monitor';

    protected static ?string $title = 'Giám Sát API';

    protected static ?string $navigationGroup = '⚙️ Hệ Thống';

    protected static ?int $navigationSort = 12;

    protected function getHeaderWidgets(): array
    {
        return [
            ApiStatsOverview::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            ApiEndpointChart::class,
            ApiErrorsTable::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int|array
    {
        return 4;
    }

    public function getFooterWidgetsColumns(): int|array
    {
        return 2;
    }
}
