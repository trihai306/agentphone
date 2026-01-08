<?php

namespace App\Filament\Resources\SystemNotificationResource\Pages;

use App\Filament\Resources\SystemNotificationResource;
use App\Services\NotificationService;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\CreateRecord;

class CreateSystemNotification extends CreateRecord
{
    protected static string $resource = SystemNotificationResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['created_by'] = auth()->id();
        return $data;
    }

    protected function afterCreate(): void
    {
        $record = $this->record;

        // If no scheduled time, broadcast immediately
        if (!$record->scheduled_at && $record->is_active) {
            $notificationService = app(NotificationService::class);
            $notificationService->broadcastSystemNotification($record);

            Notification::make()
                ->title('Notification Sent!')
                ->body('The notification has been broadcasted to the target audience.')
                ->success()
                ->send();
        }
    }
}
