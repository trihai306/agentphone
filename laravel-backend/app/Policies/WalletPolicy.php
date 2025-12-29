<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Wallet;

class WalletPolicy extends BasePolicy
{
    protected string $permissionResourceName = 'wallets';
}
