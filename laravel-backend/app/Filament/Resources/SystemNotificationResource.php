<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SystemNotificationResource\Pages;
use App\Models\SystemNotification;
use App\Models\User;
use App\Services\NotificationService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class SystemNotificationResource extends Resource
{
    protected static ?string $model = SystemNotification::class;

    protected static ?string $navigationIcon = 'heroicon-o-bell-alert';

    protected static ?string $navigationLabel = 'System Notifications';

    protected static ?string $navigationGroup = 'Hệ Thống';

    protected static ?int $navigationSort = 99;

    protected static ?string $recordTitleAttribute = 'title';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Notification Content')
                    ->schema([
                        Forms\Components\TextInput::make('title')
                            ->required()
                            ->maxLength(255)
                            ->columnSpan(2),

                        Forms\Components\Textarea::make('message')
                            ->required()
                            ->maxLength(1000)
                            ->rows(3)
                            ->columnSpan(2),

                        Forms\Components\Select::make('type')
                            ->options([
                                SystemNotification::TYPE_INFO => 'Info',
                                SystemNotification::TYPE_SUCCESS => 'Success',
                                SystemNotification::TYPE_WARNING => 'Warning',
                                SystemNotification::TYPE_ERROR => 'Error',
                            ])
                            ->default(SystemNotification::TYPE_INFO)
                            ->required()
                            ->native(false),

                        Forms\Components\Select::make('target')
                            ->options([
                                SystemNotification::TARGET_ALL => 'All Users',
                                SystemNotification::TARGET_ADMINS => 'Admins Only',
                                SystemNotification::TARGET_SPECIFIC_USER => 'Specific User',
                            ])
                            ->default(SystemNotification::TARGET_ALL)
                            ->required()
                            ->native(false)
                            ->live(),

                        Forms\Components\Select::make('target_user_id')
                            ->label('Target User')
                            ->options(User::pluck('name', 'id'))
                            ->searchable()
                            ->visible(fn(Forms\Get $get) => $get('target') === SystemNotification::TARGET_SPECIFIC_USER)
                            ->required(fn(Forms\Get $get) => $get('target') === SystemNotification::TARGET_SPECIFIC_USER),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Action & Scheduling')
                    ->schema([
                        Forms\Components\TextInput::make('action_url')
                            ->label('Action URL')
                            ->url()
                            ->maxLength(500)
                            ->placeholder('https://example.com/action'),

                        Forms\Components\TextInput::make('action_text')
                            ->label('Action Button Text')
                            ->maxLength(100)
                            ->placeholder('View Details'),

                        Forms\Components\DateTimePicker::make('scheduled_at')
                            ->label('Schedule Send')
                            ->helperText('Leave empty to send immediately')
                            ->native(false),

                        Forms\Components\DateTimePicker::make('expires_at')
                            ->label('Expires At')
                            ->helperText('Leave empty for no expiration')
                            ->native(false),
                    ])
                    ->columns(2),

                Forms\Components\Section::make('Status')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->label('Active')
                            ->default(true),

                        Forms\Components\Toggle::make('is_broadcasted')
                            ->label('Already Broadcasted')
                            ->disabled()
                            ->dehydrated(false)
                            ->visible(fn($record) => $record !== null),

                        Forms\Components\Placeholder::make('broadcasted_at')
                            ->label('Broadcasted At')
                            ->content(fn($record) => $record?->broadcasted_at?->format('Y-m-d H:i:s') ?? 'Not yet')
                            ->visible(fn($record) => $record !== null),

                        Forms\Components\Placeholder::make('created_at')
                            ->label('Created At')
                            ->content(fn($record) => $record?->created_at?->format('Y-m-d H:i:s') ?? '-')
                            ->visible(fn($record) => $record !== null),
                    ])
                    ->columns(2)
                    ->collapsed(),
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

                Tables\Columns\TextColumn::make('message')
                    ->limit(50)
                    ->toggleable()
                    ->tooltip(fn($record) => $record->message),

                Tables\Columns\BadgeColumn::make('type')
                    ->colors([
                        'info' => SystemNotification::TYPE_INFO,
                        'success' => SystemNotification::TYPE_SUCCESS,
                        'warning' => SystemNotification::TYPE_WARNING,
                        'danger' => SystemNotification::TYPE_ERROR,
                    ]),

                Tables\Columns\BadgeColumn::make('target')
                    ->colors([
                        'success' => SystemNotification::TARGET_ALL,
                        'warning' => SystemNotification::TARGET_ADMINS,
                        'primary' => SystemNotification::TARGET_SPECIFIC_USER,
                    ])
                    ->formatStateUsing(fn($state) => match ($state) {
                        SystemNotification::TARGET_ALL => 'All Users',
                        SystemNotification::TARGET_ADMINS => 'Admins',
                        SystemNotification::TARGET_SPECIFIC_USER => 'Specific User',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('targetUser.name')
                    ->label('Target User')
                    ->placeholder('-')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),

                Tables\Columns\IconColumn::make('is_broadcasted')
                    ->boolean()
                    ->label('Sent'),

                Tables\Columns\TextColumn::make('readers_count')
                    ->label('Read By')
                    ->counts('readers')
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('scheduled_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('creator.name')
                    ->label('Created By')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->options([
                        SystemNotification::TYPE_INFO => 'Info',
                        SystemNotification::TYPE_SUCCESS => 'Success',
                        SystemNotification::TYPE_WARNING => 'Warning',
                        SystemNotification::TYPE_ERROR => 'Error',
                    ]),

                Tables\Filters\SelectFilter::make('target')
                    ->options([
                        SystemNotification::TARGET_ALL => 'All Users',
                        SystemNotification::TARGET_ADMINS => 'Admins Only',
                        SystemNotification::TARGET_SPECIFIC_USER => 'Specific User',
                    ]),

                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active'),

                Tables\Filters\TernaryFilter::make('is_broadcasted')
                    ->label('Broadcasted'),

                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\ViewAction::make(),
                    Tables\Actions\EditAction::make(),

                    Tables\Actions\Action::make('broadcast')
                        ->label('Send Now')
                        ->icon('heroicon-o-paper-airplane')
                        ->color('success')
                        ->visible(fn($record) => !$record->is_broadcasted && $record->is_active)
                        ->requiresConfirmation()
                        ->modalHeading('Broadcast Notification')
                        ->modalDescription('This will immediately send this notification to all targeted users. This action cannot be undone.')
                        ->action(function ($record) {
                            $notificationService = app(NotificationService::class);
                            $notificationService->broadcastSystemNotification($record);

                            Notification::make()
                                ->title('Notification Sent!')
                                ->body('The notification has been broadcasted successfully.')
                                ->success()
                                ->send();
                        }),

                    Tables\Actions\Action::make('duplicate')
                        ->label('Duplicate')
                        ->icon('heroicon-o-document-duplicate')
                        ->color('gray')
                        ->action(function ($record) {
                            $new = $record->replicate();
                            $new->is_broadcasted = false;
                            $new->broadcasted_at = null;
                            $new->created_by = auth()->id();
                            $new->save();

                            Notification::make()
                                ->title('Notification Duplicated')
                                ->body('A copy has been created. Edit and send when ready.')
                                ->success()
                                ->send();
                        }),

                    Tables\Actions\DeleteAction::make(),
                    Tables\Actions\RestoreAction::make(),
                    Tables\Actions\ForceDeleteAction::make(),
                ]),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    \pxlrbt\FilamentExcel\Actions\Tables\ExportBulkAction::make()
                        ->label('Xuất Excel'),
                    Tables\Actions\BulkAction::make('broadcast_selected')
                        ->label('Broadcast Selected')
                        ->icon('heroicon-o-paper-airplane')
                        ->color('success')
                        ->requiresConfirmation()
                        ->action(function ($records) {
                            $notificationService = app(NotificationService::class);
                            $count = 0;

                            foreach ($records as $record) {
                                if (!$record->is_broadcasted && $record->is_active) {
                                    $notificationService->broadcastSystemNotification($record);
                                    $count++;
                                }
                            }

                            Notification::make()
                                ->title("{$count} Notifications Sent!")
                                ->success()
                                ->send();
                        }),

                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                ]),
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
            'index' => Pages\ListSystemNotifications::route('/'),
            'create' => Pages\CreateSystemNotification::route('/create'),
            'view' => Pages\ViewSystemNotification::route('/{record}'),
            'edit' => Pages\EditSystemNotification::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('is_broadcasted', false)
            ->where('is_active', true)
            ->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
