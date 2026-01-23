<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Handle Pusher presence webhooks for device connection tracking
 */
class PusherWebhookController extends Controller
{
    /**
     * Handle incoming Pusher webhook events
     */
    public function handle(Request $request): JsonResponse
    {
        // Verify webhook signature
        $signature = $request->header('X-Pusher-Signature');
        $expectedSignature = hash_hmac(
            'sha256',
            $request->getContent(),
            config('broadcasting.connections.pusher.secret')
        );

        if ($signature !== $expectedSignature) {
            Log::warning('Invalid Pusher webhook signature', [
                'received' => $signature,
                'expected' => $expectedSignature,
            ]);
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $events = $request->input('events', []);

        foreach ($events as $event) {
            $this->processEvent($event);
        }

        return response()->json(['status' => 'OK'], 200);
    }

    /**
     * Process individual webhook event
     */
    private function processEvent(array $event): void
    {
        $eventName = $event['name'] ?? null;

        switch ($eventName) {
            case 'member_removed':
                $this->handleMemberRemoved($event);
                break;

            case 'member_added':
                $this->handleMemberAdded($event);
                break;

            default:
                Log::debug('Unhandled Pusher webhook event', [
                    'event_name' => $eventName,
                    'channel' => $event['channel'] ?? null,
                ]);
        }
    }

    /**
     * Handle device disconnect (member_removed from presence channel)
     */
    private function handleMemberRemoved(array $event): void
    {
        $channel = $event['channel'] ?? '';

        // Extract device_id from channel name: "presence-device.{device_id}"
        if (!str_starts_with($channel, 'presence-device.')) {
            return;
        }

        $deviceId = str_replace('presence-device.', '', $channel);

        $updated = Device::where('device_id', $deviceId)->update([
            'socket_connected' => false,
            'last_active_at' => now(),
        ]);

        if ($updated) {
            Log::info('🔌 Device disconnected via Pusher webhook', [
                'device_id' => $deviceId,
                'channel' => $channel,
                'timestamp' => now()->toIso8601String(),
            ]);
        }
    }

    /**
     * Handle device connect (member_added to presence channel)
     */
    private function handleMemberAdded(array $event): void
    {
        $channel = $event['channel'] ?? '';

        if (!str_starts_with($channel, 'presence-device.')) {
            return;
        }

        $deviceId = str_replace('presence-device.', '', $channel);

        $updated = Device::where('device_id', $deviceId)->update([
            'socket_connected' => true,
            'last_active_at' => now(),
        ]);

        if ($updated) {
            Log::info('🔌 Device connected via Pusher webhook', [
                'device_id' => $deviceId,
                'channel' => $channel,
                'timestamp' => now()->toIso8601String(),
            ]);
        }
    }
}
