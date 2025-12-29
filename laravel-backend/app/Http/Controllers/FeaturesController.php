<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class FeaturesController extends Controller
{
    public function index()
    {
        $features = [
            [
                'icon' => 'device',
                'title' => 'Device Management',
                'description' => 'Manage unlimited devices from a single dashboard. Add, edit, and monitor all your devices in real-time.',
            ],
            [
                'icon' => 'analytics',
                'title' => 'Advanced Analytics',
                'description' => 'Get detailed insights about your device fleet with powerful analytics and reporting tools.',
            ],
            [
                'icon' => 'team',
                'title' => 'Team Collaboration',
                'description' => 'Work together seamlessly with your team. Share devices, assign roles, and collaborate efficiently.',
            ],
            [
                'icon' => 'api',
                'title' => 'API Access',
                'description' => 'Full REST API access to integrate with your existing systems and workflows.',
            ],
            [
                'icon' => 'security',
                'title' => 'Enterprise Security',
                'description' => 'Bank-level security with encryption, SSO, and compliance certifications.',
            ],
            [
                'icon' => 'support',
                'title' => '24/7 Support',
                'description' => 'Get help whenever you need it with our dedicated support team available around the clock.',
            ],
        ];

        return Inertia::render('Features/Index', [
            'features' => $features,
        ]);
    }
}
