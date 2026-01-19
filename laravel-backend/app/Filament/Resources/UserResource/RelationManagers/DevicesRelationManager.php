<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class DevicesRelationManager extends RelationManager
{
    protected static string $relationship = 'devices';

    protected static ?string $title = 'Thiết bị';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('device_id')
            ->columns([
                Tables\Columns\TextColumn::make('device_id')
                    ->label('Device ID')
                    ->searchable()
                    ->copyable()
                    ->limit(15),

                Tables\Columns\TextColumn::make('name')
                    ->label('Tên')
                    ->searchable()
                    ->placeholder('Chưa đặt tên'),

                Tables\Columns\TextColumn::make('model')
                    ->label('Model')
                    ->searchable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'active' => 'Hoạt động',
                        'inactive' => 'Không hoạt động',
                        'blocked' => 'Đã khóa',
                        default => $state,
                    })
                    ->colors([
                        'success' => 'active',
                        'warning' => 'inactive',
                        'danger' => 'blocked',
                    ]),

                Tables\Columns\TextColumn::make('last_active_at')
                    ->label('Hoạt động lần cuối')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('Chưa hoạt động'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'active' => 'Hoạt động',
                        'inactive' => 'Không hoạt động',
                        'blocked' => 'Đã khóa',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->url(fn($record) => route('filament.admin.resources.devices.edit', $record)),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
