<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserMediaResource\Pages;
use App\Models\UserMedia;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class UserMediaResource extends Resource
{
    protected static ?string $model = UserMedia::class;

    protected static ?string $navigationIcon = 'heroicon-o-photo';

    protected static ?string $navigationGroup = '📁 Nội Dung';

    protected static ?string $navigationLabel = 'Media Files';

    protected static ?string $modelLabel = 'Tệp Media';

    protected static ?string $pluralModelLabel = 'Tệp Media';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin tệp')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Người dùng')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\TextInput::make('name')
                            ->label('Tên tệp')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('original_name')
                            ->label('Tên gốc')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('path')
                            ->label('Đường dẫn')
                            ->required(),
                        Forms\Components\TextInput::make('mime_type')
                            ->label('Loại MIME')
                            ->maxLength(100),
                        Forms\Components\TextInput::make('size')
                            ->label('Kích thước (bytes)')
                            ->numeric(),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('url')
                    ->label('Xem trước')
                    ->circular()
                    ->defaultImageUrl(fn($record) => $record->mime_type && str_starts_with($record->mime_type, 'image/') ? null : asset('images/file-icon.png')),
                Tables\Columns\TextColumn::make('name')
                    ->label('Tên')
                    ->searchable()
                    ->sortable()
                    ->limit(30),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người dùng')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('mime_type')
                    ->label('Loại')
                    ->badge()
                    ->color(fn(string $state): string => match (true) {
                        str_starts_with($state, 'image/') => 'success',
                        str_starts_with($state, 'video/') => 'warning',
                        str_starts_with($state, 'audio/') => 'info',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('size')
                    ->label('Kích thước')
                    ->formatStateUsing(fn($state) => $state ? number_format($state / 1024 / 1024, 2) . ' MB' : '-')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Người dùng')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\SelectFilter::make('mime_type')
                    ->label('Loại tệp')
                    ->options([
                        'image' => 'Hình ảnh',
                        'video' => 'Video',
                        'audio' => 'Âm thanh',
                    ])
                    ->query(
                        fn($query, $data) =>
                        $data['value'] ? $query->where('mime_type', 'like', $data['value'] . '/%') : $query
                    ),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
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
            'index' => Pages\ListUserMedia::route('/'),
            'create' => Pages\CreateUserMedia::route('/create'),
            'edit' => Pages\EditUserMedia::route('/{record}/edit'),
        ];
    }
}
