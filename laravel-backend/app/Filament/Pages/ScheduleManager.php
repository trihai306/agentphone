<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class ScheduleManager extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-clock';

    protected static string $view = 'filament.pages.schedule-manager';

    protected static ?string $slug = 'schedule-manager';

    protected static ?string $navigationLabel = 'Quản Lý Schedule';

    protected static ?string $title = 'Quản Lý Scheduled Tasks';

    protected static ?string $navigationGroup = 'Hệ Thống';

    protected static ?int $navigationSort = 15;

    public array $schedules = [];
    public array $cleanupLog = [];
    public ?string $lastCleanupRun = null;

    public function mount(): void
    {
        $this->loadSchedules();
        $this->loadCleanupLog();
    }

    protected function loadSchedules(): void
    {
        $this->schedules = [
            [
                'name' => 'Đồng bộ trạng thái thiết bị',
                'command' => 'devices:sync-presence',
                'frequency' => 'Mỗi phút',
                'description' => 'Đồng bộ trạng thái online/offline thiết bị từ Redis sang Database',
                'group' => 'device',
            ],
            [
                'name' => 'Kiểm tra thiết bị offline',
                'command' => 'devices:check-online-status',
                'frequency' => 'Mỗi phút',
                'description' => 'Kiểm tra và đánh dấu offline các thiết bị không hoạt động quá 5 phút',
                'group' => 'device',
            ],
            [
                'name' => 'Dispatch scheduled jobs',
                'command' => 'jobs:dispatch-scheduled',
                'frequency' => 'Mỗi phút',
                'description' => 'Tìm và dispatch các workflow jobs đã được lên lịch',
                'group' => 'job',
            ],
            [
                'name' => 'Dọn dẹp dữ liệu cũ',
                'command' => 'cleanup:old-data',
                'frequency' => 'Hàng ngày lúc 3:00 AM',
                'description' => 'Xóa logs, sessions, và dữ liệu cũ để tiết kiệm tài nguyên',
                'group' => 'maintenance',
            ],
            [
                'name' => 'Dọn cache hết hạn',
                'command' => 'cache:prune-stale-tags',
                'frequency' => 'Chủ nhật hàng tuần lúc 4:00 AM',
                'description' => 'Xóa các cache entries đã hết hạn',
                'group' => 'maintenance',
            ],
        ];
    }

    protected function loadCleanupLog(): void
    {
        $logPath = storage_path('logs/cleanup.log');

        if (File::exists($logPath)) {
            $this->lastCleanupRun = date('d/m/Y H:i:s', File::lastModified($logPath));
            $content = File::get($logPath);
            $lines = explode("\n", $content);
            $this->cleanupLog = array_slice(array_filter($lines), -50); // Last 50 lines
        }
    }

    public function runCommand(string $command, bool $dryRun = false): void
    {
        try {
            $params = [];

            if ($command === 'cleanup:old-data') {
                $params = $dryRun ? ['--dry-run' => true] : ['--force' => true];
            }

            Artisan::call($command, $params);
            $output = Artisan::output();

            Notification::make()
                ->title('Command executed successfully')
                ->body("Command: {$command}")
                ->success()
                ->send();

            // Reload cleanup log if it was the cleanup command
            if ($command === 'cleanup:old-data') {
                $this->loadCleanupLog();
            }

        } catch (\Exception $e) {
            Notification::make()
                ->title('Command failed')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    public function runCleanupDryRun(): void
    {
        $this->runCommand('cleanup:old-data', true);
    }

    public function runCleanup(): void
    {
        $this->runCommand('cleanup:old-data', false);
    }

    public function clearCache(): void
    {
        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('view:clear');

            Notification::make()
                ->title('Cache cleared')
                ->body('All caches have been cleared successfully')
                ->success()
                ->send();

        } catch (\Exception $e) {
            Notification::make()
                ->title('Failed to clear cache')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    public function optimizeDatabase(): void
    {
        try {
            Artisan::call('cleanup:old-data', ['--force' => true]);

            Notification::make()
                ->title('Database optimized')
                ->body('Old data has been cleaned and tables optimized')
                ->success()
                ->send();

            $this->loadCleanupLog();

        } catch (\Exception $e) {
            Notification::make()
                ->title('Optimization failed')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('runCleanupDryRun')
                ->label('Xem trước Cleanup')
                ->icon('heroicon-o-eye')
                ->color('info')
                ->action('runCleanupDryRun'),

            Action::make('runCleanup')
                ->label('Chạy Cleanup')
                ->icon('heroicon-o-trash')
                ->color('danger')
                ->requiresConfirmation()
                ->modalHeading('Xác nhận chạy Cleanup')
                ->modalDescription('Bạn có chắc muốn dọn dẹp dữ liệu cũ? Hành động này không thể hoàn tác.')
                ->action('runCleanup'),

            Action::make('clearCache')
                ->label('Xóa Cache')
                ->icon('heroicon-o-arrow-path')
                ->color('warning')
                ->action('clearCache'),
        ];
    }
}
