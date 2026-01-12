<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AiGenerationResource\Pages;
use App\Models\AiGeneration;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Support\Colors\Color;

class AiGenerationResource extends Resource
{
    protected static ?string $model = AiGeneration::class;

    protected static ?string $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationLabel = 'AI Generations';

    protected static ?string $navigationGroup = 'AI Management';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Generation Details')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->relationship('user', 'name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        Forms\Components\Grid::make(2)
                            ->schema([
                                Forms\Components\Select::make('type')
                                    ->options([
                                        'image' => 'Image',
                                        'video' => 'Video',
                                    ])
                                    ->required()
                                    ->disabled(),
                                Forms\Components\TextInput::make('model')
                                    ->required()
                                    ->disabled(),
                            ]),
                        Forms\Components\Textarea::make('prompt')
                            ->required()
                            ->rows(3)
                            ->columnSpanFull()
                            ->disabled(),
                        Forms\Components\Textarea::make('negative_prompt')
                            ->rows(2)
                            ->columnSpanFull()
                            ->disabled(),
                    ]),

                Forms\Components\Section::make('Status & Results')
                    ->schema([
                        Forms\Components\Grid::make(3)
                            ->schema([
                                Forms\Components\Select::make('status')
                                    ->options([
                                        'pending' => 'Pending',
                                        'processing' => 'Processing',
                                        'completed' => 'Completed',
                                        'failed' => 'Failed',
                                    ])
                                    ->required(),
                                Forms\Components\TextInput::make('credits_used')
                                    ->numeric()
                                    ->suffix('credits')
                                    ->disabled(),
                                Forms\Components\TextInput::make('processing_time')
                                    ->numeric()
                                    ->suffix('seconds')
                                    ->disabled(),
                            ]),
                        Forms\Components\TextInput::make('result_url')
                            ->url()
                            ->columnSpanFull()
                            ->disabled(),
                        Forms\Components\Textarea::make('error_message')
                            ->rows(2)
                            ->columnSpanFull()
                            ->visible(fn($record) => $record?->status === 'failed'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('result_url')
                    ->label('Preview')
                    ->square()
                    ->defaultImageUrl(url('/images/placeholder.png'))
                    ->visible(fn() => true),
                Tables\Columns\TextColumn::make('user.name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\BadgeColumn::make('type')
                    ->colors([
                        'primary' => 'image',
                        'success' => 'video',
                    ])
                    ->icons([
                        'heroicon-o-photo' => 'image',
                        'heroicon-o-film' => 'video',
                    ]),
                Tables\Columns\TextColumn::make('model')
                    ->searchable()
                    ->limit(20)
                    ->tooltip(fn($record) => $record->model),
                Tables\Columns\TextColumn::make('prompt')
                    ->limit(40)
                    ->tooltip(fn($record) => $record->prompt)
                    ->searchable(),
                Tables\Columns\TextColumn::make('credits_used')
                    ->numeric()
                    ->sortable()
                    ->suffix(' credits')
                    ->color('warning'),
                Tables\Columns\BadgeColumn::make('status')
                    ->colors([
                        'secondary' => 'pending',
                        'primary' => 'processing',
                        'success' => 'completed',
                        'danger' => 'failed',
                    ])
                    ->icons([
                        'heroicon-o-clock' => 'pending',
                        'heroicon-o-arrow-path' => 'processing',
                        'heroicon-o-check-circle' => 'completed',
                        'heroicon-o-x-circle' => 'failed',
                    ]),
                Tables\Columns\TextColumn::make('processing_time')
                    ->label('Time')
                    ->formatStateUsing(fn($state) => $state ? number_format($state, 2) . 's' : '-')
                    ->sortable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->since()
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->options([
                        'image' => 'Image',
                        'video' => 'Video',
                    ]),
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'processing' => 'Processing',
                        'completed' => 'Completed',
                        'failed' => 'Failed',
                    ])
                    ->multiple(),
                Tables\Filters\SelectFilter::make('user')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),
                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('created_from'),
                        Forms\Components\DatePicker::make('created_until'),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['created_from'], fn($q) => $q->whereDate('created_at', '>=', $data['created_from']))
                            ->when($data['created_until'], fn($q) => $q->whereDate('created_at', '<=', $data['created_until']));
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\Action::make('view_result')
                    ->label('View')
                    ->icon('heroicon-o-eye')
                    ->url(fn($record) => $record->result_url, shouldOpenInNewTab: true)
                    ->visible(fn($record) => $record->status === 'completed' && $record->result_url),
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
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAiGenerations::route('/'),
            'view' => Pages\ViewAiGeneration::route('/{record}'),
            'edit' => Pages\EditAiGeneration::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', 'processing')->count();
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
