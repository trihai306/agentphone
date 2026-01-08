<?php

namespace App\Filament\Resources\UserServicePackageResource\Pages;

use App\Filament\Resources\UserServicePackageResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditUserServicePackage extends EditRecord
{
    protected static string $resource = UserServicePackageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
