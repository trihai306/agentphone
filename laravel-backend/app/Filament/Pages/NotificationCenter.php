<?php

namespace App\Filament\Pages;

use App\Services\NotificationService;
use Filament\Actions\Action;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;

class NotificationCenter extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-bell-alert';
    protected static ?string $navigationLabel = 'Notification Center';
    protected static ?string $navigationGroup = '⚙️ Hệ Thống';
    protected static ?int $navigationSort = 100;
    protected static string $view = 'filament.pages.notification-center';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'type' => 'info',
            'target' => 'all_admins',
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('title')
                    ->label('Notification Title')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Enter notification title'),

                Textarea::make('message')
                    ->label('Notification Message')
                    ->required()
                    ->maxLength(1000)
                    ->rows(3)
                    ->placeholder('Enter notification message'),

                Select::make('type')
                    ->label('Notification Type')
                    ->options([
                        'info' => 'Info (Blue)',
                        'success' => 'Success (Green)',
                        'warning' => 'Warning (Orange)',
                        'danger' => 'Danger/Error (Red)',
                    ])
                    ->default('info')
                    ->required(),

                Select::make('target')
                    ->label('Send To')
                    ->options([
                        'self' => 'Only Me (Test)',
                        'all_admins' => 'All Admins',
                        'announcement' => 'System Announcement (All Users)',
                    ])
                    ->default('all_admins')
                    ->required(),
            ])
            ->statePath('data');
    }

    public function sendNotification(): void
    {
        $data = $this->form->getState();
        $notificationService = app(NotificationService::class);

        $title = $data['title'];
        $message = $data['message'];
        $type = $data['type'];
        $target = $data['target'];

        switch ($target) {
            case 'self':
                // Send Filament notification to self
                $notificationService->sendFilamentNotification(
                    auth()->user(),
                    $title,
                    $message,
                    $type
                );
                // Also send WebSocket notification
                $notificationService->notifyUser(
                    auth()->id(),
                    $title,
                    $message,
                    $type === 'danger' ? 'error' : $type
                );
                break;

            case 'all_admins':
                // Send to all admins via Filament
                $notificationService->sendFilamentNotificationToAdmins(
                    $title,
                    $message,
                    $type
                );
                // Also send WebSocket notification
                $notificationService->notifyAdmins(
                    $title,
                    $message,
                    $type === 'danger' ? 'error' : $type
                );
                break;

            case 'announcement':
                // Send system-wide announcement
                $notificationService->announce(
                    $title,
                    $message,
                    $type === 'danger' ? 'error' : $type
                );
                break;
        }

        Notification::make()
            ->title('Notification Sent!')
            ->body("Your notification has been sent to: " . match($target) {
                'self' => 'yourself',
                'all_admins' => 'all admins',
                'announcement' => 'all users',
            })
            ->success()
            ->send();

        // Reset form
        $this->form->fill([
            'type' => 'info',
            'target' => 'all_admins',
        ]);
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('testQuickNotification')
                ->label('Quick Test')
                ->icon('heroicon-o-bolt')
                ->color('warning')
                ->action(function () {
                    $notificationService = app(NotificationService::class);
                    $notificationService->sendFilamentNotification(
                        auth()->user(),
                        'Quick Test',
                        'This is a quick test notification sent at ' . now()->format('H:i:s'),
                        'info'
                    );

                    Notification::make()
                        ->title('Quick Test Sent!')
                        ->body('Check your notification bell.')
                        ->info()
                        ->send();
                }),
        ];
    }
}
