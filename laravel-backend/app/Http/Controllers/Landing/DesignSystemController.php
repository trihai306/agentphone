<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class DesignSystemController extends Controller
{
    public function index()
    {
        return Inertia::render('DesignSystem/Index');
    }
}
