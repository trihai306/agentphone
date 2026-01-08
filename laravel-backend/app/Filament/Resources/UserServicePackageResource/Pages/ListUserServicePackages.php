<?php

namespace App\Filament\Resources\UserServicePackageResource\Pages;

use App\Filament\Resources\UserServicePackageResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Actions;

class ListUserServicePackages extends ListRecords
{
    protected static string $resource = UserServicePackageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
