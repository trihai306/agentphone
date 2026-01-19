<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Visual inspection (OCR) result from APK
 * Broadcasts detected text elements with coordinates to web
 */
class VisualInspectResult implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public int $userId,
        public string $deviceId,
        public bool $success,
        public array $textElements,
        public int $totalElements,
        public int $processingTimeMs,
        public int $screenshotWidth,
        public int $screenshotHeight,
        public int $statusBarHeight,
        public ?string $screenshot = null,
        public ?string $error = null
    ) {
    }

    public function broadcastOn(): Channel
    {
        // Use presence channel to reach web frontend
        return new PresenceChannel("devices.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'visual:result';
    }

    public function broadcastWith(): array
    {
        $payload = [
            'device_id' => $this->deviceId,
            'success' => $this->success,
            'text_elements' => $this->textElements,
            'total_elements' => $this->totalElements,
            'processing_time_ms' => $this->processingTimeMs,
            'screenshot_width' => $this->screenshotWidth,
            'screenshot_height' => $this->screenshotHeight,
            'status_bar_height' => $this->statusBarHeight,
            'timestamp' => now()->toIso8601String(),
        ];

        if ($this->screenshot) {
            $payload['screenshot'] = $this->screenshot;
        }

        if ($this->error) {
            $payload['error'] = $this->error;
        }

        return $payload;
    }
}
