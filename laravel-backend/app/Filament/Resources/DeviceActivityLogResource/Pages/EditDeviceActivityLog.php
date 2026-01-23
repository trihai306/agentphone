<?php

namespace App\Filament\Resources\DeviceActivityLogResource\Pages;

use App\Filament\Resources\DeviceActivityLogResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditDeviceActivityLog extends EditRecord
{
    protected static string $resource = DeviceActivityLogResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
