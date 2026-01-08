<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Flow extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'status',
        'viewport',
        'metadata',
        'is_template',
    ];

    protected $casts = [
        'viewport' => 'array',
        'metadata' => 'array',
        'is_template' => 'boolean',
    ];

    // Status constants
    public const STATUS_DRAFT = 'draft';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_ARCHIVED = 'archived';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(FlowNode::class);
    }

    public function edges(): HasMany
    {
        return $this->hasMany(FlowEdge::class);
    }

    /**
     * Get flow data in React Flow format
     */
    public function toReactFlowFormat(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'viewport' => $this->viewport ?? ['x' => 0, 'y' => 0, 'zoom' => 1],
            'nodes' => $this->nodes->map(fn($node) => $node->toReactFlowFormat())->values()->toArray(),
            'edges' => $this->edges->map(fn($edge) => $edge->toReactFlowFormat())->values()->toArray(),
        ];
    }
}
