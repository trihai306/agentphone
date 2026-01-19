<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

trait LogsActivity
{
    /**
     * Columns to exclude from activity logging
     * Override in model: protected array $dontLogColumns = ['last_active_at', 'socket_connected'];
     */
    public function getDontLogColumns(): array
    {
        return $this->dontLogColumns ?? [
            'updated_at',
            'created_at',
            'remember_token',
        ];
    }

    /**
     * Only log these columns (if set, ignores $dontLogColumns)
     * Override in model: protected array $onlyLogColumns = ['name', 'status'];
     */
    public function getOnlyLogColumns(): array
    {
        return $this->onlyLogColumns ?? [];
    }

    public static function bootLogsActivity(): void
    {
        static::created(function (Model $model) {
            if (!auth()->check())
                return;

            $attributes = $model->filterLogAttributes($model->getAttributes());
            if (empty($attributes))
                return;

            ActivityLog::log(
                ActivityLog::ACTION_CREATE,
                "Tạo mới " . class_basename($model) . ": " . $model->getLogIdentifier(),
                $model,
                null,
                $attributes
            );
        });

        static::updated(function (Model $model) {
            if (!auth()->check())
                return;

            $original = $model->getOriginal();
            $changes = $model->getChanges();

            // Filter out ignored columns
            $changes = $model->filterLogAttributes($changes);
            if (empty($changes))
                return;

            $original = array_intersect_key($original, $changes);

            ActivityLog::log(
                ActivityLog::ACTION_UPDATE,
                "Cập nhật " . class_basename($model) . ": " . $model->getLogIdentifier(),
                $model,
                $original,
                $changes
            );
        });

        static::deleted(function (Model $model) {
            if (!auth()->check())
                return;

            ActivityLog::log(
                ActivityLog::ACTION_DELETE,
                "Xóa " . class_basename($model) . ": " . $model->getLogIdentifier(),
                $model,
                $model->filterLogAttributes($model->getAttributes()),
                null
            );
        });
    }

    /**
     * Filter attributes based on onlyLogColumns or dontLogColumns
     */
    protected function filterLogAttributes(array $attributes): array
    {
        $onlyColumns = $this->getOnlyLogColumns();

        if (!empty($onlyColumns)) {
            return array_intersect_key($attributes, array_flip($onlyColumns));
        }

        $dontLogColumns = $this->getDontLogColumns();
        return array_diff_key($attributes, array_flip($dontLogColumns));
    }

    /**
     * Get identifier for log description
     */
    protected function getLogIdentifier(): string
    {
        return $this->name ?? $this->title ?? $this->email ?? "#{$this->getKey()}";
    }
}

