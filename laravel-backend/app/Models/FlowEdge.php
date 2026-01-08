<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlowEdge extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'flow_id',
        'edge_id',
        'source_node_id',
        'target_node_id',
        'source_handle',
        'target_handle',
        'type',
        'label',
        'animated',
        'style',
        'data',
    ];

    protected $casts = [
        'style' => 'array',
        'data' => 'array',
        'animated' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    /**
     * Convert to React Flow edge format
     */
    public function toReactFlowFormat(): array
    {
        return [
            'id' => $this->edge_id,
            'source' => $this->source_node_id,
            'target' => $this->target_node_id,
            'sourceHandle' => $this->source_handle,
            'targetHandle' => $this->target_handle,
            'type' => $this->type,
            'label' => $this->label,
            'animated' => $this->animated,
            'style' => $this->style,
            'data' => $this->data,
        ];
    }

    /**
     * Create from React Flow edge data
     */
    public static function fromReactFlowFormat(array $edgeData, int $userId, ?int $flowId = null): self
    {
        return new self([
            'user_id' => $userId,
            'flow_id' => $flowId,
            'edge_id' => $edgeData['id'],
            'source_node_id' => $edgeData['source'],
            'target_node_id' => $edgeData['target'],
            'source_handle' => $edgeData['sourceHandle'] ?? null,
            'target_handle' => $edgeData['targetHandle'] ?? null,
            'type' => $edgeData['type'] ?? 'default',
            'label' => $edgeData['label'] ?? null,
            'animated' => $edgeData['animated'] ?? false,
            'style' => $edgeData['style'] ?? null,
            'data' => $edgeData['data'] ?? null,
        ]);
    }
}
