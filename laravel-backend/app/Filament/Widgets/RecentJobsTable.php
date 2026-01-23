<?php

namespace App\Filament\Widgets;

use App\Models\WorkflowJob;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class RecentJobsTable extends BaseWidget
{
    protected static ?string $heading = 'Jobs Gần Đây';

    protected static ?int $sort = 5;

    protected int|string|array $columnSpan = 'full';

    protected static ?string $pollingInterval = '15s';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                WorkflowJob::query()
                    ->with(['flow', 'device', 'user'])
                    ->latest()
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('flow.name')
                    ->label('Workflow')
                    ->limit(25)
                    ->searchable(),
                Tables\Columns\TextColumn::make('device.name')
                    ->label('Thiết bị')
                    ->limit(20),
                Tables\Columns\TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        WorkflowJob::STATUS_PENDING => 'warning',
                        WorkflowJob::STATUS_RUNNING => 'info',
                        WorkflowJob::STATUS_COMPLETED => 'success',
                        WorkflowJob::STATUS_FAILED => 'danger',
                        WorkflowJob::STATUS_CANCELLED => 'gray',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('progress')
                    ->label('Tiến độ')
                    ->formatStateUsing(fn($state) => $state . '%')
                    ->badge()
                    ->color(fn($record) => $record->progress >= 100 ? 'success' : ($record->progress > 0 ? 'info' : 'gray')),
                Tables\Columns\TextColumn::make('error_message')
                    ->label('Lỗi')
                    ->limit(30)
                    ->placeholder('-')
                    ->color('danger'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Thời gian')
                    ->dateTime('d/m H:i')
                    ->sortable(),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->label('Xem')
                    ->icon('heroicon-o-eye')
                    ->url(fn(WorkflowJob $record): string => route('filament.admin.resources.workflow-jobs.edit', $record)),
            ])
            ->paginated(false);
    }
}
