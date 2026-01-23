<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DeviceResource\Pages;
use App\Filament\Resources\DeviceResource\RelationManagers;
use App\Models\Device;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class DeviceResource extends Resource
{
    protected static ?string $model = Device::class;

    protected static ?string $navigationIcon = 'heroicon-o-device-phone-mobile';

    protected static ?string $navigationLabel = 'Thiết bị';

    protected static ?string $modelLabel = 'Thiết bị';

    protected static ?string $pluralModelLabel = 'Thiết bị';

    protected static ?string $navigationGroup = '👥 Người Dùng';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin thiết bị')
                    ->description('Thông tin cơ bản về thiết bị')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Khách hàng')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\TextInput::make('device_id')
                            ->label('Device ID')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Forms\Components\TextInput::make('name')
                            ->label('Tên thiết bị')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('model')
                            ->label('Model')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('android_version')
                            ->label('Phiên bản Android')
                            ->maxLength(255),
                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options([
                                'active' => '🟢 Đang hoạt động',
                                'inactive' => '🟡 Không hoạt động',
                                'blocked' => '🔴 Đã khóa',
                            ])
                            ->required()
                            ->default('active'),
                        Forms\Components\DateTimePicker::make('last_active_at')
                            ->label('Hoạt động lần cuối'),
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
                    ->sortable(),
                Tables\Columns\TextColumn::make('device_id')
                    ->label('Device ID')
                    ->searchable()
                    ->copyable()
                    ->limit(20),
                Tables\Columns\TextColumn::make('name')
                    ->label('Tên thiết bị')
                    ->searchable()
                    ->placeholder('Chưa đặt tên'),
                Tables\Columns\TextColumn::make('model')
                    ->label('Model')
                    ->searchable(),
                Tables\Columns\TextColumn::make('android_version')
                    ->label('Android'),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('Trạng thái')
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        'active' => 'Hoạt động',
                        'inactive' => 'Không hoạt động',
                        'blocked' => 'Đã khóa',
                        default => $state,
                    })
                    ->colors([
                        'success' => 'active',
                        'warning' => 'inactive',
                        'danger' => 'blocked',
                    ]),
                Tables\Columns\TextColumn::make('last_active_at')
                    ->label('Lần cuối hoạt động')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->placeholder('Chưa hoạt động'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'active' => 'Hoạt động',
                        'inactive' => 'Không hoạt động',
                        'blocked' => 'Đã khóa',
                    ]),
                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Khách hàng')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),

                Tables\Actions\Action::make('block')
                    ->label('Khóa')
                    ->icon('heroicon-o-lock-closed')
                    ->color('danger')
                    ->button()
                    ->modalHeading('🔒 Khóa thiết bị')
                    ->modalDescription(fn(Device $record) => new \Illuminate\Support\HtmlString(
                        '<div class="space-y-3 text-left">' .
                        '<div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Thiết bị</p>' .
                        '<p class="font-semibold text-red-700 dark:text-red-300">' . ($record->name ?? $record->device_id) . '</p>' .
                        '</div>' .
                        '<div class="grid grid-cols-2 gap-4">' .
                        '<div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Khách hàng</p>' .
                        '<p class="font-semibold">' . ($record->user->name ?? 'N/A') . '</p>' .
                        '</div>' .
                        '<div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Model</p>' .
                        '<p class="font-semibold">' . ($record->model ?? 'N/A') . '</p>' .
                        '</div>' .
                        '</div>' .
                        '<p class="text-xs text-center text-red-500">⚠️ Thiết bị bị khóa sẽ không thể truy cập hệ thống</p>' .
                        '</div>'
                    ))
                    ->modalSubmitActionLabel('Khóa thiết bị')
                    ->modalIcon('heroicon-o-lock-closed')
                    ->modalIconColor('danger')
                    ->form([
                        Forms\Components\Textarea::make('block_reason')
                            ->label('Lý do khóa')
                            ->placeholder('Nhập lý do khóa thiết bị...')
                            ->required()
                            ->rows(2),
                    ])
                    ->visible(fn(Device $record) => $record->status !== 'blocked')
                    ->action(function (Device $record, array $data) {
                        $record->update([
                            'status' => 'blocked',
                            'block_reason' => $data['block_reason'] ?? null,
                        ]);

                        Notification::make()
                            ->warning()
                            ->title('🔒 Đã khóa thiết bị')
                            ->body("Thiết bị {$record->name} của {$record->user->name} đã bị khóa.")
                            ->duration(5000)
                            ->send();
                    }),

                Tables\Actions\Action::make('unblock')
                    ->label('Mở khóa')
                    ->icon('heroicon-o-lock-open')
                    ->color('success')
                    ->button()
                    ->modalHeading('🔓 Mở khóa thiết bị')
                    ->modalDescription(fn(Device $record) => new \Illuminate\Support\HtmlString(
                        '<div class="space-y-3 text-left">' .
                        '<div class="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">' .
                        '<p class="text-sm text-gray-500 dark:text-gray-400">Thiết bị</p>' .
                        '<p class="font-semibold text-green-700 dark:text-green-300">' . ($record->name ?? $record->device_id) . '</p>' .
                        '</div>' .
                        '<p class="text-sm text-gray-600 dark:text-gray-400">Bạn có chắc muốn mở khóa thiết bị này? Thiết bị sẽ có thể truy cập lại hệ thống.</p>' .
                        '</div>'
                    ))
                    ->modalSubmitActionLabel('Mở khóa')
                    ->modalIcon('heroicon-o-lock-open')
                    ->modalIconColor('success')
                    ->visible(fn(Device $record) => $record->status === 'blocked')
                    ->action(function (Device $record) {
                        $record->update([
                            'status' => 'active',
                            'block_reason' => null,
                        ]);

                        Notification::make()
                            ->success()
                            ->title('🔓 Đã mở khóa thiết bị')
                            ->body("Thiết bị {$record->name} của {$record->user->name} đã được mở khóa.")
                            ->duration(5000)
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
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
            'index' => Pages\ListDevices::route('/'),
            'create' => Pages\CreateDevice::route('/create'),
            'edit' => Pages\EditDevice::route('/{record}/edit'),
        ];
    }
}

