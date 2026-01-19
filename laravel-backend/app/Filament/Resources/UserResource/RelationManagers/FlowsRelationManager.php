<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class FlowsRelationManager extends RelationManager
{
    protected static string $relationship = 'flows';

    protected static ?string $title = 'Workflows';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Tên')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'draft' => 'Nháp',
                        'active' => 'Hoạt động',
                        'archived' => 'Lưu trữ',
                        default => $state,
                    })
                    ->colors([
                        'warning' => 'draft',
                        'success' => 'active',
                        'gray' => 'archived',
                    ]),

                Tables\Columns\TextColumn::make('nodes_count')
                    ->label('Nodes')
                    ->counts('nodes')
                    ->badge()
                    ->color('info'),

                Tables\Columns\IconColumn::make('is_template')
                    ->label('Template')
                    ->boolean(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft' => 'Nháp',
                        'active' => 'Hoạt động',
                        'archived' => 'Lưu trữ',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->url(fn($record) => route('filament.admin.resources.flows.edit', $record)),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
