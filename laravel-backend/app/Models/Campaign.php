<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasFactory, LogsActivity;

    protected array $dontLogColumns = [
        'updated_at',
        'created_at',
        'records_processed',
        'records_success',
        'records_failed', // Stats update frequently
        'last_run_at',
        'next_run_at',
    ];

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'icon',
        'color',
        'data_collection_id',
        'execution_mode',
        'records_per_batch',
        'records_per_device',
        'device_allocation',
        'repeat_per_record',
        'record_filter',
        'data_config',
        'device_record_assignments',
        'variable_mapping',
        'device_strategy',
        'schedule',
        'status',
        'total_records',
        'records_processed',
        'records_success',
        'records_failed',
        'last_run_at',
        'next_run_at',
    ];

    protected $casts = [
        'record_filter' => 'array',
        'data_config' => 'array',
        'device_record_assignments' => 'array',
        'variable_mapping' => 'array',
        'schedule' => 'array',
        'last_run_at' => 'datetime',
        'next_run_at' => 'datetime',
        'records_per_batch' => 'integer',
        'records_per_device' => 'integer',
        'repeat_per_record' => 'integer',
        'total_records' => 'integer',
        'records_processed' => 'integer',
        'records_success' => 'integer',
        'records_failed' => 'integer',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_ACTIVE = 'active';
    const STATUS_PAUSED = 'paused';
    const STATUS_COMPLETED = 'completed';

    // Execution modes
    const MODE_SEQUENTIAL = 'sequential';
    const MODE_PARALLEL = 'parallel';

    // Device strategies
    const DEVICE_ROUND_ROBIN = 'round_robin';
    const DEVICE_RANDOM = 'random';
    const DEVICE_SPECIFIC = 'specific';

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function dataCollection(): BelongsTo
    {
        return $this->belongsTo(DataCollection::class);
    }

    public function workflows(): BelongsToMany
    {
        return $this->belongsToMany(Flow::class, 'campaign_workflows')
            ->withPivot([
                'sequence',
                'repeat_count',
                'execution_mode',
                'delay_between_repeats',
                'conditions',
                'variable_source_collection_id',
                'iteration_strategy',
            ])
            ->orderByPivot('sequence')
            ->withTimestamps();
    }

    public function devices(): BelongsToMany
    {
        return $this->belongsToMany(Device::class, 'campaign_devices')
            ->withTimestamps();
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(WorkflowJob::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Helpers
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isPaused(): bool
    {
        return $this->status === self::STATUS_PAUSED;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Get progress percentage
     */
    public function getProgressAttribute(): int
    {
        if ($this->total_records === 0)
            return 0;
        return (int) round(($this->records_processed / $this->total_records) * 100);
    }

    /**
     * Get success rate
     */
    public function getSuccessRateAttribute(): int
    {
        if ($this->records_processed === 0)
            return 0;
        return (int) round(($this->records_success / $this->records_processed) * 100);
    }

    /**
     * Get workflow-specific execution configuration from pivot table
     */
    public function getWorkflowConfig(int $flowId): array
    {
        $pivot = $this->workflows()
            ->where('flows.id', $flowId)
            ->first()
                ?->pivot;

        return [
            'sequence' => $pivot?->sequence ?? 0,
            'repeat_count' => $pivot?->repeat_count ?? 1,
            'execution_mode' => $pivot?->execution_mode ?? 'once',
            'delay_between_repeats' => $pivot?->delay_between_repeats,
            'conditions' => $pivot?->conditions,
            'variable_source_collection_id' => $pivot?->variable_source_collection_id,
            'iteration_strategy' => $pivot?->iteration_strategy ?? 'sequential',
        ];
    }

    /**
     * Update stats from data collection
     */
    public function syncTotalRecords(): void
    {
        if ($this->dataCollection) {
            $query = $this->dataCollection->records();

            // Apply filter if set
            if ($this->record_filter && isset($this->record_filter['status'])) {
                $query->where('status', $this->record_filter['status']);
            }

            $this->update(['total_records' => $query->count()]);
        }
    }
}
