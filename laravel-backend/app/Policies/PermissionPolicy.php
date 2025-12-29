<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Permission;

class PermissionPolicy extends BasePolicy
{
    protected string $permissionResourceName = 'permissions';
}
