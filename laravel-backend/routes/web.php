<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FlowController;
use App\Http\Controllers\FeaturesController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\PricingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TopupController;
use App\Http\Controllers\UserDeviceController;
use Illuminate\Support\Facades\Route;

// Landing Pages
Route::get('/', [LandingController::class, 'index'])->name('landing');
Route::get('/features', [FeaturesController::class, 'index'])->name('features');
Route::get('/pricing', [PricingController::class, 'index'])->name('pricing');
Route::get('/about', [AboutController::class, 'index'])->name('about');
Route::get('/contact', [ContactController::class, 'index'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);

    Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email');

    Route::get('/reset-password/{token}', [ResetPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [ResetPasswordController::class, 'store'])->name('password.update');
});

Route::post('/logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');

// Authenticated Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::resource('devices', UserDeviceController::class);

    // Package Routes
    Route::get('/packages', [PackageController::class, 'index'])->name('packages.index');
    Route::get('/packages/{package}', [PackageController::class, 'show'])->name('packages.show');
    Route::get('/packages/{package}/subscribe', [PackageController::class, 'subscribe'])->name('packages.subscribe');
    Route::post('/packages/{package}/subscribe', [PackageController::class, 'processSubscription'])->name('packages.processSubscription');
    Route::get('/my-packages/{userPackage}/payment', [PackageController::class, 'payment'])->name('packages.payment');
    Route::get('/my-packages/{userPackage}/manage', [PackageController::class, 'manage'])->name('packages.manage');
    Route::post('/my-packages/{userPackage}/cancel', [PackageController::class, 'cancel'])->name('packages.cancel');

    // Topup Routes
    Route::get('/topup', [TopupController::class, 'index'])->name('topup.index');
    Route::post('/topup/checkout', [TopupController::class, 'checkout'])->name('topup.checkout');
    Route::post('/topup/process', [TopupController::class, 'process'])->name('topup.process');
    Route::get('/topup/{topup}/payment', [TopupController::class, 'payment'])->name('topup.payment');
    Route::get('/topup/history', [TopupController::class, 'history'])->name('topup.history');

    // Notification Routes
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/{id}', [NotificationController::class, 'show'])->name('notifications.show');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::post('/notifications/refresh', [NotificationController::class, 'refresh'])->name('notifications.refresh');

    // Flow Builder Routes
    Route::get('/flows', [FlowController::class, 'index'])->name('flows.index');
    Route::post('/flows', [FlowController::class, 'store'])->name('flows.store');
    Route::get('/flows/{flow}/edit', [FlowController::class, 'edit'])->name('flows.edit');
    Route::put('/flows/{flow}', [FlowController::class, 'update'])->name('flows.update');
    Route::post('/flows/{flow}/save-state', [FlowController::class, 'saveState'])->name('flows.saveState');
    Route::post('/flows/{flow}/duplicate', [FlowController::class, 'duplicate'])->name('flows.duplicate');
    Route::delete('/flows/{flow}', [FlowController::class, 'destroy'])->name('flows.destroy');
});
