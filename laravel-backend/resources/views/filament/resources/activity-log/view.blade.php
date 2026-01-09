<div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
        <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Người thực hiện:</span>
            <p class="text-gray-900 dark:text-white">{{ $record->user?->name ?? 'Hệ thống' }}</p>
        </div>
        <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian:</span>
            <p class="text-gray-900 dark:text-white">{{ $record->created_at->format('d/m/Y H:i:s') }}</p>
        </div>
        <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Hành động:</span>
            <p class="text-gray-900 dark:text-white">{{ $record->action_label }}</p>
        </div>
        <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Đối tượng:</span>
            <p class="text-gray-900 dark:text-white">{{ $record->model_name }} #{{ $record->model_id }}</p>
        </div>
    </div>

    <div>
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Mô tả:</span>
        <p class="text-gray-900 dark:text-white">{{ $record->description }}</p>
    </div>

    @if($record->old_values)
        <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Giá trị cũ:</span>
            <pre
                class="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-auto max-h-48">{{ json_encode($record->old_values, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</pre>
        </div>
    @endif

    @if($record->new_values)
        <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Giá trị mới:</span>
            <pre
                class="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-auto max-h-48">{{ json_encode($record->new_values, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</pre>
        </div>
    @endif

    <div class="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
        <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">IP Address:</span>
            <p class="text-gray-900 dark:text-white font-mono text-sm">{{ $record->ip_address ?? 'N/A' }}</p>
        </div>
        <div>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">User Agent:</span>
            <p class="text-gray-900 dark:text-white text-xs truncate">{{ $record->user_agent ?? 'N/A' }}</p>
        </div>
    </div>
</div>