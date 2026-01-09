<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function (Model $model) {
            ActivityLog::log(
                ActivityLog::ACTION_CREATE,
                "Tạo mới " . class_basename($model) . " #{$model->getKey()}",
                $model,
                null,
                $model->getAttributes()
            );
        });

        static::updated(function (Model $model) {
            $original = $model->getOriginal();
            $changes = $model->getChanges();

            // Remove timestamps from changes
            unset($changes['updated_at']);

            if (empty($changes))
                return;

            ActivityLog::log(
                ActivityLog::ACTION_UPDATE,
                "Cập nhật " . class_basename($model) . " #{$model->getKey()}",
                $model,
                array_intersect_key($original, $changes),
                $changes
            );
        });

        static::deleted(function (Model $model) {
            ActivityLog::log(
                ActivityLog::ACTION_DELETE,
                "Xóa " . class_basename($model) . " #{$model->getKey()}",
                $model,
                $model->getAttributes(),
                null
            );
        });
    }
}
