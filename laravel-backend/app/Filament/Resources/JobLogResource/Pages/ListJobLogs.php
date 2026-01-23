<?php

namespace App\Filament\Resources\JobLogResource\Pages;

use App\Filament\Resources\JobLogResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListJobLogs extends ListRecords
{
    protected static string $resource = JobLogResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
