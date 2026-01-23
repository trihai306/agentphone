<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ScenarioTemplateResource\Pages;
use App\Models\ScenarioTemplate;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ScenarioTemplateResource extends Resource
{
    protected static ?string $model = ScenarioTemplate::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-duplicate';

    protected static ?string $navigationGroup = '🤖 AI Studio';

    protected static ?string $navigationLabel = 'Templates';

    protected static ?string $modelLabel = 'Template Kịch Bản';

    protected static ?string $pluralModelLabel = 'Templates Kịch Bản';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin template')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Tên template')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\Select::make('category')
                            ->label('Danh mục')
                            ->options([
                                'product' => 'Sản phẩm',
                                'marketing' => 'Marketing',
                                'education' => 'Giáo dục',
                                'entertainment' => 'Giải trí',
                                'other' => 'Khác',
                            ])
                            ->required(),
                        Forms\Components\Textarea::make('description')
                            ->label('Mô tả')
                            ->rows(3)
                            ->columnSpanFull(),
                    ])->columns(2),
                Forms\Components\Section::make('Cấu hình')
                    ->schema([
                        Forms\Components\Textarea::make('prompt_template')
                            ->label('Prompt Template')
                            ->rows(5)
                            ->columnSpanFull()
                            ->helperText('Sử dụng {{variable}} cho các biến động'),
                        Forms\Components\KeyValue::make('default_settings')
                            ->label('Cài đặt mặc định')
                            ->columnSpanFull(),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Đang hoạt động')
                            ->default(true),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Tên')
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
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Hoạt động')
                    ->boolean(),
                Tables\Columns\TextColumn::make('scenarios_count')
                    ->label('Số lần dùng')
                    ->counts('scenarios')
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->dateTime('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('category')
                    ->label('Danh mục')
                    ->options([
                        'product' => 'Sản phẩm',
                        'marketing' => 'Marketing',
                        'education' => 'Giáo dục',
                        'entertainment' => 'Giải trí',
                        'other' => 'Khác',
                    ]),
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Trạng thái'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
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
            'index' => Pages\ListScenarioTemplates::route('/'),
            'create' => Pages\CreateScenarioTemplate::route('/create'),
            'edit' => Pages\EditScenarioTemplate::route('/{record}/edit'),
        ];
    }
}
