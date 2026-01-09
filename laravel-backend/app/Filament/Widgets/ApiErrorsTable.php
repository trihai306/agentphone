<?php

namespace App\Filament\Widgets;

use App\Models\ApiLog;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class ApiErrorsTable extends BaseWidget
{
    protected static ?string $heading = 'Lỗi API Gần Đây';

    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 1;

    public function table(Table $table): Table
    {
        return $table
            ->query(
                ApiLog::query()
                    ->with('user')
                    ->failed()
                    ->orderByDesc('created_at')
            )
            ->columns([
                TextColumn::make('created_at')
                    ->label('Thời gian')
                    ->since()
                    ->sortable(),

                TextColumn::make('method')
                    ->label('Method')
                    ->badge()
                    ->color(fn(ApiLog $record): string => $record->method_color),

                TextColumn::make('endpoint')
                    ->label('Endpoint')
                    ->limit(30)
                    ->tooltip(fn(ApiLog $record) => $record->endpoint),

                TextColumn::make('status_code')
                    ->label('Status')
                    ->badge()
                    ->color(fn(ApiLog $record): string => $record->status_color),

                TextColumn::make('error_message')
                    ->label('Lỗi')
                    ->limit(40)
                    ->wrap(),
            ])
            ->paginated([5, 10])
            ->defaultPaginationPageOption(5);
    }
}
