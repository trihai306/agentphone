<?php

namespace App\Filament\Resources\UserMediaResource\Pages;

use App\Filament\Resources\UserMediaResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditUserMedia extends EditRecord
{
    protected static string $resource = UserMediaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
