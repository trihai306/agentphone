<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy extends BasePolicy
{
    protected string $permissionResourceName = 'users';
}
