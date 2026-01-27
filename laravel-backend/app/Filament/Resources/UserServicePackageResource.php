<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserServicePackageResource\Pages;
use App\Models\UserServicePackage;
use App\Models\ServicePackage;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Builder;

class UserServicePackageResource extends Resource
{
    protected static ?string $model = UserServicePackage::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-cart';

    protected static ?string $navigationLabel = 'Đơn hàng gói dịch vụ';

    protected static ?string $modelLabel = 'Đơn hàng';

    protected static ?string $pluralModelLabel = 'Đơn hàng gói dịch vụ';

    protected static ?string $navigationGroup = 'Tài Chính';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin đơn hàng')
                    ->schema([
                        Forms\Components\TextInput::make('order_code')
                            ->label('Mã đơn hàng')
                            ->disabled()
                            ->dehydrated(false)
                            ->placeholder('Tự động tạo'),

                        Forms\Components\Select::make('user_id')
                            ->label('Khách hàng')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),

                        Forms\Components\Select::make('service_package_id')
                            ->label('Gói dịch vụ')
                            ->relationship('servicePackage', 'name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->reactive()
                            ->afterStateUpdated(function ($state, callable $set) {
                                if ($state) {
                                    $package = ServicePackage::find($state);
                                    if ($package) {
                                        $set('price_paid', $package->price);
                                        $set('currency', $package->currency);
                                        $set('credits_remaining', $package->credits);
                                    }
                                }
                            }),

                        Forms\Components\Select::make('transaction_id')
                            ->label('Giao dịch liên kết')
                            ->relationship('transaction', 'transaction_code')
                            ->searchable()
                            ->preload(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Thanh toán')
                    ->schema([
                        Forms\Components\TextInput::make('price_paid')
                            ->label('Giá đã thanh toán')
                            ->numeric()
                            ->required()
                            ->prefix('VND')
                            ->step(1000),

                        Forms\Components\TextInput::make('discount_amount')
                            ->label('Số tiền giảm giá')
                            ->numeric()
                            ->default(0)
                            ->prefix('VND')
                            ->step(1000),

                        Forms\Components\TextInput::make('discount_code')
                            ->label('Mã giảm giá')
                            ->maxLength(50),

                        Forms\Components\Select::make('currency')
                            ->label('Đơn vị tiền')
                            ->options([
                                'VND' => 'VND',
                                'USD' => 'USD',
                            ])
                            ->default('VND')
                            ->required(),

                        Forms\Components\Select::make('payment_method')
                            ->label('Phương thức thanh toán')
                            ->options([
                                'bank_transfer' => 'Chuyển khoản ngân hàng',
                                'wallet' => 'Ví điện tử',
                                'credit_card' => 'Thẻ tín dụng',
                                'momo' => 'MoMo',
                                'vnpay' => 'VNPay',
                                'admin' => 'Admin cấp',
                            ]),

                        Forms\Components\Select::make('payment_status')
                            ->label('Trạng thái thanh toán')
                            ->options(UserServicePackage::getPaymentStatuses())
                            ->default('pending')
                            ->required(),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Trạng thái gói')
                    ->schema([
                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options(UserServicePackage::getStatuses())
                            ->default('pending')
                            ->required(),

                        Forms\Components\DateTimePicker::make('activated_at')
                            ->label('Ngày kích hoạt'),

                        Forms\Components\DateTimePicker::make('expires_at')
                            ->label('Ngày hết hạn'),

                        Forms\Components\TextInput::make('credits_remaining')
                            ->label('Credits còn lại')
                            ->numeric(),

                        Forms\Components\TextInput::make('credits_used')
                            ->label('Credits đã dùng')
                            ->numeric()
                            ->default(0),

                        Forms\Components\Toggle::make('auto_renew')
                            ->label('Tự động gia hạn')
                            ->default(false),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Ghi chú')
                    ->schema([
                        Forms\Components\Textarea::make('user_note')
                            ->label('Ghi chú của khách hàng')
                            ->rows(2),

                        Forms\Components\Textarea::make('admin_note')
                            ->label('Ghi chú Admin')
                            ->rows(2),

                        Forms\Components\Textarea::make('cancel_reason')
                            ->label('Lý do hủy')
                            ->rows(2),
                    ])
                    ->columns(1),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('order_code')
                    ->label('Mã đơn')
                    ->searchable()
                    ->sortable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Khách hàng')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('servicePackage.name')
                    ->label('Gói dịch vụ')
                    ->searchable()
                    ->sortable()
                    ->limit(20),

                Tables\Columns\TextColumn::make('price_paid')
                    ->label('Giá')
                    ->money('VND')
                    ->sortable()
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->money('VND')),

                Tables\Columns\BadgeColumn::make('payment_status')
                    ->label('Thanh toán')
                    ->formatStateUsing(fn(string $state): string => UserServicePackage::getPaymentStatuses()[$state] ?? $state)
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'paid',
                        'danger' => 'failed',
                        'info' => 'refunded',
                    ]),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn(string $state): string => UserServicePackage::getStatuses()[$state] ?? $state)
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'active',
                        'secondary' => 'expired',
                        'danger' => 'cancelled',
                        'info' => 'refunded',
                    ]),

                Tables\Columns\TextColumn::make('activated_at')
                    ->label('Kích hoạt')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('expires_at')
                    ->label('Hết hạn')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->placeholder('Vô thời hạn')
                    ->color(fn($record) => $record->expires_at && $record->expires_at->isPast() ? 'danger' : null),

                Tables\Columns\TextColumn::make('credits_remaining')
                    ->label('Credits')
                    ->formatStateUsing(fn($record) => $record->credits_remaining !== null
                        ? "{$record->credits_remaining}/{$record->credits_used}"
                        : '-')
                    ->placeholder('-'),

                Tables\Columns\IconColumn::make('auto_renew')
                    ->label('Tự động gia hạn')
                    ->boolean()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options(UserServicePackage::getStatuses())
                    ->multiple(),

                Tables\Filters\SelectFilter::make('payment_status')
                    ->label('Thanh toán')
                    ->options(UserServicePackage::getPaymentStatuses())
                    ->multiple(),

                Tables\Filters\SelectFilter::make('service_package_id')
                    ->label('Gói dịch vụ')
                    ->relationship('servicePackage', 'name'),

                Tables\Filters\Filter::make('expiring_soon')
                    ->label('Sắp hết hạn (7 ngày)')
                    ->query(fn(Builder $query): Builder => $query
                        ->where('status', 'active')
                        ->whereNotNull('expires_at')
                        ->whereBetween('expires_at', [now(), now()->addDays(7)])),

                Tables\Filters\Filter::make('expired')
                    ->label('Đã hết hạn')
                    ->query(fn(Builder $query): Builder => $query
                        ->where('status', 'active')
                        ->whereNotNull('expires_at')
                        ->where('expires_at', '<', now())),

                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('created_from')
                            ->label('Từ ngày'),
                        Forms\Components\DatePicker::make('created_until')
                            ->label('Đến ngày'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['created_from'],
                                fn(Builder $query, $date): Builder => $query->whereDate('created_at', '>=', $date),
                            )
                            ->when(
                                $data['created_until'],
                                fn(Builder $query, $date): Builder => $query->whereDate('created_at', '<=', $date),
                            );
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),

