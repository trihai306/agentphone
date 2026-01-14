<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMediaRequest;
use App\Models\UserMedia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\Laravel\Facades\Image;

class MediaController extends Controller
{
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

        // Get stats
        $stats = [
            'total' => UserMedia::where('user_id', $user->id)->count(),
            'images' => UserMedia::where('user_id', $user->id)->images()->count(),
            'videos' => UserMedia::where('user_id', $user->id)->videos()->count(),
            'storage_used' => UserMedia::where('user_id', $user->id)->sum('file_size'),
        ];

        // Get folders
        $folders = UserMedia::where('user_id', $user->id)
            ->select('folder')
            ->distinct()
            ->pluck('folder')
            ->filter(fn($f) => $f !== '/')
            ->values();

        // Get storage plan info
        $storagePlan = $user->getOrCreateStoragePlan();
        $storagePlanInfo = null;

        if ($storagePlan) {
            $storagePlanInfo = [
                'id' => $storagePlan->id,
                'name' => $storagePlan->name,
                'slug' => $storagePlan->slug,
                'max_storage_bytes' => $storagePlan->max_storage_bytes,
                'max_files' => $storagePlan->max_files,
                'formatted_storage' => $storagePlan->formatted_storage,
                'usage_percentage' => $storagePlan->getUsagePercentage($user),
                'current_usage' => $storagePlan->getCurrentUsage($user),
            ];
        }

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

        // Get or create storage plan
        $storagePlan = $user->getOrCreateStoragePlan();

        if (!$storagePlan) {
            return back()->withErrors(['error' => 'Không tìm thấy gói lưu trữ. Vui lòng liên hệ hỗ trợ.']);
        }

        $folder = $request->get('folder', '/');
        $uploadedCount = 0;
        $failedFiles = [];

        foreach ($request->file('files') as $file) {
            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();

            // Check quota before upload
            $quotaCheck = $storagePlan->canUploadFile($user, $fileSize);

            if (!$quotaCheck['can_upload']) {
                $failedFiles[] = $originalName;
                continue; // Skip this file
            }

            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $mimeType = $file->getMimeType();

            // Store the file
            $path = $file->store(
                'media/' . $user->id,
                $filename,
                'public'
            );

            // Generate thumbnail for images
            $thumbnailPath = null;
            $metadata = [];

            if (str_starts_with($mimeType, 'image/')) {
                try {
                    // Get image dimensions
                    $image = Image::read($file->path());
                    $metadata['width'] = $image->width();
                    $metadata['height'] = $image->height();

                    // Create thumbnail
                    $thumbnailFilename = 'thumb_' . $filename;
                    $image->scale(width: 400);
                    $thumbnailFullPath = storage_path('app/public/media/' . $user->id . '/thumbnails');

                    if (!file_exists($thumbnailFullPath)) {
                        mkdir($thumbnailFullPath, 0755, true);
                    }

                    $image->save($thumbnailFullPath . '/' . $thumbnailFilename);
                    $thumbnailPath = 'media/' . $user->id . '/thumbnails/' . $thumbnailFilename;
                } catch (\Exception $e) {
                    // Thumbnail creation failed, continue without it
                }
            }

            // Create media record
            UserMedia::create([
                'user_id' => $user->id,
                'filename' => $filename,
                'original_name' => $originalName,
                'mime_type' => $mimeType,
                'file_size' => $fileSize,
                'path' => $path,
                'thumbnail_path' => $thumbnailPath,
                'folder' => $folder,
                'metadata' => $metadata,
            ]);

            $uploadedCount++;
        }

        // Prepare response message
        $message = "Đã tải lên thành công {$uploadedCount} file.";

        if (count($failedFiles) > 0) {
            $failedCount = count($failedFiles);
            $message .= " {$failedCount} file bị từ chối do vượt quá giới hạn.";

            // Get quota info for error message
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

        return Inertia::render('Media/Show', [
            'media' => $medium,
        ]);
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

        // Delete files from storage
        Storage::disk('public')->delete($medium->path);
        if ($medium->thumbnail_path) {
            Storage::disk('public')->delete($medium->thumbnail_path);
        }

        $medium->forceDelete();

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
                Storage::disk('public')->delete($media->path);
                if ($media->thumbnail_path) {
                    Storage::disk('public')->delete($media->thumbnail_path);
                }
                $media->forceDelete();
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

        $request->validate([
            'folder' => 'required|string|max:255',
        ]);

        $medium->update(['folder' => $request->folder]);

        return back()->with('success', 'File đã được di chuyển.');
    }

    /**
     * Create a new folder
     */
    public function createFolder(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|regex:/^[a-zA-Z0-9_\-\s]+$/',
        ]);

        // Folders are virtual - just return success
        // The folder will be created when a file is moved to it

        return back()->with('success', 'Thư mục đã được tạo.');
    }
}
