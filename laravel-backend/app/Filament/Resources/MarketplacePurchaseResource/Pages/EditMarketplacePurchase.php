<?php

namespace App\Filament\Resources\MarketplacePurchaseResource\Pages;

use App\Filament\Resources\MarketplacePurchaseResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditMarketplacePurchase extends EditRecord
{
    protected static string $resource = MarketplacePurchaseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
