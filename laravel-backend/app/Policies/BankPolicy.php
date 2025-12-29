<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Bank;

class BankPolicy extends BasePolicy
{
    protected string $permissionResourceName = 'banks';
}
