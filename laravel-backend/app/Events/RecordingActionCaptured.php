<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event broadcast when a recording action is captured
 * APK captures user interaction and sends to Laravel, which broadcasts to Flow Editor
 */
class RecordingActionCaptured implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $deviceId;
    public string $sessionId;
    public array $event;

    /**
     * Create a new event instance.
     *
     * @param string $deviceId The Android device ID
     * @param string $sessionId The recording session ID
     * @param array $event The captured action event data
     */
    public function __construct(string $deviceId, string $sessionId, array $event)
    {
        $this->deviceId = $deviceId;
        $this->sessionId = $sessionId;
        $this->event = $event;
    }

    /**
     * Get the channels the event should broadcast on.
     * Broadcasts to device-specific private channel
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('device.' . $this->deviceId),
        ];
    }

    /**
     * The event's broadcast name.
     * Frontend listens for: .event.captured
     */
    public function broadcastAs(): string
    {
        return 'event.captured';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'session_id' => $this->sessionId,
            'event' => $this->event,
            'node_suggestion' => $this->generateNodeSuggestion(),
        ];
    }

    /**
     * Generate a suggested node configuration for Flow Editor
     */
    private function generateNodeSuggestion(): array
    {
        $eventType = $this->event['event_type'] ?? 'unknown';
        $resourceId = $this->event['resource_id'] ?? '';
        $text = $this->event['text'] ?? '';

        // Generate a user-friendly label
        $label = $this->generateLabel($eventType, $resourceId, $text);

        // Map event type to node color
        $color = match ($eventType) {
            'tap', 'click' => 'blue',
            'long_press', 'long_click' => 'purple',
            'swipe', 'scroll' => 'green',
            'text_input', 'set_text' => 'orange',
            'focus' => 'gray',
            'back', 'home' => 'red',
            default => 'blue'
        };

        return [
            'type' => $eventType,
            'data' => [
                'label' => $label,
                'color' => $color,
                'resourceId' => $resourceId,
                'text' => $text,
                'screenshotUrl' => $this->event['screenshot_url'] ?? null,
            ]
        ];
    }

    /**
     * Generate a human-readable label for the action
     */
    private function generateLabel(string $eventType, string $resourceId, string $text): string
    {
        // Get short resource name (last part of resource ID)
        $shortId = '';
        if ($resourceId) {
            $parts = explode('/', $resourceId);
            $shortId = end($parts);
        }

        // Generate label based on event type
        return match ($eventType) {
            'tap', 'click' => $shortId ? "Tap {$shortId}" : ($text ? "Tap \"{$text}\"" : "Tap"),
            'long_press', 'long_click' => $shortId ? "Long press {$shortId}" : "Long press",
            'swipe' => "Swipe",
            'scroll' => "Scroll",
            'scroll_up' => "Scroll up",
            'scroll_down' => "Scroll down",
            'text_input', 'set_text' => $text ? "Type \"{$text}\"" : "Text input",
            'focus' => $shortId ? "Focus {$shortId}" : "Focus",
            'back' => "Back",
            'home' => "Home",
            default => ucfirst(str_replace('_', ' ', $eventType))
        };
    }
}
