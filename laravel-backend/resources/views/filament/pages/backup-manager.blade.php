<x-filament-panels::page>
    <div class="space-y-6">
        {{-- Quick Actions --}}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <x-filament::section>
                <x-slot name="heading">
                    <div class="flex items-center gap-2">
                        <x-heroicon-o-archive-box class="w-5 h-5 text-primary-500" />
                        <span>Tạo Backup</span>
                    </div>
                </x-slot>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Backup toàn bộ database vào file SQL.
                </p>
                <x-filament::button wire:click="createBackup" color="primary">
                    <x-heroicon-m-arrow-down-tray class="w-4 h-4 mr-2" />
                    Tạo Backup
                </x-filament::button>
            </x-filament::section>

            <x-filament::section>
                <x-slot name="heading">
                    <div class="flex items-center gap-2">
                        <x-heroicon-o-wrench-screwdriver class="w-5 h-5 text-warning-500" />
                        <span>Chế Độ Bảo Trì</span>
                    </div>
                </x-slot>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    @if($maintenanceMode)
                        <span class="text-warning-500 font-medium">⚠️ Đang bảo trì</span>
                    @else
                        <span class="text-success-500 font-medium">✓ Hoạt động bình thường</span>
                    @endif
                </p>
                <x-filament::button wire:click="toggleMaintenanceMode"
                    color="{{ $maintenanceMode ? 'success' : 'warning' }}">
                    @if($maintenanceMode)
                        <x-heroicon-m-play class="w-4 h-4 mr-2" />
                        Mở Lại Website
                    @else
                        <x-heroicon-m-pause class="w-4 h-4 mr-2" />
                        Bật Bảo Trì
                    @endif
                </x-filament::button>
            </x-filament::section>

            <x-filament::section>
                <x-slot name="heading">
                    <div class="flex items-center gap-2">
                        <x-heroicon-o-trash class="w-5 h-5 text-danger-500" />
                        <span>Xóa Cache</span>
                    </div>
                </x-slot>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Xóa cache hệ thống (config, views, routes).
                </p>
                <x-filament::button wire:click="clearCache" color="danger" outlined>
                    <x-heroicon-m-trash class="w-4 h-4 mr-2" />
                    Xóa Cache
                </x-filament::button>
            </x-filament::section>
        </div>

        {{-- Backup List --}}
        <x-filament::section>
            <x-slot name="heading">
                <div class="flex items-center gap-2">
                    <x-heroicon-o-folder-open class="w-5 h-5" />
                    <span>Danh Sách Backup</span>
                </div>
            </x-slot>

            @php $backups = $this->getBackups(); @endphp

            @if(count($backups) > 0)
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="text-left border-b dark:border-gray-700">
                            <tr>
                                <th class="pb-2 font-medium">Tên File</th>
                                <th class="pb-2 font-medium">Kích thước</th>
                                <th class="pb-2 font-medium">Ngày tạo</th>
                                <th class="pb-2 font-medium text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y dark:divide-gray-700">
                            @foreach($backups as $backup)
                                <tr>
                                    <td class="py-3 font-mono text-xs">{{ $backup['name'] }}</td>
                                    <td class="py-3">{{ $backup['size'] }}</td>
                                    <td class="py-3">{{ $backup['date'] }}</td>
                                    <td class="py-3 text-right">
                                        <x-filament::button wire:click="deleteBackup('{{ $backup['name'] }}')" color="danger"
                                            size="xs" outlined>
                                            Xóa
                                        </x-filament::button>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @else
                <p class="text-gray-500 dark:text-gray-400 text-center py-8">
                    Chưa có backup nào. Nhấn "Tạo Backup" để bắt đầu.
                </p>
            @endif
        </x-filament::section>
    </div>
</x-filament-panels::page>