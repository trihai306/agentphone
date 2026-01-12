<?php

namespace App\Http\Middleware;

use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
                'wallet' => fn() => $this->getWalletData($request),
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'appName' => config('app.name'),

            // Notifications data shared with all Inertia pages
            'notifications' => fn() => $this->getNotificationsData($request),

            // Localization data
            'locale' => app()->getLocale(),
            'availableLocales' => ['vi', 'en'],
            'translations' => fn() => $this->getTranslations(app()->getLocale()),
        ]);
    }

    /**
     * Get notifications data for the authenticated user
     */
    protected function getNotificationsData(Request $request): ?array
    {
        $user = $request->user();

        if (!$user) {
            return null;
        }

        $notificationService = app(NotificationService::class);

        return [
            'items' => $notificationService->getNotificationsForUser($user, 20, false),
            'unread_count' => $notificationService->getUnreadCountForUser($user),
        ];
    }

    /**
     * Get wallet data for the authenticated user
     */
    protected function getWalletData(Request $request): ?array
    {
        $user = $request->user();

        if (!$user) {
            return null;
        }

        // Get the user's primary wallet (first active wallet)
        $wallet = $user->wallets()->where('is_active', true)->first();

        if (!$wallet) {
            return [
                'balance' => 0,
                'currency' => 'VND',
                'formatted_balance' => '0 ₫',
            ];
        }

        return [
            'balance' => (float) $wallet->balance,
            'currency' => $wallet->currency ?? 'VND',
            'formatted_balance' => number_format($wallet->balance, 0, ',', '.') . ' ₫',
        ];
    }

    /**
     * Get translations for the current locale
     */
    protected function getTranslations(string $locale): array
    {
        $translationPath = resource_path("lang/{$locale}.json");

        if (!file_exists($translationPath)) {
            return [];
        }

        $translations = json_decode(file_get_contents($translationPath), true);

        return $translations ?? [];
    }
}
