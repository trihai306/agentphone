<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Available locales
     */
    protected array $availableLocales = ['vi', 'en'];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Determine the locale from multiple sources
        $locale = $this->determineLocale($request);

        // Set the application locale
        App::setLocale($locale);

        // Store in session for authenticated users
        if ($request->hasSession()) {
            session(['locale' => $locale]);
        }

        $response = $next($request);

        // Only set cookie if locale changed or not present
        // Use plain cookie (not encrypted) for JavaScript compatibility
        $response->headers->setCookie(
            cookie('locale', $locale, 60 * 24 * 30, '/', null, false, false)
        );

        return $response;
    }

    /**
     * Determine the locale from various sources.
     * Priority: Cookie (from JS) > User preference > Session > Browser > Default
     */
    protected function determineLocale(Request $request): string
    {
        // 1. Check raw cookie first (set by JavaScript)
        // This must be checked before anything else
        $rawCookie = $_COOKIE['locale'] ?? null;
        if ($rawCookie && in_array($rawCookie, $this->availableLocales)) {
            return $rawCookie;
        }

        // 2. Check Laravel's cookie accessor (fallback)
        try {
            $laravelCookie = $request->cookie('locale');
            if ($laravelCookie && in_array($laravelCookie, $this->availableLocales)) {
                return $laravelCookie;
            }
        } catch (\Exception $e) {
            // Ignore decryption errors
        }

        // 3. Check authenticated user's preference
        $user = $request->user();
        if ($user && !empty($user->language) && in_array($user->language, $this->availableLocales)) {
            return $user->language;
        }

        // 4. Check session
        if ($request->hasSession() && $request->session()->has('locale')) {
            $sessionLocale = $request->session()->get('locale');
            if (in_array($sessionLocale, $this->availableLocales)) {
                return $sessionLocale;
            }
        }

        // 5. Check browser language
        $browserLocale = $request->getPreferredLanguage($this->availableLocales);
        if ($browserLocale) {
            return $browserLocale;
        }

        // 6. Default to Vietnamese
        return config('app.locale', 'vi');
    }
}
