<?php

namespace App\Filament\Resources\PermissionResource\Pages;

use App\Filament\Resources\PermissionResource;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Spatie\Permission\Models\Permission;

class EditPermission extends EditRecord
{
    protected static string $resource = PermissionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make()
                ->before(function (Permission $record, Actions\DeleteAction $action) {
                    // Prevent deletion of permission if it has roles assigned
                    if ($record->roles()->count() > 0) {
                        Notification::make()
                            ->title('Cannot delete permission')
                            ->body('This permission is assigned to roles. Remove it from roles first.')
                            ->danger()
                            ->send();

                        $action->cancel();
                    }
                }),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        // Ensure guard_name is not changed if permission has roles
        $record = $this->getRecord();

        if ($record->roles()->count() > 0 && $data['guard_name'] !== $record->guard_name) {
            Notification::make()
                ->title('Cannot change guard name')
                ->body('This permission is assigned to roles. Changing the guard name could cause issues.')
                ->warning()
                ->send();

            $data['guard_name'] = $record->guard_name;
        }

        return $data;
    }

    /**
     * After saving, clear the permission cache to ensure changes take effect.
     */
    protected function afterSave(): void
    {
        // Clear permission cache after permission update
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
