<?php

namespace App\Policies;

use App\Models\Device;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DevicePolicy extends BasePolicy
{
    protected string $permissionResourceName = 'devices';

    public function update(User $user, $device): bool
    {
        return $user->id === $device->user_id || parent::update($user, $device);
    }

    public function delete(User $user, $device): bool
    {
        return $user->id === $device->user_id || parent::delete($user, $device);
    }
}
