<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class ServicePackagesRelationManager extends RelationManager
{
    protected static string $relationship = 'servicePackages';

    protected static ?string $title = 'Gói dịch vụ';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('id')
            ->columns([
                Tables\Columns\TextColumn::make('package.name')
                    ->label('Gói')
                    ->searchable(),

                Tables\Columns\TextColumn::make('credits_remaining')
                    ->label('Credits còn lại')
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('price_paid')
                    ->label('Đã thanh toán')
                    ->money('VND'),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'active' => 'Hoạt động',
                        'expired' => 'Hết hạn',
                        'cancelled' => 'Đã hủy',
                        default => $state,
                    })
                    ->colors([
                        'success' => 'active',
                        'danger' => 'expired',
                        'gray' => 'cancelled',
                    ]),

                Tables\Columns\TextColumn::make('expires_at')
                    ->label('Hết hạn')
                    ->dateTime('d/m/Y')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày mua')
                    ->dateTime('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'active' => 'Hoạt động',
                        'expired' => 'Hết hạn',
                        'cancelled' => 'Đã hủy',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->url(fn($record) => route('filament.admin.resources.user-service-packages.edit', $record)),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