                Tables\Actions\Action::make('activate')
                    ->label('Kích hoạt')
                    ->icon('heroicon-o-play')
                    ->color('success')
                    ->button()
                    ->modalHeading('🚀 Kích hoạt gói dịch vụ')
                    ->modalDescription(fn(UserServicePackage $record) => new \Illuminate\Support\HtmlString(
                        '<div class="space-y-3 text-left">' .
                        '<div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Đơn hàng</p>' .
                        '<p class="font-mono font-semibold">' . $record->order_code . '</p>' .
                        '</div>' .
                        '<div class="grid grid-cols-2 gap-4">' .
                        '<div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Khách hàng</p>' .
                        '<p class="font-semibold text-blue-700 dark:text-blue-300">' . ($record->user?->name ?? 'N/A') . '</p>' .
                        '</div>' .
                        '<div class="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Gói dịch vụ</p>' .
                        '<p class="font-semibold text-purple-700 dark:text-purple-300">' . ($record->servicePackage?->name ?? 'N/A') . '</p>' .
                        '</div>' .
                        '</div>' .
                        '<div class="grid grid-cols-2 gap-4">' .
                        '<div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Credits sẽ cấp</p>' .
                        '<p class="font-semibold text-amber-700 dark:text-amber-300">' . number_format($record->servicePackage?->credits ?? 0, 0, ',', '.') . ' credits</p>' .
                        '</div>' .
                        '<div class="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Thời hạn</p>' .
                        '<p class="font-semibold text-cyan-700 dark:text-cyan-300">' . ($record->servicePackage?->duration_days ?? 30) . ' ngày</p>' .
                        '</div>' .
                        '</div>' .
                        '<p class="text-xs text-center text-gray-400 dark:text-gray-500">⚠️ Gói sẽ được kích hoạt ngay lập tức</p>' .
                        '</div>'
                    ))
                    ->modalSubmitActionLabel('Kích hoạt ngay')
                    ->modalIcon('heroicon-o-rocket-launch')
                    ->modalIconColor('success')
                    ->visible(fn(UserServicePackage $record): bool =>
                        $record->status === 'pending' && $record->payment_status === 'paid' && $record->servicePackage !== null)
                    ->action(function (UserServicePackage $record) {
                        try {
                            $record->activate();

                            $expiresAt = $record->expires_at ? $record->expires_at->format('d/m/Y H:i') : 'Vô thời hạn';

                            Notification::make()
                                ->success()
                                ->title('🚀 Kích hoạt thành công!')
                                ->body("Gói " . ($record->servicePackage?->name ?? 'N/A') . " đã được kích hoạt cho " . ($record->user?->name ?? 'N/A') . ".\nHết hạn: {$expiresAt}")
                                ->duration(5000)
                                ->send();
                        } catch (\RuntimeException $e) {
                            Notification::make()
                                ->danger()
                                ->title('❌ Không thể kích hoạt')
                                ->body($e->getMessage())
                                ->duration(5000)
                                ->send();
                        }
                    }),

