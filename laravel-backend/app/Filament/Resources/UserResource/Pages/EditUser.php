<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use App\Models\User;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make()
                ->before(function (User $record, Actions\DeleteAction $action) {
                    if ($this->isLastAdmin($record)) {
                        Notification::make()
                            ->title('Cannot delete the last admin user')
                            ->body('There must be at least one admin user in the system.')
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

    /**
     * Check if this is the last admin user.
     */
    protected function isLastAdmin(User $user): bool
    {
        if (!$user->hasRole('admin')) {
            return false;
        }

        return User::role('admin')->count() <= 1;
    }

    /**
     * Handle role changes to prevent removing admin role from last admin.
     */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        $record = $this->getRecord();

        // Check if user currently has admin role
        if ($record->hasRole('admin')) {
            $newRoles = $data['roles'] ?? [];

            // If admin role is being removed, check if this is the last admin
            if (!in_array('admin', $newRoles) && $this->isLastAdmin($record)) {
                Notification::make()
                    ->title('Cannot remove admin role')
                    ->body('This is the last admin user. The admin role cannot be removed.')
                    ->danger()
                    ->send();

                // Keep the admin role
                $data['roles'][] = 'admin';
            }
        }

        return $data;
    }
}
