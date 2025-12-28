<?php

namespace App\Filament\Resources\PermissionResource\Pages;

use App\Filament\Resources\PermissionResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePermission extends CreateRecord
{
    protected static string $resource = PermissionResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // Ensure guard_name has a default value
        if (empty($data['guard_name'])) {
            $data['guard_name'] = 'web';
        }

        return $data;
    }

    /**
     * After creating, clear the permission cache to ensure changes take effect.
     */
    protected function afterCreate(): void
    {
        // Clear permission cache after creating permission
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
