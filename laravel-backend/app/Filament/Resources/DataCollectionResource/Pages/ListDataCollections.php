<?php

namespace App\Filament\Resources\DataCollectionResource\Pages;

use App\Filament\Resources\DataCollectionResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListDataCollections extends ListRecords
{
    protected static string $resource = DataCollectionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
