<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServicePackage;
use App\Models\UserServicePackage;
use App\Services\ServicePackageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServicePackageController extends Controller
{
    public function __construct(
        private ServicePackageService $service
    ) {
    }

    /**
     * Get all active packages
     */
    public function index(): JsonResponse
    {
        try {
            $packages = $this->service->listActivePackages();

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
            $details = $this->service->getPackageDetails($package);

            return response()->json([
                'success' => true,
                'message' => 'Package retrieved successfully',
                'package' => $details,
            ]);
        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * Get current user's active subscription
     */
    public function current(Request $request): JsonResponse
    {
        try {
            $subscription = $this->service->getCurrentSubscription($request->user());

            return response()->json([
                'success' => true,
                'message' => $subscription ? 'Subscription retrieved successfully' : 'No active subscription found',
                'subscription' => $subscription,
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
            $subscriptions = $this->service->getHistory($request->user());

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

            $result = $this->service->subscribe($request->user(), $request->package_id);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'subscription' => $result['subscription'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not available') ? 400 : 500;
            $statusCode = str_contains($e->getMessage(), 'already have') ? 400 : $statusCode;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * Cancel subscription
     */
    public function cancel(Request $request, UserServicePackage $subscription): JsonResponse
    {
        try {
            $this->service->cancel($request->user(), $subscription, $request->input('reason'));

            return response()->json([
                'success' => true,
                'message' => 'Subscription cancelled successfully',
            ]);
        } catch (\Exception $e) {
            $statusCode = match (true) {
                str_contains($e->getMessage(), 'Unauthorized') => 403,
                str_contains($e->getMessage(), 'already cancelled') => 400,
                default => 500,
            };
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
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

            $autoRenew = $this->service->updateAutoRenew(
                $request->user(),
                $subscription,
                $request->auto_renew
            );

            return response()->json([
                'success' => true,
                'message' => 'Auto-renew setting updated successfully',
                'auto_renew' => $autoRenew,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'Unauthorized') ? 403 : 500;
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}
