<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Navigation\NavigationGroup;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\View\PanelsRenderHook;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Blade;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->colors([
                'primary' => Color::Indigo,
                'danger' => Color::Rose,
                'gray' => Color::Slate,
                'info' => Color::Blue,
                'success' => Color::Emerald,
                'warning' => Color::Orange,
            ])
            ->font('Inter')
            ->brandName(config('app.name', 'Laravel') . ' Admin')
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->widgets([
                // Widgets sẽ được khai báo trong từng page, không cần discover
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')
            ->navigationGroups([
                NavigationGroup::make()
                    ->label('📊 Dashboard')
                    ->icon('heroicon-o-chart-bar')
                    ->collapsible()
                    ->collapsed(false),
                NavigationGroup::make()
                    ->label('👥 Người Dùng')
                    ->icon('heroicon-o-users')
                    ->collapsible(),
                NavigationGroup::make()
                    ->label('⚡ Automation')
                    ->icon('heroicon-o-bolt')
                    ->collapsible(),
                NavigationGroup::make()
                    ->label('📁 Nội Dung')
                    ->icon('heroicon-o-folder')
                    ->collapsible(),
                NavigationGroup::make()
                    ->label('🤖 AI Studio')
                    ->icon('heroicon-o-sparkles')
                    ->collapsible(),
                NavigationGroup::make()
                    ->label('💰 Tài Chính')
                    ->icon('heroicon-o-banknotes')
                    ->collapsible(),
                NavigationGroup::make()
                    ->label('🛒 Marketplace')
                    ->icon('heroicon-o-shopping-bag')
                    ->collapsible(),
                NavigationGroup::make()
                    ->label('⚙️ Hệ Thống')
                    ->icon('heroicon-o-cog-6-tooth')
                    ->collapsible(),
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ])
            ->authGuard('web')
            ->databaseNotifications()
            ->databaseNotificationsPolling('30s')
            ->topNavigation() // Menu hiển thị ở header thay vì sidebar
            ->maxContentWidth('full')
            ->globalSearchKeyBindings(['command+k', 'ctrl+k'])
            ->renderHook(
                PanelsRenderHook::BODY_END,
                fn() => Blade::render('@include("filament.scripts.echo")')
            );
    }
}
