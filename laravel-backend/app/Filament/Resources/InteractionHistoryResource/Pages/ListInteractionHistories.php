<?php

namespace App\Filament\Resources\InteractionHistoryResource\Pages;

use App\Filament\Resources\InteractionHistoryResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Filament\Resources\Components\Tab;
use Illuminate\Database\Eloquent\Builder;

class ListInteractionHistories extends ListRecords
{
    protected static string $resource = InteractionHistoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('export')
                ->label('Export CSV')
                ->icon('heroicon-o-arrow-down-tray')
                ->action(function () {
                    // Export logic here
                    $this->notify('success', 'Export started');
                }),
        ];
    }

    public function getTabs(): array
    {
        return [
            'all' => Tab::make('Tất cả')
                ->badge($this->getModel()::count()),

            'today' => Tab::make('Hôm nay')
                ->modifyQueryUsing(fn (Builder $query) => $query->whereDate('created_at', today()))
                ->badge($this->getModel()::whereDate('created_at', today())->count()),

            'tap' => Tab::make('Tap')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('action_type', 'tap'))
                ->badge($this->getModel()::where('action_type', 'tap')->count())
                ->badgeColor('success'),

            'swipe' => Tab::make('Swipe')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('action_type', 'swipe'))
                ->badge($this->getModel()::where('action_type', 'swipe')->count())
                ->badgeColor('info'),

            'input' => Tab::make('Input')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('action_type', 'input_text'))
                ->badge($this->getModel()::where('action_type', 'input_text')->count())
                ->badgeColor('primary'),
        ];
    }

    protected function getHeaderWidgets(): array
    {
        return [
            InteractionHistoryResource\Widgets\InteractionStatsOverview::class,
        ];
    }
}
