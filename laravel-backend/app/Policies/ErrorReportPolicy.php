<?php

namespace App\Policies;

use App\Models\ErrorReport;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ErrorReportPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any error reports.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the error report.
     */
    public function view(User $user, ErrorReport $errorReport): bool
    {
        return $user->id === $errorReport->user_id;
    }

    /**
     * Determine whether the user can create error reports.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the error report.
     */
    public function update(User $user, ErrorReport $errorReport): bool
    {
        return $user->id === $errorReport->user_id;
    }

    /**
     * Determine whether the user can respond to the error report.
     */
    public function respond(User $user, ErrorReport $errorReport): bool
    {
        return $user->id === $errorReport->user_id;
    }

    /**
     * Determine whether the user can delete the error report.
     */
    public function delete(User $user, ErrorReport $errorReport): bool
    {
        return $user->id === $errorReport->user_id;
    }
}
