<?php

namespace App\Filament\Resources\UserBankAccountResource\Pages;

use App\Filament\Resources\UserBankAccountResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditUserBankAccount extends EditRecord
{
    protected static string $resource = UserBankAccountResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
