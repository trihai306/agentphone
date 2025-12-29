<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy extends BasePolicy
{
    protected string $permissionResourceName = 'roles';
}