                Tables\Actions\Action::make('approve_payment')
                    ->label('Xác nhận TT')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->button()
                    ->modalHeading('💳 Xác nhận thanh toán đơn hàng')
                    ->modalDescription(fn(UserServicePackage $record) => new \Illuminate\Support\HtmlString(
                        '<div class="space-y-3 text-left">' .
                        '<div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Mã đơn hàng</p>' .
                        '<p class="font-mono font-semibold">' . $record->order_code . '</p>' .
                        '</div>' .
                        '<div class="grid grid-cols-2 gap-4">' .
                        '<div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Khách hàng</p>' .
                        '<p class="font-semibold text-blue-700 dark:text-blue-300">' . ($record->user?->name ?? 'N/A') . '</p>' .
                        '</div>' .
                        '<div class="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Gói dịch vụ</p>' .
                        '<p class="font-semibold text-purple-700 dark:text-purple-300">' . ($record->servicePackage?->name ?? 'N/A') . '</p>' .
                        '</div>' .
                        '</div>' .
                        '<div class="p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Số tiền thanh toán</p>' .
                        '<p class="text-2xl font-bold text-green-600 dark:text-green-400">' . number_format($record->price_paid ?? 0, 0, ',', '.') . ' ₫</p>' .
                        '</div>' .
                        '<p class="text-xs text-center text-gray-400 dark:text-gray-500">⚠️ Hành động này sẽ đánh dấu đơn hàng đã thanh toán</p>' .
                        '</div>'
                    ))
                    ->modalSubmitActionLabel('Xác nhận đã thanh toán')
                    ->modalIcon('heroicon-o-banknotes')
                    ->modalIconColor('success')
                    ->form([
                        Forms\Components\Checkbox::make('confirmed')
                            ->label('Tôi xác nhận đã nhận được thanh toán từ khách hàng')
                            ->required()
                            ->accepted()
                            ->validationMessages([
                                'accepted' => 'Bạn phải xác nhận đã nhận thanh toán trước khi tiếp tục.',
                            ]),
                        Forms\Components\Textarea::make('admin_note')
                            ->label('Ghi chú (tùy chọn)')
                            ->placeholder('Nhập ghi chú nếu cần...')
                            ->rows(2),
                    ])
                    ->visible(fn(UserServicePackage $record): bool => $record->payment_status === 'pending')
                    ->action(function (UserServicePackage $record, array $data) {
                        $record->update([
                            'payment_status' => 'paid',
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                            'admin_note' => $data['admin_note'] ?? $record->admin_note,
                        ]);

                        Notification::make()
                            ->success()
                            ->title('✅ Xác nhận thanh toán thành công!')
                            ->body("Đã xác nhận thanh toán cho đơn hàng {$record->order_code} của " . ($record->user?->name ?? 'N/A') . ".")
                            ->duration(5000)
                            ->send();
                    }),

                Tables\Actions\Action::make('cancel')
                    ->label('Hủy')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn(UserServicePackage $record): bool =>
                        in_array($record->status, ['pending', 'active']))
                    ->form([
                        Forms\Components\Textarea::make('cancel_reason')
                            ->label('Lý do hủy')
                            ->required(),
                    ])
                    ->action(function (UserServicePackage $record, array $data) {
                        $record->cancel(auth()->id(), $data['cancel_reason']);

                        Notification::make()
                            ->warning()
                            ->title('Đã hủy gói dịch vụ')
                            ->send();
                    }),

                Tables\Actions\Action::make('extend')
                    ->label('Gia hạn')
                    ->icon('heroicon-o-arrow-path')
                    ->color('info')
                    ->visible(fn(UserServicePackage $record): bool =>
                        in_array($record->status, ['active', 'expired']))
                    ->form([
                        Forms\Components\TextInput::make('days')
                            ->label('Số ngày gia hạn')
                            ->numeric()
                            ->required()
                            ->minValue(1),
                    ])
                    ->action(function (UserServicePackage $record, array $data) {
                        $newExpiry = $record->expires_at && $record->expires_at->isFuture()
                            ? $record->expires_at->addDays($data['days'])
                            : now()->addDays($data['days']);

                        $record->update([
                            'expires_at' => $newExpiry,
                            'status' => 'active',
                            'renewed_at' => now(),
                        ]);

                        Notification::make()
                            ->success()
                            ->title("Đã gia hạn thêm {$data['days']} ngày")
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    \pxlrbt\FilamentExcel\Actions\Tables\ExportBulkAction::make()
                        ->label('Xuất Excel'),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUserServicePackages::route('/'),
            'create' => Pages\CreateUserServicePackage::route('/create'),
            'edit' => Pages\EditUserServicePackage::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('payment_status', 'pending')->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
