<?php

namespace App\Filament\Resources;

use App\Filament\Resources\WalletResource\Pages;
use App\Filament\Resources\WalletResource\RelationManagers;
use App\Models\Wallet;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class WalletResource extends Resource
{
    protected static ?string $model = Wallet::class;

    protected static ?string $navigationIcon = 'heroicon-o-wallet';

    protected static ?string $navigationLabel = 'Ví tiền';

    protected static ?string $modelLabel = 'Ví tiền';

    protected static ?string $pluralModelLabel = 'Ví tiền';

    protected static ?string $navigationGroup = 'Tài Chính';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin ví')
                    ->description('Thông tin cơ bản về ví tiền')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Khách hàng')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('currency')
                            ->label('Loại tiền')
                            ->options([
                                'VND' => '🇻🇳 VND - Việt Nam Đồng',
                                'USD' => '🇺🇸 USD - US Dollar',
                                'EUR' => '🇪🇺 EUR - Euro',
                            ])
                            ->required()
                            ->default('VND'),
                    ])->columns(2),

                Forms\Components\Section::make('Số dư')
                    ->description('Quản lý số dư ví')
                    ->schema([
                        Forms\Components\TextInput::make('balance')
                            ->label('Số dư khả dụng')
                            ->required()
                            ->numeric()
                            ->prefix('₫')
                            ->default(0),
                        Forms\Components\TextInput::make('locked_balance')
                            ->label('Số dư đóng băng')
                            ->required()
                            ->numeric()
                            ->prefix('₫')
                            ->default(0)
                            ->helperText('Số tiền đang chờ xử lý giao dịch'),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Kích hoạt')
                            ->required()
                            ->default(true)
                            ->helperText('Ví bị vô hiệu hóa sẽ không thể giao dịch'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Khách hàng')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('currency')
                    ->label('Loại tiền')
                    ->badge()
                    ->color('info')
                    ->sortable(),
                Tables\Columns\TextColumn::make('balance')
                    ->label('Số dư')
                    ->money('VND')
                    ->sortable()
                    ->color('success')
                    ->weight('bold')
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->money('VND')),
                Tables\Columns\TextColumn::make('locked_balance')
                    ->label('Đóng băng')
                    ->money('VND')
                    ->sortable()
                    ->color('warning')
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->money('VND')),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Hoạt động')
                    ->boolean()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('currency')
                    ->label('Loại tiền')
                    ->options([
                        'VND' => 'VND',
                        'USD' => 'USD',
                        'EUR' => 'EUR',
                    ]),
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Trạng thái')
                    ->boolean()
                    ->trueLabel('Đang hoạt động')
                    ->falseLabel('Đã vô hiệu'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),

                Tables\Actions\Action::make('adjust_balance')
                    ->label('Điều chỉnh')
                    ->icon('heroicon-o-adjustments-horizontal')
                    ->color('warning')
                    ->button()
                    ->modalHeading('💰 Điều chỉnh số dư ví')
                    ->modalDescription(fn(Wallet $record) => new \Illuminate\Support\HtmlString(
                        '<div class="space-y-3 text-left">' .
                        '<div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Khách hàng</p>' .
                        '<p class="font-semibold text-lg">' . $record->user->name . '</p>' .
                        '</div>' .
                        '<div class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Số dư hiện tại</p>' .
                        '<p class="text-2xl font-bold text-blue-600 dark:text-blue-400">' . number_format($record->balance, 0, ',', '.') . ' ₫</p>' .
                        '</div>' .
                        '</div>'
                    ))
                    ->modalSubmitActionLabel('Xác nhận điều chỉnh')
                    ->modalIcon('heroicon-o-banknotes')
                    ->modalIconColor('warning')
                    ->form([
                        Forms\Components\Select::make('type')
                            ->label('Loại điều chỉnh')
                            ->options([
                                'add' => '➕ Cộng tiền vào ví',
                                'subtract' => '➖ Trừ tiền từ ví',
                            ])
                            ->required()
                            ->native(false),
                        Forms\Components\TextInput::make('amount')
                            ->label('Số tiền')
                            ->numeric()
                            ->required()
                            ->minValue(1000)
                            ->step(1000)
                            ->prefix('₫')
                            ->placeholder('Nhập số tiền...'),
                        Forms\Components\Textarea::make('reason')
                            ->label('Lý do điều chỉnh')
                            ->required()
                            ->placeholder('Nhập lý do điều chỉnh số dư...')
                            ->rows(2),
                    ])
                    ->action(function (Wallet $record, array $data) {
                        $amount = (float) $data['amount'];
                        $previousBalance = $record->balance;

                        if ($data['type'] === 'add') {
                            $record->increment('balance', $amount);
                            $action = 'cộng';
                            $icon = '➕';
                        } else {
                            if ($record->balance < $amount) {
                                Notification::make()
                                    ->danger()
                                    ->title('❌ Không đủ số dư')
                                    ->body('Số dư ví không đủ để thực hiện trừ tiền.')
                                    ->send();
                                return;
                            }
                            $record->decrement('balance', $amount);
                            $action = 'trừ';
                            $icon = '➖';
                        }

                        $newBalance = $record->fresh()->balance;

                        Notification::make()
                            ->success()
                            ->title("{$icon} Điều chỉnh thành công!")
                            ->body(
                                "Đã {$action} " . number_format($amount, 0, ',', '.') . " ₫ cho ví của {$record->user->name}.\n" .
                                "Số dư mới: " . number_format($newBalance, 0, ',', '.') . " ₫"
                            )
                            ->duration(5000)
                            ->send();
                    }),

                Tables\Actions\Action::make('toggle_status')
                    ->label(fn(Wallet $record) => $record->is_active ? 'Vô hiệu hóa' : 'Kích hoạt')
                    ->icon(fn(Wallet $record) => $record->is_active ? 'heroicon-o-x-circle' : 'heroicon-o-check-circle')
                    ->color(fn(Wallet $record) => $record->is_active ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->modalHeading(fn(Wallet $record) => $record->is_active ? '⚠️ Vô hiệu hóa ví' : '✅ Kích hoạt ví')
                    ->modalDescription(fn(Wallet $record) => $record->is_active
                        ? 'Ví bị vô hiệu hóa sẽ không thể thực hiện giao dịch.'
                        : 'Kích hoạt ví để cho phép giao dịch.')
                    ->action(function (Wallet $record) {
                        $record->update(['is_active' => !$record->is_active]);

                        $status = $record->is_active ? 'kích hoạt' : 'vô hiệu hóa';

                        Notification::make()
                            ->success()
                            ->title("Đã {$status} ví")
                            ->body("Ví của {$record->user->name} đã được {$status}.")
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
            ->defaultSort('balance', 'desc');
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
            'index' => Pages\ListWallets::route('/'),
            'create' => Pages\CreateWallet::route('/create'),
            'edit' => Pages\EditWallet::route('/{record}/edit'),
        ];
    }
}

