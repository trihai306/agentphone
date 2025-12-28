<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    /**
     * Display the main landing page.
     *
     * Renders the Landing/Index React component via Inertia.
     * The appName prop is already shared globally via HandleInertiaRequests middleware.
     */
    public function index(): Response
    {
        return Inertia::render('Landing/Index');
    }
}
