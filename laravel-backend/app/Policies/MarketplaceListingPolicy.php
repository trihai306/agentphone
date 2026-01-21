<?php

namespace App\Policies;

use App\Models\MarketplaceListing;
use App\Models\User;

class MarketplaceListingPolicy
{
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
    public function view(User $user, MarketplaceListing $listing): bool
    {
        // Published listings can be viewed by anyone
        if ($listing->status === MarketplaceListing::STATUS_PUBLISHED) {
            return true;
        }

        // Owner can view their own listings
        return $user->id === $listing->user_id;
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
    public function update(User $user, MarketplaceListing $listing): bool
    {
        return $user->id === $listing->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, MarketplaceListing $listing): bool
    {
        return $user->id === $listing->user_id;
    }

    /**
     * Determine whether the user can purchase the listing.
     */
    public function purchase(User $user, MarketplaceListing $listing): bool
    {
        // Cannot purchase own listing
        if ($user->id === $listing->user_id) {
            return false;
        }

        // Must be published
        if ($listing->status !== MarketplaceListing::STATUS_PUBLISHED) {
            return false;
        }

        return true;
    }
}
