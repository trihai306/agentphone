<?php

namespace App\Filament\Resources\RecordingSessionResource\Pages;

use App\Filament\Resources\RecordingSessionResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListRecordingSessions extends ListRecords
{
    protected static string $resource = RecordingSessionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
