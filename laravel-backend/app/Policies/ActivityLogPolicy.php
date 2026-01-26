<?php

namespace App\Policies;

class ActivityLogPolicy extends BasePolicy
{
    protected string $permissionResourceName = 'activity_logs';
}
