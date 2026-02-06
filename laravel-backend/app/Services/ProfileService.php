<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileService
{
    /**
     * Get profile statistics for user
     */
    public function getProfileStats(User $user): array
    {
        $mainWallet = $user->wallets()->where('currency', 'VND')->first();

        return [
            'devices' => $user->devices()->count(),
            'workflows' => $user->flows()->count(),
            'campaigns' => $user->campaigns()->count(),
            'jobs' => $user->workflowJobs()->count(),
            'aiCredits' => $user->ai_credits ?? 0,
            'walletBalance' => $mainWallet?->balance ?? 0,
            'mediaFiles' => $user->mediaFiles()->count(),
            'dataCollections' => $user->dataCollections()->count(),
        ];
    }

    /**
     * Get storage info for user
     */
    public function getStorageInfo(User $user): array
    {
        $storagePlan = $user->getOrCreateStoragePlan();
        $usedStorage = $user->mediaFiles()->sum('file_size');
        $maxStorage = $storagePlan?->max_storage_bytes ?? 0;

        return [
            'used' => $usedStorage,
            'max' => $maxStorage,
            'planName' => $storagePlan?->name ?? 'Free',
        ];
    }

    /**
     * Get active packages for user
     */
    public function getActivePackages(User $user): array
    {
        return $user->activeServicePackages()
            ->with('servicePackage')
            ->get()
            ->map(fn($pkg) => [
                'id' => $pkg->id,
                'name' => $pkg->servicePackage?->name ?? 'Unknown',
                'expires_at' => $pkg->expires_at?->format('d/m/Y'),
                'status' => $pkg->status,
            ])
            ->toArray();
    }

    /**
     * Update user profile
     */
    public function updateProfile(User $user, array $data, ?UploadedFile $avatar = null): void
    {
        if ($avatar) {
            $this->deleteAvatar($user);
            $data['avatar'] = $avatar->store('avatars', 'public');
        }

        $user->update($data);
    }

    /**
     * Update user password
     */
    public function updatePassword(User $user, string $password): void
    {
        $user->update([
            'password' => Hash::make($password),
        ]);
    }

    /**
     * Upload user avatar
     */
    public function uploadAvatar(User $user, UploadedFile $file): string
    {
        $this->deleteAvatar($user);

        $path = $file->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return $path;
    }

    /**
     * Delete user avatar
     */
    public function deleteAvatar(User $user): void
    {
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }
    }
}
