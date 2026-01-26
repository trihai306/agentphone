<?php

namespace App\Policies;

class ApiLogPolicy extends BasePolicy
{
    protected string $permissionResourceName = 'api_logs';
}
