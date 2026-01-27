<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MarketplacePurchaseResource\Pages;
use App\Models\MarketplacePurchase;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class MarketplacePurchaseResource extends Resource
{
    protected static ?string $model = MarketplacePurchase::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-cart';

    protected static ?string $navigationGroup = 'Marketplace';

    protected static ?string $navigationLabel = 'Lịch Sử Mua';

    protected static ?string $modelLabel = 'Giao Dịch Mua';

    protected static ?string $pluralModelLabel = 'Lịch Sử Mua';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin giao dịch')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Người mua')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('marketplace_listing_id')
                            ->label('Sản phẩm')
                            ->relationship('listing', 'title')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\TextInput::make('price')
                            ->label('Giá mua')
                            ->numeric()
                            ->prefix('₫')
                            ->required(),
                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options([
                                'pending' => 'Chờ xử lý',
                                'completed' => 'Hoàn thành',
                                'refunded' => 'Đã hoàn tiền',
                            ])
                            ->default('completed'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người mua')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('listing.title')
                    ->label('Sản phẩm')
                    ->searchable()
                    ->sortable()
                    ->limit(30),
                Tables\Columns\TextColumn::make('price')
                    ->label('Giá')
                    ->money('VND')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'pending' => 'warning',
                        'completed' => 'success',
                        'refunded' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày mua')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'pending' => 'Chờ xử lý',
                        'completed' => 'Hoàn thành',
                        'refunded' => 'Đã hoàn tiền',
                    ]),
                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Người mua')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),
            ])
            ->headerActions([
                \pxlrbt\FilamentExcel\Actions\Tables\ExportAction::make()
                    ->label('Xuất Excel')
                    ->exports([
                        \pxlrbt\FilamentExcel\Exports\ExcelExport::make()
                            ->fromTable()
                            ->askForFilename(
                                default: 'marketplace_purchases_' . now()->format('Y-m-d'),
                                label: 'Tên file'
                            )
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    \pxlrbt\FilamentExcel\Actions\Tables\ExportBulkAction::make()
                        ->label('Xuất Excel'),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMarketplacePurchases::route('/'),
            'create' => Pages\CreateMarketplacePurchase::route('/create'),
            'edit' => Pages\EditMarketplacePurchase::route('/{record}/edit'),
        ];
    }

    public static function canCreate(): bool
    {
        return false; // Purchases are created through the frontend
    }
}
