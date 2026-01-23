<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InteractionHistoryResource\Pages;
use App\Models\InteractionHistory;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class InteractionHistoryResource extends Resource
{
    protected static ?string $model = InteractionHistory::class;

    protected static ?string $navigationIcon = 'heroicon-o-finger-print';

    protected static ?string $navigationLabel = 'Lịch sử tương tác';

    protected static ?string $modelLabel = 'Tương tác';

    protected static ?string $pluralModelLabel = 'Lịch sử tương tác';

    protected static ?string $navigationGroup = '📊 Dashboard';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Thông tin thiết bị')
                    ->schema([
                        Forms\Components\TextInput::make('device_serial')
                            ->label('Device Serial')
                            ->required()
                            ->maxLength(100),

                        Forms\Components\TextInput::make('session_id')
                            ->label('Session ID')
                            ->maxLength(36),

                        Forms\Components\Select::make('user_id')
                            ->label('User')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload(),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Thông tin ứng dụng')
                    ->schema([
                        Forms\Components\TextInput::make('package_name')
                            ->label('Package Name')
                            ->maxLength(255),

                        Forms\Components\TextInput::make('activity_name')
                            ->label('Activity Name')
                            ->maxLength(255),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Thông tin Node')
                    ->schema([
                        Forms\Components\TextInput::make('node_class')
                            ->label('Class')
                            ->maxLength(255),

                        Forms\Components\TextInput::make('node_resource_id')
                            ->label('Resource ID')
                            ->maxLength(255),

                        Forms\Components\Textarea::make('node_text')
                            ->label('Text')
                            ->rows(2),

                        Forms\Components\Textarea::make('node_content_desc')
                            ->label('Content Description')
                            ->rows(2),

                        Forms\Components\Textarea::make('node_xpath')
                            ->label('XPath')
                            ->rows(2)
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Action')
                    ->schema([
                        Forms\Components\Select::make('action_type')
                            ->label('Action Type')
                            ->options(InteractionHistory::getActionTypes())
                            ->required(),

                        Forms\Components\TextInput::make('tap_x')
                            ->label('Tap X')
                            ->numeric(),

                        Forms\Components\TextInput::make('tap_y')
                            ->label('Tap Y')
                            ->numeric(),
                    ])
                    ->columns(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('action_type')
                    ->label('Action')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'tap' => 'success',
                        'long_tap' => 'warning',
                        'swipe' => 'info',
                        'input_text' => 'primary',
                        'scroll' => 'gray',
                        default => 'secondary',
                    })
                    ->icon(fn (string $state): string => match ($state) {
                        'tap' => 'heroicon-o-cursor-arrow-rays',
                        'long_tap' => 'heroicon-o-finger-print',
                        'swipe' => 'heroicon-o-arrows-right-left',
                        'input_text' => 'heroicon-o-pencil-square',
                        'scroll' => 'heroicon-o-arrows-up-down',
                        default => 'heroicon-o-cursor-arrow-ripple',
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('element_display_name')
                    ->label('Element')
                    ->limit(40)
                    ->tooltip(fn (Model $record): string => $record->node_text ?? $record->node_resource_id ?? ''),

                Tables\Columns\TextColumn::make('short_class_name')
                    ->label('Type')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('device_serial')
                    ->label('Device')
                    ->searchable()
                    ->limit(15)
                    ->toggleable(),

                Tables\Columns\TextColumn::make('package_name')
                    ->label('App')
                    ->formatStateUsing(fn (?string $state): string => $state ? last(explode('.', $state)) : '-')
                    ->searchable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('tap_x')
                    ->label('X')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('tap_y')
                    ->label('Y')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('User')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('session_id')
                    ->label('Session')
                    ->limit(8)
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Time')
                    ->dateTime('d/m/Y H:i:s')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('action_type')
                    ->label('Action Type')
                    ->options(InteractionHistory::getActionTypes()),

                Tables\Filters\Filter::make('device_serial')
                    ->form([
                        Forms\Components\TextInput::make('device_serial')
                            ->label('Device Serial'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query->when(
                            $data['device_serial'],
                            fn (Builder $query, $value): Builder => $query->where('device_serial', 'like', "%{$value}%"),
                        );
                    }),

                Tables\Filters\Filter::make('package_name')
                    ->form([
                        Forms\Components\TextInput::make('package_name')
                            ->label('Package Name'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query->when(
                            $data['package_name'],
                            fn (Builder $query, $value): Builder => $query->where('package_name', 'like', "%{$value}%"),
                        );
                    }),

                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('created_from')
                            ->label('From'),
                        Forms\Components\DatePicker::make('created_until')
                            ->label('Until'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['created_from'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '>=', $date),
                            )
                            ->when(
                                $data['created_until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '<=', $date),
                            );
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Thông tin chung')
                    ->schema([
                        Infolists\Components\TextEntry::make('action_type')
                            ->label('Action Type')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'tap' => 'success',
                                'long_tap' => 'warning',
                                'swipe' => 'info',
                                'input_text' => 'primary',
                                default => 'gray',
                            }),

                        Infolists\Components\TextEntry::make('device_serial')
                            ->label('Device'),

                        Infolists\Components\TextEntry::make('session_id')
                            ->label('Session ID'),

                        Infolists\Components\TextEntry::make('user.name')
                            ->label('User'),

                        Infolists\Components\TextEntry::make('created_at')
                            ->label('Time')
                            ->dateTime('d/m/Y H:i:s'),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Ứng dụng')
                    ->schema([
                        Infolists\Components\TextEntry::make('package_name')
                            ->label('Package Name'),

                        Infolists\Components\TextEntry::make('activity_name')
                            ->label('Activity Name'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Node Information')
                    ->schema([
                        Infolists\Components\TextEntry::make('node_class')
                            ->label('Class'),

                        Infolists\Components\TextEntry::make('node_resource_id')
                            ->label('Resource ID'),

                        Infolists\Components\TextEntry::make('node_text')
                            ->label('Text'),

                        Infolists\Components\TextEntry::make('node_content_desc')
                            ->label('Content Description'),

                        Infolists\Components\TextEntry::make('node_bounds')
                            ->label('Bounds'),

                        Infolists\Components\TextEntry::make('node_index')
                            ->label('Index'),

                        Infolists\Components\TextEntry::make('node_xpath')
                            ->label('XPath')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Node State')
                    ->schema([
                        Infolists\Components\IconEntry::make('node_clickable')
                            ->label('Clickable')
                            ->boolean(),

                        Infolists\Components\IconEntry::make('node_enabled')
                            ->label('Enabled')
                            ->boolean(),

                        Infolists\Components\IconEntry::make('node_focusable')
                            ->label('Focusable')
                            ->boolean(),

                        Infolists\Components\IconEntry::make('node_scrollable')
                            ->label('Scrollable')
                            ->boolean(),

                        Infolists\Components\IconEntry::make('node_checkable')
                            ->label('Checkable')
                            ->boolean(),

                        Infolists\Components\IconEntry::make('node_checked')
                            ->label('Checked')
                            ->boolean(),
                    ])
                    ->columns(6),

                Infolists\Components\Section::make('Coordinates')
                    ->schema([
                        Infolists\Components\TextEntry::make('tap_x')
                            ->label('X'),

                        Infolists\Components\TextEntry::make('tap_y')
                            ->label('Y'),
                    ])
                    ->columns(2),
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
            'index' => Pages\ListInteractionHistories::route('/'),
            'view' => Pages\ViewInteractionHistory::route('/{record}'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::whereDate('created_at', today())->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'success';
    }
}
