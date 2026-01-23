<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\SystemResourcesOverview;
use App\Filament\Widgets\StorageBreakdownChart;
use App\Filament\Widgets\QueueResourcesStats;
use Filament\Pages\Page;

class SystemResources extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-server-stack';

    protected static string $view = 'filament.pages.system-resources';

    protected static ?string $slug = 'system-resources';

    protected static ?string $navigationLabel = 'Tài Nguyên Hệ Thống';

    protected static ?string $title = 'Giám Sát Tài Nguyên Hệ Thống';

    protected static ?string $navigationGroup = '⚙️ Hệ Thống';

    protected static ?int $navigationSort = 13;

    protected function getHeaderWidgets(): array
    {
        return [
            SystemResourcesOverview::class,
        ];
    }

    protected function getFooterWidgets(): array
    {
        return [
            StorageBreakdownChart::class,
            QueueResourcesStats::class,
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
