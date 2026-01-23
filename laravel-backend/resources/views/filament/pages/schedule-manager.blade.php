<x-filament-panels::page>
    <div class="space-y-6">
        {{-- Quick Actions --}}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <x-filament::section>
                <div class="text-center">
                    <div class="text-3xl font-bold text-primary-600">{{ count($schedules) }}</div>
                    <div class="text-sm text-gray-500">Scheduled Tasks</div>
                </div>
            </x-filament::section>

            <x-filament::section>
                <div class="text-center">
                    <div class="text-3xl font-bold text-success-600">3</div>
                    <div class="text-sm text-gray-500">Mỗi phút</div>
                </div>
            </x-filament::section>

            <x-filament::section>
                <div class="text-center">
                    <div class="text-3xl font-bold text-warning-600">1</div>
                    <div class="text-sm text-gray-500">Hàng ngày</div>
                </div>
            </x-filament::section>

            <x-filament::section>
                <div class="text-center">
                    <div class="text-3xl font-bold text-info-600">1</div>
                    <div class="text-sm text-gray-500">Hàng tuần</div>
                </div>
            </x-filament::section>
        </div>

        {{-- Scheduled Tasks List --}}
        <x-filament::section>
            <x-slot name="heading">
                <div class="flex items-center gap-2">
                    <x-heroicon-o-queue-list class="w-5 h-5" />
                    Danh sách Scheduled Tasks
                </div>
            </x-slot>

            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                            <th class="text-left py-3 px-4 font-medium">Task</th>
                            <th class="text-left py-3 px-4 font-medium">Command</th>
                            <th class="text-left py-3 px-4 font-medium">Tần suất</th>
                            <th class="text-left py-3 px-4 font-medium">Mô tả</th>
                            <th class="text-center py-3 px-4 font-medium">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($schedules as $schedule)
                            <tr
                                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td class="py-3 px-4">
                                    <div class="flex items-center gap-2">
                                        @if($schedule['group'] === 'device')
                                            <span
                                                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                                                <x-heroicon-o-device-phone-mobile class="w-4 h-4" />
                                            </span>
                                        @elseif($schedule['group'] === 'job')
                                            <span
                                                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400">
                                                <x-heroicon-o-play class="w-4 h-4" />
                                            </span>
                                        @else
                                            <span
                                                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400">
                                                <x-heroicon-o-wrench-screwdriver class="w-4 h-4" />
                                            </span>
                                        @endif
                                        <span class="font-medium">{{ $schedule['name'] }}</span>
                                    </div>
                                </td>
                                <td class="py-3 px-4">
                                    <code class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                        {{ $schedule['command'] }}
                                    </code>
                                </td>
                                <td class="py-3 px-4">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                        @if(str_contains($schedule['frequency'], 'phút')) bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300
                                        @elseif(str_contains($schedule['frequency'], 'ngày')) bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300
                                        @else bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300
                                        @endif">
                                        {{ $schedule['frequency'] }}
                                    </span>
                                </td>
                                <td class="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                                    {{ $schedule['description'] }}
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <x-filament::button size="xs" color="gray"
                                        wire:click="runCommand('{{ $schedule['command'] }}')" wire:loading.attr="disabled">
                                        <x-heroicon-o-play class="w-3 h-3 mr-1" />
                                        Chạy
                                    </x-filament::button>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </x-filament::section>

        {{-- Cleanup Configuration --}}
        <x-filament::section>
            <x-slot name="heading">
                <div class="flex items-center gap-2">
                    <x-heroicon-o-cog-6-tooth class="w-5 h-5" />
                    Cấu hình Data Retention
                </div>
            </x-slot>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                @php
                    $retentionConfig = [
                        ['name' => 'API Logs', 'days' => 7, 'icon' => 'heroicon-o-server'],
                        ['name' => 'Activity Logs', 'days' => 30, 'icon' => 'heroicon-o-clipboard-document-list'],
                        ['name' => 'Device Logs', 'days' => 14, 'icon' => 'heroicon-o-device-phone-mobile'],
                        ['name' => 'Job Logs', 'days' => 14, 'icon' => 'heroicon-o-document-text'],
                        ['name' => 'Interactions', 'days' => 30, 'icon' => 'heroicon-o-chat-bubble-left-right'],
                        ['name' => 'Sessions', 'days' => 7, 'icon' => 'heroicon-o-user-circle'],
                        ['name' => 'Recordings', 'days' => 7, 'icon' => 'heroicon-o-video-camera'],
                        ['name' => 'Notifications', 'days' => 60, 'icon' => 'heroicon-o-bell'],
                        ['name' => 'Failed Jobs', 'days' => 30, 'icon' => 'heroicon-o-exclamation-triangle'],
                        ['name' => 'Completed Jobs', 'days' => 30, 'icon' => 'heroicon-o-check-circle'],
                        ['name' => 'Cache', 'days' => 1, 'icon' => 'heroicon-o-archive-box'],
                        ['name' => 'Temp Files', 'days' => 1, 'icon' => 'heroicon-o-folder'],
                    ];
                @endphp

                @foreach($retentionConfig as $config)
                    <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                        <div class="text-2xl font-bold text-primary-600">{{ $config['days'] }}</div>
                        <div class="text-xs text-gray-500">ngày</div>
                        <div class="text-xs font-medium mt-1">{{ $config['name'] }}</div>
                    </div>
                @endforeach
            </div>
        </x-filament::section>

        {{-- Cleanup Log --}}
        <x-filament::section collapsible collapsed>
            <x-slot name="heading">
                <div class="flex items-center gap-2">
                    <x-heroicon-o-document-text class="w-5 h-5" />
                    Cleanup Log
                    @if($lastCleanupRun)
                        <span class="text-xs text-gray-500 font-normal">(Lần chạy cuối: {{ $lastCleanupRun }})</span>
                    @endif
                </div>
            </x-slot>

            <div
                class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                @if(count($cleanupLog) > 0)
                    @foreach($cleanupLog as $line)
                        <div class="whitespace-pre">{{ $line }}</div>
                    @endforeach
                @else
                    <div class="text-gray-500">Chưa có log cleanup nào.</div>
                @endif
            </div>
        </x-filament::section>

        {{-- System Info --}}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <x-filament::section>
                <x-slot name="heading">
                    <div class="flex items-center gap-2">
                        <x-heroicon-o-server class="w-5 h-5" />
                        Disk Usage
                    </div>
                </x-slot>
                @php
                    $diskTotal = disk_total_space('/');
                    $diskFree = disk_free_space('/');
                    $diskUsed = $diskTotal - $diskFree;
                    $diskPercent = round(($diskUsed / $diskTotal) * 100, 1);
                @endphp
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span>Đã dùng</span>
                        <span class="font-medium">{{ number_format($diskUsed / 1024 / 1024 / 1024, 1) }} GB /
                            {{ number_format($diskTotal / 1024 / 1024 / 1024, 1) }} GB</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="h-2 rounded-full {{ $diskPercent > 90 ? 'bg-red-500' : ($diskPercent > 70 ? 'bg-yellow-500' : 'bg-green-500') }}"
                            style="width: {{ $diskPercent }}%"></div>
                    </div>
                    <div class="text-xs text-gray-500 text-right">{{ $diskPercent }}% used</div>
                </div>
            </x-filament::section>

            <x-filament::section>
                <x-slot name="heading">
                    <div class="flex items-center gap-2">
                        <x-heroicon-o-circle-stack class="w-5 h-5" />
                        Database Size
                    </div>
                </x-slot>
                @php
                    try {
                        $dbSize = \DB::select("SELECT SUM(data_length + index_length) as size FROM information_schema.tables WHERE table_schema = ?", [config('database.connections.mysql.database')])[0]->size ?? 0;
                        $dbSizeMB = round($dbSize / 1024 / 1024, 2);
                    } catch (\Exception $e) {
                        $dbSizeMB = 0;
                    }
                @endphp
                <div class="text-center">
                    <div class="text-3xl font-bold text-primary-600">{{ $dbSizeMB }}</div>
                    <div class="text-sm text-gray-500">MB</div>
                </div>
            </x-filament::section>

            <x-filament::section>
                <x-slot name="heading">
                    <div class="flex items-center gap-2">
                        <x-heroicon-o-folder class="w-5 h-5" />
                        Storage Logs
                    </div>
                </x-slot>
                @php
                    $logsPath = storage_path('logs');
                    $logsSize = 0;
                    if (is_dir($logsPath)) {
                        foreach (glob($logsPath . '/*') as $file) {
                            if (is_file($file))
                                $logsSize += filesize($file);
                        }
                    }
                    $logsSizeMB = round($logsSize / 1024 / 1024, 2);
                @endphp
                <div class="text-center">
                    <div class="text-3xl font-bold {{ $logsSizeMB > 100 ? 'text-red-600' : 'text-success-600' }}">
                        {{ $logsSizeMB }}</div>
                    <div class="text-sm text-gray-500">MB logs</div>
                </div>
            </x-filament::section>
        </div>
    </div>
</x-filament-panels::page>