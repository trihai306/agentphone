<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Jenssegers\Agent\Agent;

class AuthController extends Controller
{
    /**
     * Handle user login and create device-specific token.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Parse User-Agent header for device detection
        $agent = new Agent();
        $agent->setUserAgent($request->header('User-Agent'));

        // Build device identifier with fallbacks for missing values
        $device = $agent->device() ?: 'Unknown Device';
        $platform = $agent->platform() ?: 'Unknown OS';
        $browser = $agent->browser() ?: 'Unknown Browser';
        $deviceName = "{$device} - {$platform} - {$browser}";

        // Create Sanctum token with device name
        $token = $user->createToken($deviceName, ['*']);

        return response()->json([
            'token' => $token->plainTextToken,
            'device' => $deviceName,
        ]);
    }
}
