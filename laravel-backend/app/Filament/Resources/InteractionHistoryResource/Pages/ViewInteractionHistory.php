<?php

namespace App\Filament\Resources\InteractionHistoryResource\Pages;

use App\Filament\Resources\InteractionHistoryResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewInteractionHistory extends ViewRecord
{
    protected static string $resource = InteractionHistoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
