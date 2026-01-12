<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Handled by auth middleware
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->ignore($this->user()->id),
            ],
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:500',
            'location' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:50',
            'language' => 'nullable|in:vi,en',
            'social_links' => 'nullable|array',
            'social_links.twitter' => 'nullable|url|max:255',
            'social_links.linkedin' => 'nullable|url|max:255',
            'social_links.github' => 'nullable|url|max:255',
            'social_links.facebook' => 'nullable|url|max:255',
            'social_links.instagram' => 'nullable|url|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tên là bắt buộc.',
            'email.required' => 'Email là bắt buộc.',
            'email.email' => 'Email không hợp lệ.',
            'email.unique' => 'Email đã được sử dụng.',
            'avatar.image' => 'File phải là hình ảnh.',
            'avatar.max' => 'Hình ảnh không được vượt quá 2MB.',
            'bio.max' => 'Tiểu sử không được vượt quá 500 ký tự.',
        ];
    }
}
