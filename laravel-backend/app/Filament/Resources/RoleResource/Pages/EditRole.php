<?php

namespace App\Filament\Resources\RoleResource\Pages;

use App\Filament\Resources\RoleResource;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Spatie\Permission\Models\Role;

class EditRole extends EditRecord
{
    protected static string $resource = RoleResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make()
                ->before(function (Role $record, Actions\DeleteAction $action) {
                    // Prevent deletion of admin role if it has users
                    if ($record->name === 'admin' && $record->users()->count() > 0) {
                        Notification::make()
                            ->title('Cannot delete admin role')
                            ->body('The admin role has users assigned to it. Remove users from this role first.')
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
        // Ensure guard_name is not changed if role has users
        $record = $this->getRecord();

        if ($record->users()->count() > 0 && $data['guard_name'] !== $record->guard_name) {
            Notification::make()
                ->title('Cannot change guard name')
                ->body('This role has users assigned to it. Changing the guard name could cause issues.')
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
        // Clear permission cache after role update
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
