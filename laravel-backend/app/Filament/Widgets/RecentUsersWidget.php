<?php

namespace App\Filament\Widgets;

use App\Models\User;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class RecentUsersWidget extends BaseWidget
{
    /**
     * The heading displayed above the table.
     */
    protected static ?string $heading = 'Recent Users';

    /**
     * Number of items to show per page.
     */
    protected int|string|array $columnSpan = 'full';

    /**
     * Polling interval for live updates (null to disable).
     */
    protected static ?string $pollingInterval = '60s';

    /**
     * Sort order on the dashboard.
     */
    protected static ?int $sort = 2;

    /**
     * Define the table structure for recent users.
     */
    public function table(Table $table): Table
    {
        return $table
            ->query(
                User::query()
                    ->latest('created_at')
                    ->limit(5)
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Name')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('roles.name')
                    ->label('Roles')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'admin' => 'danger',
                        'editor' => 'warning',
                        'viewer' => 'info',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('workflow_state')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn ($state): string => $state?->label() ?? 'Unknown')
                    ->color(fn ($state): string => $state?->color() ?? 'gray'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Joined')
                    ->dateTime('M j, Y')
                    ->sortable()
                    ->description(fn (User $record): string => $record->created_at->diffForHumans()),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->label('View')
                    ->icon('heroicon-m-eye')
                    ->url(fn (User $record): string => route('filament.admin.resources.users.edit', ['record' => $record]))
                    ->openUrlInNewTab(false),
            ])
            ->paginated(false)
            ->defaultSort('created_at', 'desc');
    }
}
