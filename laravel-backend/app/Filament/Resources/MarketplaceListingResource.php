<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MarketplaceListingResource\Pages;
use App\Models\MarketplaceListing;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Illuminate\Database\Eloquent\Builder;

class MarketplaceListingResource extends Resource
{
    protected static ?string $model = MarketplaceListing::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationGroup = '🛒 Marketplace';

    protected static ?string $navigationLabel = 'Listings';

    protected static ?int $navigationSort = 1;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', 'pending')->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Listing Information')
                    ->schema([
                        Forms\Components\TextInput::make('title')
                            ->required()
                            ->maxLength(255),

                        Forms\Components\Textarea::make('description')
                            ->rows(4)
                            ->maxLength(2000),

                        Forms\Components\TagsInput::make('tags')
                            ->separator(','),

                        Forms\Components\Select::make('price_type')
                            ->options([
                                'free' => 'Free',
                                'paid' => 'Paid',
                            ])
                            ->required()
                            ->reactive(),

                        Forms\Components\TextInput::make('price')
                            ->numeric()
                            ->required()
                            ->visible(fn($get) => $get('price_type') === 'paid'),

                        Forms\Components\Select::make('status')
                            ->options([
                                'draft' => 'Draft',
                                'pending' => 'Pending Review',
                                'published' => 'Published',
                                'rejected' => 'Rejected',
                            ])
                            ->required(),

                        Forms\Components\Textarea::make('rejection_reason')
                            ->rows(2)
                            ->visible(fn($get) => $get('status') === 'rejected'),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->limit(40)
                    ->tooltip(fn($record) => $record->title),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Seller')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('listable_type')
                    ->label('Type')
                    ->formatStateUsing(fn($state) => str_contains($state, 'DataCollection') ? 'Collection' : 'Workflow')
                    ->badge()
                    ->color(fn($state) => str_contains($state, 'DataCollection') ? 'info' : 'success'),

                Tables\Columns\TextColumn::make('price_type')
                    ->badge()
                    ->color(fn($state) => $state === 'free' ? 'success' : 'warning'),

                Tables\Columns\TextColumn::make('price')
                    ->money('credits', 0)
                    ->visible(fn($record) => $record?->price_type === 'paid'),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn($state) => match ($state) {
                        'draft' => 'gray',
                        'pending' => 'warning',
                        'published' => 'success',
                        'rejected' => 'danger',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('downloads_count')
                    ->label('Downloads')
                    ->sortable(),

                Tables\Columns\TextColumn::make('rating')
                    ->label('Rating')
                    ->formatStateUsing(fn($state) => $state ? number_format($state, 1) . ' ⭐' : '-'),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'pending' => 'Pending Review',
                        'published' => 'Published',
                        'rejected' => 'Rejected',
                    ]),

                Tables\Filters\SelectFilter::make('price_type')
                    ->options([
                        'free' => 'Free',
                        'paid' => 'Paid',
                    ]),

                Tables\Filters\SelectFilter::make('listable_type')
                    ->label('Type')
                    ->options([
                        'App\\Models\\DataCollection' => 'Data Collection',
                        'App\\Models\\Flow' => 'Workflow',
                    ]),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\ViewAction::make(),
                    Tables\Actions\EditAction::make(),

                    Tables\Actions\Action::make('approve')
                        ->label('Approve')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->visible(fn($record) => $record->status === 'pending')
                        ->requiresConfirmation()
                        ->modalHeading('Approve Listing')
                        ->modalDescription('This will make the listing visible to all users.')
                        ->action(fn($record) => $record->publish()),

                    Tables\Actions\Action::make('reject')
                        ->label('Reject')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->visible(fn($record) => $record->status === 'pending')
                        ->form([
                            Forms\Components\Textarea::make('rejection_reason')
                                ->label('Reason for Rejection')
                                ->required()
                                ->placeholder('Explain why this listing is being rejected...'),
                        ])
                        ->action(function ($record, array $data) {
                            $record->reject($data['rejection_reason']);
                        }),

                    Tables\Actions\DeleteAction::make(),
                ]),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),

                    Tables\Actions\BulkAction::make('approve_selected')
                        ->label('Approve Selected')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->requiresConfirmation()
                        ->action(fn($records) => $records->each->publish()),

                    Tables\Actions\BulkAction::make('reject_selected')
                        ->label('Reject Selected')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->form([
                            Forms\Components\Textarea::make('rejection_reason')
                                ->label('Reason for Rejection')
                                ->required(),
                        ])
                        ->action(function ($records, array $data) {
                            $records->each(fn($record) => $record->reject($data['rejection_reason']));
                        }),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Listing Details')
                    ->schema([
                        Infolists\Components\TextEntry::make('title'),
                        Infolists\Components\TextEntry::make('description')
                            ->columnSpanFull(),
                        Infolists\Components\TextEntry::make('tags')
                            ->badge(),
                        Infolists\Components\TextEntry::make('status')
                            ->badge()
                            ->color(fn($state) => match ($state) {
                                'draft' => 'gray',
                                'pending' => 'warning',
                                'published' => 'success',
                                'rejected' => 'danger',
                                default => 'gray',
                            }),
                        Infolists\Components\TextEntry::make('rejection_reason')
                            ->visible(fn($record) => $record->status === 'rejected'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Pricing')
                    ->schema([
                        Infolists\Components\TextEntry::make('price_type')
                            ->badge()
                            ->color(fn($state) => $state === 'free' ? 'success' : 'warning'),
                        Infolists\Components\TextEntry::make('price')
                            ->suffix(' credits')
                            ->visible(fn($record) => $record->price_type === 'paid'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Statistics')
                    ->schema([
                        Infolists\Components\TextEntry::make('views_count')
                            ->label('Views'),
                        Infolists\Components\TextEntry::make('downloads_count')
                            ->label('Downloads'),
                        Infolists\Components\TextEntry::make('rating')
                            ->formatStateUsing(fn($state) => $state ? number_format($state, 1) . ' / 5' : 'No ratings'),
                        Infolists\Components\TextEntry::make('ratings_count')
                            ->label('Total Ratings'),
                    ])
                    ->columns(4),

                Infolists\Components\Section::make('Seller Information')
                    ->schema([
                        Infolists\Components\TextEntry::make('user.name')
                            ->label('Seller Name'),
                        Infolists\Components\TextEntry::make('user.email')
                            ->label('Seller Email'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Timestamps')
                    ->schema([
                        Infolists\Components\TextEntry::make('created_at')
                            ->dateTime(),
                        Infolists\Components\TextEntry::make('updated_at')
                            ->dateTime(),
                        Infolists\Components\TextEntry::make('published_at')
                            ->dateTime()
                            ->visible(fn($record) => $record->published_at),
                    ])
                    ->columns(3),
            ]);
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
            'index' => Pages\ListMarketplaceListings::route('/'),
            'view' => Pages\ViewMarketplaceListing::route('/{record}'),
            'edit' => Pages\EditMarketplaceListing::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['user', 'listable']);
    }
}
