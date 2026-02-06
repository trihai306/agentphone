<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
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

        $totalDevices = Device::where('user_id', $user->id)->count();
        $activeDevices = Device::where('user_id', $user->id)
            ->where('status', 'active')
            ->count();
        $offlineDevices = Device::where('user_id', $user->id)
            ->where('status', 'inactive')
            ->count();

        $recentDevices = Device::where('user_id', $user->id)
            ->orderBy('last_active_at', 'desc')
            ->take(5)
            ->get();

        $wallet = $user->wallets()->where('currency', 'VND')->first();
        $walletBalance = $wallet ? $wallet->balance : 0;

        $activePackages = UserServicePackage::where('user_id', $user->id)
            ->whereNotNull('service_package_id')
            ->where('status', 'active')
            ->count();

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
