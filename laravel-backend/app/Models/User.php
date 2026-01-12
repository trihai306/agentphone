<?php

namespace App\Models;

use App\States\UserWorkflow\UserWorkflowState;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\ModelStates\HasStates;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, HasStates, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'workflow_state',
        'storage_plan_id',
        'avatar',
        'phone',
        'bio',
        'location',
        'timezone',
        'language',
        'social_links',
        'preferences',
        'ai_credits',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'workflow_state' => UserWorkflowState::class,
            'social_links' => 'array',
            'preferences' => 'array',
        ];
    }

    /**
     * Determine if the user can access the Filament admin panel.
     *
     * @param Panel $panel
     * @return bool
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->hasRole('admin');
    }

    public function wallets()
    {
        return $this->hasMany(Wallet::class);
    }

    public function bankAccounts()
    {
        return $this->hasMany(UserBankAccount::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function servicePackages()
    {
        return $this->hasMany(UserServicePackage::class);
    }

    public function activeServicePackages()
    {
        return $this->hasMany(UserServicePackage::class)
            ->where('status', UserServicePackage::STATUS_ACTIVE);
    }

    /**
     * Get the user's storage plan
     */
    public function storagePlan()
    {
        return $this->belongsTo(MediaStoragePlan::class, 'storage_plan_id');
    }

    /**
     * Get user's media files
     */
    public function mediaFiles()
    {
        return $this->hasMany(UserMedia::class);
    }

    /**
     * Alias for mediaFiles() - backward compatibility
     */
    public function media()
    {
        return $this->mediaFiles();
    }

    /**
     * Get user's data collections
     */
    public function dataCollections()
    {
        return $this->hasMany(DataCollection::class);
    }

    /**
     * Get user's devices
     */
    public function devices()
    {
        return $this->hasMany(Device::class);
    }

    /**
     * Get or create default storage plan for user
     */
    public function getOrCreateStoragePlan()
    {
        if (!$this->storage_plan_id) {
            $defaultPlan = MediaStoragePlan::getDefault();
            if ($defaultPlan) {
                $this->update(['storage_plan_id' => $defaultPlan->id]);
                return $defaultPlan;
            }
        }

        return $this->storagePlan;
    }

    /**
     * Get user's custom fields
     */
    public function customFields()
    {
        return $this->hasMany(UserCustomField::class);
    }

    /**
     * Get user's custom field values
     */
    public function customFieldValues()
    {
        return $this->hasMany(UserCustomFieldValue::class);
    }

    /**
     * Get custom field value by key
     */
    public function getCustomFieldValue(string $key)
    {
        return $this->customFieldValues()
            ->whereHas('customField', fn($q) => $q->where('key', $key))
            ->first()?->value;
    }

    /**
     * Set custom field value by key
     */
    public function setCustomFieldValue(string $key, $value)
    {
        $field = $this->customFields()->where('key', $key)->first();
        if (!$field) {
            throw new \Exception("Custom field '{$key}' not found");
        }

        return $this->customFieldValues()->updateOrCreate(
            ['user_custom_field_id' => $field->id],
            ['value' => $value]
        );
    }

    /**
     * Get avatar URL or default
     */
    public function getAvatarUrlAttribute()
    {
        return $this->avatar
            ? asset('storage/' . $this->avatar)
            : null;
    }

    /**
     * Get user's AI generations
     */
    public function aiGenerations()
    {
        return $this->hasMany(AiGeneration::class);
    }

    /**
     * Add AI credits to user account
     */
    public function addAiCredits(int $amount): void
    {
        $this->increment('ai_credits', $amount);
    }

    /**
     * Deduct AI credits from user account
     * 
     * @throws \Exception if insufficient credits
     */
    public function deductAiCredits(int $amount): void
    {
        if (!$this->hasEnoughCredits($amount)) {
            throw new \Exception("Insufficient AI credits. Required: {$amount}, Available: {$this->ai_credits}");
        }

        $this->decrement('ai_credits', $amount);
    }

    /**
     * Check if user has enough AI credits
     */
    public function hasEnoughCredits(int $required): bool
    {
        return $this->ai_credits >= $required;
    }

    /**
     * Get formatted AI credits
     */
    public function getFormattedAiCreditsAttribute(): string
    {
        return number_format($this->ai_credits, 0, ',', '.');
    }
}
