<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class UserMedia extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected array $dontLogColumns = [
        'updated_at',
        'created_at',
        'download_count', // Increments on each download
    ];

    protected $table = 'user_media';

    protected $fillable = [
        'user_id',
        'filename',
        'original_name',
        'mime_type',
        'file_size',
        'path',
        'thumbnail_path',
        'folder',
        'tags',
        'metadata',
        'alt_text',
        'description',
        'is_public',
        'download_count',
        'source',
        'ai_generation_id',
    ];

    protected $casts = [
        'tags' => 'array',
        'metadata' => 'array',
        'is_public' => 'boolean',
        'file_size' => 'integer',
        'download_count' => 'integer',
    ];

    protected $appends = ['url', 'thumbnail_url', 'formatted_size', 'type'];

    /**
     * Get the user that owns the media
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full URL of the media file
     */
    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }

    /**
     * Get the thumbnail URL
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->thumbnail_path) {
            return Storage::disk('public')->url($this->thumbnail_path);
        }

        // For images without thumbnails, use the original
        if ($this->isImage()) {
            return $this->url;
        }

        return null;
    }

    /**
     * Get formatted file size
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }

        return $bytes . ' bytes';
    }

    /**
     * Get the file type (image, video, other)
     */
    public function getTypeAttribute(): string
    {
        if ($this->isImage()) {
            return 'image';
        } elseif ($this->isVideo()) {
            return 'video';
        }
        return 'other';
    }

    /**
     * Check if the media is an image
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if the media is a video
     */
    public function isVideo(): bool
    {
        return str_starts_with($this->mime_type, 'video/');
    }

    /**
     * Scope for images only
     */
    public function scopeImages($query)
    {
        return $query->where('mime_type', 'like', 'image/%');
    }

    /**
     * Scope for videos only
     */
    public function scopeVideos($query)
    {
        return $query->where('mime_type', 'like', 'video/%');
    }

    /**
     * Scope for media in a specific folder
     * Normalizes folder path (removes leading slash if present)
     */
    public function scopeInFolder($query, string $folder)
    {
        // Normalize: remove leading slash if present
        $normalizedFolder = ltrim($folder, '/');

        // Match both formats: with and without leading slash
        return $query->where(function ($q) use ($normalizedFolder) {
            $q->where('folder', $normalizedFolder)
                ->orWhere('folder', '/' . $normalizedFolder);
        });
    }

    /**
     * Scope for media with a specific tag
     */
    public function scopeWithTag($query, string $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }

    /**
     * Scope for public media
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Increment download count
     */
    public function incrementDownload(): void
    {
        $this->increment('download_count');
    }

    /**
     * Get dimensions from metadata
     */
    public function getDimensions(): ?array
    {
        if ($this->metadata && isset($this->metadata['width'], $this->metadata['height'])) {
            return [
                'width' => $this->metadata['width'],
                'height' => $this->metadata['height'],
            ];
        }
        return null;
    }

    /**
     * Get duration for videos
     */
    public function getDuration(): ?int
    {
        return $this->metadata['duration'] ?? null;
    }
}
