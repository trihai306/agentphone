<?php

namespace App\Filament\Widgets;

use App\Models\Flow;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class RecentWorkflowsTable extends BaseWidget
{
    protected static ?string $heading = 'Workflows Gần Đây';

    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 'full';

    protected static ?string $pollingInterval = '30s';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Flow::query()
                    ->with(['user', 'nodes'])
                    ->withCount('nodes', 'edges')
                    ->orderByDesc('updated_at')
            )
            ->columns([
                TextColumn::make('name')
                    ->label('Tên Workflow')
                    ->searchable()
                    ->sortable()
                    ->icon('heroicon-m-arrows-right-left')
                    ->iconColor('primary'),

                TextColumn::make('user.name')
                    ->label('Người tạo')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'draft' => 'Bản nháp',
                        'active' => 'Hoạt động',
                        'archived' => 'Lưu trữ',
                        default => $state,
                    })
                    ->color(fn(string $state): string => match ($state) {
                        'draft' => 'warning',
                        'active' => 'success',
                        'archived' => 'gray',
                        default => 'gray',
                    }),

                TextColumn::make('is_template')
                    ->label('Template')
                    ->badge()
                    ->formatStateUsing(fn(bool $state): string => $state ? '✓ Template' : '—')
                    ->color(fn(bool $state): string => $state ? 'info' : 'gray'),

                TextColumn::make('nodes_count')
                    ->label('Nodes')
                    ->sortable()
                    ->alignCenter()
                    ->badge()
                    ->color('primary'),

                TextColumn::make('edges_count')
                    ->label('Edges')
                    ->sortable()
                    ->alignCenter()
                    ->badge()
                    ->color('warning'),

                TextColumn::make('updated_at')
                    ->label('Cập nhật')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('updated_at', 'desc')
            ->paginated([5, 10, 25])
            ->defaultPaginationPageOption(5)
            ->emptyStateHeading('Chưa có Workflow')
            ->emptyStateDescription('Bạn chưa tạo workflow nào.')
            ->emptyStateIcon('heroicon-o-arrows-right-left');
    }
}
