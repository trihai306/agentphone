<?php

namespace App\Filament\Pages;

use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class BackupManager extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-server-stack';

    protected static string $view = 'filament.pages.backup-manager';

    protected static ?string $slug = 'backup-manager';

    protected static ?string $navigationLabel = 'Backup & Bảo Trì';

    protected static ?string $title = 'Quản Lý Backup & Bảo Trì';

    protected static ?string $navigationGroup = '⚙️ Hệ Thống';

    protected static ?int $navigationSort = 13;

    public bool $maintenanceMode = false;

    public function mount(): void
    {
        $this->maintenanceMode = app()->isDownForMaintenance();
    }

    public function getBackups(): array
    {
        $backupPath = storage_path('backups');

        if (!File::exists($backupPath)) {
            File::makeDirectory($backupPath, 0755, true);
            return [];
        }

        $files = File::files($backupPath);
        $backups = [];

        foreach ($files as $file) {
            if (in_array($file->getExtension(), ['sql', 'zip', 'gz'])) {
                $backups[] = [
                    'name' => $file->getFilename(),
                    'size' => $this->formatBytes($file->getSize()),
                    'date' => date('d/m/Y H:i', $file->getMTime()),
                    'path' => $file->getPathname(),
                ];
            }
        }

        return array_reverse($backups);
    }

    public function createBackup(): void
    {
        try {
            $filename = 'backup_' . date('Y-m-d_His') . '.sql';
            $path = storage_path('backups/' . $filename);

            // Simple database dump (MySQL)
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host = config('database.connections.mysql.host');

            $command = "mysqldump -h{$host} -u{$username} -p{$password} {$database} > {$path}";
            exec($command, $output, $resultCode);

            if ($resultCode === 0) {
                Notification::make()
                    ->title('Backup thành công!')
                    ->body("File: {$filename}")
                    ->success()
                    ->send();
            } else {
                throw new \Exception('Backup failed');
            }
        } catch (\Exception $e) {
            Notification::make()
                ->title('Backup thất bại!')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    public function toggleMaintenanceMode(): void
    {
        if (app()->isDownForMaintenance()) {
            Artisan::call('up');
            $this->maintenanceMode = false;
            Notification::make()
                ->title('Đã tắt chế độ bảo trì')
                ->success()
                ->send();
        } else {
            Artisan::call('down', ['--secret' => 'admin-bypass-key']);
            $this->maintenanceMode = true;
            Notification::make()
                ->title('Đã bật chế độ bảo trì')
                ->body('Truy cập /admin-bypass-key để bypass')
                ->warning()
                ->send();
        }
    }

    public function clearCache(): void
    {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('view:clear');
        Artisan::call('route:clear');

        Notification::make()
            ->title('Đã xóa cache!')
            ->success()
            ->send();
    }

    public function deleteBackup(string $filename): void
    {
        $path = storage_path('backups/' . $filename);

        if (File::exists($path)) {
            File::delete($path);
            Notification::make()
                ->title('Đã xóa backup!')
                ->success()
                ->send();
        }
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);
        return sprintf("%.2f", $bytes / pow(1024, $factor)) . ' ' . $units[$factor];
    }
}
