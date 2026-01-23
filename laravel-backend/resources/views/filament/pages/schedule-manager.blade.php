<x-filament-panels::page>
    <div class="space-y-4">
        {{-- Stats Row - Force horizontal --}}
        <div class="flex flex-wrap gap-3">
            <div
                class="flex-1 min-w-[80px] max-w-[120px] bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div class="text-xl font-bold text-primary-600">{{ count($schedules) }}</div>
                <div class="text-[10px] text-gray-500">Tasks</div>
            </div>
            <div
                class="flex-1 min-w-[80px] max-w-[120px] bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div class="text-xl font-bold text-success-600">3</div>
                <div class="text-[10px] text-gray-500">Mỗi phút</div>
            </div>
            <div
                class="flex-1 min-w-[80px] max-w-[120px] bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div class="text-xl font-bold text-warning-600">1</div>
                <div class="text-[10px] text-gray-500">Hàng ngày</div>
            </div>
            <div
                class="flex-1 min-w-[80px] max-w-[120px] bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div class="text-xl font-bold text-info-600">1</div>
                <div class="text-[10px] text-gray-500">Hàng tuần</div>
            </div>
            @php
                $diskTotal = disk_total_space('/');
                $diskFree = disk_free_space('/');
                $diskUsed = $diskTotal - $diskFree;
                $diskPercent = round(($diskUsed / $diskTotal) * 100, 1);
                try {
                    $dbSize = \DB::select("SELECT SUM(data_length + index_length) as size FROM information_schema.tables WHERE table_schema = ?", [config('database.connections.mysql.database')])[0]->size ?? 0;
                    $dbSizeMB = round($dbSize / 1024 / 1024, 2);
                } catch (\Exception $e) {
                    $dbSizeMB = 0;
                }
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
            <div
                class="flex-1 min-w-[80px] max-w-[120px] bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div
                    class="text-xl font-bold {{ $diskPercent > 80 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300' }}">
                    {{ $diskPercent }}%</div>
                <div class="text-[10px] text-gray-500">Disk</div>
            </div>
            <div
                class="flex-1 min-w-[80px] max-w-[120px] bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div class="text-xl font-bold text-gray-700 dark:text-gray-300">{{ $dbSizeMB }}</div>
                <div class="text-[10px] text-gray-500">DB (MB)</div>
            </div>
            <div
                class="flex-1 min-w-[80px] max-w-[120px] bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div
                    class="text-xl font-bold {{ $logsSizeMB > 50 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300' }}">
                    {{ $logsSizeMB }}</div>
                <div class="text-[10px] text-gray-500">Logs (MB)</div>
            </div>
        </div>

        {{-- Scheduled Tasks - Compact table --}}
        <x-filament::section>
            <x-slot name="heading">
                <span class="text-sm">Scheduled Tasks</span>
            </x-slot>

            <div class="overflow-x-auto -mx-4 -my-2">
                <table class="w-full text-sm">
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        @foreach($schedules as $schedule)
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td class="px-4 py-2 w-8">
                                    @if($schedule['group'] === 'device')
                                        <span
                                            class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center">
                                            <x-heroicon-o-device-phone-mobile class="w-3 h-3" />
                                        </span>
                                    @elseif($schedule['group'] === 'job')
                                        <span
                                            class="w-6 h-6 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 flex items-center justify-center">
                                            <x-heroicon-o-play class="w-3 h-3" />
                                        </span>
                                    @else
                                        <span
                                            class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400 flex items-center justify-center">
                                            <x-heroicon-o-wrench-screwdriver class="w-3 h-3" />
                                        </span>
                                    @endif
                                </td>
                                <td class="px-2 py-2">
                                    <div class="font-medium text-sm">{{ $schedule['name'] }}</div>
                                    <code class="text-[10px] text-gray-500">{{ $schedule['command'] }}</code>
                                </td>
                                <td class="px-2 py-2">
                                    <span class="inline-flex px-2 py-0.5 rounded text-[10px] font-medium
                                        @if(str_contains($schedule['frequency'], 'phút')) bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300
                                        @elseif(str_contains($schedule['frequency'], 'ngày')) bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300
                                        @else bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300
                                        @endif">
                                        {{ $schedule['frequency'] }}
                                    </span>
                                </td>
                                <td class="px-4 py-2 text-right">
                                    <x-filament::button size="xs" color="gray"
                                        wire:click="runCommand('{{ $schedule['command'] }}')">
                                        <x-heroicon-o-play class="w-3 h-3" />
                                    </x-filament::button>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </x-filament::section>

        {{-- Data Retention - Grid --}}
        <x-filament::section>
            <x-slot name="heading">
                <span class="text-sm">Data Retention (ngày)</span>
            </x-slot>

            <div class="flex flex-wrap gap-2 -mx-2 -my-1">
                @php
                    $retentionConfig = [
                        ['name' => 'API', 'days' => 7],
                        ['name' => 'Activity', 'days' => 30],
                        ['name' => 'Device', 'days' => 14],
                        ['name' => 'Jobs', 'days' => 14],
                        ['name' => 'History', 'days' => 30],
                        ['name' => 'Session', 'days' => 7],
                        ['name' => 'Recording', 'days' => 7],
                        ['name' => 'Notif', 'days' => 60],
                        ['name' => 'Failed', 'days' => 30],
                        ['name' => 'Done', 'days' => 30],
                        ['name' => 'Cache', 'days' => 1],
                        ['name' => 'Temp', 'days' => 1],
                    ];
                @endphp

                @foreach($retentionConfig as $config)
                    <div class="w-16 p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                        <div class="text-base font-bold text-primary-600">{{ $config['days'] }}</div>
                        <div class="text-[9px] text-gray-500 truncate">{{ $config['name'] }}</div>
                    </div>
                @endforeach
            </div>
        </x-filament::section>

        {{-- Cleanup Log --}}
        <x-filament::section collapsible collapsed>
            <x-slot name="heading">
                <span class="text-sm">Cleanup Log</span>
                @if($lastCleanupRun)
                    <span class="text-[10px] text-gray-400 font-normal ml-2">({{ $lastCleanupRun }})</span>
                @endif
            </x-slot>

            <div class="bg-gray-900 text-green-400 p-2 rounded font-mono text-[9px] max-h-32 overflow-y-auto">
                @if(count($cleanupLog) > 0)
                    @foreach($cleanupLog as $line)
                        <div>{{ $line }}</div>
                    @endforeach
                @else
                    <span class="text-gray-500">Chưa có log.</span>
                @endif
            </div>
        </x-filament::section>
    </div>
</x-filament-panels::page>