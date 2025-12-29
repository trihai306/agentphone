<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PricingController extends Controller
{
    public function index()
    {
        $plans = [
            [
                'id' => 1,
                'name' => 'Starter',
                'price' => 0,
                'period' => 'month',
                'description' => 'Perfect for individuals and small projects',
                'features' => [
                    '5 devices',
                    'Basic analytics',
                    'Email support',
                    '1 GB storage',
                    'Community access',
                ],
                'highlighted' => false,
            ],
            [
                'id' => 2,
                'name' => 'Professional',
                'price' => 29,
                'period' => 'month',
                'description' => 'Best for growing businesses and teams',
                'features' => [
                    '50 devices',
                    'Advanced analytics',
                    'Priority support',
                    '50 GB storage',
                    'Team collaboration',
                    'API access',
                    'Custom integrations',
                ],
                'highlighted' => true,
            ],
            [
                'id' => 3,
                'name' => 'Enterprise',
                'price' => 99,
                'period' => 'month',
                'description' => 'For large organizations with advanced needs',
                'features' => [
                    'Unlimited devices',
                    'Real-time analytics',
                    '24/7 phone support',
                    'Unlimited storage',
                    'Advanced team features',
                    'Full API access',
                    'Custom integrations',
                    'Dedicated account manager',
                    'SLA guarantee',
                ],
                'highlighted' => false,
            ],
        ];

        return Inertia::render('Pricing/Index', [
            'plans' => $plans,
        ]);
    }
}
