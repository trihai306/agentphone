<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Flow;
use App\Models\UserServicePackage;
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
            ->where('status', 'active')
            ->count();
        $offlineDevices = Device::where('user_id', $user->id)
            ->where('status', 'inactive')
            ->count();

        // Get recent devices
        $recentDevices = Device::where('user_id', $user->id)
            ->orderBy('last_active_at', 'desc')
            ->take(5)
            ->get();

        // Get wallet balance
        $wallet = $user->wallets()->where('currency', 'VND')->first();
        $walletBalance = $wallet ? $wallet->balance : 0;

        // Get active packages count
        $activePackages = UserServicePackage::where('user_id', $user->id)
            ->whereNotNull('service_package_id')
            ->where('status', 'active')
            ->count();

        // Get workflow count
        $workflowCount = Flow::where('user_id', $user->id)->count();

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'total' => $totalDevices,
                'active' => $activeDevices,
                'offline' => $offlineDevices,
            ],
            'recentDevices' => $recentDevices,
            'walletBalance' => $walletBalance,
            'activePackages' => $activePackages,
            'workflowCount' => $workflowCount,
        ]);
    }
}
