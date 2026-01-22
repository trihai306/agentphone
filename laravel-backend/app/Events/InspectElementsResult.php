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
        // Strip base64 image data from elements to reduce payload size
        // Large payloads (1MB+) may fail WebSocket delivery
        $elementsWithoutImages = array_map(function ($el) {
            if (is_array($el)) {
                unset($el['image']); // Remove base64 icon image
            }
            return $el;
        }, $this->elements);

        // Also strip from text elements if present
        $textWithoutImages = array_map(function ($el) {
            if (is_array($el)) {
                unset($el['image']);
            }
            return $el;
        }, $this->textElements);

        return [
            'device_id' => $this->deviceId,
            'success' => $this->success,
            'package_name' => $this->packageName,
            'element_count' => count($this->elements),
            'elements' => $elementsWithoutImages,
            'text_elements' => $textWithoutImages,  // OCR text elements
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

