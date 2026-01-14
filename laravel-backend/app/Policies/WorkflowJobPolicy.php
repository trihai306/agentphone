<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkflowJob;
use Illuminate\Auth\Access\HandlesAuthorization;

class WorkflowJobPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, WorkflowJob $job): bool
    {
        return $user->id === $job->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, WorkflowJob $job): bool
    {
        return $user->id === $job->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, WorkflowJob $job): bool
    {
        return $user->id === $job->user_id;
    }
}
