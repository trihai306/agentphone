<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'files' => 'required|array|max:10',
            'files.*' => 'required|file|max:51200|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,webm',
            'folder' => 'nullable|string|max:255',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'files.required' => 'Vui lòng chọn file để tải lên.',
            'files.max' => 'Tối đa 10 file mỗi lần tải lên.',
            'files.*.max' => 'Mỗi file không được quá 50MB.',
            'files.*.mimes' => 'Chỉ hỗ trợ định dạng: jpg, jpeg, png, gif, webp, mp4, mov, avi, webm.',
        ];
    }
}
