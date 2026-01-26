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

        // Register remaining policies for Filament resources
        \Illuminate\Support\Facades\Gate::policy(\App\Models\ActivityLog::class, \App\Policies\ActivityLogPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\AiCreditPackage::class, \App\Policies\AiCreditPackagePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\ApiLog::class, \App\Policies\ApiLogPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\DeviceActivityLog::class, \App\Policies\DeviceActivityLogPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\InteractionHistory::class, \App\Policies\InteractionHistoryPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\JobLog::class, \App\Policies\JobLogPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\JobTask::class, \App\Policies\JobTaskPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\MediaStoragePlan::class, \App\Policies\MediaStoragePlanPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\ScenarioTemplate::class, \App\Policies\ScenarioTemplatePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\ServicePackage::class, \App\Policies\ServicePackagePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\SystemNotification::class, \App\Policies\SystemNotificationPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\DataRecord::class, \App\Policies\DataRecordPolicy::class);

        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return $user->hasRole('admin') ? true : null;
        });
    }
}
