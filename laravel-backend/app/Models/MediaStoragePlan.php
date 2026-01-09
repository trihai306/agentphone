<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaStoragePlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'max_storage_bytes',
        'max_files',
        'max_file_size_bytes',
        'price',
        'billing_period',
        'features',
        'is_active',
        'sort_order',
        'is_default',
    ];

    protected $casts = [
        'max_storage_bytes' => 'integer',
        'max_files' => 'integer',
        'max_file_size_bytes' => 'integer',
        'price' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = ['formatted_storage', 'formatted_price'];

    /**
     * Get users with this plan
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'storage_plan_id');
    }

    /**
     * Scope for active plans
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordered plans
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('price');
    }

    /**
     * Get formatted storage size
     */
    public function getFormattedStorageAttribute(): string
    {
        $bytes = $this->max_storage_bytes;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 0) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 0) . ' MB';
        }

        return number_format($bytes / 1024, 0) . ' KB';
    }

    /**
     * Get formatted price
     */
    public function getFormattedPriceAttribute(): string
    {
        if ($this->price == 0) {
            return 'Miễn phí';
        }

        return number_format($this->price, 0, ',', '.') . '₫';
    }

    /**
     * Check if user can upload file
     */
    public function canUploadFile(User $user, int $fileSize): array
    {
        $currentUsage = UserMedia::where('user_id', $user->id)->sum('file_size');
        $currentFileCount = UserMedia::where('user_id', $user->id)->count();

        // Check storage limit
        if (($currentUsage + $fileSize) > $this->max_storage_bytes) {
            return [
                'can_upload' => false,
                'reason' => 'storage_exceeded',
                'message' => 'Bạn đã vượt quá giới hạn dung lượng. Vui lòng nâng cấp gói để tiếp tục.',
            ];
        }

        // Check file count limit
        if ($this->max_files !== null && $currentFileCount >= $this->max_files) {
            return [
                'can_upload' => false,
                'reason' => 'file_count_exceeded',
                'message' => 'Bạn đã đạt giới hạn số lượng file. Vui lòng nâng cấp gói để tiếp tục.',
            ];
        }

        // Check single file size limit
        if ($fileSize > $this->max_file_size_bytes) {
            return [
                'can_upload' => false,
                'reason' => 'file_too_large',
                'message' => 'File quá lớn. Kích thước tối đa: ' . $this->formatBytes($this->max_file_size_bytes),
            ];
        }

        return [
            'can_upload' => true,
            'reason' => null,
            'message' => null,
        ];
    }

    /**
     * Get storage usage percentage for user
     */
    public function getUsagePercentage(User $user): float
    {
        $currentUsage = UserMedia::where('user_id', $user->id)->sum('file_size');

        if ($this->max_storage_bytes == 0) {
            return 0;
        }

        return min(100, ($currentUsage / $this->max_storage_bytes) * 100);
    }

    /**
     * Get current storage usage for user
     */
    public function getCurrentUsage(User $user): int
    {
        return UserMedia::where('user_id', $user->id)->sum('file_size');
    }

    /**
     * Format bytes to readable string
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }

        return $bytes . ' bytes';
    }

    /**
     * Get default plan
     */
    public static function getDefault(): ?self
    {
        return self::where('is_default', true)->first()
            ?? self::active()->ordered()->first();
    }
}
