<?php

namespace App\Filament\Widgets;

use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\File;

class StorageBreakdownChart extends ChartWidget
{
    protected static ?string $heading = 'Phân Bổ Storage';

    protected static ?string $description = 'Dung lượng theo thư mục';

    protected static ?int $sort = 2;

    protected static ?string $pollingInterval = '60s';

    protected int|string|array $columnSpan = 1;

    protected static ?string $maxHeight = '300px';

    protected function getData(): array
    {
        $folders = $this->getStorageFolders();

        $labels = [];
        $data = [];
        $colors = [
            'rgb(59, 130, 246)',   // blue - media
            'rgb(139, 92, 246)',   // purple - other
            'rgb(245, 158, 11)',   // amber - logs
            'rgb(16, 185, 129)',   // emerald - recordings
            'rgb(236, 72, 153)',   // pink - cache
            'rgb(107, 114, 128)',  // gray - sessions
        ];

        foreach ($folders as $index => $folder) {
            $labels[] = $folder['name'];
            $data[] = $folder['size_bytes'];
        }

        return [
            'datasets' => [
                [
                    'label' => 'Dung lượng',
                    'data' => $data,
                    'backgroundColor' => array_slice($colors, 0, count($data)),
                    'borderWidth' => 0,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'position' => 'bottom',
                    'labels' => [
                        'usePointStyle' => true,
                        'padding' => 15,
                    ],
                ],
            ],
            'maintainAspectRatio' => true,
        ];
    }

    protected function getStorageFolders(): array
    {
        $folderConfigs = [
            ['path' => storage_path('app/public/media'), 'name' => 'Media'],
            ['path' => storage_path('app/public/recordings'), 'name' => 'Recordings'],
            ['path' => storage_path('logs'), 'name' => 'Logs'],
            ['path' => storage_path('framework/cache'), 'name' => 'Cache'],
            ['path' => storage_path('framework/sessions'), 'name' => 'Sessions'],
        ];

        $result = [];
        $totalTracked = 0;

        foreach ($folderConfigs as $config) {
            if (File::isDirectory($config['path'])) {
                $size = $this->getDirectorySize($config['path']);
                $totalTracked += $size;

                if ($size > 1024) {
                    $result[] = [
                        'name' => $config['name'] . ' (' . $this->formatBytes($size) . ')',
                        'size_bytes' => $size,
                    ];
                }
            }
        }

        // Calculate "Other" storage
        $storagePath = storage_path();
        $totalStorage = $this->getDirectorySize($storagePath);
        $otherSize = max(0, $totalStorage - $totalTracked);

        if ($otherSize > 1024) {
            $result[] = [
                'name' => 'Other (' . $this->formatBytes($otherSize) . ')',
                'size_bytes' => $otherSize,
            ];
        }

        usort($result, fn($a, $b) => $b['size_bytes'] <=> $a['size_bytes']);

        return $result;
    }

    protected function getDirectorySize(string $path): int
    {
        $size = 0;
        try {
            $files = File::allFiles($path);
            foreach ($files as $file) {
                $size += $file->getSize();
            }
        } catch (\Exception $e) {
        }
        return $size;
    }

    protected function formatBytes(int $bytes, int $precision = 1): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
