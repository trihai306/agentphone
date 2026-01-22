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
        // SELECTIVE image stripping: only remove LARGE base64 images (>5KB ≈ 6800 chars)
        // Small icons from OCR text elements (~1-3KB) pass through for visual identification
        // This prevents WebSocket payload from exceeding limits while keeping useful icons
        $maxImageSize = 6800; // ~5KB in base64

        $elementsWithOptimizedImages = array_map(function ($el) use ($maxImageSize) {
            if (is_array($el) && isset($el['image']) && is_string($el['image'])) {
                // Only strip large images (typically accessibility element screenshots)
                if (strlen($el['image']) > $maxImageSize) {
                    unset($el['image']);
                }
            }
            return $el;
        }, $this->elements);

        // Same for text elements - keep small OCR text crops
        $textWithOptimizedImages = array_map(function ($el) use ($maxImageSize) {
            if (is_array($el) && isset($el['image']) && is_string($el['image'])) {
                if (strlen($el['image']) > $maxImageSize) {
                    unset($el['image']);
                }
            }
            return $el;
        }, $this->textElements);

        // Strip ALL images from text elements to debug payload size
        $textStripped = array_map(function ($el) {
            if (is_array($el) && isset($el['image'])) {
                unset($el['image']);
            }
            return $el;
        }, $this->textElements);

        $payload = [
            'device_id' => $this->deviceId,
            'success' => $this->success,
            'package_name' => $this->packageName,
            'element_count' => count($this->elements),
            'elements' => $elementsWithOptimizedImages,
            'text_elements' => $textStripped,  // Stripped for now
            'ocr_count' => count($this->textElements),
            'screenshot' => $this->screenshot,  // Include full screenshot (Soketi limit 50MB)
            'screen_width' => $this->screenWidth,
            'screen_height' => $this->screenHeight,
            'screenshot_width' => $this->screenshotWidth,
            'screenshot_height' => $this->screenshotHeight,
            'status_bar_height' => $this->statusBarHeight,
            'nav_bar_height' => $this->navBarHeight,
            'error' => $this->error,
            'timestamp' => now()->toIso8601String(),
        ];

        // Log payload size for debugging
        $payloadSize = strlen(json_encode($payload));
        \Illuminate\Support\Facades\Log::info("📊 InspectElementsResult payload size: " . round($payloadSize / 1024, 2) . "KB");

        return $payload;
    }
}

