<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DataRecordResource\Pages;
use App\Models\DataRecord;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class DataRecordResource extends Resource
{
    protected static ?string $model = DataRecord::class;

    protected static ?string $navigationIcon = 'heroicon-o-table-cells';

    protected static ?string $navigationGroup = 'Nội Dung';

    protected static ?string $navigationLabel = 'Data Records';

    protected static ?string $modelLabel = 'Bản Ghi';

    protected static ?string $pluralModelLabel = 'Bản Ghi Dữ Liệu';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin')
                    ->schema([
                        Forms\Components\Select::make('data_collection_id')
                            ->label('Bộ dữ liệu')
                            ->relationship('dataCollection', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\KeyValue::make('data')
                            ->label('Dữ liệu')
                            ->columnSpanFull()
                            ->addButtonLabel('Thêm trường'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),
                Tables\Columns\TextColumn::make('dataCollection.name')
                    ->label('Bộ dữ liệu')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('data')
                    ->label('Dữ liệu')
                    ->formatStateUsing(function ($state) {
                        if (is_array($state)) {
                            $preview = [];
                            foreach (array_slice($state, 0, 3) as $key => $value) {
                                $preview[] = "{$key}: " . (is_string($value) ? substr($value, 0, 20) : json_encode($value));
                            }
                            return implode(', ', $preview) . (count($state) > 3 ? '...' : '');
                        }
                        return '-';
                    })
                    ->limit(60),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('data_collection_id')
                    ->label('Bộ dữ liệu')
                    ->relationship('dataCollection', 'name')
                    ->searchable()
                    ->preload(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDataRecords::route('/'),
            'create' => Pages\CreateDataRecord::route('/create'),
            'edit' => Pages\EditDataRecord::route('/{record}/edit'),
        ];
    }
}
