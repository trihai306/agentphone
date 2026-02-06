<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileUpdateRequest;
use App\Services\ProfileService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function __construct(
        protected ProfileService $profileService
    ) {
    }

    public function edit(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Profile/Edit', [
            'user' => $user->load(['customFields.values']),
            'stats' => $this->profileService->getProfileStats($user),
            'storage' => $this->profileService->getStorageInfo($user),
            'activePackages' => $this->profileService->getActivePackages($user),
        ]);
    }

    public function update(ProfileUpdateRequest $request)
    {
        $user = $request->user();
        $avatar = $request->hasFile('avatar') ? $request->file('avatar') : null;

        $this->profileService->updateProfile($user, $request->validated(), $avatar);

        return back()->with('success', 'Thông tin đã được cập nhật thành công!');
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $this->profileService->updatePassword($request->user(), $validated['password']);

        return back()->with('success', 'Mật khẩu đã được cập nhật thành công!');
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $this->profileService->uploadAvatar($request->user(), $request->file('avatar'));

        return back()->with('success', 'Avatar đã được tải lên thành công!');
    }

    public function deleteAvatar(Request $request)
    {
        $this->profileService->deleteAvatar($request->user());

        return back()->with('success', 'Avatar đã được xóa!');
    }
}
