<x-filament-panels::page>
    <div class="space-y-4">
        {{-- Header Stats + System Info in one row --}}
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div class="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-2xl font-bold text-primary-600">{{ count($schedules) }}</div>
                <div class="text-xs text-gray-500">Tasks</div>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-2xl font-bold text-success-600">3</div>
                <div class="text-xs text-gray-500">Mỗi phút</div>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-2xl font-bold text-warning-600">1</div>
                <div class="text-xs text-gray-500">Hàng ngày</div>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-2xl font-bold text-info-600">1</div>
                <div class="text-xs text-gray-500">Hàng tuần</div>
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
            <div class="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div
                    class="text-2xl font-bold {{ $diskPercent > 80 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300' }}">
                    {{ $diskPercent }}%</div>
                <div class="text-xs text-gray-500">Disk</div>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ $dbSizeMB }}</div>
                <div class="text-xs text-gray-500">DB (MB)</div>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div
                    class="text-2xl font-bold {{ $logsSizeMB > 50 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300' }}">
                    {{ $logsSizeMB }}</div>
                <div class="text-xs text-gray-500">Logs (MB)</div>
            </div>
        </div>

        {{-- Main Content: Tasks + Retention --}}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {{-- Scheduled Tasks --}}
            <div class="lg:col-span-2">
                <x-filament::section>
                    <x-slot name="heading">
                        <div class="flex items-center gap-2 text-sm">
                            <x-heroicon-o-queue-list class="w-4 h-4" />
                            Scheduled Tasks
                        </div>
                    </x-slot>

                    <div class="divide-y divide-gray-100 dark:divide-gray-800 -mx-4 -my-2">
                        @foreach($schedules as $schedule)
                            <div
                                class="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div class="flex items-center gap-3">
                                    @if($schedule['group'] === 'device')
                                        <span
                                            class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 flex items-center justify-center">
                                            <x-heroicon-o-device-phone-mobile class="w-3.5 h-3.5" />
                                        </span>
                                    @elseif($schedule['group'] === 'job')
                                        <span
                                            class="w-7 h-7 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400 flex items-center justify-center">
                                            <x-heroicon-o-play class="w-3.5 h-3.5" />
                                        </span>
                                    @else
                                        <span
                                            class="w-7 h-7 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400 flex items-center justify-center">
                                            <x-heroicon-o-wrench-screwdriver class="w-3.5 h-3.5" />
                                        </span>
                                    @endif
                                    <div>
                                        <div class="text-sm font-medium">{{ $schedule['name'] }}</div>
                                        <div class="text-xs text-gray-500">
                                            <code class="text-xs">{{ $schedule['command'] }}</code>
                                            <span class="mx-1">•</span>
                                            <span class="text-primary-600">{{ $schedule['frequency'] }}</span>
                                        </div>
                                    </div>
                                </div>
                                <x-filament::button size="xs" color="gray"
                                    wire:click="runCommand('{{ $schedule['command'] }}')">
                                    <x-heroicon-o-play class="w-3 h-3" />
                                </x-filament::button>
                            </div>
                        @endforeach
                    </div>
                </x-filament::section>
            </div>

            {{-- Data Retention --}}
            <div>
                <x-filament::section>
                    <x-slot name="heading">
                        <div class="flex items-center gap-2 text-sm">
                            <x-heroicon-o-cog-6-tooth class="w-4 h-4" />
                            Data Retention
                        </div>
                    </x-slot>

                    <div class="grid grid-cols-3 gap-2 -mx-2 -my-1">
                        @php
                            $retentionConfig = [
                                ['name' => 'API', 'days' => 7],
                                ['name' => 'Activity', 'days' => 30],
                                ['name' => 'Device', 'days' => 14],
                                ['name' => 'Jobs', 'days' => 14],
                                ['name' => 'History', 'days' => 30],
                                ['name' => 'Session', 'days' => 7],
                                ['name' => 'Record', 'days' => 7],
                                ['name' => 'Notif', 'days' => 60],
                                ['name' => 'Failed', 'days' => 30],
                                ['name' => 'Done', 'days' => 30],
                                ['name' => 'Cache', 'days' => 1],
                                ['name' => 'Temp', 'days' => 1],
                            ];
                        @endphp

                        @foreach($retentionConfig as $config)
                            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                                <div class="text-lg font-bold text-primary-600">{{ $config['days'] }}</div>
                                <div class="text-[10px] text-gray-500 truncate">{{ $config['name'] }}</div>
                            </div>
                        @endforeach
                    </div>
                </x-filament::section>
            </div>
        </div>

        {{-- Cleanup Log --}}
        <x-filament::section collapsible collapsed>
            <x-slot name="heading">
                <div class="flex items-center gap-2 text-sm">
                    <x-heroicon-o-document-text class="w-4 h-4" />
                    Cleanup Log
                    @if($lastCleanupRun)
                        <span class="text-xs text-gray-400 font-normal ml-2">({{ $lastCleanupRun }})</span>
                    @endif
                </div>
            </x-slot>

            <div
                class="bg-gray-900 text-green-400 p-3 rounded font-mono text-[10px] max-h-48 overflow-y-auto -mx-2 -my-1">
                @if(count($cleanupLog) > 0)
                    @foreach($cleanupLog as $line)
                        <div class="whitespace-pre">{{ $line }}</div>
                    @endforeach
                @else
                    <div class="text-gray-500">Chưa có log.</div>
                @endif
            </div>
        </x-filament::section>
    </div>
</x-filament-panels::page>