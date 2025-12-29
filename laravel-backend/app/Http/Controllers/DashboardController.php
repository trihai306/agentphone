<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get device statistics
        $totalDevices = Device::where('user_id', $user->id)->count();
        $activeDevices = Device::where('user_id', $user->id)
            ->where('status', 'online')
            ->count();
        $offlineDevices = Device::where('user_id', $user->id)
            ->where('status', 'offline')
            ->count();

        // Get recent devices
        $recentDevices = Device::where('user_id', $user->id)
            ->orderBy('last_active_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'total' => $totalDevices,
                'active' => $activeDevices,
                'offline' => $offlineDevices,
            ],
            'recentDevices' => $recentDevices,
        ]);
    }
}
