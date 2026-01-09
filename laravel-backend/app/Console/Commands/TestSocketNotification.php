<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use Illuminate\Console\Command;

class TestSocketNotification extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'socket:test 
                            {type=deposit : Type of notification (deposit, withdrawal, admin)}
                            {--user= : User ID to send notification to}
                            {--amount=100000 : Amount in VND}';

    /**
     * The console command description.
     */
    protected $description = 'Test WebSocket notifications for deposit/withdrawal';

    public function __construct(
        private NotificationService $notificationService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->argument('type');
        $amount = $this->option('amount');
        $userId = $this->option('user');

        $this->info("🚀 Sending test {$type} notification via WebSocket...");

        switch ($type) {
            case 'deposit':
                $this->sendDepositNotification($amount, $userId);
                break;
            case 'withdrawal':
                $this->sendWithdrawalNotification($amount, $userId);
                break;
            case 'admin':
                $this->sendAdminNotification($amount);
                break;
            default:
                $this->error("Unknown notification type: {$type}");
                return 1;
        }

        $this->info("✅ Notification sent successfully!");
        return 0;
    }

    private function sendDepositNotification(int $amount, ?int $userId): void
    {
        $formattedAmount = number_format($amount, 0, ',', '.') . ' ₫';

        // Send Filament notification to all admins (saves to database + broadcasts)
        $this->notificationService->filamentAdminWarning(
            title: '💰 Yêu cầu nạp tiền mới',
            body: "Có yêu cầu nạp tiền {$formattedAmount} đang chờ duyệt"
        );

        $this->line("   → Sent Filament notification to all admins (database + broadcast)");

        // If user specified, also send to user
        if ($userId) {
            $this->notificationService->sendFilamentNotification(
                user: $userId,
                title: '✅ Đã nhận yêu cầu nạp tiền',
                body: "Yêu cầu nạp {$formattedAmount} của bạn đã được ghi nhận.",
                type: 'success',
                icon: 'heroicon-o-banknotes'
            );
            $this->line("   → Sent Filament notification to user #{$userId}");
        }
    }

    private function sendWithdrawalNotification(int $amount, ?int $userId): void
    {
        $formattedAmount = number_format($amount, 0, ',', '.') . ' ₫';

        $this->notificationService->filamentAdminInfo(
            title: '🏧 Yêu cầu rút tiền mới',
            body: "Có yêu cầu rút tiền {$formattedAmount} đang chờ duyệt"
        );

        $this->line("   → Sent Filament notification to all admins");
    }

    private function sendAdminNotification(int $amount): void
    {
        $formattedAmount = number_format($amount, 0, ',', '.') . ' ₫';

        $this->notificationService->filamentAdminSuccess(
            title: '🔔 Test Notification',
            body: "Đây là thông báo test với số tiền {$formattedAmount}"
        );

        $this->line("   → Sent test Filament notification to all admins");
    }
}
