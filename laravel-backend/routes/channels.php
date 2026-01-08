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
