<?php

namespace App\Filament\Resources\SystemNotificationResource\Pages;

use App\Filament\Resources\SystemNotificationResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSystemNotification extends EditRecord
{
    protected static string $resource = SystemNotificationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\ViewAction::make(),
            Actions\DeleteAction::make(),
            Actions\RestoreAction::make(),
            Actions\ForceDeleteAction::make(),
        ];
    }
}
