<?php

namespace App\Filament\Resources\MediaStoragePlanResource\Pages;

use App\Filament\Resources\MediaStoragePlanResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListMediaStoragePlans extends ListRecords
{
    protected static string $resource = MediaStoragePlanResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
