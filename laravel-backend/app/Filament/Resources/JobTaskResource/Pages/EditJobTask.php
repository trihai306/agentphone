<?php

namespace App\Filament\Resources\JobTaskResource\Pages;

use App\Filament\Resources\JobTaskResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditJobTask extends EditRecord
{
    protected static string $resource = JobTaskResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
