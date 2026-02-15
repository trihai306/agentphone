<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Private channel for individual user notifications
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for user-specific notifications
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Private channel for admin notifications (only users with admin role)
Broadcast::channel('admin.notifications', function ($user) {
    return $user->hasRole('super_admin') || $user->hasRole('admin');
});

// Private channel for all admins to receive notifications
Broadcast::channel('admins', function ($user) {
    return $user->hasRole('super_admin') || $user->hasRole('admin');
});

// Public channel for system-wide announcements
Broadcast::channel('announcements', function () {
    return true;
});

// Presence channel for tracking online devices per user
Broadcast::channel('presence-devices.{userId}', function ($user, $userId) {
    if ((int) $user->id === (int) $userId) {
        // Get device info from request headers
        $deviceId = request()->header('X-Device-ID') ?? request()->input('device_id');
        $device = $user->devices()->where('device_id', $deviceId)->first();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'device_id' => $deviceId,
            'device_name' => $device?->name ?? 'Unknown Device',
            'device_model' => $device?->model,
            'device_db_id' => $device?->id,
        ];
    }
    return false;
});

// Private channel for device screen streaming & status events
Broadcast::channel('devices.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Private channel for recording session events (workflow sync)
Broadcast::channel('recording.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Private channel for wallet updates
Broadcast::channel('wallet.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Private channel for device-specific events (recording, job execution)
// User can subscribe to devices they own
Broadcast::channel('device.{deviceId}', function ($user, $deviceId) {
    // Check if this device belongs to the user
    return $user->devices()->where('device_id', $deviceId)->exists();
});

// Private channel for flow execution status (node status updates)
// User can subscribe to flows they own
Broadcast::channel('flow.{flowId}', function ($user, $flowId) {
    return \App\Models\Flow::where('id', $flowId)
        ->where('user_id', $user->id)
        ->exists();
});
