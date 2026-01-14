<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserServicePackage;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserServicePackagePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any packages.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the package.
     */
    public function view(User $user, UserServicePackage $userPackage): bool
    {
        return $user->id === $userPackage->user_id;
    }

    /**
     * Determine whether the user can create packages.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the package.
     */
    public function update(User $user, UserServicePackage $userPackage): bool
    {
        return $user->id === $userPackage->user_id;
    }

    /**
     * Determine whether the user can delete the package.
     */
    public function delete(User $user, UserServicePackage $userPackage): bool
    {
        return $user->id === $userPackage->user_id;
    }

    /**
     * Determine whether the user can cancel the package.
     */
    public function cancel(User $user, UserServicePackage $userPackage): bool
    {
        return $user->id === $userPackage->user_id;
    }
}
