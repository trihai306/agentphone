<?php

namespace App\Filament\Resources\AiScenarioResource\Pages;

use App\Filament\Resources\AiScenarioResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAiScenarios extends ListRecords
{
    protected static string $resource = AiScenarioResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
