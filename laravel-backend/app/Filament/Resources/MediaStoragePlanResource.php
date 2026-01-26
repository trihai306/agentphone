<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MediaStoragePlanResource\Pages;
use App\Models\MediaStoragePlan;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class MediaStoragePlanResource extends Resource
{
    protected static ?string $model = MediaStoragePlan::class;

    protected static ?string $navigationIcon = 'heroicon-o-server-stack';

    protected static ?string $navigationGroup = 'Tài Chính';

    protected static ?string $navigationLabel = 'Gói Lưu Trữ';

    protected static ?string $modelLabel = 'Gói Lưu Trữ';

    protected static ?string $pluralModelLabel = 'Gói Lưu Trữ';

    protected static ?int $navigationSort = 5;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin gói')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Tên gói')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\Textarea::make('description')
                            ->label('Mô tả')
                            ->rows(3)
                            ->columnSpanFull(),
                    ])->columns(2),
                Forms\Components\Section::make('Cấu hình')
                    ->schema([
                        Forms\Components\TextInput::make('max_storage_bytes')
                            ->label('Dung lượng tối đa (GB)')
                            ->numeric()
                            ->suffix('GB')
                            ->formatStateUsing(fn($state) => $state ? $state / 1024 / 1024 / 1024 : null)
                            ->dehydrateStateUsing(fn($state) => $state ? $state * 1024 * 1024 * 1024 : null)
                            ->required(),
                        Forms\Components\TextInput::make('price')
                            ->label('Giá')
                            ->numeric()
                            ->prefix('₫')
                            ->default(0),
                        Forms\Components\Toggle::make('is_default')
                            ->label('Gói mặc định')
                            ->helperText('Gói này sẽ được áp dụng cho user mới'),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Đang hoạt động')
                            ->default(true),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Tên gói')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('max_storage_bytes')
                    ->label('Dung lượng')
                    ->formatStateUsing(fn($state) => number_format($state / 1024 / 1024 / 1024, 1) . ' GB')
                    ->sortable(),
                Tables\Columns\TextColumn::make('price')
                    ->label('Giá')
                    ->money('VND')
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_default')
                    ->label('Mặc định')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Hoạt động')
                    ->boolean(),
                Tables\Columns\TextColumn::make('users_count')
                    ->label('Số user')
                    ->counts('users')
                    ->badge()
                    ->color('info'),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Trạng thái'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    \pxlrbt\FilamentExcel\Actions\Tables\ExportBulkAction::make()
                        ->label('Xuất Excel'),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMediaStoragePlans::route('/'),
            'create' => Pages\CreateMediaStoragePlan::route('/create'),
            'edit' => Pages\EditMediaStoragePlan::route('/{record}/edit'),
        ];
    }
}
