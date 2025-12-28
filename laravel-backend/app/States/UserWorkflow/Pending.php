<?php

namespace App\States\UserWorkflow;

class Pending extends UserWorkflowState
{
    /**
     * Get the human-readable name of this state.
     */
    public function label(): string
    {
        return 'Pending';
    }

    /**
     * Get the color associated with this state (for UI display).
     * Uses Filament/Tailwind color names.
     */
    public function color(): string
    {
        return 'warning';
    }
}
