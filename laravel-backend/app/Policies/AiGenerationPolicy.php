<?php

namespace App\Policies;

use App\Models\AiGeneration;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AiGenerationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any generations.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the generation.
     */
    public function view(User $user, AiGeneration $generation): bool
    {
        return $user->id === $generation->user_id;
    }

    /**
     * Determine whether the user can create generations.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can delete the generation.
     */
    public function delete(User $user, AiGeneration $generation): bool
    {
        return $user->id === $generation->user_id;
    }
}
