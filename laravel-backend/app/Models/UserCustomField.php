<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserCustomField extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'key',
        'type',
        'options',
        'description',
        'validation_rules',
        'visibility',
        'is_searchable',
        'order',
    ];

    protected $casts = [
        'options' => 'array',
        'validation_rules' => 'array',
        'is_searchable' => 'boolean',
    ];

    // Field type constants
    const TYPE_TEXT = 'text';
    const TYPE_NUMBER = 'number';
    const TYPE_DATE = 'date';
    const TYPE_SELECT = 'select';
    const TYPE_MULTI_SELECT = 'multi_select';
    const TYPE_TEXTAREA = 'textarea';
    const TYPE_URL = 'url';
    const TYPE_EMAIL = 'email';
    const TYPE_PHONE = 'phone';
    const TYPE_FILE = 'file';

    // Visibility constants
    const VISIBILITY_PUBLIC = 'public';
    const VISIBILITY_PRIVATE = 'private';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(UserCustomFieldValue::class);
    }

    /**
     * Get the value for this field for a specific user
     */
    public function getValueForUser(int $userId)
    {
        return $this->values()->where('user_id', $userId)->first();
    }
}
