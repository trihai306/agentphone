<?php

namespace App\Filament\Resources\MarketplaceListingResource\Pages;

use App\Filament\Resources\MarketplaceListingResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Filament\Resources\Components\Tab;
use Illuminate\Database\Eloquent\Builder;

class ListMarketplaceListings extends ListRecords
{
    protected static string $resource = MarketplaceListingResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTabs(): array
    {
        return [
            'all' => Tab::make('All'),
            'pending' => Tab::make('Pending Review')
                ->modifyQueryUsing(fn(Builder $query) => $query->where('status', 'pending'))
                ->badge(fn() => static::getResource()::getModel()::where('status', 'pending')->count())
                ->badgeColor('warning'),
            'published' => Tab::make('Published')
                ->modifyQueryUsing(fn(Builder $query) => $query->where('status', 'published')),
            'rejected' => Tab::make('Rejected')
                ->modifyQueryUsing(fn(Builder $query) => $query->where('status', 'rejected')),
        ];
    }
}
