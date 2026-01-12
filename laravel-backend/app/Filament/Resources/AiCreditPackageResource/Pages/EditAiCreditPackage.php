<?php

namespace App\Filament\Resources\AiCreditPackageResource\Pages;

use App\Filament\Resources\AiCreditPackageResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditAiCreditPackage extends EditRecord
{
    protected static string $resource = AiCreditPackageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
