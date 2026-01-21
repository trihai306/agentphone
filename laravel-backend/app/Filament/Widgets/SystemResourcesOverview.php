<?php

namespace App\Filament\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class SystemResourcesOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected static ?string $pollingInterval = '30s';

    protected int|string|array $columnSpan = 'full';

    protected function getStats(): array
    {
        return [
            $this->getDiskStat(),
            $this->getMemoryStat(),
            $this->getCpuStat(),
            $this->getDatabaseStat(),
        ];
    }

    protected function getDiskStat(): Stat
    {
        $storagePath = storage_path();
        $totalDisk = disk_total_space($storagePath);
        $freeDisk = disk_free_space($storagePath);
        $usedDisk = $totalDisk - $freeDisk;
        $usedPercent = round(($usedDisk / $totalDisk) * 100, 1);

        $color = match (true) {
            $usedPercent >= 90 => 'danger',
            $usedPercent >= 70 => 'warning',
            default => 'success',
        };

        return Stat::make('Disk Storage', $this->formatBytes($usedDisk))
            ->description("Còn trống: {$this->formatBytes($freeDisk)} ({$usedPercent}% used)")
            ->descriptionIcon('heroicon-m-circle-stack')
            ->color($color)
            ->chart($this->generateUsageChart($usedPercent));
    }

    protected function getMemoryStat(): Stat
    {
        $memInfo = $this->getMemoryInfo();

        $color = match (true) {
            $memInfo['used_percent'] >= 90 => 'danger',
            $memInfo['used_percent'] >= 70 => 'warning',
            default => 'success',
        };

        return Stat::make('Memory (RAM)', $memInfo['used'])
            ->description("Còn trống: {$memInfo['free']} ({$memInfo['used_percent']}% used)")
            ->descriptionIcon('heroicon-m-cpu-chip')
            ->color($color)
            ->chart($this->generateUsageChart($memInfo['used_percent']));
    }

    protected function getCpuStat(): Stat
    {
        $load = sys_getloadavg();
        $cpuCount = $this->getCpuCount();
        $loadPercent = round(($load[0] / $cpuCount) * 100, 1);

        $color = match (true) {
            $loadPercent >= 90 => 'danger',
            $loadPercent >= 70 => 'warning',
            default => 'success',
        };

        $loadStr = sprintf('%.2f / %.2f / %.2f', $load[0], $load[1], $load[2]);

        return Stat::make('CPU Load', $loadStr)
            ->description("{$cpuCount} cores • {$loadPercent}% avg load")
            ->descriptionIcon('heroicon-m-bolt')
            ->color($color)
            ->chart($this->generateUsageChart(min($loadPercent, 100)));
    }

    protected function getDatabaseStat(): Stat
    {
        try {
            $dbName = config('database.connections.mysql.database');
            $result = DB::select("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb,
                    COUNT(*) as table_count
                FROM information_schema.tables 
                WHERE table_schema = ?
            ", [$dbName]);

            $sizeMb = $result[0]->size_mb ?? 0;
            $tableCount = $result[0]->table_count ?? 0;

            $size = $sizeMb >= 1000
                ? round($sizeMb / 1024, 2) . ' GB'
                : round($sizeMb, 1) . ' MB';

            return Stat::make('Database', $size)
                ->description("{$tableCount} tables • {$dbName}")
                ->descriptionIcon('heroicon-m-server-stack')
                ->color('info');
        } catch (\Exception $e) {
            return Stat::make('Database', 'N/A')
                ->description('Không thể lấy thông tin')
                ->descriptionIcon('heroicon-m-server-stack')
                ->color('gray');
        }
    }

    protected function getMemoryInfo(): array
    {
        if (PHP_OS_FAMILY === 'Darwin') {
            $vmStat = shell_exec('vm_stat');
            $pageSize = 16384;

            preg_match('/Pages active:\s+(\d+)/', $vmStat, $activeMatch);
            preg_match('/Pages wired down:\s+(\d+)/', $vmStat, $wiredMatch);

            $sysctl = shell_exec('sysctl -n hw.memsize');
            $totalBytes = (int) trim($sysctl);

            $activePages = (int) ($activeMatch[1] ?? 0);
            $wiredPages = (int) ($wiredMatch[1] ?? 0);

            $usedBytes = ($activePages + $wiredPages) * $pageSize;
            $freeBytes = $totalBytes - $usedBytes;
        } else {
            $memInfo = file_get_contents('/proc/meminfo');
            preg_match('/MemTotal:\s+(\d+)/', $memInfo, $totalMatch);
            preg_match('/MemAvailable:\s+(\d+)/', $memInfo, $availMatch);

            $totalBytes = (int) ($totalMatch[1] ?? 0) * 1024;
            $availBytes = (int) ($availMatch[1] ?? 0) * 1024;
            $usedBytes = $totalBytes - $availBytes;
            $freeBytes = $availBytes;
        }

        $usedPercent = $totalBytes > 0 ? round(($usedBytes / $totalBytes) * 100, 1) : 0;

        return [
            'total' => $this->formatBytes($totalBytes),
            'used' => $this->formatBytes($usedBytes),
            'free' => $this->formatBytes($freeBytes),
            'used_percent' => $usedPercent,
        ];
    }

    protected function getCpuCount(): int
    {
        if (PHP_OS_FAMILY === 'Darwin') {
            return (int) trim(shell_exec('sysctl -n hw.ncpu'));
        }
        return (int) trim(shell_exec('nproc'));
    }

    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    protected function generateUsageChart(float $percent): array
    {
        // Generate a simple chart that shows the usage level
        $baseValue = max(1, (int) ($percent / 10));
        return [
            max(1, $baseValue - 2),
            max(1, $baseValue - 1),
            $baseValue,
            max(1, $baseValue - 1),
            $baseValue,
            max(1, $baseValue + 1),
            (int) ($percent / 10),
        ];
    }
}
