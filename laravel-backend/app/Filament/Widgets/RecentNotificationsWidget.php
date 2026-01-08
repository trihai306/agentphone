<?php

namespace App\Filament\Widgets;

use App\Models\SystemNotification;
use App\Services\NotificationService;
use Filament\Notifications\Notification;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class RecentNotificationsWidget extends BaseWidget
{
    protected static ?int $sort = 6;

    protected int|string|array $columnSpan = 'full';

    protected static ?string $heading = 'Recent System Notifications';

    protected static ?string $pollingInterval = '30s';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                SystemNotification::query()
                    ->latest()
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->limit(30),

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
                    ->formatStateUsing(fn ($state) => match ($state) {
                        SystemNotification::TARGET_ALL => 'All',
                        SystemNotification::TARGET_ADMINS => 'Admins',
                        SystemNotification::TARGET_SPECIFIC_USER => 'User',
                        default => $state,
                    }),

                Tables\Columns\IconColumn::make('is_broadcasted')
                    ->boolean()
                    ->label('Sent'),

                Tables\Columns\TextColumn::make('created_at')
                    ->since()
                    ->sortable(),
            ])
            ->actions([
                Tables\Actions\Action::make('broadcast')
                    ->label('Send')
                    ->icon('heroicon-o-paper-airplane')
                    ->color('success')
                    ->visible(fn ($record) => !$record->is_broadcasted && $record->is_active)
                    ->requiresConfirmation()
                    ->action(function ($record) {
                        $notificationService = app(NotificationService::class);
                        $notificationService->broadcastSystemNotification($record);

                        Notification::make()
                            ->title('Sent!')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('view')
                    ->label('View')
                    ->icon('heroicon-o-eye')
                    ->url(fn ($record) => route('filament.admin.resources.system-notifications.view', $record)),
            ])
            ->paginated(false);
    }
}
