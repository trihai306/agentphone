<x-filament-widgets::widget>
    <x-filament::section>
        <x-slot name="heading">
            <div class="flex items-center gap-2">
                <x-heroicon-o-bolt class="w-5 h-5 text-warning-500" />
                <span>WebSocket Server (Soketi)</span>
            </div>
        </x-slot>

        <div class="space-y-4">
            {{-- Connection Status --}}
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Trạng thái</span>
                @if($stats['connected'])
                    <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300">
                        <span class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                        Đang hoạt động
                    </span>
                @else
                    <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-300">
                        <span class="w-2 h-2 bg-danger-500 rounded-full"></span>
                        Offline
                    </span>
                @endif
            </div>

            {{-- Stats Grid --}}
            <div class="grid grid-cols-2 gap-4">
                <div
                    class="p-4 rounded-lg bg-primary-50 dark:bg-gray-800/50 border border-primary-200 dark:border-gray-700">
                    <div class="text-2xl font-bold text-primary-700 dark:text-primary-400">
                        {{ number_format($stats['connections']) }}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Kết nối hiện tại
                    </div>
                </div>
                <div
                    class="p-4 rounded-lg bg-warning-50 dark:bg-gray-800/50 border border-warning-200 dark:border-gray-700">
                    <div class="text-2xl font-bold text-warning-700 dark:text-warning-400">
                        {{ number_format($stats['peak_connections']) }}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Peak connections
                    </div>
                </div>
            </div>

            {{-- Channels List --}}
            @if(count($channels) > 0)
                <div class="mt-4">
                    <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Channels hoạt động ({{ $channelCount }})
                    </div>
                    <div class="max-h-32 overflow-y-auto space-y-1">
                        @foreach($channels as $channelName => $channelData)
                            <div
                                class="flex items-center justify-between px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                                <span class="font-mono truncate">{{ $channelName }}</span>
                                <span class="text-gray-500">{{ $channelData['subscription_count'] ?? 0 }} sub</span>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif

            {{-- Memory Usage --}}
            @if(!empty($stats['memory']))
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Memory: {{ round(($stats['memory']['heapUsed'] ?? 0) / 1024 / 1024, 1) }}MB /
                    {{ round(($stats['memory']['heapTotal'] ?? 0) / 1024 / 1024, 1) }}MB
                </div>
            @endif
        </div>
    </x-filament::section>
</x-filament-widgets::widget>