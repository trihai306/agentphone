<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'label',
        'description',
        'is_public',
        'sort_order',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'sort_order' => 'integer',
    ];

    // Setting groups
    public const GROUP_GENERAL = 'general';
    public const GROUP_EMAIL = 'email';
    public const GROUP_PAYMENT = 'payment';
    public const GROUP_API = 'api';
    public const GROUP_NOTIFICATION = 'notification';

    // Setting types
    public const TYPE_TEXT = 'text';
    public const TYPE_TEXTAREA = 'textarea';
    public const TYPE_BOOLEAN = 'boolean';
    public const TYPE_NUMBER = 'number';
    public const TYPE_JSON = 'json';
    public const TYPE_FILE = 'file';
    public const TYPE_SELECT = 'select';

    /**
     * Get a setting value by key
     */
    public static function get(string $key, $default = null)
    {
        return Cache::rememberForever("setting.{$key}", function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            if (!$setting)
                return $default;

            return match ($setting->type) {
                self::TYPE_BOOLEAN => (bool) $setting->value,
                self::TYPE_NUMBER => (float) $setting->value,
                self::TYPE_JSON => json_decode($setting->value, true),
                default => $setting->value,
            };
        });
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, $value): void
    {
        $setting = static::where('key', $key)->first();

        if ($setting) {
            $setting->update(['value' => is_array($value) ? json_encode($value) : $value]);
        }

        Cache::forget("setting.{$key}");
    }

    /**
     * Get all settings for a group
     */
    public static function getGroup(string $group): array
    {
        return static::where('group', $group)
            ->orderBy('sort_order')
            ->get()
            ->mapWithKeys(fn($setting) => [$setting->key => static::get($setting->key)])
            ->toArray();
    }

    /**
     * Get group names
     */
    public static function getGroups(): array
    {
        return [
            self::GROUP_GENERAL => 'Cài đặt chung',
            self::GROUP_EMAIL => 'Email',
            self::GROUP_PAYMENT => 'Thanh toán',
            self::GROUP_API => 'API',
            self::GROUP_NOTIFICATION => 'Thông báo',
        ];
    }

    /**
     * Get type options
     */
    public static function getTypes(): array
    {
        return [
            self::TYPE_TEXT => 'Text',
            self::TYPE_TEXTAREA => 'Textarea',
            self::TYPE_BOOLEAN => 'Boolean',
            self::TYPE_NUMBER => 'Number',
            self::TYPE_JSON => 'JSON',
            self::TYPE_FILE => 'File',
            self::TYPE_SELECT => 'Select',
        ];
    }

    /**
     * Clear settings cache
     */
    public static function clearCache(): void
    {
        $keys = static::pluck('key')->toArray();
        foreach ($keys as $key) {
            Cache::forget("setting.{$key}");
        }
    }
}
