<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

abstract class BasePolicy
{
    use HandlesAuthorization;

    protected string $permissionResourceName;

    public function viewAny(User $user): bool
    {
        return $user->can("view_any_{$this->permissionResourceName}");
    }

    public function view(User $user, $model): bool
    {
        return $user->can("view_{$this->permissionResourceName}");
    }

    public function create(User $user): bool
    {
        return $user->can("create_{$this->permissionResourceName}");
    }

    public function update(User $user, $model): bool
    {
        return $user->can("update_{$this->permissionResourceName}");
    }

    public function delete(User $user, $model): bool
    {
        return $user->can("delete_{$this->permissionResourceName}");
    }

    public function deleteAny(User $user): bool
    {
        return $user->can("delete_any_{$this->permissionResourceName}");
    }

    public function forceDelete(User $user, $model): bool
    {
        return $user->can("force_delete_{$this->permissionResourceName}");
    }

    public function forceDeleteAny(User $user): bool
    {
        return $user->can("force_delete_any_{$this->permissionResourceName}");
    }

    public function restore(User $user, $model): bool
    {
        return $user->can("restore_{$this->permissionResourceName}");
    }

    public function restoreAny(User $user): bool
    {
        return $user->can("restore_any_{$this->permissionResourceName}");
    }

    public function reorder(User $user): bool
    {
        return $user->can("reorder_{$this->permissionResourceName}");
    }
}
