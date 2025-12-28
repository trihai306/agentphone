<?php

namespace App\States\UserWorkflow;

class Archived extends UserWorkflowState
{
    /**
     * Get the human-readable name of this state.
     */
    public function label(): string
    {
        return 'Archived';
    }

    /**
     * Get the color associated with this state (for UI display).
     * Uses Filament/Tailwind color names.
     */
    public function color(): string
    {
        return 'gray';
    }
}
