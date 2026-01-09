<?php

namespace App\Filament\Widgets;

use App\Services\DeviceAnalyticsService;
use Filament\Widgets\Widget;
use Illuminate\Contracts\View\View;

class SoketiConnectionStats extends Widget
{
    protected static string $view = 'filament.widgets.soketi-connection-stats';

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 1;

    protected static ?string $pollingInterval = '10s';

    public function getViewData(): array
    {
        $service = app(DeviceAnalyticsService::class);
        $stats = $service->getSoketiStats();
        $channels = $service->getSoketiChannels();

        return [
            'stats' => $stats,
            'channels' => $channels,
            'channelCount' => count($channels),
        ];
    }
}
