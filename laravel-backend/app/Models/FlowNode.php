<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlowNode extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'flow_id',
        'node_id',
        'type',
        'label',
        'position_x',
        'position_y',
        'data',
        'style',
        'is_active',
    ];

    protected $casts = [
        'data' => 'array',
        'style' => 'array',
        'position_x' => 'float',
        'position_y' => 'float',
        'is_active' => 'boolean',
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
     * Convert to React Flow node format
     */
    public function toReactFlowFormat(): array
    {
        return [
            'id' => $this->node_id,
            'type' => $this->type,
            'position' => [
                'x' => $this->position_x,
                'y' => $this->position_y,
            ],
            'data' => array_merge(
                ['label' => $this->label],
                $this->data ?? []
            ),
            'style' => $this->style,
        ];
    }

    /**
     * Create from React Flow node data
     */
    public static function fromReactFlowFormat(array $nodeData, int $userId, ?int $flowId = null): self
    {
        return new self([
            'user_id' => $userId,
            'flow_id' => $flowId,
            'node_id' => $nodeData['id'],
            'type' => $nodeData['type'] ?? 'default',
            'label' => $nodeData['data']['label'] ?? null,
            'position_x' => $nodeData['position']['x'] ?? 0,
            'position_y' => $nodeData['position']['y'] ?? 0,
            'data' => $nodeData['data'] ?? [],
            'style' => $nodeData['style'] ?? null,
            'is_active' => true,
        ]);
    }
}
