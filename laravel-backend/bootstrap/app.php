<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LogApiRequests;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Exclude 'locale' cookie from encryption so JavaScript can set it
        // and Laravel can read it properly (fixes language switcher flickering)
        $middleware->encryptCookies(except: ['locale']);

        $middleware->web(append: [
            SetLocale::class,
            HandleInertiaRequests::class,
        ]);

        // Log all API requests for monitoring
        $middleware->api(append: [
            LogApiRequests::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle CSRF token mismatch (419) gracefully for Inertia.js
        // When session expires, redirect back with a flash message instead of showing error page
        $exceptions->respond(function (Response $response) {
            if ($response->getStatusCode() === 419) {
                return back()->with([
                    'message' => 'Phiên làm việc đã hết hạn, vui lòng thử lại.',
                    'type' => 'warning',
                ]);
            }

            return $response;
        });
    })->create();
