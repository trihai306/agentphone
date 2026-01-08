<?php

namespace App\Filament\Widgets;

use App\Models\Transaction;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class LatestTransactions extends BaseWidget
{
    protected static ?int $sort = 3;

    protected int | string | array $columnSpan = 'full';

    protected static ?string $heading = 'Giao dịch gần đây';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Transaction::query()
                    ->latest()
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\TextColumn::make('transaction_code')
                    ->label('Mã GD')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('User')
                    ->searchable(),

                Tables\Columns\BadgeColumn::make('type')
                    ->label('Loại')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'deposit' => 'Nạp',
                        'withdrawal' => 'Rút',
                        default => $state,
                    })
                    ->colors([
                        'success' => 'deposit',
                        'danger' => 'withdrawal',
                    ]),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Số tiền')
                    ->money('VND'),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'Chờ',
                        'processing' => 'Xử lý',
                        'completed' => 'Xong',
                        'failed' => 'Lỗi',
                        'cancelled' => 'Hủy',
                        default => $state,
                    })
                    ->colors([
                        'warning' => 'pending',
                        'info' => 'processing',
                        'success' => 'completed',
                        'danger' => 'failed',
                        'secondary' => 'cancelled',
                    ]),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Thời gian')
                    ->dateTime('d/m H:i')
                    ->sortable(),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->label('Xem')
                    ->icon('heroicon-m-eye')
                    ->url(fn (Transaction $record): string => route('filament.admin.resources.transactions.edit', $record)),
            ])
            ->paginated(false);
    }
}
