<?php

namespace App\Filament\Resources\UserMediaResource\Pages;

use App\Filament\Resources\UserMediaResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListUserMedia extends ListRecords
{
    protected static string $resource = UserMediaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
