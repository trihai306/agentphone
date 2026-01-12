<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Services\DataCollectionCacheService;

class DataRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'data_collection_id',
        'data',
        'status',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    /**
     * Relationships
     */
    public function collection()
    {
        return $this->belongsTo(DataCollection::class, 'data_collection_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    /**
     * Helper Methods
     */
    public function validateAgainstSchema()
    {
        $schema = $this->collection->schema ?? [];
        $errors = [];

        foreach ($schema as $field) {
            $fieldName = $field['name'];
            $isRequired = $field['required'] ?? false;
            $value = $this->data[$fieldName] ?? null;

            if ($isRequired && empty($value)) {
                $errors[$fieldName] = "Field {$fieldName} is required";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    public function archive()
    {
        $this->update(['status' => 'archived']);
        $this->invalidateCache();
        $this->collection->updateRecordCount();
    }

    public function restore()
    {
        $this->update(['status' => 'active']);
        $this->invalidateCache();
        $this->collection->updateRecordCount();
    }

    /**
     * Invalidate cache for the parent collection
     */
    protected function invalidateCache(): void
    {
        try {
            $cache = app(DataCollectionCacheService::class);
            $cache->invalidateRecords($this->collection);
        } catch (\Exception $e) {
            // Silently fail if cache service unavailable
        }
    }

    /**
     * Boot method for model events
     */
    protected static function booted()
    {
        static::created(function ($record) {
            $record->collection->updateRecordCount();
            $record->invalidateCache();
        });

        static::updated(function ($record) {
            $record->invalidateCache();
        });

        static::deleted(function ($record) {
            $record->collection->updateRecordCount();
            $record->invalidateCache();
        });
    }
}

