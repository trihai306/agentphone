<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AiScenarioResource\Pages;
use App\Models\AiScenario;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class AiScenarioResource extends Resource
{
    protected static ?string $model = AiScenario::class;

    protected static ?string $navigationIcon = 'heroicon-o-film';

    protected static ?string $navigationGroup = 'AI Studio';

    protected static ?string $navigationLabel = 'Kịch Bản AI';

    protected static ?string $modelLabel = 'Kịch Bản AI';

    protected static ?string $pluralModelLabel = 'Kịch Bản AI';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin kịch bản')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Người dùng')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\TextInput::make('title')
                            ->label('Tiêu đề')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\Textarea::make('description')
                            ->label('Mô tả')
                            ->rows(3)
                            ->columnSpanFull(),
                        Forms\Components\Select::make('status')
                            ->label('Trạng thái')
                            ->options([
                                'draft' => 'Nháp',
                                'processing' => 'Đang xử lý',
                                'completed' => 'Hoàn thành',
                                'failed' => 'Thất bại',
                            ])
                            ->default('draft'),
                    ])->columns(2),
                Forms\Components\Section::make('Cấu hình')
                    ->schema([
                        Forms\Components\Select::make('category')
                            ->label('Danh mục')
                            ->options([
                                'product' => 'Sản phẩm',
                                'marketing' => 'Marketing',
                                'education' => 'Giáo dục',
                                'entertainment' => 'Giải trí',
                                'other' => 'Khác',
                            ]),
                        Forms\Components\TextInput::make('scenes_count')
                            ->label('Số cảnh')
                            ->numeric()
                            ->disabled(),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->label('Tiêu đề')
                    ->searchable()
                    ->sortable()
                    ->limit(40),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Người tạo')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('category')
                    ->label('Danh mục')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'product' => 'success',
                        'marketing' => 'warning',
                        'education' => 'info',
                        'entertainment' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->label('Trạng thái')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'draft' => 'gray',
                        'processing' => 'warning',
                        'completed' => 'success',
                        'failed' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('scenes_count')
                    ->label('Số cảnh')
                    ->counts('scenes')
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Trạng thái')
                    ->options([
                        'draft' => 'Nháp',
                        'processing' => 'Đang xử lý',
                        'completed' => 'Hoàn thành',
                        'failed' => 'Thất bại',
                    ]),
                Tables\Filters\SelectFilter::make('user_id')
                    ->label('Người dùng')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
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
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAiScenarios::route('/'),
            'create' => Pages\CreateAiScenario::route('/create'),
            'edit' => Pages\EditAiScenario::route('/{record}/edit'),
        ];
    }
}
