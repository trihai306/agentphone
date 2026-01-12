<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Determine the locale from multiple sources
        $locale = $this->determineLocale($request);

        // Set the application locale
        App::setLocale($locale);

        // Store in session for authenticated users
        if ($request->user()) {
            session(['locale' => $locale]);
        }

        $response = $next($request);

        // Set cookie for all users (30 days)
        $cookie = cookie('locale', $locale, 60 * 24 * 30);

        return $response->withCookie($cookie);
    }

    /**
     * Determine the locale from various sources.
     */
    protected function determineLocale(Request $request): string
    {
        // Priority order:
        // 1. Explicit session value (set by user)
        // 2. Cookie value
        // 3. Browser accept-language header
        // 4. Default fallback

        $availableLocales = ['vi', 'en'];

        // Check session first
        if ($request->session()->has('locale')) {
            $locale = $request->session()->get('locale');
            if (in_array($locale, $availableLocales)) {
                return $locale;
            }
        }

        // Check cookie
        if ($request->hasCookie('locale')) {
            $locale = $request->cookie('locale');
            if (in_array($locale, $availableLocales)) {
                return $locale;
            }
        }

        // Check browser language
        $browserLocale = $request->getPreferredLanguage($availableLocales);
        if ($browserLocale) {
            return $browserLocale;
        }

        // Default to Vietnamese (since the app is currently in Vietnamese)
        return config('app.locale', 'vi');
    }
}
