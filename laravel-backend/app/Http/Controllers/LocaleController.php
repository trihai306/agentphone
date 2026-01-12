<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class LocaleController extends Controller
{
    /**
     * Set the application locale via POST (Inertia).
     */
    public function setLocale(Request $request, string $locale)
    {
        return $this->changeLocale($locale);
    }

    /**
     * Set the application locale via GET (direct link).
     */
    public function setLocaleGet(Request $request, string $locale)
    {
        return $this->changeLocale($locale);
    }

    /**
     * Common logic to change locale.
     */
    private function changeLocale(string $locale)
    {
        $availableLocales = ['vi', 'en'];

        // Validate the locale
        if (!in_array($locale, $availableLocales)) {
            return redirect()->back()->with('error', 'Invalid language selected.');
        }

        // Set in session
        session(['locale' => $locale]);

        // Set application locale for this request
        App::setLocale($locale);

        // Redirect back with cookie (30 days)
        return redirect()->back()
            ->cookie('locale', $locale, 60 * 24 * 30) // 30 days
            ->with('success', 'Language changed successfully.');
    }
}
