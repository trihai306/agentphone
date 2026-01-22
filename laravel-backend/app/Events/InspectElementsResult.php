<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Element inspection result from device
 * Sent from APK to web via socket (through API)
 * 
 * UNIFIED API: Now includes both accessibility elements and OCR text elements
 */
class InspectElementsResult implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public int $userId,
        public string $deviceId,
        public bool $success,
        public array $elements = [],
        public array $textElements = [],  // OCR text elements (unified API)
        public ?string $packageName = null,
        public ?string $screenshot = null,
        public ?int $screenWidth = null,
        public ?int $screenHeight = null,
        public ?int $screenshotWidth = null,
        public ?int $screenshotHeight = null,
        public ?int $statusBarHeight = null,
        public ?int $navBarHeight = null,
        public ?string $error = null
    ) {
    }

    public function broadcastOn(): Channel
    {
        // Use standard Laravel Echo user channel naming
        return new PrivateChannel("user.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        // Use DOT notation (not colon) for Soketi compatibility
        return 'inspect.result';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'success' => $this->success,
            'package_name' => $this->packageName,
            'element_count' => count($this->elements),
            'elements' => $this->elements,
            'text_elements' => $this->textElements,  // OCR text elements
            'ocr_count' => count($this->textElements),
            'screenshot' => $this->screenshot,
            'screen_width' => $this->screenWidth,
            'screen_height' => $this->screenHeight,
            'screenshot_width' => $this->screenshotWidth,
            'screenshot_height' => $this->screenshotHeight,
            'status_bar_height' => $this->statusBarHeight,
            'nav_bar_height' => $this->navBarHeight,
            'error' => $this->error,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}

