<?php

namespace App\Filament\Resources\ScenarioTemplateResource\Pages;

use App\Filament\Resources\ScenarioTemplateResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditScenarioTemplate extends EditRecord
{
    protected static string $resource = ScenarioTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
