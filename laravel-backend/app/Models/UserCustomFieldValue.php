<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCustomFieldValue extends Model
{
    protected $fillable = [
        'user_id',
        'user_custom_field_id',
        'value',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customField(): BelongsTo
    {
        return $this->belongsTo(UserCustomField::class, 'user_custom_field_id');
    }

    /**
     * Get formatted value based on field type
     */
    public function getFormattedValueAttribute()
    {
        if (!$this->customField) {
            return $this->value;
        }

        $type = $this->customField->type;

        return match ($type) {
            UserCustomField::TYPE_NUMBER => (int) $this->value,
            UserCustomField::TYPE_DATE => $this->value ? Carbon::parse($this->value) : null,
            UserCustomField::TYPE_MULTI_SELECT => json_decode($this->value, true) ?? [],
            default => $this->value,
        };
    }
}
