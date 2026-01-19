<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    // Action constants
    public const ACTION_CREATE = 'create';
    public const ACTION_UPDATE = 'update';
    public const ACTION_DELETE = 'delete';
    public const ACTION_LOGIN = 'login';
    public const ACTION_LOGOUT = 'logout';
    public const ACTION_EXPORT = 'export';
    public const ACTION_IMPORT = 'import';
    public const ACTION_APPROVE = 'approve';
    public const ACTION_REJECT = 'reject';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): MorphTo
    {
        return $this->morphTo('model');
    }

    /**
     * Get action label for display
     */
    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            self::ACTION_CREATE => 'Tạo mới',
            self::ACTION_UPDATE => 'Cập nhật',
            self::ACTION_DELETE => 'Xóa',
            self::ACTION_LOGIN => 'Đăng nhập',
            self::ACTION_LOGOUT => 'Đăng xuất',
            self::ACTION_EXPORT => 'Xuất dữ liệu',
            self::ACTION_IMPORT => 'Nhập dữ liệu',
            self::ACTION_APPROVE => 'Phê duyệt',
            self::ACTION_REJECT => 'Từ chối',
            default => ucfirst($this->action),
        };
    }

    /**
     * Get action color for badges
     */
    public function getActionColorAttribute(): string
    {
        return match ($this->action) {
            self::ACTION_CREATE => 'success',
            self::ACTION_UPDATE => 'info',
            self::ACTION_DELETE => 'danger',
            self::ACTION_LOGIN => 'primary',
            self::ACTION_LOGOUT => 'gray',
            self::ACTION_APPROVE => 'success',
            self::ACTION_REJECT => 'danger',
            default => 'gray',
        };
    }

    /**
     * Get model name for display
     */
    public function getModelNameAttribute(): ?string
    {
        if (!$this->model_type)
            return null;

        $parts = explode('\\', $this->model_type);
        return end($parts);
    }

    /**
     * Log an activity
     */
    public static function log(
        string $action,
        string $description,
        ?Model $model = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        return static::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model?->getKey(),
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Scope for filtering by action
     */
    public function scopeOfAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope for filtering by model
     */
    public function scopeForModel($query, string $modelType, ?int $modelId = null)
    {
        $query->where('model_type', $modelType);
        if ($modelId) {
            $query->where('model_id', $modelId);
        }
        return $query;
    }

    /**
     * Check if this log entry can be restored
     */
    public function canRestore(): bool
    {
        // Can only restore update actions that have old_values
        if ($this->action !== self::ACTION_UPDATE) {
            return false;
        }

        if (empty($this->old_values)) {
            return false;
        }

        // Check if model exists
        if (!$this->model_type || !$this->model_id) {
            return false;
        }

        // Check if model class exists
        if (!class_exists($this->model_type)) {
            return false;
        }

        // Check if record still exists
        return $this->model_type::find($this->model_id) !== null;
    }

    /**
     * Restore the model to its old values
     */
    public function restoreOldValues(): bool
    {
        if (!$this->canRestore()) {
            return false;
        }

        $model = $this->model_type::find($this->model_id);
        if (!$model) {
            return false;
        }

        try {
            // Only restore fields that exist in old_values and are fillable
            $restoreData = [];
            $fillable = $model->getFillable();

            foreach ($this->old_values as $key => $value) {
                if (in_array($key, $fillable) || empty($fillable)) {
                    $restoreData[$key] = $value;
                }
            }

            if (empty($restoreData)) {
                return false;
            }

            $model->update($restoreData);

            // Log the restore action
            self::log(
                'restore',
                "Khôi phục " . class_basename($model) . " #{$model->getKey()} từ nhật ký #{$this->id}",
                $model,
                $this->new_values,
                $restoreData
            );

            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to restore from activity log', [
                'log_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
