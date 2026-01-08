<?php

namespace App\Http\Controllers;

use App\Models\ServicePackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PricingController extends Controller
{
    public function index()
    {
        // Lấy tất cả gói dịch vụ active, sắp xếp theo priority và giá
        $packages = ServicePackage::active()
            ->ordered()
            ->get()
            ->map(function ($package) {
                return [
                    'id' => $package->id,
                    'code' => $package->code,
                    'name' => $package->name,
                    'description' => $package->description,
                    'type' => $package->type,
                    'price' => (float) $package->price,
                    'original_price' => $package->original_price ? (float) $package->original_price : null,
                    'currency' => $package->currency,
                    'duration_days' => $package->duration_days,
                    'credits' => $package->credits,
                    'features' => $package->features ?? [],
                    'limits' => $package->limits ?? [],
                    'max_devices' => $package->max_devices,
                    'is_featured' => $package->is_featured,
                    'is_trial' => $package->is_trial,
                    'trial_days' => $package->trial_days,
                    'badge' => $package->badge,
                    'badge_color' => $package->badge_color,
                    'icon' => $package->icon,
                    'discount_percent' => $package->discount_percent,
                    'formatted_price' => $package->formatted_price,
                    'active_subscribers' => $package->active_subscribers,
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('Pricing/Index', [
            'packages' => $packages,
        ]);
    }
}
