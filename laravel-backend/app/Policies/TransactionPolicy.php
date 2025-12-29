<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Transaction;

class TransactionPolicy extends BasePolicy
{
    protected string $permissionResourceName = 'transactions';
}
