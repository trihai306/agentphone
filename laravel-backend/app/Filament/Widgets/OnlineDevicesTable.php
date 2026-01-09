<?php

namespace App\Filament\Widgets;

use App\Models\Device;
use App\Services\DeviceAnalyticsService;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class OnlineDevicesTable extends BaseWidget
{
    protected static ?string $heading = 'Thiết Bị Đang Online';

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 'full';

    protected static ?string $pollingInterval = '15s';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Device::query()
                    ->with('user')
                    ->where('status', Device::STATUS_ACTIVE)
                    ->where('last_active_at', '>=', now()->subMinutes(5))
                    ->orderByDesc('last_active_at')
            )
            ->columns([
                TextColumn::make('user.name')
                    ->label('Người dùng')
                    ->searchable()
                    ->sortable()
                    ->icon('heroicon-m-user')
                    ->iconColor('primary'),

                TextColumn::make('name')
                    ->label('Tên thiết bị')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('model')
                    ->label('Model')
                    ->searchable()
                    ->badge()
                    ->color('gray'),

                TextColumn::make('android_version')
                    ->label('Android')
                    ->badge()
                    ->color('info'),

                TextColumn::make('last_active_at')
                    ->label('Hoạt động lần cuối')
                    ->since()
                    ->sortable()
                    ->color('success'),

                TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'active' => '🟢 Online',
                        'inactive' => '⚫ Offline',
                        'blocked' => '🔴 Bị khóa',
                        default => $state,
                    })
                    ->color(fn(string $state): string => match ($state) {
                        'active' => 'success',
                        'inactive' => 'gray',
                        'blocked' => 'danger',
                        default => 'gray',
                    }),
            ])
            ->defaultSort('last_active_at', 'desc')
            ->paginated([5, 10, 25])
            ->defaultPaginationPageOption(5)
            ->emptyStateHeading('Không có thiết bị online')
            ->emptyStateDescription('Chưa có thiết bị nào kết nối trong 5 phút gần đây.')
            ->emptyStateIcon('heroicon-o-device-phone-mobile');
    }
}
