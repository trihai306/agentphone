<?php

namespace App\Services;

use App\Models\AiGeneration;
use App\Models\UserMedia;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

/**
 * Service class for Media business logic
 * Handles file uploads, thumbnail generation, and storage management
 */
class MediaService
{
    /**
     * Upload a single file with optional thumbnail generation
     */
    public function uploadFile(User $user, UploadedFile $file, string $folder = '/'): ?UserMedia
    {
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $mimeType = $file->getMimeType();

        // Store the file
        $path = $file->storeAs(
            'media/' . $user->id,
            $filename,
            'public'
        );

        // Generate thumbnail for images
        $thumbnailPath = null;
        $metadata = [];

        if (str_starts_with($mimeType, 'image/')) {
            try {
                $image = Image::read($file->path());
                $metadata['width'] = $image->width();
                $metadata['height'] = $image->height();

                $thumbnailPath = $this->generateThumbnail($user->id, $file->path(), $filename);
            } catch (\Exception $e) {
                // Thumbnail creation failed, continue without it
            }
        }

        // Create media record
        return UserMedia::create([
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
    }

    /**
     * Save AI generation result to user's media library
     */
    public function saveAiGenerationToMedia(User $user, AiGeneration $generation, string $folder = '/'): ?UserMedia
    {
        // Check if already saved
        $existing = UserMedia::where('user_id', $user->id)
            ->where('ai_generation_id', $generation->id)
            ->first();

        if ($existing) {
            return null; // Already saved
        }

        $aiDisk = config('ai-generation.storage.disk', 'public');
        $fileSize = Storage::disk($aiDisk)->size($generation->result_path);

        // Determine file type
        $extension = pathinfo($generation->result_path, PATHINFO_EXTENSION);
        $mimeType = $generation->type === 'video'
            ? 'video/' . ($extension ?: 'mp4')
            : 'image/' . ($extension ?: 'png');

        // Copy file to user's media directory
        $sourceContent = Storage::disk($aiDisk)->get($generation->result_path);
        $newFilename = Str::uuid() . '.' . ($extension ?: ($generation->type === 'video' ? 'mp4' : 'png'));
        $newPath = 'media/' . $user->id . '/' . $newFilename;

        Storage::disk('public')->put($newPath, $sourceContent);

        // Generate thumbnail for images
        $thumbnailPath = null;
        if ($generation->type === 'image') {
            $fullPath = Storage::disk('public')->path($newPath);
            $thumbnailPath = $this->generateThumbnail($user->id, $fullPath, $newFilename);
        }

        // Create media record
        return UserMedia::create([
            'user_id' => $user->id,
            'filename' => $newFilename,
            'original_name' => 'AI_' . $generation->type . '_' . $generation->id . '.' . ($extension ?: 'png'),
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'path' => $newPath,
            'thumbnail_path' => $thumbnailPath,
            'folder' => $folder,
            'source' => 'ai_generated',
            'ai_generation_id' => $generation->id,
            'metadata' => [
                'prompt' => $generation->prompt,
                'model' => $generation->model,
            ],
        ]);
    }

    /**
     * Generate thumbnail for an image
     */
    public function generateThumbnail(int $userId, string $sourcePath, string $filename): ?string
    {
        try {
            $image = Image::read($sourcePath);
            $thumbnailFilename = 'thumb_' . $filename;
            $image->scale(width: 400);

            $thumbnailFullPath = storage_path('app/public/media/' . $userId . '/thumbnails');
            if (!file_exists($thumbnailFullPath)) {
                mkdir($thumbnailFullPath, 0755, true);
            }

            $image->save($thumbnailFullPath . '/' . $thumbnailFilename);
            return 'media/' . $userId . '/thumbnails/' . $thumbnailFilename;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Delete a media file and its thumbnail
     */
    public function deleteMedia(UserMedia $media): void
    {
        Storage::disk('public')->delete($media->path);
        if ($media->thumbnail_path) {
            Storage::disk('public')->delete($media->thumbnail_path);
        }
        $media->forceDelete();
    }

    /**
     * Get storage stats for a user
     */
    public function getStorageStats(User $user): array
    {
        return [
            'total' => UserMedia::where('user_id', $user->id)->count(),
            'images' => UserMedia::where('user_id', $user->id)->images()->count(),
            'videos' => UserMedia::where('user_id', $user->id)->videos()->count(),
            'ai_generated' => UserMedia::where('user_id', $user->id)->where('source', 'ai_generated')->count(),
            'storage_used' => UserMedia::where('user_id', $user->id)->sum('file_size'),
        ];
    }

    /**
     * Get user's folders
     */
    public function getUserFolders(User $user): \Illuminate\Support\Collection
    {
        // Get folders from the dedicated table
        $dbFolders = \App\Models\UserMediaFolder::where('user_id', $user->id)
            ->orderBy('name')
            ->pluck('name');

        // Also get unique folders from media records (for backwards compatibility)
        $mediaFolders = UserMedia::where('user_id', $user->id)
            ->select('folder')
            ->distinct()
            ->pluck('folder')
            ->filter(fn($f) => $f && $f !== '/')
            ->map(fn($f) => ltrim($f, '/'));

        // Merge and deduplicate
        return $dbFolders->merge($mediaFolders)->unique()->values();
    }
}
