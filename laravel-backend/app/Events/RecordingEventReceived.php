<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event broadcast when a recording action is captured from mobile device
 * This enables real-time workflow node generation in the Flow Editor
 */
class RecordingEventReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $eventData;
    public int $userId;
    public int $flowId;
    public string $sessionId;

    public function __construct(int $userId, int $flowId, string $sessionId, array $eventData)
    {
        $this->userId = $userId;
        $this->flowId = $flowId;
        $this->sessionId = $sessionId;
        $this->eventData = $eventData;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("recording.{$this->userId}.{$this->flowId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'event.captured';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'flow_id' => $this->flowId,
            'event' => $this->eventData,
            'node_suggestion' => $this->generateNodeSuggestion(),
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Generate suggested node data based on event type
     */
    private function generateNodeSuggestion(): array
    {
        $eventType = $this->eventData['event_type'] ?? 'unknown';
        $nodeType = $this->mapEventToNodeType($eventType);

        return [
            'type' => $nodeType['type'],
            'data' => [
                'label' => $this->generateNodeLabel(),
                'color' => $nodeType['color'],
                'eventType' => $eventType,
                'resourceId' => $this->eventData['resource_id'] ?? null,
                'text' => $this->eventData['text'] ?? null,
                'screenshotUrl' => $this->eventData['screenshot_url'] ?? null,
                'coordinates' => [
                    'x' => $this->eventData['x'] ?? null,
                    'y' => $this->eventData['y'] ?? null,
                ],
                'bounds' => $this->eventData['bounds'] ?? null,
            ],
        ];
    }

    private function mapEventToNodeType(string $eventType): array
    {
        $mapping = [
            'click' => ['type' => 'action', 'color' => 'amber'],
            'tap' => ['type' => 'action', 'color' => 'amber'],
            'long_press' => ['type' => 'action', 'color' => 'orange'],
            'text_input' => ['type' => 'input', 'color' => 'blue'],
            'text_changed' => ['type' => 'input', 'color' => 'blue'],
            'scroll_up' => ['type' => 'process', 'color' => 'violet'],
            'scroll_down' => ['type' => 'process', 'color' => 'violet'],
            'swipe_left' => ['type' => 'process', 'color' => 'purple'],
            'swipe_right' => ['type' => 'process', 'color' => 'purple'],
            'swipe_up' => ['type' => 'process', 'color' => 'purple'],
            'swipe_down' => ['type' => 'process', 'color' => 'purple'],
            'app_launch' => ['type' => 'custom', 'color' => 'emerald'],
            'back_pressed' => ['type' => 'action', 'color' => 'red'],
        ];

        return $mapping[$eventType] ?? ['type' => 'action', 'color' => 'gray'];
    }

    private function generateNodeLabel(): string
    {
        $eventType = $this->eventData['event_type'] ?? 'Action';
        $text = $this->eventData['text'] ?? '';
        $resourceId = $this->eventData['resource_id'] ?? '';

        // Clean up event type for display
        $label = ucwords(str_replace('_', ' ', $eventType));

        // Add context if available
        if (!empty($text) && strlen($text) < 30) {
            $label .= ": " . $text;
        } elseif (!empty($resourceId)) {
            // Extract readable part from resource ID like "com.app:id/button_login"
            if (preg_match('/id\/(.+)$/', $resourceId, $matches)) {
                $label .= ": " . ucwords(str_replace('_', ' ', $matches[1]));
            }
        }

        return $label;
    }
}
