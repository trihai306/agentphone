<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Explicitly register policies to ensure Filament uses them
        \Illuminate\Support\Facades\Gate::policy(\Spatie\Permission\Models\Role::class, \App\Policies\RolePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\Spatie\Permission\Models\Permission::class, \App\Policies\PermissionPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\User::class, \App\Policies\UserPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Transaction::class, \App\Policies\TransactionPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Wallet::class, \App\Policies\WalletPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Bank::class, \App\Policies\BankPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\UserBankAccount::class, \App\Policies\UserBankAccountPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Device::class, \App\Policies\DevicePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\MarketplaceListing::class, \App\Policies\MarketplaceListingPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\AiScenario::class, \App\Policies\AiScenarioPolicy::class);

        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return $user->hasRole('admin') ? true : null;
        });
    }
}
