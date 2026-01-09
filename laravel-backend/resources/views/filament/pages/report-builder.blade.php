<x-filament-panels::page>
    <div class="space-y-6">
        {{-- Report Form --}}
        <x-filament::section>
            <x-slot name="heading">
                <div class="flex items-center gap-2">
                    <x-heroicon-o-funnel class="w-5 h-5 text-primary-500" />
                    <span>Tùy Chọn Báo Cáo</span>
                </div>
            </x-slot>

            {{ $this->form }}
        </x-filament::section>

        {{-- Report Results --}}
        @if($reportData)
            <x-filament::section>
                <x-slot name="heading">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <x-heroicon-o-document-text class="w-5 h-5 text-success-500" />
                            <span>{{ $reportData['title'] }}</span>
                        </div>
                        <span class="text-sm text-gray-500">
                            {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }} -
                            {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}
                        </span>
                    </div>
                </x-slot>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    @foreach($reportData['summary'] as $item)
                        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                            <div class="text-2xl font-bold text-gray-900 dark:text-white">
                                {{ $item['value'] }}
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {{ $item['label'] }}
                            </div>
                        </div>
                    @endforeach
                </div>

                <div class="mt-6 flex gap-2">
                    <x-filament::button color="gray" outlined>
                        <x-heroicon-m-printer class="w-4 h-4 mr-2" />
                        In Báo Cáo
                    </x-filament::button>
                    <x-filament::button color="success" outlined>
                        <x-heroicon-m-arrow-down-tray class="w-4 h-4 mr-2" />
                        Xuất Excel
                    </x-filament::button>
                </div>
            </x-filament::section>
        @else
            <x-filament::section>
                <div class="text-center py-12">
                    <x-heroicon-o-document-chart-bar class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p class="text-gray-500 dark:text-gray-400">
                        Chọn loại báo cáo và khoảng thời gian, sau đó nhấn "Tạo Báo Cáo"
                    </p>
                </div>
            </x-filament::section>
        @endif
    </div>
</x-filament-panels::page>