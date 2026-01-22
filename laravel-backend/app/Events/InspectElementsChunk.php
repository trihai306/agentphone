<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Chunked element inspection result - streaming approach
 * Sends elements in batches to avoid large WebSocket payloads
 */
class InspectElementsChunk implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public int $userId,
        public string $deviceId,
        public int $chunkIndex,        // 1-based chunk number
        public int $totalChunks,       // total number of chunks
        public array $elements = [],   // accessibility elements in this chunk
        public array $textElements = [], // OCR elements in this chunk
        public bool $isComplete = false, // true for final chunk
        public ?string $packageName = null,
        public ?string $screenshot = null,  // only sent with first chunk
        public ?int $screenWidth = null,
        public ?int $screenHeight = null,
        public ?int $screenshotWidth = null,
        public ?int $screenshotHeight = null,
        public ?int $statusBarHeight = null,
        public ?int $navBarHeight = null,
        public ?int $totalElementCount = null,
        public ?int $totalOcrCount = null,
        public ?string $error = null
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("user.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'inspect.chunk';
    }

    public function broadcastWith(): array
    {
        // Strip large images from elements to keep chunks small
        $maxImageSize = 6800; // ~5KB in base64

        $optimizedElements = array_map(function ($el) use ($maxImageSize) {
            if (is_array($el) && isset($el['image']) && is_string($el['image'])) {
                if (strlen($el['image']) > $maxImageSize) {
                    unset($el['image']);
                }
            }
            return $el;
        }, $this->elements);

        $optimizedTextElements = array_map(function ($el) use ($maxImageSize) {
            if (is_array($el) && isset($el['image']) && is_string($el['image'])) {
                if (strlen($el['image']) > $maxImageSize) {
                    unset($el['image']);
                }
            }
            return $el;
        }, $this->textElements);

        $payload = [
            'device_id' => $this->deviceId,
            'chunk_index' => $this->chunkIndex,
            'total_chunks' => $this->totalChunks,
            'is_complete' => $this->isComplete,
            'elements' => $optimizedElements,
            'text_elements' => $optimizedTextElements,
            'element_count' => count($this->elements),
            'ocr_count' => count($this->textElements),
            'total_element_count' => $this->totalElementCount,
            'total_ocr_count' => $this->totalOcrCount,
            'package_name' => $this->packageName,
            'screenshot' => $this->chunkIndex === 1 ? $this->screenshot : null, // only first chunk
            'screen_width' => $this->screenWidth,
            'screen_height' => $this->screenHeight,
            'screenshot_width' => $this->screenshotWidth,
            'screenshot_height' => $this->screenshotHeight,
            'status_bar_height' => $this->statusBarHeight,
            'nav_bar_height' => $this->navBarHeight,
            'error' => $this->error,
            'timestamp' => now()->toIso8601String(),
        ];

        // Log chunk info
        $payloadSize = strlen(json_encode($payload));
        \Illuminate\Support\Facades\Log::info("📦 InspectElementsChunk {$this->chunkIndex}/{$this->totalChunks}: " .
            count($this->elements) . " elements, " .
            count($this->textElements) . " OCR, " .
            round($payloadSize / 1024, 2) . "KB");

        return $payload;
    }
}
