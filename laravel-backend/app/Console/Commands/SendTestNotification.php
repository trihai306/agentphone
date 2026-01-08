<?php

namespace App\Console\Commands;

use App\Events\AdminNotification;
use App\Events\SystemAnnouncement;
use App\Events\UserNotification;
use App\Models\User;
use App\Notifications\AdminAlertNotification;
use Illuminate\Console\Command;

class SendTestNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notification:test
                            {--type=all : Type of notification to send (user, admin, announcement, database, all)}
                            {--user-id= : User ID to send notification to}
                            {--message= : Custom message}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send test notifications via WebSocket and/or database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $type = $this->option('type');
        $userId = $this->option('user-id');
        $customMessage = $this->option('message');

        $this->info('Sending test notifications...');

        switch ($type) {
            case 'user':
                $this->sendUserNotification($userId, $customMessage);
                break;
            case 'admin':
                $this->sendAdminNotification($customMessage);
                break;
            case 'announcement':
                $this->sendAnnouncement($customMessage);
                break;
            case 'database':
                $this->sendDatabaseNotification($userId, $customMessage);
                break;
            case 'all':
            default:
                $this->sendUserNotification($userId, $customMessage);
                $this->sendAdminNotification($customMessage);
                $this->sendAnnouncement($customMessage);
                $this->sendDatabaseNotification($userId, $customMessage);
                break;
        }

        $this->info('Test notifications sent successfully!');
        return Command::SUCCESS;
    }

    protected function sendUserNotification(?string $userId, ?string $message): void
    {
        $targetUserId = $userId ?? User::first()?->id ?? 1;

        event(new UserNotification(
            userId: (int) $targetUserId,
            title: 'Test User Notification',
            message: $message ?? 'This is a test notification sent to user ID: ' . $targetUserId,
            type: 'info',
            data: ['test' => true, 'timestamp' => now()->toISOString()]
        ));

        $this->line("  ✓ User notification sent to user ID: {$targetUserId}");
    }

    protected function sendAdminNotification(?string $message): void
    {
        event(new AdminNotification(
            title: 'Test Admin Notification',
            message: $message ?? 'This is a test notification for all admins',
            type: 'warning',
            data: ['test' => true, 'timestamp' => now()->toISOString()]
        ));

        $this->line('  ✓ Admin notification broadcast sent');
    }

    protected function sendAnnouncement(?string $message): void
    {
        event(new SystemAnnouncement(
            title: 'System Announcement',
            message: $message ?? 'This is a test system-wide announcement',
            type: 'success',
            data: ['test' => true, 'timestamp' => now()->toISOString()]
        ));

        $this->line('  ✓ System announcement broadcast sent');
    }

    protected function sendDatabaseNotification(?string $userId, ?string $message): void
    {
        $user = $userId ? User::find($userId) : User::first();

        if (!$user) {
            $this->warn('  ⚠ No user found for database notification');
            return;
        }

        $user->notify(new AdminAlertNotification(
            title: 'Database Test Notification',
            message: $message ?? 'This notification is stored in the database and broadcast via WebSocket',
            type: 'info',
            data: ['test' => true],
            actionUrl: '/admin',
            actionText: 'Go to Admin'
        ));

        $this->line("  ✓ Database notification sent to user: {$user->email}");
    }
}
