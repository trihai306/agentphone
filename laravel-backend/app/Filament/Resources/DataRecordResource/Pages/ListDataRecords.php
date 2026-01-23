<?php

namespace App\Filament\Resources\DataRecordResource\Pages;

use App\Filament\Resources\DataRecordResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListDataRecords extends ListRecords
{
    protected static string $resource = DataRecordResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
