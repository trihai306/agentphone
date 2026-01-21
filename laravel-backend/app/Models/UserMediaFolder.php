<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMediaFolder extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'path',
    ];

    /**
     * Get the user that owns the folder.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all media in this folder.
     */
    public function media()
    {
        return $this->hasMany(UserMedia::class, 'folder', 'path')
            ->where('user_id', $this->user_id);
    }

    /**
     * Check if folder exists for user.
     */
    public static function existsForUser(int $userId, string $path): bool
    {
        return static::where('user_id', $userId)
            ->where('path', $path)
            ->exists();
    }
}
