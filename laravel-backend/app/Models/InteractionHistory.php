<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class InteractionHistory extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'interaction_histories';

    /**
     * Action type constants
     */
    public const ACTION_TAP = 'tap';
    public const ACTION_LONG_TAP = 'long_tap';
    public const ACTION_SWIPE = 'swipe';
    public const ACTION_INPUT_TEXT = 'input_text';
    public const ACTION_SCROLL = 'scroll';

    /**
     * Sync source constants
     */
    public const SYNC_SOURCE_CONTROLLER = 'controller';
    public const SYNC_SOURCE_PORTAL_APK = 'portal-apk';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'device_serial',
        'session_id',
        'package_name',
        'activity_name',
        'node_class',
        'node_text',
        'node_content_desc',
        'node_resource_id',
        'node_bounds',
        'node_index',
        'node_checkable',
        'node_checked',
        'node_clickable',
        'node_enabled',
        'node_focusable',
        'node_focused',
        'node_scrollable',
        'node_selected',
        'node_xpath',
        'node_hierarchy',
        'action_type',
        'tap_x',
        'tap_y',
        'screenshot_path',
        'metadata',
        'synced_from_controller_at',
        'sync_source',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'node_bounds' => 'array',
        'node_hierarchy' => 'array',
        'metadata' => 'array',
        'node_checkable' => 'boolean',
        'node_checked' => 'boolean',
        'node_clickable' => 'boolean',
        'node_enabled' => 'boolean',
        'node_focusable' => 'boolean',
        'node_focused' => 'boolean',
        'node_scrollable' => 'boolean',
        'node_selected' => 'boolean',
        'synced_from_controller_at' => 'datetime',
    ];

    /**
     * Get the user that owns this interaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get action types
     */
    public static function getActionTypes(): array
    {
        return [
            self::ACTION_TAP => 'Tap',
            self::ACTION_LONG_TAP => 'Long Tap',
            self::ACTION_SWIPE => 'Swipe',
            self::ACTION_INPUT_TEXT => 'Input Text',
            self::ACTION_SCROLL => 'Scroll',
        ];
    }

    /**
     * Get node information as array
     */
    public function getNodeAttribute(): array
    {
        return [
            'class' => $this->node_class,
            'text' => $this->node_text,
            'content_desc' => $this->node_content_desc,
            'resource_id' => $this->node_resource_id,
            'bounds' => $this->node_bounds,
            'index' => $this->node_index,
            'checkable' => $this->node_checkable,
            'checked' => $this->node_checked,
            'clickable' => $this->node_clickable,
            'enabled' => $this->node_enabled,
            'focusable' => $this->node_focusable,
            'focused' => $this->node_focused,
            'scrollable' => $this->node_scrollable,
            'selected' => $this->node_selected,
            'xpath' => $this->node_xpath,
            'hierarchy' => $this->node_hierarchy,
        ];
    }

    /**
     * Set node information from array
     */
    public function setNodeFromArray(array $node): self
    {
        $this->node_class = $node['class'] ?? null;
        $this->node_text = $node['text'] ?? null;
        $this->node_content_desc = $node['content_desc'] ?? null;
        $this->node_resource_id = $node['resource_id'] ?? null;
        $this->node_bounds = $node['bounds'] ?? null;
        $this->node_index = $node['index'] ?? null;
        $this->node_checkable = $node['checkable'] ?? false;
        $this->node_checked = $node['checked'] ?? false;
        $this->node_clickable = $node['clickable'] ?? false;
        $this->node_enabled = $node['enabled'] ?? true;
        $this->node_focusable = $node['focusable'] ?? false;
        $this->node_focused = $node['focused'] ?? false;
        $this->node_scrollable = $node['scrollable'] ?? false;
        $this->node_selected = $node['selected'] ?? false;
        $this->node_xpath = $node['xpath'] ?? null;
        $this->node_hierarchy = $node['hierarchy'] ?? null;

        return $this;
    }

    /**
     * Scope: Filter by device serial
     */
    public function scopeForDevice(Builder $query, string $deviceSerial): Builder
    {
        return $query->where('device_serial', $deviceSerial);
    }

    /**
     * Scope: Filter by package name
     */
    public function scopeForPackage(Builder $query, string $packageName): Builder
    {
        return $query->where('package_name', $packageName);
    }

    /**
     * Scope: Filter by session
     */
    public function scopeForSession(Builder $query, string $sessionId): Builder
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * Scope: Filter by action type
     */
    public function scopeOfActionType(Builder $query, string $actionType): Builder
    {
        return $query->where('action_type', $actionType);
    }

    /**
     * Scope: Filter by user
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeBetweenDates(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope: Get recent interactions
     */
    public function scopeRecent(Builder $query, int $limit = 100): Builder
    {
        return $query->orderByDesc('created_at')->limit($limit);
    }

    /**
     * Get display name for the element
     */
    public function getElementDisplayNameAttribute(): string
    {
        if ($this->node_text) {
            return $this->node_text;
        }

        if ($this->node_content_desc) {
            return $this->node_content_desc;
        }

        if ($this->node_resource_id) {
            // Extract the ID part from full resource ID
            $parts = explode('/', $this->node_resource_id);
            return end($parts);
        }

        return $this->node_class ? class_basename($this->node_class) : 'Unknown Element';
    }

    /**
     * Get short class name
     */
    public function getShortClassNameAttribute(): string
    {
        if (!$this->node_class) {
            return 'Element';
        }

        $parts = explode('.', $this->node_class);
        return end($parts);
    }

    /**
     * Get action icon name for UI
     */
    public function getActionIconAttribute(): string
    {
        return match ($this->action_type) {
            self::ACTION_TAP => 'heroicon-o-cursor-arrow-rays',
            self::ACTION_LONG_TAP => 'heroicon-o-finger-print',
            self::ACTION_SWIPE => 'heroicon-o-arrows-right-left',
            self::ACTION_INPUT_TEXT => 'heroicon-o-pencil-square',
            self::ACTION_SCROLL => 'heroicon-o-arrows-up-down',
            default => 'heroicon-o-cursor-arrow-ripple',
        };
    }

    /**
     * Get action color for UI
     */
    public function getActionColorAttribute(): string
    {
        return match ($this->action_type) {
            self::ACTION_TAP => 'success',
            self::ACTION_LONG_TAP => 'warning',
            self::ACTION_SWIPE => 'info',
            self::ACTION_INPUT_TEXT => 'primary',
            self::ACTION_SCROLL => 'gray',
            default => 'secondary',
        };
    }

    /**
     * Create from sync data
     */
    public static function createFromSyncData(array $data): self
    {
        $node = $data['node'] ?? [];

        $interaction = new self([
            'user_id' => $data['user_id'] ?? null,
            'device_serial' => $data['device_serial'] ?? 'unknown',
            'session_id' => $data['session_id'] ?? null,
            'package_name' => $data['package_name'] ?? null,
            'activity_name' => $data['activity_name'] ?? null,
            'action_type' => $data['action_type'] ?? self::ACTION_TAP,
            'tap_x' => $data['tap_x'] ?? null,
            'tap_y' => $data['tap_y'] ?? null,
            'screenshot_path' => $data['screenshot_path'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'synced_from_controller_at' => now(),
            'sync_source' => self::SYNC_SOURCE_CONTROLLER,
        ]);

        $interaction->setNodeFromArray($node);
        $interaction->save();

        return $interaction;
    }

    /**
     * Get statistics
     */
    public static function getStatistics(?string $deviceSerial = null, ?string $packageName = null): array
    {
        $query = self::query();

        if ($deviceSerial) {
            $query->forDevice($deviceSerial);
        }

        if ($packageName) {
            $query->forPackage($packageName);
        }

        $total = $query->count();

        $byActionType = (clone $query)
            ->selectRaw('action_type, COUNT(*) as count')
            ->groupBy('action_type')
            ->pluck('count', 'action_type')
            ->toArray();

        $byPackage = (clone $query)
            ->selectRaw('package_name, COUNT(*) as count')
            ->groupBy('package_name')
            ->orderByDesc('count')
            ->limit(10)
            ->pluck('count', 'package_name')
            ->toArray();

        $uniqueDevices = (clone $query)
            ->distinct('device_serial')
            ->count('device_serial');

        $uniqueSessions = (clone $query)
            ->whereNotNull('session_id')
            ->distinct('session_id')
            ->count('session_id');

        return [
            'total_interactions' => $total,
            'unique_devices' => $uniqueDevices,
            'unique_sessions' => $uniqueSessions,
            'by_action_type' => $byActionType,
            'by_package' => $byPackage,
        ];
    }
}
