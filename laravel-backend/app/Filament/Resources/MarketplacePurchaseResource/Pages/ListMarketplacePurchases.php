<?php

namespace App\Filament\Resources\MarketplacePurchaseResource\Pages;

use App\Filament\Resources\MarketplacePurchaseResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListMarketplacePurchases extends ListRecords
{
    protected static string $resource = MarketplacePurchaseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
