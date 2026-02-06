<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class AboutController extends Controller
{
    public function index()
    {
        $stats = [
            ['label' => 'Active Users', 'value' => '50K+'],
            ['label' => 'Devices Managed', 'value' => '500K+'],
            ['label' => 'Countries', 'value' => '120+'],
            ['label' => 'Uptime', 'value' => '99.9%'],
        ];

        $team = [
            [
                'name' => 'John Doe',
                'role' => 'CEO & Founder',
                'bio' => '15+ years in tech industry',
            ],
            [
                'name' => 'Jane Smith',
                'role' => 'CTO',
                'bio' => 'Former Google engineer',
            ],
            [
                'name' => 'Mike Johnson',
                'role' => 'Head of Product',
                'bio' => 'Product expert from Amazon',
            ],
        ];

        return Inertia::render('About/Index', [
            'stats' => $stats,
            'team' => $team,
        ]);
    }
}
