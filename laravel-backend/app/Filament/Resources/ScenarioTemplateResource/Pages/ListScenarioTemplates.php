<?php

namespace App\Filament\Resources\ScenarioTemplateResource\Pages;

use App\Filament\Resources\ScenarioTemplateResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListScenarioTemplates extends ListRecords
{
    protected static string $resource = ScenarioTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
