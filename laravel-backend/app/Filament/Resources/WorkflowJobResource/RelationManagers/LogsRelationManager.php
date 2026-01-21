<?php

namespace App\Filament\Resources\WorkflowJobResource\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class LogsRelationManager extends RelationManager
{
    protected static string $relationship = 'logs';

    protected static ?string $title = 'Logs';

    protected static ?string $recordTitleAttribute = 'message';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Thời gian')
                    ->dateTime('H:i:s')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('level')
                    ->label('Level')
                    ->colors([
                        'secondary' => 'debug',
                        'info' => 'info',
                        'warning' => 'warning',
                        'danger' => 'error',
                    ]),

                Tables\Columns\TextColumn::make('message')
                    ->label('Thông báo')
                    ->searchable()
                    ->limit(80),

                Tables\Columns\TextColumn::make('jobTask.action_type')
                    ->label('Task')
                    ->placeholder('-'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('level')
                    ->options([
                        'debug' => 'Debug',
                        'info' => 'Info',
                        'warning' => 'Warning',
                        'error' => 'Error',
                    ]),
            ])
            ->headerActions([])
            ->actions([])
            ->bulkActions([])
            ->defaultSort('created_at', 'desc');
    }
}
