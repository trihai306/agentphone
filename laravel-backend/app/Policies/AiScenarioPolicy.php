<?php

namespace App\Policies;

use App\Models\AiScenario;
use App\Models\User;

class AiScenarioPolicy
{
    /**
     * Determine whether the user can view any scenarios.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the scenario.
     */
    public function view(User $user, AiScenario $scenario): bool
    {
        return $user->id === $scenario->user_id;
    }

    /**
     * Determine whether the user can create scenarios.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the scenario.
     */
    public function update(User $user, AiScenario $scenario): bool
    {
        return $user->id === $scenario->user_id;
    }

    /**
     * Determine whether the user can delete the scenario.
     */
    public function delete(User $user, AiScenario $scenario): bool
    {
        return $user->id === $scenario->user_id;
    }
}
