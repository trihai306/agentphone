<?php

namespace App\Policies;

use App\Models\Flow;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FlowPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any flows.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the flow.
     */
    public function view(User $user, Flow $flow): bool
    {
        return $user->id === $flow->user_id;
    }

    /**
     * Determine whether the user can create flows.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the flow.
     */
    public function update(User $user, Flow $flow): bool
    {
        return $user->id === $flow->user_id;
    }

    /**
     * Determine whether the user can delete the flow.
     */
    public function delete(User $user, Flow $flow): bool
    {
        return $user->id === $flow->user_id;
    }

    /**
     * Determine whether the user can run the flow.
     */
    public function run(User $user, Flow $flow): bool
    {
        return $user->id === $flow->user_id;
    }

    /**
     * Determine whether the user can duplicate the flow.
     */
    public function duplicate(User $user, Flow $flow): bool
    {
        return $user->id === $flow->user_id;
    }
}
