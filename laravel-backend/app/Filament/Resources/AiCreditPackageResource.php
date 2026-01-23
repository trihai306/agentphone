<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AiCreditPackageResource\Pages;
use App\Models\AiCreditPackage;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Grid;

class AiCreditPackageResource extends Resource
{
    protected static ?string $model = AiCreditPackage::class;

    protected static ?string $navigationIcon = 'heroicon-o-currency-dollar';

    protected static ?string $navigationLabel = 'AI Credit Packages';

    protected static ?string $navigationGroup = 'AI Studio';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make('Package Information')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->required()
                                    ->maxLength(255)
                                    ->placeholder('e.g., Gói Basic'),
                                Forms\Components\TextInput::make('credits')
                                    ->required()
                                    ->numeric()
                                    ->minValue(1)
                                    ->suffix('credits'),
                            ]),
                        Forms\Components\Textarea::make('description')
                            ->rows(3)
                            ->placeholder('Mô tả gói credits...')
                            ->columnSpanFull(),
                    ]),

                Section::make('Pricing')
                    ->schema([
                        Grid::make(3)
                            ->schema([
                                Forms\Components\TextInput::make('price')
                                    ->required()
                                    ->numeric()
                                    ->minValue(0)
                                    ->prefix('₫')
                                    ->placeholder('200000'),
                                Forms\Components\TextInput::make('original_price')
                                    ->numeric()
                                    ->minValue(0)
                                    ->prefix('₫')
                                    ->placeholder('250000')
                                    ->hint('Leave empty if no discount'),
                                Forms\Components\TextInput::make('currency')
                                    ->required()
                                    ->maxLength(3)
                                    ->default('VND')
                                    ->disabled(),
                            ]),
                    ]),

                Section::make('Display Settings')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                Forms\Components\TextInput::make('badge')
                                    ->maxLength(255)
                                    ->placeholder('e.g., Best Value'),
                                Forms\Components\Select::make('badge_color')
                                    ->options([
                                        'blue' => 'Blue',
                                        'green' => 'Green',
                                        'purple' => 'Purple',
                                        'red' => 'Red',
                                        'yellow' => 'Yellow',
                                    ])
                                    ->default('blue'),
                            ]),
                        Grid::make(3)
                            ->schema([
                                Forms\Components\Toggle::make('is_active')
                                    ->label('Active')
                                    ->default(true)
                                    ->inline(false),
                                Forms\Components\Toggle::make('is_featured')
                                    ->label('Featured')
                                    ->default(false)
                                    ->inline(false),
                                Forms\Components\TextInput::make('sort_order')
                                    ->numeric()
                                    ->default(0)
                                    ->minValue(0)
                                    ->hint('Lower numbers appear first'),
                            ]),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->weight('bold')
                    ->sortable(),
                Tables\Columns\TextColumn::make('credits')
                    ->numeric()
                    ->sortable()
                    ->suffix(' credits')
                    ->color('success'),
                Tables\Columns\TextColumn::make('price')
                    ->money('VND')
                    ->sortable(),
                Tables\Columns\TextColumn::make('discount_percent')
                    ->label('Discount')
                    ->formatStateUsing(fn($state) => $state ? "{$state}%" : '-')
                    ->color('warning'),
                Tables\Columns\TextColumn::make('price_per_credit')
                    ->label('₫/Credit')
                    ->formatStateUsing(fn($state) => number_format($state, 0) . '₫')
                    ->color('gray'),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
                Tables\Columns\IconColumn::make('is_featured')
                    ->boolean()
                    ->label('Featured'),
                Tables\Columns\BadgeColumn::make('badge')
                    ->color(fn($record) => $record->badge_color ?? 'gray')
                    ->formatStateUsing(fn($state) => $state ?? 'No Badge'),
                Tables\Columns\TextColumn::make('sort_order')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active Status')
                    ->placeholder('All packages')
                    ->trueLabel('Active only')
                    ->falseLabel('Inactive only'),
                Tables\Filters\TernaryFilter::make('is_featured')
                    ->label('Featured')
                    ->placeholder('All packages')
                    ->trueLabel('Featured only')
                    ->falseLabel('Non-featured only'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('toggle_active')
                    ->label(fn($record) => $record->is_active ? 'Deactivate' : 'Activate')
                    ->icon(fn($record) => $record->is_active ? 'heroicon-o-x-circle' : 'heroicon-o-check-circle')
                    ->color(fn($record) => $record->is_active ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->action(fn($record) => $record->update(['is_active' => !$record->is_active])),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\BulkAction::make('activate')
                        ->label('Activate Selected')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->action(fn($records) => $records->each->update(['is_active' => true])),
                    Tables\Actions\BulkAction::make('deactivate')
                        ->label('Deactivate Selected')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->action(fn($records) => $records->each->update(['is_active' => false])),
                ]),
            ])
            ->defaultSort('sort_order', 'asc');
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
            'index' => Pages\ListAiCreditPackages::route('/'),
            'create' => Pages\CreateAiCreditPackage::route('/create'),
            'edit' => Pages\EditAiCreditPackage::route('/{record}/edit'),
        ];
    }
}
