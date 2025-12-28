<?php

namespace App\Filament\Resources\UserBankAccountResource\Pages;

use App\Filament\Resources\UserBankAccountResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListUserBankAccounts extends ListRecords
{
    protected static string $resource = UserBankAccountResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
