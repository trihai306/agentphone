<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\AiCreditController;
use App\Http\Controllers\AiGenerationController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CustomFieldController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ErrorReportController;
use App\Http\Controllers\FlowController;
use App\Http\Controllers\FeaturesController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\PricingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TopupController;
use App\Http\Controllers\UserDeviceController;
use App\Http\Controllers\WorkflowJobController;
use Illuminate\Support\Facades\Route;

// Locale Route (available for all users)
Route::post('/locale/{locale}', [LocaleController::class, 'setLocale'])->name('locale.set');
Route::get('/locale/{locale}', [LocaleController::class, 'setLocaleGet'])->name('locale.set.get');

// SEO Routes
Route::get('/sitemap.xml', [\App\Http\Controllers\SitemapController::class, 'index'])->name('sitemap');

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
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar'])->name('profile.avatar.upload');
    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar'])->name('profile.avatar.delete');

    // Custom Fields Management
    Route::post('/custom-fields', [CustomFieldController::class, 'store'])->name('custom-fields.store');
    Route::put('/custom-fields/{id}', [CustomFieldController::class, 'update'])->name('custom-fields.update');
    Route::delete('/custom-fields/{id}', [CustomFieldController::class, 'destroy'])->name('custom-fields.destroy');
    Route::post('/custom-fields/{id}/value', [CustomFieldController::class, 'updateValue'])->name('custom-fields.value');
    Route::post('/custom-fields/reorder', [CustomFieldController::class, 'reorder'])->name('custom-fields.reorder');

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

    // Error Report Routes
    Route::get('/error-reports', [ErrorReportController::class, 'index'])->name('error-reports.index');
    Route::get('/error-reports/create', [ErrorReportController::class, 'create'])->name('error-reports.create');
    Route::post('/error-reports', [ErrorReportController::class, 'store'])->name('error-reports.store');
    Route::get('/error-reports/{errorReport}', [ErrorReportController::class, 'show'])->name('error-reports.show');
    Route::post('/error-reports/{errorReport}/respond', [ErrorReportController::class, 'addResponse'])->name('error-reports.respond');
    Route::post('/error-reports/upload-screenshot', [ErrorReportController::class, 'uploadScreenshot'])->name('error-reports.upload-screenshot');

    // Flow Builder Routes
    Route::get('/flows', [FlowController::class, 'index'])->name('flows.index');
    Route::post('/flows', [FlowController::class, 'store'])->name('flows.store');
    Route::get('/flows/{flow}/edit', [FlowController::class, 'edit'])->name('flows.edit');
    Route::put('/flows/{flow}', [FlowController::class, 'update'])->name('flows.update');
    Route::post('/flows/{flow}/save-state', [FlowController::class, 'saveState'])->name('flows.saveState');
    Route::post('/flows/{flow}/duplicate', [FlowController::class, 'duplicate'])->name('flows.duplicate');
    Route::get('/flows/{flow}/run', [FlowController::class, 'run'])->name('flows.run');
    Route::post('/flows/{flow}/test-run', [FlowController::class, 'testRun'])->name('flows.testRun');
    Route::delete('/flows/{flow}', [FlowController::class, 'destroy'])->name('flows.destroy');

    // Recording Session Routes (Web auth for Flow Editor)
    Route::post('/recording-sessions/start', [\App\Http\Controllers\Api\RecordingEventController::class, 'startSession'])->name('recording.start');
    Route::post('/recording-sessions/{sessionId}/stop', [\App\Http\Controllers\Api\RecordingEventController::class, 'stopSession'])->name('recording.stop');

    // Element Inspector Routes (Web auth for Flow Editor)
    Route::post('/devices/inspect', [\App\Http\Controllers\DeviceController::class, 'inspectElements'])->name('devices.inspect');
    Route::post('/devices/visual-inspect', [\App\Http\Controllers\DeviceController::class, 'visualInspect'])->name('devices.visualInspect');
    Route::post('/devices/inspect-result', [\App\Http\Controllers\DeviceController::class, 'inspectElementsResult'])->name('devices.inspectResult');

    // Accessibility Check Routes (Web auth for Flow Editor)
    Route::post('/devices/check-accessibility', [\App\Http\Controllers\DeviceController::class, 'checkAccessibility'])->name('devices.checkAccessibility');

    // Quick Action Routes (send real-time actions to device)
    Route::post('/devices/send-action', [\App\Http\Controllers\DeviceController::class, 'sendAction'])->name('devices.sendAction');

    // Device Online Status Polling (Redis-based, poll every 45s)
    Route::get('/devices/online-status', [\App\Http\Controllers\DeviceController::class, 'getOnlineStatus'])->name('devices.onlineStatus');

    // Workflow Listener Routes (Web auth for Flow Editor registration)
    Route::post('/recording-listener/register', [\App\Http\Controllers\Api\RecordingEventController::class, 'registerListener'])->name('recording.listener.register');
    Route::post('/recording-listener/unregister', [\App\Http\Controllers\Api\RecordingEventController::class, 'unregisterListener'])->name('recording.listener.unregister');

    // Media Library Routes
    // Note: specific routes must come before resource route to avoid conflicts
    Route::get('/media/storage-plans', [MediaController::class, 'storagePlans'])->name('media.storagePlans');
    Route::post('/media/storage-plans/upgrade', [MediaController::class, 'upgradeStoragePlan'])->name('media.upgradePlan');
    Route::post('/media/bulk-delete', [MediaController::class, 'bulkDelete'])->name('media.bulkDelete');
    Route::post('/media/create-folder', [MediaController::class, 'createFolder'])->name('media.createFolder');
    Route::post('/media/save-from-ai/{generation}', [MediaController::class, 'saveAiToMedia'])->name('media.saveFromAi');
    Route::resource('media', MediaController::class)->except(['create', 'edit']);
    Route::post('/media/{medium}/move', [MediaController::class, 'move'])->name('media.move');

    // AI Credits Management
    Route::prefix('ai-credits')->name('ai-credits.')->group(function () {
        Route::get('/', [AiCreditController::class, 'index'])->name('index');
        Route::get('/packages', [AiCreditController::class, 'packages'])->name('packages');
        Route::post('/purchase', [AiCreditController::class, 'purchase'])->name('purchase');
        Route::get('/history', [AiCreditController::class, 'history'])->name('history');
    });

    // AI Studio
    Route::prefix('ai-studio')->name('ai-studio.')->group(function () {
        Route::get('/', [AiGenerationController::class, 'index'])->name('index');
        Route::get('/models', [AiGenerationController::class, 'models'])->name('models');
        Route::post('/generate/image', [AiGenerationController::class, 'generateImage'])->name('generate.image');
        Route::post('/generate/video', [AiGenerationController::class, 'generateVideo'])->name('generate.video');
        Route::post('/generate/image-to-video', [AiGenerationController::class, 'generateVideoFromImage'])->name('generate.image-to-video');
        Route::post('/estimate-cost', [AiGenerationController::class, 'estimateCost'])->name('estimate-cost');
        Route::get('/generations', [AiGenerationController::class, 'myGenerations'])->name('generations');
        Route::get('/generations/{generation}', [AiGenerationController::class, 'show'])->name('generations.show');
        Route::get('/generations/{generation}/status', [AiGenerationController::class, 'checkStatus'])->name('generations.status');
        Route::delete('/generations/{generation}', [AiGenerationController::class, 'delete'])->name('generations.delete');
    });


    // Data Collections (No-Code Data Management)
    Route::resource('data-collections', \App\Http\Controllers\DataCollectionController::class);
    Route::post('/data-collections/{data_collection}/import', [\App\Http\Controllers\DataCollectionController::class, 'import'])->name('data-collections.import');
    Route::get('/data-collections/{data_collection}/export', [\App\Http\Controllers\DataCollectionController::class, 'export'])->name('data-collections.export');
    Route::post('/data-collections/{data_collection}/records', [\App\Http\Controllers\DataRecordController::class, 'store'])->name('data-records.store');
    Route::put('/data-collections/{data_collection}/records/{record}', [\App\Http\Controllers\DataRecordController::class, 'update'])->name('data-records.update');
    Route::delete('/data-collections/{data_collection}/records/{record}', [\App\Http\Controllers\DataRecordController::class, 'destroy'])->name('data-records.destroy');
    Route::post('/data-collections/{data_collection}/records/bulk-delete', [\App\Http\Controllers\DataRecordController::class, 'bulkDelete'])->name('data-records.bulk-delete');

    // Workflow Jobs Management
    Route::get('/jobs', [WorkflowJobController::class, 'index'])->name('jobs.index');
    Route::get('/jobs/create', [WorkflowJobController::class, 'create'])->name('jobs.create');
    Route::post('/jobs', [WorkflowJobController::class, 'store'])->name('jobs.store');
    Route::get('/jobs/{job}', [WorkflowJobController::class, 'show'])->name('jobs.show');
    Route::post('/jobs/{job}/cancel', [WorkflowJobController::class, 'cancel'])->name('jobs.cancel');
    Route::post('/jobs/{job}/retry', [WorkflowJobController::class, 'retry'])->name('jobs.retry');
    Route::get('/jobs/{job}/logs', [WorkflowJobController::class, 'logs'])->name('jobs.logs');
    Route::delete('/jobs/{job}', [WorkflowJobController::class, 'destroy'])->name('jobs.destroy');

    // Campaigns (Account Farming)
    Route::get('/campaigns', [\App\Http\Controllers\CampaignController::class, 'index'])->name('campaigns.index');
    Route::get('/campaigns/create', [\App\Http\Controllers\CampaignController::class, 'create'])->name('campaigns.create');
    Route::post('/campaigns', [\App\Http\Controllers\CampaignController::class, 'store'])->name('campaigns.store');
    Route::get('/campaigns/{campaign}', [\App\Http\Controllers\CampaignController::class, 'show'])->name('campaigns.show');
    Route::put('/campaigns/{campaign}', [\App\Http\Controllers\CampaignController::class, 'update'])->name('campaigns.update');
    Route::delete('/campaigns/{campaign}', [\App\Http\Controllers\CampaignController::class, 'destroy'])->name('campaigns.destroy');
    Route::post('/campaigns/{campaign}/run', [\App\Http\Controllers\CampaignController::class, 'run'])->name('campaigns.run');
    Route::post('/campaigns/{campaign}/pause', [\App\Http\Controllers\CampaignController::class, 'pause'])->name('campaigns.pause');
});

