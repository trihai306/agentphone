<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserBankAccount;

class UserBankAccountPolicy extends BasePolicy
{
    protected string $permissionResourceName = 'user_bank_accounts';
}
