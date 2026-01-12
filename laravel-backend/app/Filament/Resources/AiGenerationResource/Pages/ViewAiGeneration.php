<?php

namespace App\Filament\Resources\AiGenerationResource\Pages;

use App\Filament\Resources\AiGenerationResource;
use Filament\Resources\Pages\ViewRecord;

class ViewAiGeneration extends ViewRecord
{
    protected static string $resource = AiGenerationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\EditAction::make(),
            \Filament\Actions\DeleteAction::make(),
        ];
    }
}
