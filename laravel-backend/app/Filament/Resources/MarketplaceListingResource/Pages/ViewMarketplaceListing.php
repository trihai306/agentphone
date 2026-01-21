<?php

namespace App\Filament\Resources\MarketplaceListingResource\Pages;

use App\Filament\Resources\MarketplaceListingResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewMarketplaceListing extends ViewRecord
{
    protected static string $resource = MarketplaceListingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('approve')
                ->label('Approve')
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->visible(fn() => $this->record->status === 'pending')
                ->requiresConfirmation()
                ->action(fn() => $this->record->publish()),

            Actions\Action::make('reject')
                ->label('Reject')
                ->icon('heroicon-o-x-circle')
                ->color('danger')
                ->visible(fn() => $this->record->status === 'pending')
                ->form([
                    \Filament\Forms\Components\Textarea::make('rejection_reason')
                        ->label('Reason')
                        ->required(),
                ])
                ->action(function (array $data) {
                    $this->record->reject($data['rejection_reason']);
                }),

            Actions\EditAction::make(),
        ];
    }
}
