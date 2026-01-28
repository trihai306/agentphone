<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();

        // Load relationships for stats
        $storagePlan = $user->getOrCreateStoragePlan();
        $usedStorage = $user->mediaFiles()->sum('file_size');
        $maxStorage = $storagePlan?->max_storage_bytes ?? 0;

        // Get primary wallet balance (VND currency)
        $mainWallet = $user->wallets()->where('currency', 'VND')->first();

        return Inertia::render('Profile/Edit', [
            'user' => $user->load(['customFields.values']),
            'stats' => [
                'devices' => $user->devices()->count(),
                'workflows' => $user->flows()->count(),
                'campaigns' => $user->campaigns()->count(),
                'jobs' => $user->workflowJobs()->count(),
                'aiCredits' => $user->ai_credits ?? 0,
                'walletBalance' => $mainWallet?->balance ?? 0,
                'mediaFiles' => $user->mediaFiles()->count(),
                'dataCollections' => $user->dataCollections()->count(),
            ],
            'storage' => [
                'used' => $usedStorage,
                'max' => $maxStorage,
                'planName' => $storagePlan?->name ?? 'Free',
            ],
            'activePackages' => $user->activeServicePackages()
                ->with('servicePackage')
                ->get()
                ->map(fn($pkg) => [
                    'id' => $pkg->id,
                    'name' => $pkg->servicePackage?->name ?? 'Unknown',
                    'expires_at' => $pkg->expires_at?->format('d/m/Y'),
                    'status' => $pkg->status,
                ]),
        ]);
    }

    public function update(ProfileUpdateRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $path;
        }

        $user->update($data);

        return back()->with('success', 'Thông tin đã được cập nhật thành công!');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Mật khẩu đã được cập nhật thành công!');
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        // Delete old avatar
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return back()->with('success', 'Avatar đã được tải lên thành công!');
    }

    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return back()->with('success', 'Avatar đã được xóa!');
    }
}
