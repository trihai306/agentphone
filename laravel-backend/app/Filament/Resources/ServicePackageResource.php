<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ServicePackageResource\Pages;
use App\Models\ServicePackage;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ServicePackageResource extends Resource
{
    protected static ?string $model = ServicePackage::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';

    protected static ?string $navigationLabel = 'Gói dịch vụ';

    protected static ?string $modelLabel = 'Gói dịch vụ';

    protected static ?string $pluralModelLabel = 'Gói dịch vụ';

    protected static ?string $navigationGroup = '💰 Tài Chính';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin cơ bản')
                    ->schema([
                        Forms\Components\TextInput::make('code')
                            ->label('Mã gói')
                            ->disabled()
                            ->dehydrated(false)
                            ->placeholder('Tự động tạo'),

                        Forms\Components\TextInput::make('name')
                            ->label('Tên gói')
                            ->required()
                            ->maxLength(255),

                        Forms\Components\Select::make('type')
                            ->label('Loại gói')
                            ->options(ServicePackage::getTypes())
                            ->required()
                            ->default('subscription')
                            ->reactive(),

                        Forms\Components\Textarea::make('description')
                            ->label('Mô tả')
                            ->rows(3)
                            ->columnSpanFull(),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Giá và thời hạn')
                    ->schema([
                        Forms\Components\TextInput::make('price')
                            ->label('Giá bán')
                            ->numeric()
                            ->required()
                            ->prefix('VND')
                            ->step(1000)
                            ->default(0),

                        Forms\Components\TextInput::make('original_price')
                            ->label('Giá gốc')
                            ->numeric()
                            ->prefix('VND')
                            ->step(1000)
                            ->helperText('Để trống nếu không giảm giá'),

                        Forms\Components\Select::make('currency')
                            ->label('Đơn vị tiền')
                            ->options([
                                'VND' => 'VND',
                                'USD' => 'USD',
                            ])
                            ->default('VND')
                            ->required(),

                        Forms\Components\TextInput::make('duration_days')
                            ->label('Thời hạn (ngày)')
                            ->numeric()
                            ->visible(fn (callable $get) => $get('type') === 'subscription')
                            ->helperText('Số ngày sử dụng gói'),

                        Forms\Components\TextInput::make('credits')
                            ->label('Số Credits')
                            ->numeric()
                            ->visible(fn (callable $get) => $get('type') === 'credits')
                            ->helperText('Số credits được cấp'),

                        Forms\Components\TextInput::make('max_devices')
                            ->label('Số thiết bị tối đa')
                            ->numeric()
                            ->helperText('Để trống nếu không giới hạn'),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Tính năng gói')
                    ->schema([
                        Forms\Components\Repeater::make('features')
                            ->label('Danh sách tính năng')
                            ->schema([
                                Forms\Components\TextInput::make('feature')
                                    ->label('Tính năng')
                                    ->required(),
                            ])
                            ->columnSpanFull()
                            ->defaultItems(0)
                            ->addActionLabel('Thêm tính năng'),

                        Forms\Components\KeyValue::make('limits')
                            ->label('Giới hạn sử dụng')
                            ->keyLabel('Tên giới hạn')
                            ->valueLabel('Giá trị')
                            ->columnSpanFull()
                            ->helperText('VD: api_calls => 1000, storage_gb => 5'),
                    ]),

                Forms\Components\Section::make('Hiển thị')
                    ->schema([
                        Forms\Components\TextInput::make('priority')
                            ->label('Độ ưu tiên')
                            ->numeric()
                            ->default(0)
                            ->helperText('Số cao hơn hiển thị trước'),

                        Forms\Components\TextInput::make('badge')
                            ->label('Badge')
                            ->maxLength(50)
                            ->placeholder('VD: Hot, Best Seller'),

                        Forms\Components\Select::make('badge_color')
                            ->label('Màu badge')
                            ->options([
                                'primary' => 'Primary',
                                'secondary' => 'Secondary',
                                'success' => 'Success',
                                'danger' => 'Danger',
                                'warning' => 'Warning',
                                'info' => 'Info',
                            ]),

                        Forms\Components\TextInput::make('icon')
                            ->label('Icon')
                            ->maxLength(100)
                            ->placeholder('heroicon-o-star'),
                    ])
                    ->columns(4),

                Forms\Components\Section::make('Trạng thái')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->label('Hoạt động')
                            ->default(true)
                            ->helperText('Gói có hiển thị để mua không'),

                        Forms\Components\Toggle::make('is_featured')
                            ->label('Nổi bật')
                            ->default(false)
                            ->helperText('Hiển thị ở vị trí nổi bật'),

                        Forms\Components\Toggle::make('is_trial')
                            ->label('Gói dùng thử')
                            ->default(false)
                            ->reactive(),

                        Forms\Components\TextInput::make('trial_days')
                            ->label('Số ngày dùng thử')
                            ->numeric()
                            ->visible(fn (callable $get) => $get('is_trial')),
                    ])
                    ->columns(4),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('code')
                    ->label('Mã gói')
                    ->searchable()
                    ->sortable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('name')
                    ->label('Tên gói')
                    ->searchable()
                    ->sortable()
                    ->limit(30),

                Tables\Columns\BadgeColumn::make('type')
                    ->label('Loại')
                    ->formatStateUsing(fn (string $state): string => ServicePackage::getTypes()[$state] ?? $state)
                    ->colors([
                        'primary' => 'subscription',
                        'success' => 'one_time',
                        'warning' => 'credits',
                    ]),

                Tables\Columns\TextColumn::make('price')
                    ->label('Giá bán')
                    ->money('VND')
                    ->sortable(),

                Tables\Columns\TextColumn::make('original_price')
                    ->label('Giá gốc')
                    ->money('VND')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('duration_days')
                    ->label('Thời hạn')
                    ->suffix(' ngày')
                    ->sortable()
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('credits')
                    ->label('Credits')
                    ->sortable()
                    ->placeholder('-'),

                Tables\Columns\TextColumn::make('max_devices')
                    ->label('Max Devices')
                    ->sortable()
                    ->placeholder('Unlimited'),

                Tables\Columns\IconColumn::make('is_featured')
                    ->label('Nổi bật')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Hoạt động')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\TextColumn::make('user_service_packages_count')
                    ->label('Subscribers')
                    ->counts('userServicePackages')
                    ->sortable(),

                Tables\Columns\TextColumn::make('priority')
                    ->label('Ưu tiên')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('Loại gói')
                    ->options(ServicePackage::getTypes()),

                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Trạng thái')
                    ->placeholder('Tất cả')
                    ->trueLabel('Đang hoạt động')
                    ->falseLabel('Đã tắt'),

                Tables\Filters\TernaryFilter::make('is_featured')
                    ->label('Nổi bật')
                    ->placeholder('Tất cả')
                    ->trueLabel('Nổi bật')
                    ->falseLabel('Thường'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('toggle_active')
                    ->label(fn (ServicePackage $record): string => $record->is_active ? 'Tắt' : 'Bật')
                    ->icon(fn (ServicePackage $record): string => $record->is_active ? 'heroicon-o-x-circle' : 'heroicon-o-check-circle')
                    ->color(fn (ServicePackage $record): string => $record->is_active ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->action(fn (ServicePackage $record) => $record->update(['is_active' => !$record->is_active])),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('priority', 'desc');
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
            'index' => Pages\ListServicePackages::route('/'),
            'create' => Pages\CreateServicePackage::route('/create'),
            'edit' => Pages\EditServicePackage::route('/{record}/edit'),
        ];
    }
}
