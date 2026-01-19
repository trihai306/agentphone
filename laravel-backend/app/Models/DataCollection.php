<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataCollection extends Model
{
    use HasFactory, LogsActivity;

    protected array $dontLogColumns = [
        'updated_at',
        'created_at',
        'total_records', // Updated frequently when records change
    ];

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'icon',
        'color',
        'total_records',
        'schema',
    ];

    protected $casts = [
        'schema' => 'array',
        'total_records' => 'integer',
    ];

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function records()
    {
        return $this->hasMany(DataRecord::class);
    }

    public function activeRecords()
    {
        return $this->hasMany(DataRecord::class)->where('status', 'active');
    }

    /**
     * Scopes
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Accessors & Mutators
     */
    public function getFormattedSchemaAttribute()
    {
        if (!$this->schema) {
            return [];
        }

        return collect($this->schema)->map(function ($field) {
            return [
                'name' => $field['name'] ?? '',
                'type' => $field['type'] ?? 'text',
                'required' => $field['required'] ?? false,
                'default' => $field['default'] ?? null,
            ];
        })->toArray();
    }

    /**
     * Helper Methods
     */
    public function updateRecordCount()
    {
        $this->update([
            'total_records' => $this->records()->where('status', 'active')->count()
        ]);
    }
}
