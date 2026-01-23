<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Installed apps list result from device
 * Broadcasted to user channel so web frontend can receive
 */
class InstalledAppsResult implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(
        public int $userId,
        public string $deviceId,
        public bool $success,
        public array $apps = [],
        public ?string $error = null
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("user.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'apps.result';
    }

    public function broadcastWith(): array
    {
        return [
            'device_id' => $this->deviceId,
            'success' => $this->success,
            'apps' => $this->apps,
            'app_count' => count($this->apps),
            'error' => $this->error,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
