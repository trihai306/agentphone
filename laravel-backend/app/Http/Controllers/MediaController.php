<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMediaRequest;
use App\Models\AiGeneration;
use App\Models\UserMedia;
use App\Services\MediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function __construct(
        protected MediaService $mediaService
    ) {
    }

    /**
     * Display a listing of the user's media
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = UserMedia::where('user_id', $user->id);

        // Filter by type
        if ($request->filled('type')) {
            match ($request->type) {
                'image' => $query->images(),
                'video' => $query->videos(),
                'ai' => $query->where('source', 'ai_generated'),
                default => null,
            };
        }

        // Filter by folder
        if ($request->filled('folder')) {
            $query->inFolder($request->folder);
        }

        // Search by name
        if ($request->filled('search')) {
            $query->where('original_name', 'like', '%' . $request->search . '%');
        }

        // Sort
        $sortBy = $request->get('sort', 'created_at');
        $sortDir = $request->get('dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $media = $query->paginate(24)->withQueryString();

        // Get stats and folders via service
        $stats = $this->mediaService->getStorageStats($user);
        $folders = $this->mediaService->getUserFolders($user);

        // Get storage plan info
        $storagePlan = $user->getOrCreateStoragePlan();
        $storagePlanInfo = $storagePlan ? [
            'id' => $storagePlan->id,
            'name' => $storagePlan->name,
            'slug' => $storagePlan->slug,
            'max_storage_bytes' => $storagePlan->max_storage_bytes,
            'max_files' => $storagePlan->max_files,
            'formatted_storage' => $storagePlan->formatted_storage,
            'usage_percentage' => $storagePlan->getUsagePercentage($user),
            'current_usage' => $storagePlan->getCurrentUsage($user),
        ] : null;

        return Inertia::render('Media/Index', [
            'media' => $media,
            'stats' => $stats,
            'folders' => $folders,
            'filters' => $request->only(['type', 'folder', 'search', 'sort', 'dir']),
            'storage_plan' => $storagePlanInfo,
        ]);
    }

    /**
     * Upload new media files
     */
    public function store(StoreMediaRequest $request): RedirectResponse
    {
        $user = $request->user();
        $storagePlan = $user->getOrCreateStoragePlan();

        if (!$storagePlan) {
            return back()->withErrors(['error' => 'Không tìm thấy gói lưu trữ. Vui lòng liên hệ hỗ trợ.']);
        }

        $folder = $request->get('folder', '/');
        $uploadedCount = 0;
        $failedFiles = [];

        foreach ($request->file('files') as $file) {
            // Check quota before upload
            $quotaCheck = $storagePlan->canUploadFile($user, $file->getSize());

            if (!$quotaCheck['can_upload']) {
                $failedFiles[] = $file->getClientOriginalName();
                continue;
            }

            $this->mediaService->uploadFile($user, $file, $folder);
            $uploadedCount++;
        }

        // Prepare response message
        $message = "Đã tải lên thành công {$uploadedCount} file.";

        if (count($failedFiles) > 0) {
            $failedCount = count($failedFiles);
            $message .= " {$failedCount} file bị từ chối do vượt quá giới hạn.";

            $quotaCheck = $storagePlan->canUploadFile($user, 0);
            if (!$quotaCheck['can_upload']) {
                return back()
                    ->with('warning', $message)
                    ->with('quota_exceeded', true)
                    ->with('quota_message', $quotaCheck['message']);
            }
        }

        return back()->with('success', $message);
    }

    /**
     * Display the specified media
     */
    public function show(Request $request, UserMedia $medium): Response
    {
        $this->authorize('view', $medium);

        return Inertia::render('Media/Show', ['media' => $medium]);
    }

    /**
     * Update the specified media
     */
    public function update(Request $request, UserMedia $medium): RedirectResponse
    {
        $this->authorize('update', $medium);

        $validated = $request->validate([
            'original_name' => 'sometimes|string|max:255',
            'folder' => 'sometimes|string|max:255',
            'tags' => 'sometimes|array',
            'alt_text' => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string|max:1000',
            'is_public' => 'sometimes|boolean',
        ]);

        $medium->update($validated);

        return back()->with('success', 'File đã được cập nhật.');
    }

    /**
     * Remove the specified media
     */
    public function destroy(Request $request, UserMedia $medium): RedirectResponse
    {
        $this->authorize('delete', $medium);

        $this->mediaService->deleteMedia($medium);

        return back()->with('success', 'File đã được xóa.');
    }

    /**
     * Bulk delete multiple media files
     */
    public function bulkDelete(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:user_media,id',
        ]);

        $user = $request->user();
        $count = 0;

        foreach ($request->ids as $id) {
            $media = UserMedia::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if ($media) {
                $this->mediaService->deleteMedia($media);
                $count++;
            }
        }

        return back()->with('success', "Đã xóa {$count} file.");
    }

    /**
     * Move media to a different folder
     */
    public function move(Request $request, UserMedia $medium): RedirectResponse
    {
        $this->authorize('update', $medium);

        $request->validate(['folder' => 'required|string|max:255']);

        $medium->update(['folder' => $request->folder]);

        return back()->with('success', 'File đã được di chuyển.');
    }

    /**
     * Create a new folder (virtual)
     */
    public function createFolder(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|regex:/^[a-zA-Z0-9_\-\s]+$/',
        ]);

        return back()->with('success', 'Thư mục đã được tạo.');
    }

    /**
     * Save AI generation result to user's media library
     */
    public function saveAiToMedia(Request $request, AiGeneration $generation): RedirectResponse
    {
        $user = $request->user();

        if ($generation->user_id !== $user->id) {
            abort(403, 'Bạn không có quyền truy cập.');
        }

        if (!$generation->isCompleted() || !$generation->result_path) {
            return back()->withErrors(['error' => 'Generation chưa hoàn thành hoặc không có kết quả.']);
        }

        // Check quota
        $storagePlan = $user->getOrCreateStoragePlan();
        $aiDisk = config('ai-generation.storage.disk', 'public');
        $fileSize = Storage::disk($aiDisk)->size($generation->result_path);

        $quotaCheck = $storagePlan->canUploadFile($user, $fileSize);
        if (!$quotaCheck['can_upload']) {
            return back()->withErrors(['error' => $quotaCheck['message']]);
        }

        $media = $this->mediaService->saveAiGenerationToMedia($user, $generation);

        if (!$media) {
            return back()->with('info', 'File này đã được lưu vào thư viện.');
        }

        return back()->with('success', 'Đã lưu vào thư viện Media.');
    }

    /**
     * Display storage plans page
     */
    public function storagePlans(Request $request): Response
    {
        $user = $request->user();
        $currentPlan = $user->getOrCreateStoragePlan();
        $plans = \App\Models\MediaStoragePlan::active()->ordered()->get();

        $usage = [
            'storage_used' => UserMedia::where('user_id', $user->id)->sum('file_size'),
            'file_count' => UserMedia::where('user_id', $user->id)->count(),
        ];

        return Inertia::render('Media/StoragePlans', [
            'currentPlan' => $currentPlan,
            'plans' => $plans,
            'usage' => $usage,
        ]);
    }

    /**
     * Upgrade user's storage plan
     */
    public function upgradeStoragePlan(Request $request): RedirectResponse
    {
        $request->validate(['plan_id' => 'required|exists:media_storage_plans,id']);

        $user = $request->user();
        $newPlan = \App\Models\MediaStoragePlan::findOrFail($request->plan_id);
        $currentPlan = $user->getOrCreateStoragePlan();

        if ($newPlan->price <= ($currentPlan->price ?? 0)) {
            return back()->with('error', 'Chỉ có thể nâng cấp lên gói cao hơn.');
        }

        $wallet = $user->wallet;
        if (!$wallet || $wallet->balance < $newPlan->price) {
            return back()->with('error', 'Số dư ví không đủ. Vui lòng nạp thêm tiền.');
        }

        $wallet->decrement('balance', $newPlan->price);
        $user->update(['storage_plan_id' => $newPlan->id]);

        \App\Models\WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $newPlan->price,
            'description' => 'Nâng cấp gói lưu trữ: ' . $newPlan->name,
            'reference_type' => 'storage_plan_upgrade',
            'reference_id' => $newPlan->id,
        ]);

        return back()->with('success', 'Đã nâng cấp lên gói ' . $newPlan->name . ' thành công!');
    }
}
