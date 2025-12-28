<?php

namespace App\States\UserWorkflow;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class UserWorkflowState extends State
{
    /**
     * Get the human-readable name of this state.
     */
    abstract public function label(): string;

    /**
     * Get the color associated with this state (for UI display).
     */
    abstract public function color(): string;

    /**
     * Configure the state machine with default state and allowed transitions.
     */
    public static function config(): StateConfig
    {
        return parent::config()
            ->default(Pending::class)
            ->allowTransition(Pending::class, Active::class)
            ->allowTransition(Active::class, Suspended::class)
            ->allowTransition(Suspended::class, Active::class)
            ->allowTransition(Active::class, Archived::class)
            ->allowTransition(Suspended::class, Archived::class);
    }
}
