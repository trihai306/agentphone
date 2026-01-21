<?php

namespace App\Filament\Resources\WorkflowJobResource\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class TasksRelationManager extends RelationManager
{
    protected static string $relationship = 'tasks';

    protected static ?string $title = 'Tasks';

    protected static ?string $recordTitleAttribute = 'action_type';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('sequence')
                    ->label('#')
                    ->sortable(),

                Tables\Columns\TextColumn::make('action_type')
                    ->label('Loại')
                    ->searchable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->colors([
                        'secondary' => 'pending',
                        'warning' => 'running',
                        'success' => 'completed',
                        'danger' => 'failed',
                        'gray' => 'skipped',
                    ]),

                Tables\Columns\TextColumn::make('started_at')
                    ->label('Bắt đầu')
                    ->dateTime('H:i:s')
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('completed_at')
                    ->label('Hoàn thành')
                    ->dateTime('H:i:s')
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('error_message')
                    ->label('Lỗi')
                    ->limit(50)
                    ->color('danger')
                    ->placeholder('-'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Chờ xử lý',
                        'running' => 'Đang chạy',
                        'completed' => 'Hoàn thành',
                        'failed' => 'Thất bại',
                        'skipped' => 'Bỏ qua',
                    ]),
            ])
            ->headerActions([])
            ->actions([])
            ->bulkActions([])
            ->defaultSort('sequence');
    }
}
