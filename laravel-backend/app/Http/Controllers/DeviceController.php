<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class DeviceController extends Controller
{
    /**
     * List all active devices (tokens) for the authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens()->get(['id', 'name', 'last_used_at']);

        return response()->json([
            'devices' => $tokens,
        ]);
    }

    /**
     * Revoke a specific device token.
     *
     * @param Request $request
     * @param int $id
     * @return Response|JsonResponse
     */
    public function destroy(Request $request, int $id): Response|JsonResponse
    {
        $token = $request->user()->tokens()->where('id', $id)->first();

        if (!$token) {
            return response()->json([
                'message' => 'Device not found',
            ], 404);
        }

        $token->delete();

        return response()->noContent();
    }

    /**
     * Revoke all device tokens except the current one.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()->id;

        $request->user()->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'message' => 'Successfully logged out from all other devices',
        ]);
    }
}
