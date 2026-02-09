<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\BroadcastServiceProvider::class,
    App\Providers\Filament\AdminPanelProvider::class,
    ...class_exists(\App\Providers\TelescopeServiceProvider::class)
    ? [\App\Providers\TelescopeServiceProvider::class]
    : [],
];
