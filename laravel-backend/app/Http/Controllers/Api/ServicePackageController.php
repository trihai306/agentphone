<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServicePackage;
use App\Models\User;
use App\Models\UserServicePackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServicePackageController extends Controller
{
    /**
     * Get all active packages
     */
    public function index(): JsonResponse
    {
        try {
            $packages = ServicePackage::active()
                ->ordered()
                ->get()
                ->map(function ($package) {
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
                });

            return response()->json([
                'success' => true,
                'message' => 'Packages retrieved successfully',
                'packages' => $packages,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve packages: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get package details
     */
    public function show(ServicePackage $package): JsonResponse
    {
        try {
            if (!$package->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package not found or inactive',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Package retrieved successfully',
                'package' => [
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
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve package: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current user's active subscription
     */
    public function current(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();

            $subscription = UserServicePackage::where('user_id', $user->id)
                ->where('status', UserServicePackage::STATUS_ACTIVE)
                ->with('servicePackage')
                ->latest()
                ->first();

            if (!$subscription) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active subscription found',
                    'subscription' => null,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Subscription retrieved successfully',
                'subscription' => [
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
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subscription: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's subscription history
     */
    public function history(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();

            $subscriptions = UserServicePackage::where('user_id', $user->id)
                ->with('servicePackage')
                ->latest()
                ->get()
                ->map(function ($subscription) {
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
                });

            return response()->json([
                'success' => true,
                'message' => 'Subscription history retrieved successfully',
                'subscriptions' => $subscriptions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subscription history: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Subscribe to a package
     */
    public function subscribe(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'package_id' => 'required|exists:service_packages,id',
            ]);

            /** @var User $user */
            $user = $request->user();

            $package = ServicePackage::findOrFail($request->package_id);

            if (!$package->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'This package is not available',
                ], 400);
            }

            // Check if user already has an active subscription
            $existingActive = UserServicePackage::where('user_id', $user->id)
                ->where('status', UserServicePackage::STATUS_ACTIVE)
                ->exists();

            if ($existingActive) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have an active subscription. Please cancel it first.',
                ], 400);
            }

            DB::beginTransaction();

            try {
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

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Successfully subscribed to ' . $package->name,
                    'subscription' => [
                        'id' => $subscription->id,
                        'package_id' => $subscription->service_package_id,
                        'package_name' => $package->name,
                        'status' => $subscription->status,
                        'started_at' => $subscription->activated_at?->toIso8601String(),
                        'expires_at' => $subscription->expires_at?->toIso8601String(),
                        'auto_renew' => $subscription->auto_renew,
                    ],
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to subscribe: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel subscription
     */
    public function cancel(Request $request, UserServicePackage $subscription): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $request->user();

            // Check ownership
            if ($subscription->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            // Check if already cancelled
            if ($subscription->status === UserServicePackage::STATUS_CANCELLED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subscription is already cancelled',
                ], 400);
            }

            $subscription->cancel($user->id, $request->input('reason'));

            return response()->json([
                'success' => true,
                'message' => 'Subscription cancelled successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel subscription: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update auto-renew setting
     */
    public function updateAutoRenew(Request $request, UserServicePackage $subscription): JsonResponse
    {
        try {
            $request->validate([
                'auto_renew' => 'required|boolean',
            ]);

            /** @var User $user */
            $user = $request->user();

            // Check ownership
            if ($subscription->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $subscription->update([
                'auto_renew' => $request->auto_renew,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Auto-renew setting updated successfully',
                'auto_renew' => $subscription->auto_renew,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update auto-renew: ' . $e->getMessage(),
            ], 500);
        }
    }
}
