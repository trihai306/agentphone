<?php

namespace App\Filament\Widgets;

use App\Models\UserServicePackage;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class LatestServiceOrders extends BaseWidget
{
    protected static ?int $sort = 4;

    protected int | string | array $columnSpan = 'full';

    protected static ?string $heading = 'Đơn hàng gói dịch vụ gần đây';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                UserServicePackage::query()
                    ->with(['user', 'servicePackage'])
                    ->latest()
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\TextColumn::make('order_code')
                    ->label('Mã đơn')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Khách hàng')
                    ->searchable(),

                Tables\Columns\TextColumn::make('servicePackage.name')
                    ->label('Gói')
                    ->limit(20),

                Tables\Columns\TextColumn::make('price_paid')
                    ->label('Giá')
                    ->money('VND'),

                Tables\Columns\BadgeColumn::make('payment_status')
                    ->label('Thanh toán')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'Chờ TT',
                        'paid' => 'Đã TT',
                        'failed' => 'Lỗi',
                        'refunded' => 'Hoàn',
                        default => $state,
                    })
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'paid',
                        'danger' => 'failed',
                        'info' => 'refunded',
                    ]),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'Chờ',
                        'active' => 'Active',
                        'expired' => 'Hết hạn',
                        'cancelled' => 'Hủy',
                        'refunded' => 'Hoàn',
                        default => $state,
                    })
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'active',
                        'secondary' => 'expired',
                        'danger' => 'cancelled',
                        'info' => 'refunded',
                    ]),

                Tables\Columns\TextColumn::make('expires_at')
                    ->label('Hết hạn')
                    ->dateTime('d/m/Y')
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m H:i'),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->label('Xem')
                    ->icon('heroicon-m-eye')
                    ->url(fn (UserServicePackage $record): string => route('filament.admin.resources.user-service-packages.edit', $record)),
            ])
            ->paginated(false);
    }
}
