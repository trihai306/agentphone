<?php

namespace App\Filament\Widgets;

use App\Models\InteractionHistory;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Model;

class LatestInteractions extends BaseWidget
{
    protected static ?string $heading = 'Tương tác gần đây';

    protected static ?int $sort = 5;

    protected int | string | array $columnSpan = 'full';

    protected static ?string $pollingInterval = '15s';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                InteractionHistory::query()
                    ->latest()
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\TextColumn::make('action_type')
                    ->label('Action')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'tap' => 'success',
                        'long_tap' => 'warning',
                        'swipe' => 'info',
                        'input_text' => 'primary',
                        'scroll' => 'gray',
                        default => 'secondary',
                    }),

                Tables\Columns\TextColumn::make('element_display_name')
                    ->label('Element')
                    ->limit(30),

                Tables\Columns\TextColumn::make('device_serial')
                    ->label('Device')
                    ->limit(12),

                Tables\Columns\TextColumn::make('package_name')
                    ->label('App')
                    ->formatStateUsing(fn (?string $state): string => $state ? last(explode('.', $state)) : '-'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Time')
                    ->since(),
            ])
            ->paginated(false)
            ->actions([
                Tables\Actions\Action::make('view')
                    ->url(fn (Model $record): string => route('filament.admin.resources.interaction-histories.view', $record))
                    ->icon('heroicon-o-eye'),
            ]);
    }
}
