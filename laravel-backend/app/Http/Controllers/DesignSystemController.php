<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class DesignSystemController extends Controller
{
    public function index()
    {
        return Inertia::render('DesignSystem/Index');
    }
}
