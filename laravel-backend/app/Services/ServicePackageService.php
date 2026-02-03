<?php

namespace App\Services;

use App\Models\ServicePackage;
use App\Models\User;
use App\Models\UserServicePackage;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * ServicePackageService - Manages service packages and user subscriptions
 * 
 * Responsibilities:
 * - Package listing and details
 * - User subscription lifecycle (subscribe, cancel, renew)
 * - Subscription history and status
 */
class ServicePackageService
{
    // ============================================
    // PACKAGE OPERATIONS
    // ============================================

    /**
     * Get all active packages formatted for API
     */
    public function listActivePackages(): Collection
    {
        return ServicePackage::active()
            ->ordered()
            ->get()
            ->map(fn($package) => $this->formatPackageForList($package));
    }

    /**
     * Get package details with full information
     * 
     * @throws \Exception if package is inactive
     */
    public function getPackageDetails(ServicePackage $package): array
    {
        if (!$package->is_active) {
            throw new \Exception('Package not found or inactive');
        }

        return [
            'id' => $package->id,
            'name' => $package->name,
            'description' => $package->description,
            'price' => $package->price,
            'original_price' => $package->original_price,
            'discount_percent' => $package->discount_percent,
            'currency' => $package->currency,
            'duration_days' => $package->duration_days,
            'features' => $package->features ?? [],
            'limits' => $package->limits ?? [],
            'is_popular' => $package->is_featured,
            'badge' => $package->badge,
            'badge_color' => $package->badge_color,
            'max_devices' => $package->max_devices,
            'credits' => $package->credits,
            'total_subscribers' => $package->total_subscribers,
            'active_subscribers' => $package->active_subscribers,
        ];
    }

    // ============================================
    // SUBSCRIPTION OPERATIONS
    // ============================================

    /**
     * Get user's current active subscription
     */
    public function getCurrentSubscription(User $user): ?array
    {
        $subscription = UserServicePackage::where('user_id', $user->id)
            ->where('status', UserServicePackage::STATUS_ACTIVE)
            ->with('servicePackage')
            ->latest()
            ->first();

        if (!$subscription) {
            return null;
        }

        return $this->formatSubscription($subscription);
    }

    /**
     * Get user's subscription history
     */
    public function getHistory(User $user): Collection
    {
        return UserServicePackage::where('user_id', $user->id)
            ->with('servicePackage')
            ->latest()
            ->get()
            ->map(fn($sub) => $this->formatSubscriptionHistory($sub));
    }

    /**
     * Subscribe user to a package
     * 
     * @throws \Exception on validation or business rule failure
     */
    public function subscribe(User $user, int $packageId): array
    {
        $package = ServicePackage::findOrFail($packageId);

        if (!$package->is_active) {
            throw new \Exception('This package is not available');
        }

        // Check if user already has an active subscription
        $existingActive = UserServicePackage::where('user_id', $user->id)
            ->where('status', UserServicePackage::STATUS_ACTIVE)
            ->exists();

        if ($existingActive) {
            throw new \Exception('You already have an active subscription. Please cancel it first.');
        }

        return DB::transaction(function () use ($user, $package) {
            // Create subscription
            $subscription = UserServicePackage::create([
                'user_id' => $user->id,
                'service_package_id' => $package->id,
                'price_paid' => $package->price,
                'currency' => $package->currency,
                'status' => UserServicePackage::STATUS_PENDING,
                'payment_status' => UserServicePackage::PAYMENT_STATUS_PENDING,
                'auto_renew' => false,
            ]);

            // For demo purposes, auto-activate the subscription
            // In production, this should be done after payment verification
            $subscription->update([
                'payment_status' => UserServicePackage::PAYMENT_STATUS_PAID,
            ]);
            $subscription->activate();

            return [
                'subscription' => [
                    'id' => $subscription->id,
                    'package_id' => $subscription->service_package_id,
                    'package_name' => $package->name,
                    'status' => $subscription->status,
                    'started_at' => $subscription->activated_at?->toIso8601String(),
                    'expires_at' => $subscription->expires_at?->toIso8601String(),
                    'auto_renew' => $subscription->auto_renew,
                ],
                'message' => 'Successfully subscribed to ' . $package->name,
            ];
        });
    }

    /**
     * Cancel user's subscription
     * 
     * @throws \Exception on authorization or business rule failure
     */
    public function cancel(User $user, UserServicePackage $subscription, ?string $reason = null): void
    {
        // Check ownership
        if ($subscription->user_id !== $user->id) {
            throw new \Exception('Unauthorized');
        }

        // Check if already cancelled
        if ($subscription->status === UserServicePackage::STATUS_CANCELLED) {
            throw new \Exception('Subscription is already cancelled');
        }

        $subscription->cancel($user->id, $reason);
    }

    /**
     * Update auto-renew setting
     * 
     * @throws \Exception on authorization failure
     */
    public function updateAutoRenew(User $user, UserServicePackage $subscription, bool $autoRenew): bool
    {
        // Check ownership
        if ($subscription->user_id !== $user->id) {
            throw new \Exception('Unauthorized');
        }

        $subscription->update([
            'auto_renew' => $autoRenew,
        ]);

        return $subscription->auto_renew;
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    /**
     * Format package for list response
     */
    private function formatPackageForList(ServicePackage $package): array
    {
        return [
            'id' => $package->id,
            'name' => $package->name,
            'description' => $package->description,
            'price' => $package->price,
            'currency' => $package->currency,
            'duration_days' => $package->duration_days,
            'features' => $package->features ?? [],
            'is_popular' => $package->is_featured,
            'badge' => $package->badge,
            'badge_color' => $package->badge_color,
            'max_devices' => $package->max_devices,
            'credits' => $package->credits,
        ];
    }

    /**
     * Format subscription for current response
     */
    private function formatSubscription(UserServicePackage $subscription): array
    {
        return [
            'id' => $subscription->id,
            'package_id' => $subscription->service_package_id,
            'package_name' => $subscription->servicePackage->name,
            'status' => $subscription->status,
            'started_at' => $subscription->activated_at?->toIso8601String(),
            'expires_at' => $subscription->expires_at?->toIso8601String(),
            'auto_renew' => $subscription->auto_renew,
            'days_remaining' => $subscription->days_remaining,
            'credits_remaining' => $subscription->credits_remaining,
            'credits_used' => $subscription->credits_used,
        ];
    }

    /**
     * Format subscription for history response
     */
    private function formatSubscriptionHistory(UserServicePackage $subscription): array
    {
        return [
            'id' => $subscription->id,
            'order_code' => $subscription->order_code,
            'package_id' => $subscription->service_package_id,
            'package_name' => $subscription->servicePackage->name,
            'status' => $subscription->status,
            'payment_status' => $subscription->payment_status,
            'price_paid' => $subscription->price_paid,
            'currency' => $subscription->currency,
            'started_at' => $subscription->activated_at?->toIso8601String(),
            'expires_at' => $subscription->expires_at?->toIso8601String(),
            'created_at' => $subscription->created_at->toIso8601String(),
        ];
    }
}
