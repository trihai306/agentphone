<?php

namespace App\Filament\Resources\AiGenerationResource\Pages;

use App\Filament\Resources\AiGenerationResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditAiGeneration extends EditRecord
{
    protected static string $resource = AiGenerationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
