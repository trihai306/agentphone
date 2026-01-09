<x-filament-panels::page>
    <div class="space-y-6">
        {{-- Header Stats --}}
        @if ($this->getHeaderWidgets())
            <x-filament-widgets::widgets :columns="$this->getHeaderWidgetsColumns()" :widgets="$this->getHeaderWidgets()" />
        @endif

        {{-- Footer Widgets --}}
        @if ($this->getFooterWidgets())
            <x-filament-widgets::widgets :columns="$this->getFooterWidgetsColumns()" :widgets="$this->getFooterWidgets()" />
        @endif
    </div>
</x-filament-panels::page>